export type TrendDirection = "increasing" | "decreasing" | "stable" | "consistently_same" | "insufficient_data";

export interface MetricTrendAnalysis {
  metricName: string;
  totalEntries: number;
  average: number;
  min: number;
  max: number;
  firstHalfAvg: number;
  secondHalfAvg: number;
  difference: number;
  trend: TrendDirection;
  currentStreak: number;
  streakValue: number | null;
  allSameValue: boolean;
  summary: string;
}

export interface TrendReport {
  mood: MetricTrendAnalysis;
  urge: MetricTrendAnalysis;
  checkinConsistency: {
    totalCheckins: number;
    daysCovered: number;
    rate: number;
    summary: string;
  };
  vulnerabilities: string[];
}

const DAILY_ITEM_LABELS: Record<string, string> = {
  "no-acting-out": "sobriety",
  "no-rituals": "avoiding rituals",
  "triggers-managed": "trigger management",
  "sleep": "adequate sleep",
  "exercise": "physical exercise",
  "connection": "meaningful connection",
  "values-aligned": "values-aligned action",
  "honest": "rigorous honesty"
};

const HALT_LABELS: Record<string, string> = {
  "hungry": "hunger",
  "angry": "anger",
  "lonely": "loneliness",
  "tired": "tiredness",
  "bored": "boredom",
  "stressed": "stress"
};

const MIN_ENTRIES_FOR_TREND = 5;
const MCID_THRESHOLD = 2.0;

function analyzeMetric(name: string, values: number[]): MetricTrendAnalysis {
  if (values.length === 0) {
    return {
      metricName: name,
      totalEntries: 0,
      average: 0,
      min: 0,
      max: 0,
      firstHalfAvg: 0,
      secondHalfAvg: 0,
      difference: 0,
      trend: "insufficient_data",
      currentStreak: 0,
      streakValue: null,
      allSameValue: false,
      summary: `No ${name} data recorded yet.`,
    };
  }

  const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const allSame = values.every(v => v === values[0]);

  let streakCount = 1;
  for (let i = values.length - 2; i >= 0; i--) {
    if (values[i] === values[values.length - 1]) {
      streakCount++;
    } else {
      break;
    }
  }

  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);
  const firstHalfAvg = firstHalf.length > 0
    ? Math.round((firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length) * 10) / 10
    : 0;
  const secondHalfAvg = secondHalf.length > 0
    ? Math.round((secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length) * 10) / 10
    : 0;
  const difference = Math.round((secondHalfAvg - firstHalfAvg) * 10) / 10;

  let trend: TrendDirection;
  let summary: string;

  if (allSame) {
    trend = "consistently_same";
    summary = `${name} has been consistently at ${values[0]}/10 across all ${values.length} entries. No variation detected.`;
  } else if (values.length < MIN_ENTRIES_FOR_TREND) {
    trend = "insufficient_data";
    summary = `${name}: ${values.length} entries recorded (average ${avg}/10, range ${min}-${max}). Need at least ${MIN_ENTRIES_FOR_TREND} entries to identify trends.`;
  } else if (Math.abs(difference) >= MCID_THRESHOLD) {
    if (difference > 0) {
      trend = "increasing";
      summary = `${name} is increasing: first-half average ${firstHalfAvg}/10, second-half average ${secondHalfAvg}/10 (change: +${difference}). ${values.length} entries, overall average ${avg}/10.`;
    } else {
      trend = "decreasing";
      summary = `${name} is decreasing: first-half average ${firstHalfAvg}/10, second-half average ${secondHalfAvg}/10 (change: ${difference}). ${values.length} entries, overall average ${avg}/10.`;
    }
  } else {
    trend = "stable";
    summary = `${name} is stable: first-half average ${firstHalfAvg}/10, second-half average ${secondHalfAvg}/10 (change: ${difference >= 0 ? '+' : ''}${difference}, below clinical threshold of ${MCID_THRESHOLD}). ${values.length} entries, overall average ${avg}/10.`;
  }

  if (streakCount >= 3 && !allSame) {
    summary += ` Current streak: ${streakCount} consecutive entries at ${values[values.length - 1]}/10.`;
  }

  return {
    metricName: name,
    totalEntries: values.length,
    average: avg,
    min,
    max,
    firstHalfAvg,
    secondHalfAvg,
    difference,
    trend,
    currentStreak: streakCount,
    streakValue: values.length > 0 ? values[values.length - 1] : null,
    allSameValue: allSame,
    summary,
  };
}

export function analyzeTrends(
  checkins: Array<{ 
    moodLevel: number | null; 
    urgeLevel: number | null; 
    dateKey: string;
    eveningChecks?: string | null;
    haltChecks?: string | null;
  }>,
): TrendReport {
  const sorted = [...checkins].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const moodValues = sorted.filter(c => c.moodLevel !== null).map(c => c.moodLevel!);
  const urgeValues = sorted.filter(c => c.urgeLevel !== null).map(c => c.urgeLevel!);

  const uniqueDates = new Set(checkins.map(c => c.dateKey));
  const sortedDates = [...uniqueDates].sort();
  const daysCovered = sortedDates.length > 1
    ? Math.ceil((new Date(sortedDates[sortedDates.length - 1]).getTime() - new Date(sortedDates[0]).getTime()) / 86400000) + 1
    : sortedDates.length;
  const rate = daysCovered > 0 ? Math.round((uniqueDates.size / daysCovered) * 100) : 0;

  // Analyze vulnerabilities (unchecked positives, checked negatives)
  const missedPositives: Record<string, number> = {};
  const presentNegatives: Record<string, number> = {};
  const totalEntries = checkins.length;

  if (totalEntries > 0) {
    checkins.forEach(c => {
      const daily = c.eveningChecks ? JSON.parse(c.eveningChecks) : [];
      const halt = c.haltChecks ? JSON.parse(c.haltChecks) : [];
      
      const dailySet = new Set(daily);
      Object.keys(DAILY_ITEM_LABELS).forEach(id => {
        if (!dailySet.has(id)) missedPositives[id] = (missedPositives[id] || 0) + 1;
      });

      halt.forEach((id: string) => {
        presentNegatives[id] = (presentNegatives[id] || 0) + 1;
      });
    });
  }

  const vulnerabilities: string[] = [];
  
  // Add top missed positives (missed > 40% of check-ins)
  Object.entries(missedPositives).forEach(([id, count]) => {
    const pct = (count / totalEntries) * 100;
    if (pct >= 40) vulnerabilities.push(`Missing ${DAILY_ITEM_LABELS[id]} (${Math.round(pct)}% of days)`);
  });

  // Add top present negatives (present > 40% of check-ins)
  Object.entries(presentNegatives).forEach(([id, count]) => {
    const pct = (count / totalEntries) * 100;
    if (pct >= 40) vulnerabilities.push(`Frequent ${HALT_LABELS[id]} (${Math.round(pct)}% of days)`);
  });

  let consistencySummary: string;
  if (uniqueDates.size === 0) {
    consistencySummary = "No check-ins recorded.";
  } else if (rate >= 80) {
    consistencySummary = `Excellent consistency: ${uniqueDates.size} check-ins over ${daysCovered} days (${rate}% completion rate).`;
  } else if (rate >= 50) {
    consistencySummary = `Moderate consistency: ${uniqueDates.size} check-ins over ${daysCovered} days (${rate}% completion rate).`;
  } else {
    consistencySummary = `Low consistency: ${uniqueDates.size} check-ins over ${daysCovered} days (${rate}% completion rate).`;
  }

  return {
    mood: analyzeMetric("Mood level", moodValues),
    urge: analyzeMetric("Urge level", urgeValues),
    checkinConsistency: {
      totalCheckins: uniqueDates.size,
      daysCovered,
      rate,
      summary: consistencySummary,
    },
    vulnerabilities: vulnerabilities.slice(0, 4),
  };
}

export function formatTrendReportForAI(report: TrendReport): string {
  const vulnBlock = report.vulnerabilities.length > 0 
    ? `VULNERABILITIES (Areas for Improvement):\n- ${report.vulnerabilities.join('\n- ')}`
    : "VULNERABILITIES: No significant negative patterns detected in daily habits.";

  return [
    "=== PRE-COMPUTED CLIENT STATISTICS (verified from raw data) ===",
    "",
    `MOOD: ${report.mood.summary}`,
    `URGE: ${report.urge.summary}`,
    `CHECK-IN CONSISTENCY: ${report.checkinConsistency.summary}`,
    "",
    vulnBlock,
    "",
    "IMPORTANT: Base your observations strictly on the statistics above.",
    "Do NOT invent, infer, or contradict any trend that is not explicitly stated.",
    "If a metric is listed as 'stable' or 'consistently at X', do NOT describe it as increasing or decreasing.",
    "If data is listed as 'insufficient', state that more data is needed rather than guessing a trend.",
    "=== END STATISTICS ===",
  ].join("\n");
}

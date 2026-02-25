import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  Heart,
  Zap,
  Award,
  ClipboardCheck,
  BarChart3,
  Sparkles,
} from "lucide-react";

type CheckinStats = {
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
  averageMood: number;
  averageUrge: number;
  dailyCompletionRate: number;
  windowSize?: number;
  recentCheckins: Array<{
    date: string;
    mood: number | null;
    urge: number | null;
  }>;
};

function ProgressRing({ percentage, color, size = 120 }: { percentage: number; color: string; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{percentage}%</span>
      </div>
    </div>
  );
}

function TrendChart({ data, color, label, height = 140 }: { data: (number | null)[]; color: string; label: string; height?: number }) {
  const validData = data.filter(d => d !== null) as number[];
  if (validData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">No data yet. Complete check-ins to see trends.</p>
      </div>
    );
  }

  const max = Math.max(...validData, 10);
  const min = Math.min(...validData, 0);
  const range = max - min || 1;
  const latest = validData[validData.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-lg font-bold" style={{ color }}>
          {latest}/10
        </span>
      </div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((value, i) => {
          const barHeight = value !== null ? ((value - min) / range) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-300 relative group"
              style={{
                height: `${Math.max(barHeight, 5)}%`,
                backgroundColor: value !== null ? color : 'transparent',
                opacity: value !== null ? 0.5 + (i / data.length) * 0.5 : 0.08,
              }}
            >
              {value !== null && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {value}/10
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>14 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function WeekGrid({ completedWeeks }: { completedWeeks: number[] }) {
  const phase1 = Array.from({ length: 8 }, (_, i) => i + 1);
  const phase2 = Array.from({ length: 8 }, (_, i) => i + 9);

  function WeekBubble({ week }: { week: number }) {
    const done = completedWeeks.includes(week);
    return (
      <div
        title={`Week ${week}`}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold border transition-all duration-300 ${
          done
            ? "bg-amber-500 border-amber-500 text-white shadow-sm"
            : "border-border text-muted-foreground bg-muted/30"
        }`}
      >
        {week}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Phase 1 — CBT (Weeks 1–8)</p>
        <div className="flex gap-2 flex-wrap">
          {phase1.map(w => <WeekBubble key={w} week={w} />)}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Phase 2 — ACT (Weeks 9–16)</p>
        <div className="flex gap-2 flex-wrap">
          {phase2.map(w => <WeekBubble key={w} week={w} />)}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {completedWeeks.length} of 16 weeks completed
        {completedWeeks.length > 0 && ` · ${Math.round((completedWeeks.length / 16) * 100)}% through the program`}
      </p>
    </div>
  );
}

const MIN_ENTRIES_FOR_TREND = 5;
const MCID_THRESHOLD = 2.0;

type TrendDirection = "increasing" | "decreasing" | "stable" | "consistently_same" | "insufficient_data";

function computeTrend(values: (number | null)[]): TrendDirection {
  const filtered = values.filter((v): v is number => v !== null);
  if (filtered.length < MIN_ENTRIES_FOR_TREND) return "insufficient_data";
  if (filtered.every(v => v === filtered[0])) return "consistently_same";

  const mid = Math.floor(filtered.length / 2);
  const firstHalf = filtered.slice(0, mid);
  const secondHalf = filtered.slice(mid);
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;

  if (Math.abs(diff) < MCID_THRESHOLD) return "stable";
  return diff > 0 ? "increasing" : "decreasing";
}

function getInsight(stats: CheckinStats, moodTrend: TrendDirection, urgeTrend: TrendDirection, isViewingOther: boolean): string {
  const insights: string[] = [];
  const you = isViewingOther ? "Client's" : "Your";
  const your = isViewingOther ? "Their" : "Your";

  if (moodTrend === "insufficient_data" || urgeTrend === "insufficient_data") {
    return `${isViewingOther ? "More check-ins are needed" : "Keep checking in daily"} to build enough data for meaningful trend analysis (at least ${MIN_ENTRIES_FOR_TREND} entries).`;
  }

  if (stats.currentStreak >= 14) {
    insights.push(`${isViewingOther ? "A" : "You've maintained a"} two-week streak. This level of consistency is building lasting neural pathways.`);
  } else if (stats.currentStreak >= 7) {
    insights.push(`A week-long streak shows real commitment. ${your} brain is adapting to this new routine.`);
  } else if (stats.currentStreak >= 3) {
    insights.push("Three days of consistency is when habits start forming. Keep going.");
  }

  if (moodTrend === "increasing") {
    insights.push(`${you} mood has been meaningfully improving — a positive sign of progress.`);
  } else if (moodTrend === "decreasing") {
    insights.push(`${you} mood has dipped recently. Awareness is the first step to turning it around.`);
  }

  if (urgeTrend === "decreasing") {
    insights.push(`${you} urge levels are meaningfully decreasing — the coping strategies are working.`);
  } else if (urgeTrend === "increasing") {
    insights.push(`Urge levels have increased. ${isViewingOther ? "Consider discussing" : "Consider reviewing"} coping tools or ${isViewingOther ? "additional support" : "reaching out"}.`);
  } else if ((urgeTrend === "stable" || urgeTrend === "consistently_same") && stats.averageUrge < 4) {
    insights.push(`${you} urge levels are consistently low — a sign of growing control.`);
  }

  if (stats.dailyCompletionRate >= 80) {
    insights.push(`Excellent consistency — ${isViewingOther ? "checking" : "you're checking"} in most days.`);
  } else if (stats.dailyCompletionRate < 50 && stats.totalCheckins > 5) {
    insights.push("More frequent check-ins help track patterns. Try to check in daily.");
  }

  return insights.length > 0 ? insights[0] : `${you} data is stable. ${isViewingOther ? "Encourage daily check-ins" : "Keep checking in daily"} to track the journey.`;
}

export default function AnalyticsPage({ params }: { params?: { clientId?: string } }) {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const viewingClientId = params?.clientId;
  const isViewingOtherClient = !!viewingClientId && viewingClientId !== user?.id;
  const isMentor = user?.role === 'therapist';
  const isAdmin = user?.role === 'admin';

  const statsUrl = isViewingOtherClient
    ? (isMentor ? `/api/therapist/clients/${viewingClientId}/checkin-stats` : `/api/admin/clients/${viewingClientId}/checkin-stats`)
    : '/api/progress/checkin-stats';

  const completionsUrl = isViewingOtherClient
    ? (isMentor ? `/api/therapist/clients/${viewingClientId}/completions` : `/api/admin/clients/${viewingClientId}/completions-data`)
    : '/api/progress/completions';

  const { data: stats, isLoading } = useQuery<CheckinStats>({
    queryKey: [statsUrl],
    staleTime: 60000,
    enabled: !!user,
  });

  const { data: completionsData } = useQuery<{ completedWeeks: number[] }>({
    queryKey: [completionsUrl],
    enabled: !!user,
  });

  const { data: clientData } = useQuery<{ name?: string; email?: string }>({
    queryKey: ['/api/therapist/clients', viewingClientId, 'progress'],
    enabled: !!viewingClientId && isMentor,
    select: (data: any) => ({ name: data?.client?.name, email: data?.client?.email }),
  });

  const { data: adminClientData } = useQuery<{ name?: string; email?: string }>({
    queryKey: ['/api/admin/users'],
    enabled: !!viewingClientId && isAdmin,
    select: (data: any) => {
      const found = data?.users?.find((u: any) => u.id === viewingClientId);
      return found ? { name: found.name, email: found.email } : {};
    },
  });

  const viewedClientName = isMentor ? clientData?.name : adminClientData?.name;

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-10" />
          </div>
        </header>
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 py-10">
          <div className="mx-auto max-w-5xl px-4 space-y-3">
            <Skeleton className="h-6 w-48 bg-white/10" />
            <Skeleton className="h-10 w-64 bg-white/10" />
          </div>
        </div>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const completedWeeks = completionsData?.completedWeeks || [];
  const moodData = stats?.recentCheckins.map(c => c.mood) || [];
  const urgeData = stats?.recentCheckins.map(c => c.urge) || [];

  const moodTrend = computeTrend(moodData);
  const urgeTrend = computeTrend(urgeData);
  const hasData = (stats?.totalCheckins ?? 0) > 0;

  const displayName = isViewingOtherClient
    ? (viewedClientName || "Client")
    : (user.name || "Your");

  const heroSubtitle = isViewingOtherClient
    ? `Recovery analytics for ${displayName}`
    : "Your recovery progress";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href={isViewingOtherClient ? (isMentor ? `/therapist/clients/${viewingClientId}` : `/admin/clients/${viewingClientId}`) : "/dashboard"}>
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 py-10 px-4">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-white/50" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/50">{heroSubtitle}</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {isViewingOtherClient ? `${displayName}'s Analytics` : "My Analytics"}
            </h1>
            <p className="mt-2 text-white/60 text-sm max-w-md">
              {hasData
                ? "Data from your check-ins, tracked over time. What the numbers show is what's actually happening."
                : "No check-in data yet. Complete your first check-in to start seeing your trends here."}
            </p>
          </div>
          {hasData && (
            <div className="flex items-center gap-4 sm:text-right">
              <div className="flex flex-col items-center bg-white/10 rounded-xl px-5 py-3 ring-1 ring-white/20">
                <Flame className="h-5 w-5 text-orange-400 mb-1" />
                <span className="text-3xl font-bold text-white">{stats?.currentStreak ?? 0}</span>
                <span className="text-xs text-white/50 mt-0.5">day streak</span>
              </div>
              <div className="flex flex-col items-center bg-white/10 rounded-xl px-5 py-3 ring-1 ring-white/20">
                <Target className="h-5 w-5 text-cyan-400 mb-1" />
                <span className="text-3xl font-bold text-white">{stats?.totalCheckins ?? 0}</span>
                <span className="text-xs text-white/50 mt-0.5">check-ins</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">

        {/* Insight Banner */}
        {hasData && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    {isViewingOtherClient ? "Progress insight" : "Your progress insight"}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {getInsight(stats!, moodTrend, urgeTrend, isViewingOtherClient)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Current Streak</p>
                  <p className="text-4xl font-bold text-orange-700 dark:text-orange-300">
                    {stats?.currentStreak || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Best: {stats?.longestStreak || 0} days
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <Flame className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-600 dark:text-cyan-400">Consistency</p>
                  <p className="text-4xl font-bold text-cyan-700 dark:text-cyan-300">
                    {stats?.dailyCompletionRate || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.totalCheckins || 0} total check-ins
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                  <ClipboardCheck className="h-8 w-8 text-cyan-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Avg Mood</p>
                    {moodTrend === "increasing" && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300 px-1">
                        <TrendingUp className="h-3 w-3" />
                      </Badge>
                    )}
                    {moodTrend === "decreasing" && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300 px-1">
                        <TrendingDown className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                    {stats?.averageMood || 0}<span className="text-xl">/10</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Higher is better</p>
                </div>
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-purple-600 dark:text-purple-400">Avg Urge</p>
                    {urgeTrend === "decreasing" && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300 px-1">
                        <TrendingDown className="h-3 w-3" />
                      </Badge>
                    )}
                    {urgeTrend === "increasing" && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300 px-1">
                        <TrendingUp className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <p className="text-4xl font-bold text-purple-700 dark:text-purple-300">
                    {stats?.averageUrge || 0}<span className="text-xl">/10</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Lower is better</p>
                </div>
                <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4 text-emerald-500" />
                Mood — Last 14 Days
              </CardTitle>
              <CardDescription>Higher is better</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={moodData} color="#10b981" label="Mood level" height={140} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-purple-500" />
                Urge Intensity — Last 14 Days
              </CardTitle>
              <CardDescription>Lower is better</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={urgeData} color="#8b5cf6" label="Urge level" height={140} />
            </CardContent>
          </Card>
        </div>

        {/* Program Progress + Completion Rate */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-amber-500" />
                Program Progress
              </CardTitle>
              <CardDescription>
                16-week journey — each bubble is one week
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <WeekGrid completedWeeks={completedWeeks} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-4 w-4 text-cyan-500" />
                Daily Check-in Rate
              </CardTitle>
              <CardDescription>
                Last {stats?.windowSize || 14} days — consistency builds change
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6 gap-4">
              <ProgressRing percentage={stats?.dailyCompletionRate || 0} color="#0891b2" size={140} />
              <p className="text-sm text-center text-muted-foreground max-w-xs">
                {(stats?.dailyCompletionRate ?? 0) >= 80
                  ? "Strong consistency. This level of check-in frequency is where patterns become visible."
                  : (stats?.dailyCompletionRate ?? 0) >= 50
                  ? "Solid effort. Daily check-ins — even brief ones — compound over time."
                  : "Aim to check in daily. The data only works if it's there."}
              </p>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}

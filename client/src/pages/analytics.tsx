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
  Calendar,
  ClipboardCheck,
  BarChart3,
  LineChart
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

function TrendChart({ data, color, label, height = 120 }: { data: (number | null)[]; color: string; label: string; height?: number }) {
  const validData = data.filter(d => d !== null) as number[];
  if (validData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No data yet. Complete check-ins to see trends.
      </div>
    );
  }
  
  const max = Math.max(...validData, 10);
  const min = Math.min(...validData, 0);
  const range = max - min || 1;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-lg font-bold" style={{ color }}>
          {validData[validData.length - 1]}/10
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
                opacity: value !== null ? 0.6 + (i / data.length) * 0.4 : 0.1
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
    return `${isViewingOther ? "More" : "Keep"} check${isViewingOther ? "-ins are needed" : "ing in daily"} to build enough data for meaningful trend analysis (at least ${MIN_ENTRIES_FOR_TREND} entries).`;
  }

  if (stats.currentStreak >= 14) {
    insights.push(`${isViewingOther ? "A" : "You've maintained a"} two-week streak! This level of consistency is building lasting neural pathways.`);
  } else if (stats.currentStreak >= 7) {
    insights.push(`${isViewingOther ? "A" : "A"} week-long streak shows real commitment. ${your} brain is adapting to this new routine.`);
  } else if (stats.currentStreak >= 3) {
    insights.push("Three days of consistency is when habits start forming. Keep going!");
  }

  if (moodTrend === "increasing") {
    insights.push(`${you} mood has been meaningfully improving — a positive sign of progress.`);
  } else if (moodTrend === "decreasing") {
    insights.push(`${you} mood has dipped recently. This is common and awareness is the first step to turning it around.`);
  }

  if (urgeTrend === "decreasing") {
    insights.push(`${you} urge levels are meaningfully decreasing — coping strategies are working.`);
  } else if (urgeTrend === "increasing") {
    insights.push(`Urge levels have increased. ${isViewingOther ? "Consider discussing" : "Consider reviewing"} coping tools or ${isViewingOther ? "additional" : "reaching out for"} support.`);
  } else if ((urgeTrend === "stable" || urgeTrend === "consistently_same") && stats.averageUrge < 4) {
    insights.push(`${you} urge levels are consistently low — a sign of growing control.`);
  }

  if (stats.dailyCompletionRate >= 80) {
    insights.push(`Excellent consistency! ${isViewingOther ? "Checking" : "You're checking"} in most days.`);
  } else if (stats.dailyCompletionRate < 50 && stats.totalCheckins > 5) {
    insights.push("More frequent check-ins help stay aware of patterns. Try to check in daily.");
  }

  return insights.length > 0 ? insights[0] : `${you} data is stable. ${isViewingOther ? "Encourage daily" : "Keep"} check${isViewingOther ? "-ins" : "ing in daily"} to track the journey.`;
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
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-10" />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-64 w-full" />
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href={isViewingOtherClient ? (isMentor ? `/therapist/clients/${viewingClientId}` : `/admin/clients/${viewingClientId}`) : "/dashboard"}>
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold leading-tight">
                  {isViewingOtherClient ? `${viewedClientName || 'Client'}'s Analytics` : 'My Analytics'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isViewingOtherClient ? 'Client recovery progress' : 'Track your recovery progress'}
                </div>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Insight Banner */}
        {stats && stats.totalCheckins > 0 && (
          <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <LineChart className="h-5 w-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-cyan-700 dark:text-cyan-300 mb-1">{isViewingOtherClient ? 'Client Progress Insight' : 'Your Progress Insight'}</p>
                  <p className="text-sm text-cyan-600 dark:text-cyan-400">{getInsight(stats, moodTrend, urgeTrend, isViewingOtherClient)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
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
                  <p className="text-sm text-cyan-600 dark:text-cyan-400">Total Check-ins</p>
                  <p className="text-4xl font-bold text-cyan-700 dark:text-cyan-300">
                    {stats?.totalCheckins || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Days of awareness
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                  <Target className="h-8 w-8 text-cyan-500" />
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
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                        <TrendingUp className="h-3 w-3" />
                      </Badge>
                    )}
                    {moodTrend === "decreasing" && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                        <TrendingDown className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                    {stats?.averageMood || 0}<span className="text-xl">/10</span>
                  </p>
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
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                        <TrendingDown className="h-3 w-3" />
                      </Badge>
                    )}
                    {urgeTrend === "increasing" && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                        <TrendingUp className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <p className="text-4xl font-bold text-purple-700 dark:text-purple-300">
                    {stats?.averageUrge || 0}<span className="text-xl">/10</span>
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-500" />
                Mood Trends (14 Days)
              </CardTitle>
              <CardDescription>
                Higher is better - track how you're feeling each day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={moodData} color="#10b981" label="Mood Level" height={150} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                Urge Trends (14 Days)
              </CardTitle>
              <CardDescription>
                Lower is better - watch urges decrease over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={urgeData} color="#8b5cf6" label="Urge Level" height={150} />
            </CardContent>
          </Card>
        </div>

        {/* Completion Rate and Program Progress */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-cyan-500" />
                Daily Check-in Rate
              </CardTitle>
              <CardDescription>
                Percentage of days with completed check-ins (last {stats?.windowSize || 14} days)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <ProgressRing percentage={stats?.dailyCompletionRate || 0} color="#0891b2" size={140} />
              <p className="text-sm text-muted-foreground mt-4">
                {stats?.dailyCompletionRate || 0}% consistency builds lasting change
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Program Progress
              </CardTitle>
              <CardDescription>
                Weeks completed in your 16-week journey
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold text-amber-600 dark:text-amber-400">
                  {completedWeeks.length}<span className="text-2xl text-muted-foreground">/16</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">weeks completed</p>
                <div className="w-full mt-4 bg-muted rounded-full h-3">
                  <div 
                    className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(completedWeeks.length / 16) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between w-full mt-2 text-xs text-muted-foreground">
                  <span>Phase 1: CBT</span>
                  <span>Phase 2: ACT</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/daily-checkin">
                <Button data-testid="button-goto-checkin">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Complete Today's Check-in
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" data-testid="button-goto-lessons">
                  <Calendar className="mr-2 h-4 w-4" />
                  Continue Lessons
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

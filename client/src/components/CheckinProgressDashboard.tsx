import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, TrendingUp, TrendingDown, Sun, Moon, Target, Heart, Zap, Award, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

type CheckinStats = {
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
  averageMood: number;
  averageUrge: number;
  morningCompletionRate: number;
  eveningCompletionRate: number;
  recentCheckins: Array<{
    date: string;
    mood: number | null;
    urge: number | null;
  }>;
};

function ProgressRing({ percentage, color, size = 80 }: { percentage: number; color: string; size?: number }) {
  const strokeWidth = 8;
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
        <span className="text-lg font-bold">{percentage}%</span>
      </div>
    </div>
  );
}

function MiniChart({ data, color, label }: { data: (number | null)[]; color: string; label: string }) {
  const validData = data.filter(d => d !== null) as number[];
  if (validData.length === 0) return null;
  
  const max = Math.max(...validData, 10);
  const min = Math.min(...validData, 0);
  const range = max - min || 1;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium" style={{ color }}>
          {validData[validData.length - 1]}/10
        </span>
      </div>
      <div className="flex items-end gap-1 h-12">
        {data.slice(-14).map((value, i) => {
          const height = value !== null ? ((value - min) / range) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-300"
              style={{ 
                height: `${Math.max(height, 5)}%`, 
                backgroundColor: value !== null ? color : 'transparent',
                opacity: value !== null ? 0.7 + (i / data.length) * 0.3 : 0.1
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>2 wks ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function getEncouragementMessage(stats: CheckinStats): { message: string; type: 'success' | 'encouragement' | 'tip' } {
  if (stats.currentStreak >= 7) {
    return { 
      message: `Amazing! You're on a ${stats.currentStreak}-day streak. Your consistency is building real change!`, 
      type: 'success' 
    };
  }
  if (stats.currentStreak >= 3) {
    return { 
      message: `Great momentum! ${stats.currentStreak} days in a row. Keep showing up for yourself!`, 
      type: 'success' 
    };
  }
  if (stats.averageUrge > 0 && stats.averageUrge < stats.averageMood) {
    return { 
      message: "Your mood is trending higher than urges - that's a positive sign of progress!", 
      type: 'encouragement' 
    };
  }
  if (stats.totalCheckins >= 5) {
    return { 
      message: "Every check-in is a step toward freedom. You're doing the work!", 
      type: 'encouragement' 
    };
  }
  if (stats.totalCheckins > 0) {
    return { 
      message: "You've started your journey! Daily check-ins help you build awareness and track progress.", 
      type: 'tip' 
    };
  }
  return { 
    message: "Start your first check-in today! Tracking helps you understand patterns and make progress.", 
    type: 'tip' 
  };
}

export function CheckinProgressDashboard() {
  const { data: stats, isLoading } = useQuery<CheckinStats>({
    queryKey: ['/api/progress/checkin-stats'],
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalCheckins === 0) {
    return (
      <Card className="col-span-full border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Calendar className="h-5 w-5" />
            Start Your Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-amber-800 dark:text-amber-200">
            Daily check-ins help you track your mood, urges, and build awareness. Start today to see your progress!
          </p>
          <Link href="/daily-checkin">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="button-start-checkin">
              <Sun className="mr-2 h-4 w-4" />
              Start First Check-in
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const encouragement = getEncouragementMessage(stats);
  const moodData = stats.recentCheckins.map(c => c.mood);
  const urgeData = stats.recentCheckins.map(c => c.urge);
  
  // Calculate trend indicators
  const recentMoods = moodData.filter(m => m !== null).slice(-3);
  const olderMoods = moodData.filter(m => m !== null).slice(0, -3);
  const moodTrending = recentMoods.length > 0 && olderMoods.length > 0
    ? (recentMoods.reduce((a, b) => a! + b!, 0)! / recentMoods.length) > (olderMoods.reduce((a, b) => a! + b!, 0)! / olderMoods.length)
    : null;

  const recentUrges = urgeData.filter(u => u !== null).slice(-3);
  const olderUrges = urgeData.filter(u => u !== null).slice(0, -3);
  const urgeTrending = recentUrges.length > 0 && olderUrges.length > 0
    ? (recentUrges.reduce((a, b) => a! + b!, 0)! / recentUrges.length) < (olderUrges.reduce((a, b) => a! + b!, 0)! / olderUrges.length)
    : null;

  return (
    <div className="col-span-full space-y-4">
      {/* Encouragement Banner */}
      <Card className={`border-l-4 ${
        encouragement.type === 'success' 
          ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20' 
          : encouragement.type === 'encouragement'
            ? 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
            : 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
      }`}>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            {encouragement.type === 'success' ? (
              <Award className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : encouragement.type === 'encouragement' ? (
              <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm font-medium ${
              encouragement.type === 'success' 
                ? 'text-green-700 dark:text-green-300' 
                : encouragement.type === 'encouragement'
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-amber-700 dark:text-amber-300'
            }`}>
              {encouragement.message}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Streak Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Current Streak</p>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                  {stats.currentStreak} <span className="text-lg font-normal">days</span>
                </p>
                {stats.longestStreak > stats.currentStreak && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Best: {stats.longestStreak} days
                  </p>
                )}
              </div>
              <div className="h-14 w-14 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Flame className="h-7 w-7 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Check-ins */}
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-600 dark:text-cyan-400">Total Check-ins</p>
                <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
                  {stats.totalCheckins}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep building momentum!
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                <Target className="h-7 w-7 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Mood */}
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Avg Mood</p>
                  {moodTrending !== null && (
                    <Badge variant="outline" className={`text-xs ${moodTrending ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}`}>
                      {moodTrending ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    </Badge>
                  )}
                </div>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {stats.averageMood}<span className="text-lg font-normal">/10</span>
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Heart className="h-7 w-7 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Urge */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-purple-600 dark:text-purple-400">Avg Urge</p>
                  {urgeTrending !== null && (
                    <Badge variant="outline" className={`text-xs ${urgeTrending ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}`}>
                      {urgeTrending ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    </Badge>
                  )}
                </div>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {stats.averageUrge}<span className="text-lg font-normal">/10</span>
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Zap className="h-7 w-7 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Completion Rates */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Trend Charts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              14-Day Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MiniChart data={moodData} color="#10b981" label="Mood Level" />
            <MiniChart data={urgeData} color="#8b5cf6" label="Urge Level" />
          </CardContent>
        </Card>

        {/* Completion Rates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Check-in Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <ProgressRing percentage={stats.morningCompletionRate} color="#f59e0b" />
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Morning</span>
                </div>
              </div>
              <div className="text-center">
                <ProgressRing percentage={stats.eveningCompletionRate} color="#6366f1" />
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Moon className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm text-muted-foreground">Evening</span>
                </div>
              </div>
            </div>
            <div className="text-center mt-4">
              <Link href="/daily-checkin">
                <Button variant="outline" size="sm" data-testid="button-goto-checkin">
                  Continue Today's Check-in
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

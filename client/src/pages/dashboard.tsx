import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Lock,
  LogOut,
  ClipboardCheck,
  Key,
  CheckCircle,
  Eye,
  AlertTriangle,
  BarChart3,
  Loader2,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  UserCircle,
  UserCog,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { WEEK_TITLES, PHASE_INFO } from "@/data/curriculum";
import { ADOLESCENT_WEEK_TITLES } from "@/data/adolescent-curriculum";
import { Badge } from "@/components/ui/badge";
import { OnboardingModal } from "@/components/OnboardingModal";
import { CheckinProgressDashboard } from "@/components/CheckinProgressDashboard";
import { UrgeSurfingTool } from "@/components/UrgeSurfingTool";

type WeekItem = {
  week: number;
  title: string;
};

export default function Dashboard() {
  const { user, isLoading, isAuthenticating, logout } = useAuth();
  const isAdolescent = (user as any)?.programType === "adolescent";
  const WEEKS: WeekItem[] = Array.from({ length: 16 }, (_, i) => ({
    week: i + 1,
    title: isAdolescent
      ? (ADOLESCENT_WEEK_TITLES[i + 1] || `Week ${i + 1}`)
      : (WEEK_TITLES[i + 1] || `Week ${i + 1}`),
  }));
  const [, setLocation] = useLocation();

  const { data: completionsData } = useQuery<{ completedWeeks: number[] }>({
    queryKey: ["/api/progress/completions"],
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: unlockedWeeksData } = useQuery<{ unlockedWeeks: number[] }>({
    queryKey: ["/api/progress/unlocked-weeks"],
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: feedbackData } = useQuery<{
    feedback: Array<{
      id: string;
      feedbackType: string;
      content: string;
      weekNumber: number | null;
      checkinDateKey: string | null;
      createdAt: string;
      editedAt: string | null;
      editedBy: string | null;
    }>;
  }>({
    queryKey: ["/api/my-feedback"],
  });

  const completedWeeks = completionsData?.completedWeeks || [];
  const unlockedWeeks = unlockedWeeksData?.unlockedWeeks || [];

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && (user as any).role === "client") {
      const onboardingKey = `onboarding_completed_${(user as any).id}`;
      const hasCompletedOnboarding = localStorage.getItem(onboardingKey);
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) {
      const onboardingKey = `onboarding_completed_${(user as any).id}`;
      localStorage.setItem(onboardingKey, "true");
      setShowOnboarding(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticating && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, isAuthenticating, setLocation]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const nextAvailableWeek = useMemo(() => {
    for (let i = 1; i <= 16; i++) {
      if (unlockedWeeks.includes(i) && !completedWeeks.includes(i)) {
        return i;
      }
    }
    return completedWeeks.length > 0 ? Math.max(...completedWeeks) : 1;
  }, [unlockedWeeks, completedWeeks]);

  const resumeCurrentWeek = () => {
    setLocation(`/week/${nextAvailableWeek}`);
  };

  const { data: reflectionData } = useQuery<any>({
    queryKey: [`/api/progress/reflection/${nextAvailableWeek}`],
    enabled: !!user && nextAvailableWeek <= 16,
  });

  const { data: exerciseData } = useQuery<any>({
    queryKey: [`/api/progress/exercise/${nextAvailableWeek}`],
    enabled: !!user && nextAvailableWeek <= 16,
  });

  const { data: homeworkData } = useQuery<any>({
    queryKey: [`/api/progress/homework/${nextAvailableWeek}`],
    enabled: !!user && nextAvailableWeek <= 16,
  });

  const hasReflection = !!(reflectionData?.reflection?.q1 || reflectionData?.reflection?.q2 || reflectionData?.reflection?.q3 || reflectionData?.reflection?.q4);
  const hasExercise = !!exerciseData?.exercise?.answers && exerciseData.exercise.answers !== "{}";
  const hasHomework = !!homeworkData?.homework?.completedItems && homeworkData.homework.completedItems !== "[]";
  const showSubmitNudge = hasReflection && hasExercise && hasHomework && !completedWeeks.includes(nextAvailableWeek);

  if (isLoading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const completionCount = completedWeeks.length;
  const progressPercent = Math.round((completionCount / 16) * 100);

  return (
    <div className="min-h-screen bg-background">
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">SI</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold leading-tight text-sm">
                  The Integrity Protocol
                </div>
                <div className="text-xs text-muted-foreground">
                  Member Dashboard
                </div>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-profile-menu">
                  <UserCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline text-sm">
                    {(user as any)?.name || "Account"}
                  </span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {(user as any)?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(user as any)?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation("/analytics")}
                  data-testid="menu-analytics"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  My Analytics
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/change-password")}
                  data-testid="menu-change-password"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/user-manual")}
                  data-testid="menu-user-manual"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  User Manual
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/profile")}
                  data-testid="menu-profile"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  data-testid="menu-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {showSubmitNudge && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-base font-bold">Action Needed: Submit Week {nextAvailableWeek}</CardTitle>
              </div>
              <CardDescription className="text-orange-700 dark:text-orange-400">
                You've completed your work for Week {nextAvailableWeek}. Don't forget to click "Complete Week" to notify your mentor and unlock the next module.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setLocation(`/week/${nextAvailableWeek}`)}
                className="bg-orange-600 hover:bg-orange-700 text-white border-none"
              >
                Go to Week {nextAvailableWeek}
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" data-testid="text-welcome-greeting">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {(user as any)?.name || 'there'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Your program progress and daily tools.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setLocation("/analytics")}
            data-testid="button-analytics-top"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            My Analytics
          </Button>
        </div>

        <Card>
          <CardHeader className="gap-1">
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle className="text-lg">My Program</CardTitle>
                <CardDescription className="mt-1">
                  {completionCount} of 16 weeks completed
                  {completionCount > 0 && ` \u00b7 ${progressPercent}%`}
                </CardDescription>
                {completionCount > 0 && (
                  <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <UrgeSurfingTool />
                <Link href="/relapse-autopsy" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    data-testid="button-relapse-autopsy"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Relapse Autopsy
                  </Button>
                </Link>
                <Link href="/daily-checkin" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    data-testid="button-daily-checkin"
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Daily Check-in
                  </Button>
                </Link>
                <Button
                  onClick={resumeCurrentWeek}
                  className="w-full sm:w-auto"
                  data-testid="button-resume-week"
                >
                  {completedWeeks.includes(nextAvailableWeek)
                    ? `Review Week ${nextAvailableWeek}`
                    : `Continue Week ${nextAvailableWeek}`}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="divide-y">
              {WEEKS.map((w) => {
                const isCompleted = completedWeeks.includes(w.week);
                const isUnlocked = unlockedWeeks.includes(w.week);
                const isAvailable = isUnlocked && !isCompleted;

                return (
                  <div
                    key={w.week}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    data-testid={`week-row-${w.week}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                      ) : isAvailable ? (
                        <div className="h-4 w-4 rounded-full border-2 border-accent flex-shrink-0" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          Week {w.week}: {w.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isCompleted
                            ? "Completed"
                            : isUnlocked
                              ? "Available"
                              : "Locked"}
                        </div>
                      </div>
                    </div>

                    {isCompleted ? (
                      <Link href={`/week/${w.week}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-review-week-${w.week}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </Link>
                    ) : isAvailable ? (
                      <Link href={`/week/${w.week}`}>
                        <Button
                          size="sm"
                          data-testid={`button-continue-week-${w.week}`}
                        >
                          Continue
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 pr-2">
                        Locked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <CheckinProgressDashboard />

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              Messages from Your Mentor
            </CardTitle>
            <CardDescription>
              Personalized messages from your mentor on your progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!feedbackData?.feedback || feedbackData.feedback.length === 0 ? (
              <p
                className="text-sm text-muted-foreground py-4"
                data-testid="text-no-feedback"
              >
                No messages from your mentor yet. They'll reach out as you progress through the program.
              </p>
            ) : (
              <div
                className="space-y-3 max-h-96 overflow-y-auto"
                data-testid="section-mentor-messages"
              >
                {[...feedbackData.feedback]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-md border p-4"
                      data-testid={`feedback-item-${fb.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary">
                          {fb.feedbackType === "week" && fb.weekNumber
                            ? `Week ${fb.weekNumber}`
                            : fb.feedbackType === "checkin" && fb.checkinDateKey
                              ? `Check-in: ${fb.checkinDateKey}`
                              : fb.feedbackType === "checkin"
                                ? "Check-in"
                                : fb.feedbackType === "guidance"
                                  ? "Message"
                                  : "General"}
                        </Badge>
                        <div className="flex items-center gap-2 flex-wrap">
                          {fb.editedAt && (
                            <span className="text-[10px] text-muted-foreground italic">
                              Edited &middot; {new Date(fb.editedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(fb.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {fb.content}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground py-4 border-t">
          <p>
            The Integrity Protocol is an educational and personal growth program.{" "}
            <strong>It is not therapy or mental health treatment.</strong>
          </p>
          <p className="mt-1">
            If you are in crisis, call or text <strong>988</strong> (Suicide & Crisis Lifeline) or text HOME to <strong>741741</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}

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
import { Calendar, Lock, LogOut, Mail, User, ClipboardCheck, Key, CheckCircle, Eye, AlertTriangle } from "lucide-react";
import { WEEK_TITLES, PHASE_INFO } from "@/data/curriculum";
import { OnboardingModal } from "@/components/OnboardingModal";

type WeekItem = {
  week: number;
  title: string;
};

const WEEKS: WeekItem[] = Array.from({ length: 16 }, (_, i) => ({
  week: i + 1,
  title: WEEK_TITLES[i + 1] || `Week ${i + 1}`,
}));

export default function Dashboard() {
  const { user, isLoading, isAuthenticating, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch completed weeks from the API
  const { data: completionsData } = useQuery<{ completedWeeks: number[] }>({
    queryKey: ['/api/progress/completions'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch unlocked weeks based on start date
  const { data: unlockedWeeksData } = useQuery<{ unlockedWeeks: number[] }>({
    queryKey: ['/api/progress/unlocked-weeks'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const completedWeeks = completionsData?.completedWeeks || [];
  const unlockedWeeks = unlockedWeeksData?.unlockedWeeks || [];


  // Check if user has completed onboarding (only for clients)
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

  const memberSince = useMemo(() => {
    if (!user) return "";
    const createdAt = (user as any)?.createdAt;
    const dt = createdAt ? new Date(createdAt) : new Date();
    return dt.toLocaleDateString();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  // Find the next available week to continue (first unlocked but not completed)
  const nextAvailableWeek = useMemo(() => {
    for (let i = 1; i <= 16; i++) {
      if (unlockedWeeks.includes(i) && !completedWeeks.includes(i)) {
        return i;
      }
    }
    // If all unlocked weeks are completed, return the last completed week for review
    return completedWeeks.length > 0 ? Math.max(...completedWeeks) : 1;
  }, [unlockedWeeks, completedWeeks]);

  const resumeCurrentWeek = () => {
    setLocation(`/week/${nextAvailableWeek}`);
  };

  if (isLoading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Modal for first-time users */}
      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />
      
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">SI</span>
              </div>
              <div>
                <div className="font-semibold leading-tight">
                  Sexual Integrity Program
                </div>
                <div className="text-xs text-muted-foreground">
                  Private member dashboard
                </div>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link href="/change-password">
              <Button variant="ghost" size="icon" title="Change Password" data-testid="button-change-password">
                <Key className="h-4 w-4" />
              </Button>
            </Link>

            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* My Program */}
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>My Program</CardTitle>
                <CardDescription>
                  Your weekly modules, daily practices, and progress live here.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Daily Check-in button */}
                <Link href="/daily-checkin">
                  <Button variant="outline" data-testid="button-daily-checkin">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Daily Check-in
                  </Button>
                </Link>
                {/* Resume button */}
                <Button onClick={resumeCurrentWeek} data-testid="button-resume-week">
                  {completedWeeks.includes(nextAvailableWeek) ? `Review Week ${nextAvailableWeek}` : `Continue Week ${nextAvailableWeek}`}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 16-week overview */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Your 16-Week Program</h2>
              <p className="text-sm text-muted-foreground">
                Weeks unlock weekly. Right now Week 1 is available. As you
                progress, new weeks will unlock automatically.
              </p>
            </div>

            <div className="grid gap-3">
              {WEEKS.map((w) => {
                const isCompleted = completedWeeks.includes(w.week);
                const isUnlocked = unlockedWeeks.includes(w.week);
                const isAvailable = isUnlocked && !isCompleted;

                return (
                  <div
                    key={w.week}
                    className={`rounded-lg border p-4 flex items-center justify-between ${
                      isCompleted ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" : ""
                    }`}
                    data-testid={`week-row-${w.week}`}
                  >
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        Week {w.week}: {w.title}
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isCompleted
                          ? "Completed"
                          : isUnlocked
                          ? "Available"
                          : "Locked"}
                      </div>
                    </div>

                    {isCompleted ? (
                      <Link href={`/week/${w.week}`}>
                        <Button variant="outline" className="gap-2" data-testid={`button-review-week-${w.week}`}>
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                      </Link>
                    ) : isAvailable ? (
                      <Link href={`/week/${w.week}`}>
                        <Button variant="default" data-testid={`button-continue-week-${w.week}`}>
                          Continue
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" disabled className="gap-2" data-testid={`button-locked-week-${w.week}`}>
                        <Lock className="h-4 w-4" />
                        Locked
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>


            {/* Daily Check-ins and Support Resources */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Daily Check-ins */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Daily Check-In</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Track your progress with morning and evening check-ins. Required to continue progressing through the program.
                </p>
                <Button onClick={() => setLocation("/checkin")} data-testid="button-start-checkin">
                  Start Today's Check-In
                </Button>
              </div>

              {/* Relapse Support */}
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                  <h3 className="font-medium text-amber-700 dark:text-amber-400">If You've Had a Setback</h3>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300/80 mb-4">
                  A relapse does NOT remove you from the program. Use the Relapse Autopsy tool to process what happened and create a plan forward.
                </p>
                <Link href="/relapse-autopsy">
                  <Button variant="outline" className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50" data-testid="button-relapse-autopsy">
                    Open Relapse Autopsy
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Account */}
        <Card>
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>
              Profile info for this member account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">
                {(user as any)?.name ?? "Not set"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">
                {(user as any)?.email ?? "Not set"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Joined:</span>
              <span className="font-medium">{memberSince}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

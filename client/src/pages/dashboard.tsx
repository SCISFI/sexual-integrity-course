import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Calendar,
  Lock,
  LogOut,
  Mail,
  User,
  ClipboardCheck,
  Key,
  CheckCircle,
  Eye,
  AlertTriangle,
  BarChart3,
  Clock,
  XCircle,
  Loader2,
  BookOpen,
  MessageSquare,
  ChevronDown,
  Settings,
  UserCircle,
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
import { Badge } from "@/components/ui/badge";
import { OnboardingModal } from "@/components/OnboardingModal";
import { NotificationSettings } from "@/components/NotificationSettings";
import { CheckinProgressDashboard } from "@/components/CheckinProgressDashboard";
import { UrgeSurfingTool } from "@/components/UrgeSurfingTool";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const { toast } = useToast();
  // -----------------------------------------------------
  // Staff-only Draft Assistant UI state (v2 Hybrid)
  // -----------------------------------------------------
  const isStaff = user?.role === "admin" || user?.role === "therapist";

  const [draftClientId, setDraftClientId] = useState("");
  const [draftFocus, setDraftFocus] = useState("");
  const [draftTone, setDraftTone] = useState<"neutral" | "direct" | "warm">(
    "neutral",
  );
  const [draftConstraints, setDraftConstraints] = useState(
    "Avoid shame language. No diagnosis. No risk scoring.",
  );
  const [draftText, setDraftText] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  // Fetch completed weeks from the API
  const { data: completionsData } = useQuery<{ completedWeeks: number[] }>({
    queryKey: ["/api/progress/completions"],
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Fetch unlocked weeks based on start date
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

  // Check if user has completed onboarding (only for clients)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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

  // Cancel account mutation
  const cancelAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/account/cancel", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Cancelled",
        description:
          "Your account has been cancelled. You will retain access to any previously paid weeks. No refunds will be issued.",
      });
      setLocation("/login");
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel account. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const generateStaffDraft = async () => {
    if (!draftClientId || !draftFocus) return;
    setDraftLoading(true);
    setDraftText("");
    try {
      const res = await apiRequest("POST", "/api/ai/staff-draft", {
        clientId: draftClientId,
        focus: draftFocus,
        tone: draftTone,
        constraints: draftConstraints,
      });
      const data = await res.json();
      setDraftText(data.draft || "No draft generated.");
    } catch (err) {
      setDraftText("Failed to generate draft. Please try again.");
    } finally {
      setDraftLoading(false);
    }
  };

  const resumeCurrentWeek = () => {
    setLocation(`/week/${nextAvailableWeek}`);
  };

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

  return (
    <div className="min-h-screen bg-background">
      {isStaff && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mentor Draft Assistant (Private)</CardTitle>
            <CardDescription>
              Staff-only drafts. Not client-visible. Review and edit before use.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Client ID</div>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={draftClientId}
                onChange={(e) => setDraftClientId(e.target.value)}
                placeholder="Paste the client ID here"
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Focus</div>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={draftFocus}
                onChange={(e) => setDraftFocus(e.target.value)}
                placeholder="Session opener, accountability questions, follow-up email..."
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Tone</div>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={draftTone}
                onChange={(e) => setDraftTone(e.target.value as any)}
              >
                <option value="neutral">Neutral</option>
                <option value="direct">Direct</option>
                <option value="warm">Warm</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Constraints</div>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={draftConstraints}
                onChange={(e) => setDraftConstraints(e.target.value)}
              />
            </div>

            <Button onClick={generateStaffDraft} disabled={draftLoading}>
              {draftLoading ? "Generating..." : "Generate Draft"}
            </Button>

            {draftText && (
              <textarea
                className="w-full min-h-[200px] rounded-md border px-3 py-2 text-sm"
                value={draftText}
                readOnly
              />
            )}
          </CardContent>
        </Card>
      )}
      {/* Onboarding Modal for first-time users */}
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

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
                  The Integrity Protocol
                </div>
                <div className="text-xs text-muted-foreground">
                  Private member dashboard
                </div>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-profile-menu">
                  <UserCircle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowCancelDialog(true)}
                  className="text-destructive focus:text-destructive"
                  data-testid="menu-cancel-account"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Account
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

          <AlertDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Your Account?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>Are you sure you want to cancel your account?</p>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg mt-4">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Important:
                    </p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside">
                      <li>
                        You will retain access to any weeks you have already
                        paid for
                      </li>
                      <li>
                        No refunds will be issued for previously purchased weeks
                      </li>
                      <li>
                        You will not be able to purchase new weeks after
                        cancellation
                      </li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-keep-account">
                  Keep Account
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => cancelAccountMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={cancelAccountMutation.isPending}
                  data-testid="button-confirm-cancel-account"
                >
                  {cancelAccountMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Welcome greeting */}
        <div data-testid="text-welcome-greeting">
          <h1 className="text-2xl font-bold">
            Welcome back, {(user as any)?.name || 'there'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's your program progress and daily tools.
          </p>
        </div>

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
                {/* I'm Struggling button */}
                <UrgeSurfingTool />
                {/* Relapse Autopsy */}
                <Link href="/relapse-autopsy">
                  <Button
                    variant="outline"
                    className="border-amber-300 dark:border-amber-700"
                    data-testid="button-relapse-autopsy"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Relapse Autopsy
                  </Button>
                </Link>
                {/* Daily Check-in button */}
                <Link href="/daily-checkin">
                  <Button variant="outline" data-testid="button-daily-checkin">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Daily Check-in
                  </Button>
                </Link>
                {/* Resume button */}
                <Button
                  onClick={resumeCurrentWeek}
                  data-testid="button-resume-week"
                >
                  {completedWeeks.includes(nextAvailableWeek)
                    ? `Review Week ${nextAvailableWeek}`
                    : `Continue Week ${nextAvailableWeek}`}
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
                      isCompleted
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                        : ""
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
                        <Button
                          variant="outline"
                          className="gap-2"
                          data-testid={`button-review-week-${w.week}`}
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                      </Link>
                    ) : isAvailable ? (
                      <Link href={`/week/${w.week}`}>
                        <Button
                          variant="default"
                          data-testid={`button-continue-week-${w.week}`}
                        >
                          Continue
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        disabled
                        className="gap-2"
                        data-testid={`button-locked-week-${w.week}`}
                      >
                        <Lock className="h-4 w-4" />
                        Locked
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Check-in Progress Dashboard */}
        <CheckinProgressDashboard />

        {/* Mentor Feedback */}
        <Card>
          <CardHeader className="gap-3">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mentor Feedback
            </CardTitle>
            <CardDescription>
              Personalized feedback from your mentor on your progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!feedbackData?.feedback || feedbackData.feedback.length === 0 ? (
              <p
                className="text-sm text-muted-foreground"
                data-testid="text-no-feedback"
              >
                No feedback from your mentor yet. They'll provide personalized
                feedback as you progress through the program.
              </p>
            ) : (
              <div
                className="space-y-4 max-h-96 overflow-y-auto"
                data-testid="section-mentor-feedback"
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
                      className="rounded-lg border p-4"
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
                                : "General"}
                        </Badge>
                        {fb.editedAt && (
                          <span className="text-[10px] text-muted-foreground italic">
                            Edited by Admin &middot; {new Date(fb.editedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
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
                      <p className="text-sm whitespace-pre-wrap">
                        {fb.content}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mentor Support */}
        <Card className="border-primary/30 bg-primary/5 dark:bg-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              Your Mentor Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              You have a dedicated mentor monitoring your progress throughout
              this program. They review your check-ins, reflections, and
              homework—and will provide personalized feedback to support your
              recovery.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Clock className="h-4 w-4" />
              <span>Typical response time: Within 1-2 business days</span>
            </div>
          </CardContent>
        </Card>

        {/* Support Resources */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Support Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 dark:text-amber-300/80 mb-4">
              A setback does NOT remove you from the program. Use these tools to
              process and move forward.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/user-manual">
                <Button
                  variant="outline"
                  className="border-amber-300 dark:border-amber-700"
                  data-testid="button-user-manual"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  User Manual
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <NotificationSettings />

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
        <IntegrityCoach />
      </main>
    </div>
  );
}
export function IntegrityCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([
    { role: "bot", content: "Hello! How can I support your journey today?" },
  ]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setChat((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, weekNumber: 1 }),
      });

      const data = await response.json();
      setChat((prev) => [...prev, { role: "bot", content: data.reply }]);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        { role: "bot", content: "Sorry, I'm having trouble connecting." },
      ]);
    }
  };

  return (
    <div
      style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "15px",
          borderRadius: "50%",
          background: "#007bff",
          color: "white",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        }}
      >
        💬 Coach
      </button>

      {isOpen && (
        <div
          style={{
            background: "white",
            border: "1px solid #ccc",
            width: "300px",
            height: "400px",
            position: "absolute",
            bottom: "70px",
            right: "0",
            display: "flex",
            flexDirection: "column",
            padding: "10px",
            borderRadius: "10px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              marginBottom: "10px",
              fontSize: "14px",
            }}
          >
            {chat.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "8px",
                  textAlign: msg.role === "bot" ? "left" : "right",
                }}
              >
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: "10px",
                    background: msg.role === "bot" ? "#f0f0f0" : "#007bff",
                    color: msg.role === "bot" ? "black" : "white",
                    display: "inline-block",
                  }}
                >
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "5px" }}>
            <input
              style={{
                flex: 1,
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "5px",
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a question..."
            />
            <button
              onClick={sendMessage}
              style={{
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "0 10px",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

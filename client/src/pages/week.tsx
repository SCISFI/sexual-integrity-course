import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, BookOpen, HelpCircle, ClipboardList, ListChecks, PartyPopper, ArrowRight, Loader2, Lock, Eye, CreditCard, Cloud, BarChart3, PenLine, Lightbulb, Trophy, Sparkles, Target } from "lucide-react";
import { WEEK_CONTENT, WEEK_TITLES, PHASE_INFO } from "@/data/curriculum";
import { useToast } from "@/hooks/use-toast";
import { AIEncouragement } from "@/components/AIEncouragement";
import { CrisisResources } from "@/components/CrisisResources";
import { UrgeSurfingTool } from "@/components/UrgeSurfingTool";
import { MilestoneDialog, isMilestoneWeek } from "@/components/MilestoneDialog";

function safeNumber(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const WEEK_SUMMARIES: Record<number, { congrats: string; learnings: string[] }> = {
  1: {
    congrats: "You've taken an incredibly brave first step by completing Week 1. Beginning this journey takes real courage, and you should be proud of yourself.",
    learnings: [
      "You learned what Compulsive Sexual Behavior Disorder (CSBD) actually is - a recognized clinical condition, not a moral failure",
      "You understood the addiction cycle: preoccupation → ritualization → acting out → despair",
      "You began clarifying your personal motivation for change and recovery"
    ]
  },
  2: {
    congrats: "Great work completing Week 2! Understanding your triggers is a crucial skill for lasting change.",
    learnings: [
      "You identified the difference between internal triggers (emotions, thoughts) and external triggers (situations, people, places)",
      "You created your personal trigger inventory",
      "You learned strategies for managing high-risk situations"
    ]
  },
  3: {
    congrats: "Week 3 complete! You're building powerful skills for changing unhelpful thought patterns.",
    learnings: [
      "You learned cognitive restructuring techniques to identify and challenge distorted thinking",
      "You practiced recognizing cognitive distortions in your own thoughts",
      "You developed alternative, more balanced ways of thinking"
    ]
  },
  4: {
    congrats: "Excellent progress on Week 4! Self-regulation is a cornerstone of recovery.",
    learnings: [
      "You learned practical self-regulation skills for managing urges and emotions",
      "You practiced techniques for calming your nervous system",
      "You developed a personal toolkit for emotional regulation"
    ]
  },
  5: {
    congrats: "Week 5 complete! Understanding shame versus guilt is transformative for recovery.",
    learnings: [
      "You learned the crucial difference between shame (I am bad) and guilt (I did something bad)",
      "You understood how shame fuels the addiction cycle",
      "You began developing self-compassion practices"
    ]
  },
  6: {
    congrats: "Great work on Week 6! Healthy relationships are vital for lasting recovery.",
    learnings: [
      "You explored how CSBD has impacted your relationships",
      "You learned about healthy boundaries and intimacy",
      "You began developing strategies for rebuilding trust"
    ]
  },
  7: {
    congrats: "Week 7 complete! Communication skills will serve you well beyond recovery.",
    learnings: [
      "You learned assertive communication techniques",
      "You practiced expressing needs and boundaries clearly",
      "You developed skills for difficult conversations"
    ]
  },
  8: {
    congrats: "Congratulations on completing Phase 1! You've built a strong foundation for recovery.",
    learnings: [
      "You developed your initial relapse prevention plan",
      "You reviewed and consolidated all the CBT skills from Phase 1",
      "You're now prepared to begin the deeper work of Phase 2"
    ]
  },
  9: {
    congrats: "Welcome to Phase 2! Week 9 introduces powerful new approaches to lasting change.",
    learnings: [
      "You were introduced to Acceptance and Commitment Therapy (ACT)",
      "You learned about psychological flexibility",
      "You began understanding how acceptance differs from giving up"
    ]
  },
  10: {
    congrats: "Week 10 complete! Cognitive defusion is a game-changing skill.",
    learnings: [
      "You learned to observe thoughts without being controlled by them",
      "You practiced defusion techniques to create distance from unhelpful thoughts",
      "You understood that thoughts are not facts or commands"
    ]
  },
  11: {
    congrats: "Great work on Week 11! Your values will guide you toward the life you truly want.",
    learnings: [
      "You clarified your core personal values",
      "You explored what truly matters to you across different life domains",
      "You began connecting your values to daily actions"
    ]
  },
  12: {
    congrats: "Week 12 complete! Acceptance and mindfulness are powerful allies in recovery.",
    learnings: [
      "You deepened your understanding of acceptance - making room for difficult experiences",
      "You practiced mindfulness techniques",
      "You learned to be present rather than escaping into compulsive behavior"
    ]
  },
  13: {
    congrats: "Excellent work on Week 13! Committed action turns values into reality.",
    learnings: [
      "You learned about committed action - values-guided behavior even when it's difficult",
      "You practiced setting values-aligned goals",
      "You developed strategies for taking action despite discomfort"
    ]
  },
  14: {
    congrats: "Week 14 complete! Self-as-context provides a stable foundation for change.",
    learnings: [
      "You explored the observing self - the part of you that notices all experiences",
      "You practiced dis-identifying from thoughts, feelings, and roles",
      "You developed a more flexible sense of identity"
    ]
  },
  15: {
    congrats: "Great progress on Week 15! Your comprehensive relapse prevention plan is taking shape.",
    learnings: [
      "You developed a detailed, personalized relapse prevention plan",
      "You identified early warning signs and intervention strategies",
      "You built a support network and accountability system"
    ]
  },
  16: {
    congrats: "Congratulations on completing the entire 16-week Sexual Integrity Program! This is a remarkable achievement. The work you've done takes tremendous courage and commitment.",
    learnings: [
      "You've integrated all the skills and insights from both phases",
      "You've created a vision for your continued growth and recovery",
      "You've written a letter to your future self as a reminder of your journey"
    ]
  }
};

export default function WeekPage() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/week/:week");

  const weekNumber = useMemo(() => safeNumber(params?.week, 1), [params?.week]);

  const weekContent = WEEK_CONTENT[weekNumber];
  const title = WEEK_TITLES[weekNumber] ?? "Week";
  const phase = weekNumber <= 8 ? 1 : 2;
  const phaseInfo = PHASE_INFO[phase];

  const { toast } = useToast();
  const [isWeekCompleted, setIsWeekCompleted] = useState(false);
  const [affirmComplete, setAffirmComplete] = useState(false);
  const [homeworkCompleted, setHomeworkCompleted] = useState<Record<number, boolean>>({});
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});
  const [reflectionsLoaded, setReflectionsLoaded] = useState(false);
  const [homeworkLoaded, setHomeworkLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reflectionAnswersRef = useRef<Record<string, string>>({});
  const homeworkCompletedRef = useRef<Record<number, boolean>>({});
  const weekIsLockedRef = useRef(false);
  const reflectionsDirtyRef = useRef(false);
  const homeworkDirtyRef = useRef(false);
  const homeworkSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const paymentConfirmedRef = useRef(false);

  // Handle payment success confirmation
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentSuccess = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentSuccess === 'success' && sessionId && !paymentConfirmedRef.current) {
      paymentConfirmedRef.current = true;

      // Confirm the payment with Stripe session verification
      apiRequest("POST", "/api/payments/confirm-week", { weekNumber, sessionId })
        .then(() => {
          toast({
            title: "Payment Confirmed",
            description: `Week ${weekNumber} is now unlocked!`,
          });
          // Remove the query parameters
          window.history.replaceState({}, '', `/week/${weekNumber}`);
          // Refresh access data
          queryClient.invalidateQueries({ queryKey: ['/api/progress/week-access', weekNumber] });
        })
        .catch(() => {
          // Payment might have already been recorded or verification failed
          window.history.replaceState({}, '', `/week/${weekNumber}`);
        });
    } else if (paymentSuccess === 'success' && !sessionId) {
      // Old redirect without session ID - just clear the URL
      window.history.replaceState({}, '', `/week/${weekNumber}`);
    }
  }, [weekNumber, toast]);

  // Fetch completed weeks to check if this week is already done
  // Always fetch fresh data to handle admin resets
  const { data: completionsData } = useQuery<{ completedWeeks: number[] }>({
    queryKey: ['/api/progress/completions'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch unlocked weeks based on start date
  const { data: unlockedWeeksData } = useQuery<{ unlockedWeeks: number[] }>({
    queryKey: ['/api/progress/unlocked-weeks'],
  });

  // Fetch saved reflections for this week
  const { data: reflectionData, isLoading: loadingReflections } = useQuery<{ reflection: any }>({
    queryKey: ['/api/progress/reflection', weekNumber],
  });

  // Fetch homework completions for this week
  const { data: homeworkData } = useQuery<{ completedItems: number[] }>({
    queryKey: ['/api/progress/homework', weekNumber],
  });

  // Fetch payment status for this week
  const { data: paymentStatusData, isLoading: loadingPaymentStatus } = useQuery<{ 
    needsPayment: boolean; 
    reason?: string;
  }>({
    queryKey: [`/api/payments/week/${weekNumber}/status`],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Mutation to start checkout
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/checkout/week", { 
        weekNumber,
        successUrl: `${window.location.origin}/week/${weekNumber}?payment=success`,
        cancelUrl: `${window.location.origin}/week/${weekNumber}?payment=cancelled`,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Checkout Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const needsPayment = paymentStatusData?.needsPayment === true;

  // Check if this week is already completed (locked)
  const weekIsLocked = completionsData?.completedWeeks?.includes(weekNumber) || false;
  weekIsLockedRef.current = weekIsLocked;

  // Check if this week is time-locked (not yet unlocked based on start date)
  const unlockedWeeks = unlockedWeeksData?.unlockedWeeks || [];
  const isTimeLocked = unlockedWeeks.length > 0 && !unlockedWeeks.includes(weekNumber);

  // Check if next week is unlocked
  const nextWeekUnlocked = weekNumber < 16 && unlockedWeeks.includes(weekNumber + 1);

  // Sync isWeekCompleted with weekIsLocked on initial load
  useEffect(() => {
    if (weekIsLocked && !isWeekCompleted) {
      setIsWeekCompleted(true);
    }
  }, [weekIsLocked]);

  // Load reflections when data arrives
  useEffect(() => {
    if (reflectionData?.reflection && !reflectionsLoaded) {
      const r = reflectionData.reflection;
      const loaded = {
        q1: r.q1 || "",
        q2: r.q2 || "",
        q3: r.q3 || "",
        q4: r.q4 || "",
      };
      setReflectionAnswers(loaded);
      reflectionAnswersRef.current = loaded;
      reflectionsDirtyRef.current = false;
      setReflectionsLoaded(true);
    }
  }, [reflectionData, reflectionsLoaded]);

  // Load homework completions when data arrives
  useEffect(() => {
    if (homeworkData?.completedItems && !homeworkLoaded) {
      const completed: Record<number, boolean> = {};
      homeworkData.completedItems.forEach((idx: number) => {
        completed[idx] = true;
      });
      setHomeworkCompleted(completed);
      homeworkCompletedRef.current = completed;
      homeworkDirtyRef.current = false;
      setHomeworkLoaded(true);
    }
  }, [homeworkData, homeworkLoaded]);

  // Mutation to save reflections
  const saveReflectionMutation = useMutation({
    mutationFn: async (data: { q1?: string; q2?: string; q3?: string; q4?: string }) => {
      const res = await apiRequest("PUT", `/api/progress/reflection/${weekNumber}`, data);
      return res.json();
    },
    onMutate: () => {
      setSaveStatus("saving");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress/reflection', weekNumber] });
      reflectionsDirtyRef.current = false;
      setSaveStatus("saved");
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    },
    onError: () => {
      setSaveStatus("idle");
      toast({
        title: "Auto-save failed",
        description: "Your reflection answers couldn't be saved. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to mark week complete
  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/progress/completions/${weekNumber}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress/completions'] });
      setIsWeekCompleted(true);
      setShowCompletionDialog(true);
      // Show milestone dialog after completion dialog for milestone weeks
      if (isMilestoneWeek(weekNumber)) {
        setTimeout(() => setShowMilestoneDialog(true), 500);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark week complete. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to save homework completions
  const saveHomeworkMutation = useMutation({
    mutationFn: async (completedItems: number[]) => {
      const res = await apiRequest("PUT", `/api/progress/homework/${weekNumber}`, { completedItems });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress/homework', weekNumber] });
      homeworkDirtyRef.current = false;
    },
    onError: () => {
      toast({
        title: "Auto-save failed",
        description: "Your homework progress couldn't be saved.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    setAffirmComplete(false);
    setHomeworkCompleted({});
    setReflectionAnswers({});
    setReflectionsLoaded(false);
    setHomeworkLoaded(false);
    setIsWeekCompleted(false);
    setShowCompletionDialog(false);
    reflectionAnswersRef.current = {};
    homeworkCompletedRef.current = {};
    reflectionsDirtyRef.current = false;
    homeworkDirtyRef.current = false;
  }, [weekNumber]);

  // Debounced save for reflections
  const debouncedSaveReflections = useCallback((answers: Record<string, string>) => {
    if (weekIsLocked || loadingReflections) return; // Don't save if week is locked or still loading

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveReflectionMutation.mutate({
        q1: answers.q1 ?? "",
        q2: answers.q2 ?? "",
        q3: answers.q3 ?? "",
        q4: answers.q4 ?? "",
      });
    }, 1000); // Save after 1 second of inactivity
  }, [weekNumber, weekIsLocked, loadingReflections]);

  // Debounced save for homework
  const debouncedSaveHomework = useCallback((completed: Record<number, boolean>) => {
    if (weekIsLocked) return;

    if (homeworkSaveTimeoutRef.current) {
      clearTimeout(homeworkSaveTimeoutRef.current);
    }
    homeworkSaveTimeoutRef.current = setTimeout(() => {
      const completedItems = Object.entries(completed)
        .filter(([, isCompleted]) => isCompleted)
        .map(([idx]) => parseInt(idx, 10));
      saveHomeworkMutation.mutate(completedItems);
    }, 500);
  }, [weekNumber, weekIsLocked]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (homeworkSaveTimeoutRef.current) {
        clearTimeout(homeworkSaveTimeoutRef.current);
      }
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }

      if (!weekIsLockedRef.current && reflectionsDirtyRef.current) {
        const answers = reflectionAnswersRef.current;
        fetch(`/api/progress/reflection/${weekNumber}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            q1: answers.q1 ?? "",
            q2: answers.q2 ?? "",
            q3: answers.q3 ?? "",
            q4: answers.q4 ?? "",
          }),
          keepalive: true,
        }).catch(() => {});
      }

      if (!weekIsLockedRef.current && homeworkDirtyRef.current) {
        const completed = homeworkCompletedRef.current;
        const completedItems = Object.entries(completed)
          .filter(([, isCompleted]) => isCompleted)
          .map(([idx]) => parseInt(idx, 10));
        fetch(`/api/progress/homework/${weekNumber}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ completedItems }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [weekNumber]);

  const markWeekComplete = async () => {
    try {
      // First save reflections immediately
      await saveReflectionMutation.mutateAsync({
        q1: reflectionAnswers.q1 ?? "",
        q2: reflectionAnswers.q2 ?? "",
        q3: reflectionAnswers.q3 ?? "",
        q4: reflectionAnswers.q4 ?? "",
      });
      // Then mark the week complete
      markCompleteMutation.mutate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save reflections. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleHomework = (index: number) => {
    setHomeworkCompleted(prev => {
      const updated = { ...prev, [index]: !prev[index] };
      homeworkCompletedRef.current = updated;
      homeworkDirtyRef.current = true;
      debouncedSaveHomework(updated);
      return updated;
    });
  };

  const handleReflectionChange = (questionId: string, value: string) => {
    if (weekIsLocked) return;

    const newAnswers = {
      ...reflectionAnswers,
      [questionId]: value
    };
    setReflectionAnswers(newAnswers);
    reflectionAnswersRef.current = newAnswers;
    reflectionsDirtyRef.current = true;
    debouncedSaveReflections(newAnswers);
  };

  const weekSummary = WEEK_SUMMARIES[weekNumber] || {
    congrats: "Congratulations on completing this week! Your dedication to growth is inspiring.",
    learnings: ["You've taken another important step in your recovery journey."]
  };

  const hasReflectionAnswers = Object.values(reflectionAnswers).some(answer => answer.trim().length > 0);

  // Calculate homework progress
  const homeworkTotal = weekContent?.homeworkChecklist?.length || 0;
  const homeworkDone = Object.values(homeworkCompleted).filter(Boolean).length;
  const homeworkProgress = homeworkTotal > 0 ? Math.round((homeworkDone / homeworkTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 flex-wrap border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="font-semibold text-sm">Sexual Integrity Program</div>
            <div className="text-xs text-muted-foreground">
              Week {weekNumber} of 16
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UrgeSurfingTool />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/analytics")}
            data-testid="button-analytics"
            title="View Analytics"
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
          <CrisisResources />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className={`relative overflow-hidden rounded-xl ${phase === 1 ? 'bg-gradient-to-br from-primary/90 via-primary to-primary/80' : 'bg-gradient-to-br from-accent/90 via-accent to-accent/80'} p-6 md:p-8 text-white`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                Phase {phase}: {phase === 1 ? 'CBT' : 'ACT'}
              </Badge>
              {weekIsLocked && (
                <Badge variant="secondary" className="bg-green-500/30 text-white border-green-300/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-week-title">
              Week {weekNumber}: {title}
            </h1>
            <p className="text-white/90 text-sm md:text-base max-w-2xl" data-testid="text-week-overview">
              {weekContent?.overview ?? "Content coming soon."}
            </p>
            
            {/* Progress Indicator */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${(weekNumber / 16) * 100}%` }}
                />
              </div>
              <span className="text-sm text-white/80 font-medium">{Math.round((weekNumber / 16) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Review Mode Banner - show for completed weeks */}
        {weekIsLocked && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30" data-testid="banner-review-mode">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex-shrink-0 p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200">Review Mode</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You completed this week. You can review your answers below, but cannot make changes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Encouragement section - only show if week is accessible */}
        {!isTimeLocked && (
          <AIEncouragement weekNumber={weekNumber} />
        )}

        {/* Show time-locked message if week is not yet accessible */}
        {isTimeLocked && (
          <Card className="border-dashed" data-testid="week-time-locked">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Week Not Yet Available</h3>
              <p className="max-w-md text-muted-foreground">
                This week will unlock {weekNumber > 1 ? `${(weekNumber - 1) * 7} days` : ""} after your program start date.
                {unlockedWeeks.length > 0 && ` You currently have access to Week${unlockedWeeks.length > 1 ? "s" : ""} ${unlockedWeeks.join(", ")}.`}
              </p>
              <Button
                className="mt-6"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-go-dashboard"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment wall - show if week is unlocked but not paid for */}
        {!isTimeLocked && needsPayment && (
          <Card className="border-dashed" data-testid="week-payment-required">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Payment Required</h3>
              <p className="max-w-md text-muted-foreground mb-6">
                Unlock Week {weekNumber} for <span className="font-semibold text-foreground">$14.99</span> to access the full lesson content, exercises, and reflection activities.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  data-testid="button-pay-week"
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay $14.99 to Unlock
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-back-dashboard-pay"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isTimeLocked && !needsPayment && (
          <Tabs defaultValue="read" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="read" data-testid="tab-read">
                <BookOpen className="h-4 w-4 mr-2" />
                Read
              </TabsTrigger>
              <TabsTrigger value="listen" data-testid="tab-listen">Listen</TabsTrigger>
              <TabsTrigger value="video" data-testid="tab-video">Video</TabsTrigger>
            </TabsList>

            <TabsContent value="read" className="space-y-6">
              {weekContent ? (
                <>
                  {/* Teaching Sections */}
                  {weekContent.teaching && weekContent.teaching.length > 0 && (
                    <Card data-testid="section-teaching">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold">Teaching</h2>
                            <p className="text-sm text-muted-foreground">
                              {weekContent.teaching.length} topic{weekContent.teaching.length !== 1 ? 's' : ''} to explore
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Accordion type="multiple" className="w-full">
                          {weekContent.teaching.map((section, idx) => (
                            <AccordionItem key={section.id} value={section.id} className="border-b last:border-b-0">
                              <AccordionTrigger 
                                className="text-left py-4 hover:no-underline group"
                                data-testid={`accordion-teaching-${idx}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary group-hover:bg-primary/20 transition-colors">
                                    {idx + 1}
                                  </span>
                                  <span className="font-medium">{section.title}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pl-10 space-y-4 text-sm text-muted-foreground leading-relaxed">
                                  {section.content.map((paragraph, pIdx) => (
                                    <p key={pIdx}>{paragraph}</p>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reflection Questions */}
                  {weekContent.reflectionQuestions && weekContent.reflectionQuestions.length > 0 && (
                    <Card className="border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10" data-testid="section-reflection">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                              <PenLine className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                            </div>
                            <div>
                              <h2 className="text-xl font-semibold">Reflection Journal</h2>
                              <p className="text-sm text-muted-foreground">
                                Take time to reflect on your journey
                              </p>
                            </div>
                          </div>
                          {!weekIsLocked && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="save-indicator">
                              {saveStatus === "saving" && (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              )}
                              {saveStatus === "saved" && (
                                <>
                                  <Cloud className="h-3 w-3 text-green-600" />
                                  <span className="text-green-600">Saved</span>
                                </>
                              )}
                              {saveStatus === "idle" && reflectionsLoaded && (
                                <>
                                  <Cloud className="h-3 w-3" />
                                  <span>Auto-save on</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {weekContent.reflectionQuestions.map((q, idx) => (
                          <div 
                            key={q.id} 
                            className="rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-white/70 dark:bg-background/50 p-4 space-y-3"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200/70 dark:bg-amber-800/50 text-xs font-semibold text-amber-800 dark:text-amber-200 flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <Label 
                                htmlFor={`reflection-${q.id}`}
                                className="text-sm font-medium leading-relaxed"
                                data-testid={`label-reflection-${idx}`}
                              >
                                {q.question}
                              </Label>
                            </div>
                            <Textarea
                              id={`reflection-${q.id}`}
                              placeholder={weekIsLocked ? "This week has been completed. Your answers are saved." : "Write your reflection here..."}
                              className={`min-h-[100px] bg-white dark:bg-background/80 border-amber-200/50 dark:border-amber-800/30 resize-none ${weekIsLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                              value={reflectionAnswers[q.id] || ""}
                              onChange={(e) => handleReflectionChange(q.id, e.target.value)}
                              disabled={weekIsLocked}
                              data-testid={`input-reflection-${idx}`}
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Exercises */}
                  {weekContent.exercises && weekContent.exercises.length > 0 && (
                    <Card data-testid="section-exercises">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                            <Target className="h-5 w-5 text-green-700 dark:text-green-400" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold">Exercises</h2>
                            <p className="text-sm text-muted-foreground">
                              {weekContent.exercises.length} practical exercise{weekContent.exercises.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4">
                        {weekContent.exercises.map((exercise, idx) => (
                          <div 
                            key={exercise.id}
                            className="rounded-lg border bg-muted/30 overflow-hidden"
                          >
                            <div className="flex items-center gap-3 p-4 border-b bg-muted/50">
                              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                                Exercise {idx + 1}
                              </Badge>
                              <span className="font-medium">{exercise.title}</span>
                            </div>
                            <div className="p-4 space-y-4">
                              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30">
                                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  {exercise.instructions}
                                </p>
                              </div>
                              <div className="space-y-4">
                                {exercise.fields.map((field, fIdx) => (
                                  <div key={field.id} className="space-y-2">
                                    <Label 
                                      htmlFor={`${exercise.id}-${field.id}`}
                                      className="text-sm font-medium"
                                    >
                                      {field.label}
                                    </Label>
                                    {field.type === "textarea" ? (
                                      <Textarea
                                        id={`${exercise.id}-${field.id}`}
                                        placeholder={field.placeholder}
                                        className="min-h-[120px] resize-none"
                                        data-testid={`input-exercise-${idx}-${fIdx}`}
                                      />
                                    ) : field.type === "number" ? (
                                      <Input
                                        id={`${exercise.id}-${field.id}`}
                                        type="number"
                                        placeholder={field.placeholder}
                                        data-testid={`input-exercise-${idx}-${fIdx}`}
                                      />
                                    ) : (
                                      <Input
                                        id={`${exercise.id}-${field.id}`}
                                        type="text"
                                        placeholder={field.placeholder}
                                        data-testid={`input-exercise-${idx}-${fIdx}`}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Homework Checklist */}
                  {weekContent.homeworkChecklist && weekContent.homeworkChecklist.length > 0 && (
                    <Card data-testid="section-homework">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                            <ListChecks className="h-5 w-5 text-purple-700 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h2 className="text-xl font-semibold">Weekly Homework</h2>
                              <span className="text-sm font-medium text-muted-foreground">
                                {homeworkDone}/{homeworkTotal} completed
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <Progress value={homeworkProgress} className="h-2 flex-1" />
                              <span className="text-xs font-medium text-muted-foreground w-10">
                                {homeworkProgress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {weekContent.homeworkChecklist.map((item, idx) => (
                            <div 
                              key={idx} 
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                homeworkCompleted[idx] 
                                  ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/30' 
                                  : 'bg-muted/30 border-transparent'
                              }`}
                              data-testid={`homework-item-${idx}`}
                            >
                              <Checkbox
                                id={`homework-${idx}`}
                                checked={homeworkCompleted[idx] || false}
                                onCheckedChange={() => toggleHomework(idx)}
                                disabled={weekIsLocked}
                                className="mt-0.5"
                                data-testid={`checkbox-homework-${idx}`}
                              />
                              <label
                                htmlFor={`homework-${idx}`}
                                className={`text-sm flex-1 ${weekIsLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${
                                  homeworkCompleted[idx] ? 'line-through text-muted-foreground' : ''
                                }`}
                              >
                                {item}
                              </label>
                              {homeworkCompleted[idx] && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {homeworkProgress === 100 && (
                          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-green-100/80 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-sm font-medium">Amazing! You've completed all homework for this week!</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Week Completion */}
                  {weekIsLocked ? (
                    <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10">
                      <CardContent className="flex items-center gap-4 py-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                          <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-800 dark:text-green-200">Week {weekNumber} Completed</h3>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Your reflection answers are saved and viewable above.
                          </p>
                        </div>
                        {weekNumber < 16 && (
                          <Button
                            onClick={() => setLocation(`/week/${weekNumber + 1}`)}
                            data-testid="button-next-week-locked"
                          >
                            Week {weekNumber + 1}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                      <CardContent className="py-6 space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-muted">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={affirmComplete}
                            onChange={(e) => setAffirmComplete(e.target.checked)}
                            data-testid="checkbox-affirm-complete"
                          />
                          <span className="text-sm leading-relaxed">
                            By marking this week complete, I affirm that I have completed all required readings, reflections, and exercises <strong>honestly and in full</strong>. I understand that partial completion or skipping undermines the purpose of this program.
                          </span>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-muted-foreground">
                            {isWeekCompleted
                              ? weekNumber === 16 
                                ? "Congratulations! You have completed the program!"
                                : `Week ${weekNumber} completed! Week ${weekNumber + 1} is now unlocked.`
                              : weekNumber === 16
                                ? "Complete all exercises to finish the program."
                                : `Complete all exercises to unlock Week ${weekNumber + 1}.`}
                          </p>

                          <Button
                            onClick={markWeekComplete}
                            disabled={isWeekCompleted || !affirmComplete || markCompleteMutation.isPending}
                            className="gap-2"
                            data-testid="button-mark-complete"
                          >
                            {markCompleteMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : isWeekCompleted ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Week {weekNumber} Completed
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Mark Week {weekNumber} Complete
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Content for Week {weekNumber} is coming soon.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="listen">
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Audio narration coming soon.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="video">
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Video content coming soon.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <PartyPopper className="h-5 w-5 text-primary" />
              </div>
              Week {weekNumber} Complete!
            </DialogTitle>
            <DialogDescription className="sr-only">
              Congratulations on completing Week {weekNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Congratulations Message */}
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 border border-primary/20">
              <p className="text-sm leading-relaxed">
                {weekSummary.congrats}
              </p>
            </div>

            {/* What You Learned */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                What You Learned This Week
              </h3>
              <ul className="space-y-2">
                {weekSummary.learnings.map((learning, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>{learning}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Personal Insights from Reflections */}
            {hasReflectionAnswers && (
              <div className="space-y-3">
                <h3 className="font-semibold">Your Personal Insights</h3>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  {weekContent?.reflectionQuestions?.map((q) => {
                    const answer = reflectionAnswers[q.id];
                    if (!answer?.trim()) return null;
                    return (
                      <div key={q.id} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{q.question}</p>
                        <p className="text-sm italic">"{answer.substring(0, 150)}{answer.length > 150 ? '...' : ''}"</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daily Check-in Reminder */}
            {weekNumber < 16 && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Don't forget: Daily Check-ins</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Complete your daily check-in every day to track your progress and stay accountable. This is a key part of the program.
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold">
                {weekNumber === 16 ? "Your Continuing Journey" : "Next Steps"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {weekNumber === 16 
                  ? "Remember: recovery is a journey, not a destination. Continue practicing the skills you've learned, stay connected to your support network, and be compassionate with yourself. You've done remarkable work."
                  : nextWeekUnlocked 
                    ? `Week ${weekNumber + 1} is available. Take some time to let this week's lessons settle before moving on. Remember to practice what you've learned and complete any homework assignments.`
                    : `Great work! Week ${weekNumber + 1} will unlock ${weekNumber * 7} days after your program start date. In the meantime, continue practicing what you've learned and complete any homework assignments.`
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4">
              <Button 
                onClick={() => setLocation("/daily-checkin")}
                className="w-full"
                data-testid="button-go-checkin"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Do Today's Check-in
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                className="w-full"
                data-testid="button-go-dashboard"
              >
                Return to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {weekNumber < 16 && nextWeekUnlocked && (
                <Button 
                  variant="ghost"
                  onClick={() => {
                    setShowCompletionDialog(false);
                    setLocation(`/week/${weekNumber + 1}`);
                  }}
                  className="w-full"
                  data-testid="button-next-week"
                >
                  Continue to Week {weekNumber + 1}
                </Button>
              )}
              {weekNumber < 16 && !nextWeekUnlocked && (
                <div className="flex items-center justify-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Week {weekNumber + 1} will unlock based on your program schedule</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Milestone Celebration Dialog */}
      <MilestoneDialog 
        weekNumber={weekNumber} 
        open={showMilestoneDialog} 
        onClose={() => setShowMilestoneDialog(false)} 
      />
    </div>
  );
}

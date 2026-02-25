import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, CheckCircle2, ClipboardList, PartyPopper, ArrowRight, Loader2, Lock, Eye, CreditCard, Cloud, BarChart3, PenLine, Map, Brain, Anchor, Sunset, Heart, MessageCircle, Shield, Leaf, Feather, Compass, Droplets, Footprints, Circle, ShieldCheck, Sunrise, RefreshCw, Lightbulb, Waves, Users, Wind, Star, Mountain, Target, BookOpen, Infinity } from "lucide-react";
import { WEEK_CONTENT, WEEK_TITLES, type Exercise } from "@/data/curriculum";
import { useToast } from "@/hooks/use-toast";
import { CrisisResources } from "@/components/CrisisResources";
import { TextToSpeech } from "@/components/TextToSpeech";
import { MilestoneDialog, isMilestoneWeek } from "@/components/MilestoneDialog";

function safeNumber(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const WEEK_SUMMARIES: Record<number, { congrats: string; learnings: string[]; nextWeekTeaser?: string }> = {
  1: {
    congrats: "You showed up. You were honest. That's not a small thing — it's the foundation everything else is built on.",
    learnings: [
      "You named what brought you here — not just the behavior, but the relational impact",
      "You recognized the cycle and isolation as the hidden drivers",
      "You made a commitment — not just to yourself, but to what you're rebuilding"
    ],
    nextWeekTeaser: "You've named the cycle. Next week, you'll map YOUR specific version of it — every trigger, every ritual, every exit ramp. The more precisely you can see it, the earlier you can stop it."
  },
  2: {
    congrats: "Great work completing Week 2! Understanding your triggers is a crucial skill for lasting change.",
    learnings: [
      "You identified the difference between internal triggers (emotions, thoughts) and external triggers (situations, people, places)",
      "You created your personal trigger inventory",
      "You learned strategies for managing high-risk situations"
    ],
    nextWeekTeaser: "You know your triggers. But what happens in the 10 seconds between trigger and choice? Week 3 exposes the thought patterns — the distortions, the rationalizations your mind runs automatically — and gives you tools to interrupt them before they gain momentum."
  },
  3: {
    congrats: "Week 3 complete! You're building powerful skills for changing unhelpful thought patterns.",
    learnings: [
      "You learned cognitive restructuring techniques to identify and challenge distorted thinking",
      "You practiced recognizing cognitive distortions in your own thoughts",
      "You developed alternative, more balanced ways of thinking"
    ],
    nextWeekTeaser: "You can see the thoughts now. But seeing isn't stopping. Week 4 gives you the physiological tools — techniques that work on your nervous system in real-time when an urge hits. This is where insight becomes capability."
  },
  4: {
    congrats: "Excellent progress on Week 4! Self-regulation is a cornerstone of recovery.",
    learnings: [
      "You learned practical self-regulation skills for managing urges and emotions",
      "You practiced techniques for calming your nervous system",
      "You developed a personal toolkit for emotional regulation"
    ],
    nextWeekTeaser: "You have tools. But there's a fuel source you haven't fully confronted. Week 5 goes after the emotion that drives more relapse than any trigger: shame. Understanding how it operates — and how to dismantle it — changes everything."
  },
  5: {
    congrats: "Week 5 complete! Understanding shame versus guilt is transformative for recovery.",
    learnings: [
      "You learned the crucial difference between shame (I am bad) and guilt (I did something bad)",
      "You understood how shame fuels the addiction cycle",
      "You began developing self-compassion practices"
    ],
    nextWeekTeaser: "You've been working on yourself. Week 6 turns the lens outward. Your patterns didn't develop in a vacuum — they developed in relationship. The relational roots of this behavior may be the most important territory you explore."
  },
  6: {
    congrats: "Great work on Week 6! Healthy relationships are vital for lasting recovery.",
    learnings: [
      "You explored how CSBD has impacted your relationships",
      "You learned about healthy boundaries and intimacy",
      "You began developing strategies for rebuilding trust"
    ],
    nextWeekTeaser: "You understand what's driven the distance. Week 7 teaches you what to do about it — specifically how to have the conversations you've been avoiding, express what you actually need, and begin rebuilding trust through honest communication."
  },
  7: {
    congrats: "Week 7 complete! Communication skills will serve you well beyond recovery.",
    learnings: [
      "You learned assertive communication techniques",
      "You practiced expressing needs and boundaries clearly",
      "You developed skills for difficult conversations"
    ],
    nextWeekTeaser: "Week 8 is where everything comes together. Seven weeks of understanding — the cycle, triggers, thoughts, body, shame, relationships — get encoded into a single plan. The plan that will hold when things get hard."
  },
  8: {
    congrats: "Congratulations on completing Phase 1! You've built a strong foundation for recovery.",
    learnings: [
      "You developed your initial relapse prevention plan",
      "You reviewed and consolidated all the CBT skills from Phase 1",
      "You're now prepared to begin the deeper work of Phase 2"
    ],
    nextWeekTeaser: "Phase 1 is complete. Phase 2 starts with something fundamentally different. You've been fighting your urges. Week 9 will challenge whether fighting is the right strategy — and introduce an approach that changes your relationship with the struggle itself."
  },
  9: {
    congrats: "Welcome to Phase 2! Week 9 introduces powerful new approaches to lasting change.",
    learnings: [
      "You were introduced to Acceptance and Commitment Therapy (ACT)",
      "You learned about psychological flexibility",
      "You began understanding how acceptance differs from giving up"
    ],
    nextWeekTeaser: "You've seen what psychological flexibility can do. Week 10 takes it further. Defusion — the ability to step back from a thought until it loses its grip — turns 'I need to act out' into just a thought. Watch what happens to an urge you stop arguing with."
  },
  10: {
    congrats: "Week 10 complete! Cognitive defusion is a game-changing skill.",
    learnings: [
      "You learned to observe thoughts without being controlled by them",
      "You practiced defusion techniques to create distance from unhelpful thoughts",
      "You understood that thoughts are not facts or commands"
    ],
    nextWeekTeaser: "You can step back from thoughts. But what are you stepping toward? Week 11 answers that. Clarifying your core values isn't therapy-speak — it's the architecture of a life that doesn't need escape."
  },
  11: {
    congrats: "Great work on Week 11! Your values will guide you toward the life you truly want.",
    learnings: [
      "You clarified your core personal values",
      "You explored what truly matters to you across different life domains",
      "You began connecting your values to daily actions"
    ],
    nextWeekTeaser: "You know your values. But the gap between knowing and living is where most men stumble. Week 12 teaches you how to stay present when discomfort arrives — not by eliminating it, but by moving through it without running."
  },
  12: {
    congrats: "Week 12 complete! Acceptance and mindfulness are powerful allies in recovery.",
    learnings: [
      "You deepened your understanding of acceptance - making room for difficult experiences",
      "You practiced mindfulness techniques",
      "You learned to be present rather than escaping into compulsive behavior"
    ],
    nextWeekTeaser: "Acceptance is not the finish line — it's the starting line. Week 13 is where values stop being an idea and start being daily behavior. Committed action is the difference between insight and actual change."
  },
  13: {
    congrats: "Excellent work on Week 13! Committed action turns values into reality.",
    learnings: [
      "You learned about committed action - values-guided behavior even when it's difficult",
      "You practiced setting values-aligned goals",
      "You developed strategies for taking action despite discomfort"
    ],
    nextWeekTeaser: "Who are you beyond your behavior? Week 14 answers that in a way that permanently shifts how you relate to your struggle. The observing self — the part of you that can notice urges without becoming them — may be your most powerful recovery tool."
  },
  14: {
    congrats: "Week 14 complete! Self-as-context provides a stable foundation for change.",
    learnings: [
      "You explored the observing self - the part of you that notices all experiences",
      "You practiced dis-identifying from thoughts, feelings, and roles",
      "You developed a more flexible sense of identity"
    ],
    nextWeekTeaser: "You've built a new identity. Week 15 protects it. Everything you've learned gets encoded into a comprehensive plan — your early warning system, your response protocols, your accountability structure. The plan that holds when things get hard."
  },
  15: {
    congrats: "Great progress on Week 15! Your comprehensive relapse prevention plan is taking shape.",
    learnings: [
      "You developed a detailed, personalized relapse prevention plan",
      "You identified early warning signs and intervention strategies",
      "You built a support network and accountability system"
    ],
    nextWeekTeaser: "One week left. Not the end — the beginning of what this was always building toward. Week 16 integrates everything: who you've become, what you've rebuilt, and how you carry this forward. Most men don't make it this far. You did."
  },
  16: {
    congrats: "Congratulations on completing the entire 16-week Integrity Protocol! This is a remarkable achievement. The work you've done takes tremendous courage and commitment.",
    learnings: [
      "You've integrated all the skills and insights from both phases",
      "You've created a vision for your continued growth and recovery",
      "You've written a letter to your future self as a reminder of your journey"
    ]
  }
};

type LucideIcon = React.ComponentType<{ className?: string }>;

interface WeekHero {
  icon: LucideIcon;
  accent: LucideIcon;
  gradient: string;
  tagline: string;
}

const WEEK_HERO: Record<number, WeekHero> = {
  1:  { icon: Eye,          accent: BookOpen,     gradient: "from-slate-900 to-cyan-900",    tagline: "Face what you've been hiding" },
  2:  { icon: Map,          accent: RefreshCw,    gradient: "from-slate-900 to-indigo-900",  tagline: "Know your triggers. Stop the cycle." },
  3:  { icon: Brain,        accent: Lightbulb,    gradient: "from-slate-900 to-blue-900",    tagline: "Rewire the thoughts that drive the behavior" },
  4:  { icon: Anchor,       accent: Waves,        gradient: "from-slate-900 to-cyan-800",    tagline: "Hold steady when the urge hits" },
  5:  { icon: Sunset,       accent: Cloud,        gradient: "from-slate-900 to-amber-900",   tagline: "Shame fuels the cycle. Break it." },
  6:  { icon: Heart,        accent: Users,        gradient: "from-slate-900 to-rose-900",    tagline: "The damage done. The repair begins." },
  7:  { icon: MessageCircle,accent: ArrowRight,   gradient: "from-slate-900 to-blue-800",    tagline: "Say what needs to be said" },
  8:  { icon: Shield,       accent: CheckCircle2, gradient: "from-slate-900 to-green-900",   tagline: "Build the plan that holds" },
  9:  { icon: Leaf,         accent: Wind,         gradient: "from-slate-900 to-emerald-900", tagline: "Stop fighting. Start moving." },
  10: { icon: Cloud,        accent: Feather,      gradient: "from-slate-900 to-sky-900",     tagline: "A thought is not a command" },
  11: { icon: Compass,      accent: Star,         gradient: "from-slate-900 to-yellow-900",  tagline: "What actually matters to you?" },
  12: { icon: Droplets,     accent: Mountain,     gradient: "from-slate-900 to-teal-900",    tagline: "Present. Not running." },
  13: { icon: Target,       accent: Footprints,   gradient: "from-slate-900 to-green-800",   tagline: "Values in motion, not just in mind" },
  14: { icon: Eye,          accent: Circle,       gradient: "from-slate-900 to-purple-900",  tagline: "You are not your urges" },
  15: { icon: ShieldCheck,  accent: Lock,         gradient: "from-slate-900 to-blue-900",    tagline: "Protect what you've built" },
  16: { icon: Sunrise,      accent: Infinity,     gradient: "from-slate-900 to-orange-900",  tagline: "The beginning of what comes next" },
};

export default function WeekPage() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/week/:week");

  const weekNumber = useMemo(() => safeNumber(params?.week, 1), [params?.week]);

  const weekContent = WEEK_CONTENT[weekNumber];
  const title = WEEK_TITLES[weekNumber] ?? "Week";
  const phase = weekNumber <= 8 ? 1 : 2;

  const { toast } = useToast();
  const [isWeekCompleted, setIsWeekCompleted] = useState(false);
  const [affirmComplete, setAffirmComplete] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});
  const [reflectionsLoaded, setReflectionsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({});
  const [exercisesLoaded, setExercisesLoaded] = useState(false);
  const [exerciseSaveStatus, setExerciseSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reflectionAnswersRef = useRef<Record<string, string>>({});
  const exerciseAnswersRef = useRef<Record<string, string>>({});
  const exercisesDirtyRef = useRef(false);
  const exerciseSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const weekIsLockedRef = useRef(false);
  const reflectionsDirtyRef = useRef(false);
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

  // Fetch exercise answers for this week
  const { data: exerciseData, isLoading: loadingExercises } = useQuery<{ answers: Record<string, string> }>({
    queryKey: ['/api/progress/exercises', weekNumber],
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
        q5: r.q5 || "",
        q6: r.q6 || "",
      };
      setReflectionAnswers(loaded);
      reflectionAnswersRef.current = loaded;
      reflectionsDirtyRef.current = false;
      setReflectionsLoaded(true);
    }
  }, [reflectionData, reflectionsLoaded]);

  // Load exercise answers when data arrives
  useEffect(() => {
    if (exerciseData?.answers && !exercisesLoaded) {
      setExerciseAnswers(exerciseData.answers);
      exerciseAnswersRef.current = exerciseData.answers;
      exercisesDirtyRef.current = false;
      setExercisesLoaded(true);
    }
  }, [exerciseData, exercisesLoaded]);

  // Mutation to save reflections
  const saveReflectionMutation = useMutation({
    mutationFn: async (data: { q1?: string; q2?: string; q3?: string; q4?: string; q5?: string; q6?: string }) => {
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

  // Mutation to save exercise answers
  const saveExerciseMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await apiRequest("PUT", `/api/progress/exercises/${weekNumber}`, { answers: data });
      return res.json();
    },
    onMutate: () => {
      setExerciseSaveStatus("saving");
    },
    onSuccess: () => {
      setExerciseSaveStatus("saved");
      setTimeout(() => setExerciseSaveStatus("idle"), 2000);
    },
    onError: () => {
      setExerciseSaveStatus("idle");
    },
  });

  useEffect(() => {
    setAffirmComplete(false);
    setReflectionAnswers({});
    setReflectionsLoaded(false);
    setExerciseAnswers({});
    setExercisesLoaded(false);
    setIsWeekCompleted(false);
    setShowCompletionDialog(false);
    reflectionAnswersRef.current = {};
    exerciseAnswersRef.current = {};
    reflectionsDirtyRef.current = false;
    exercisesDirtyRef.current = false;
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
        q5: answers.q5 ?? "",
        q6: answers.q6 ?? "",
      });
    }, 1000); // Save after 1 second of inactivity
  }, [weekNumber, weekIsLocked, loadingReflections]);

  // Debounced save for exercises
  const debouncedSaveExercises = useCallback((answers: Record<string, string>) => {
    if (weekIsLocked || loadingExercises) return;
    if (exerciseSaveTimeoutRef.current) {
      clearTimeout(exerciseSaveTimeoutRef.current);
    }
    exerciseSaveTimeoutRef.current = setTimeout(() => {
      saveExerciseMutation.mutate(answers);
    }, 1000);
  }, [weekNumber, weekIsLocked, loadingExercises]);

  const handleExerciseChange = useCallback((fieldKey: string, value: string) => {
    const updated = { ...exerciseAnswersRef.current, [fieldKey]: value };
    setExerciseAnswers(updated);
    exerciseAnswersRef.current = updated;
    exercisesDirtyRef.current = true;
    debouncedSaveExercises(updated);
  }, [debouncedSaveExercises]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      if (exerciseSaveTimeoutRef.current) {
        clearTimeout(exerciseSaveTimeoutRef.current);
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
            q5: answers.q5 ?? "",
            q6: answers.q6 ?? "",
          }),
          keepalive: true,
        }).catch(() => {});
      }

      if (!weekIsLockedRef.current && exercisesDirtyRef.current) {
        const answers = exerciseAnswersRef.current;
        fetch(`/api/progress/exercises/${weekNumber}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ answers }),
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

  // Calculate progress based on completed reflections and exercises per teaching section
  const totalTeachingSections = weekContent?.teaching?.length || 0;
  const totalReflections = weekContent?.reflectionQuestions?.length || 0;
  const nonNullExercises = weekContent?.exercises?.filter((e): e is Exercise => e !== null) || [];
  const totalExercises = nonNullExercises.length;
  const totalProgressItems = totalReflections + totalExercises;
  
  const completedReflections = weekContent?.reflectionQuestions?.filter(
    (q) => (reflectionAnswers[q.id] || "").trim().length > 0
  ).length || 0;
  
  const completedExercises = nonNullExercises.filter((exercise) =>
    exercise.fields.every((field) => 
      (exerciseAnswers[`${exercise.id}-${field.id}`] || "").trim().length > 0
    )
  ).length || 0;
  
  const sectionProgress = totalProgressItems > 0
    ? Math.round(((completedReflections + completedExercises) / totalProgressItems) * 100)
    : 0;

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
            <div className="font-semibold text-sm">The Integrity Protocol</div>
            <div className="text-xs text-muted-foreground">
              Week {weekNumber} of 16
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation("/analytics")}
            data-testid="button-analytics"
            className="flex items-center gap-1.5"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm">Analytics</span>
          </Button>
          <CrisisResources />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Hero Section */}
        <Card className="overflow-hidden" data-testid="section-hero">
          {/* Themed Hero Graphic */}
          {(() => {
            const hero = WEEK_HERO[weekNumber];
            if (!hero) return null;
            const PrimaryIcon = hero.icon;
            const AccentIcon = hero.accent;
            return (
              <div className={`relative flex flex-col items-center justify-center bg-gradient-to-br ${hero.gradient} h-44 md:h-52 overflow-hidden px-6`}>
                {/* Decorative large faint background icons */}
                <PrimaryIcon className="absolute left-4 top-4 h-28 w-28 text-white opacity-5 rotate-12" />
                <AccentIcon className="absolute right-4 bottom-4 h-24 w-24 text-white opacity-5 -rotate-12" />
                {/* Central icon cluster */}
                <div className="relative flex items-center justify-center gap-4 mb-3">
                  <AccentIcon className="h-7 w-7 text-white/40" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
                    <PrimaryIcon className="h-8 w-8 text-white" />
                  </div>
                  <AccentIcon className="h-7 w-7 text-white/40" />
                </div>
                {/* Tagline */}
                <p className="text-white/90 text-sm md:text-base font-medium tracking-wide text-center max-w-xs">
                  {hero.tagline}
                </p>
                {/* Week badge */}
                <span className="absolute top-3 right-3 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/70 font-medium">
                  Week {weekNumber} of 16
                </span>
              </div>
            );
          })()}

          <CardContent className="p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary">
                Phase {phase}: {phase === 1 ? 'CBT' : 'ACT'}
              </Badge>
              {weekIsLocked && (
                <Badge variant="secondary" className="bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-week-title">
                Week {weekNumber}: {title}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed" data-testid="text-week-overview">
                {weekContent?.overview ?? "Content coming soon."}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-3 pt-2">
              <Progress value={(weekNumber / 16) * 100} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{Math.round((weekNumber / 16) * 100)}% complete</span>
            </div>
          </CardContent>
        </Card>

        {/* Review Mode Banner - show for completed weeks */}
        {weekIsLocked && (
          <Card data-testid="banner-review-mode">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex-shrink-0">
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                You completed this week. You can review your answers below, but cannot make changes.
              </p>
            </CardContent>
          </Card>
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
          <div className="space-y-6">
            {weekContent ? (
              <>
                {/* Progress Tracker */}
                {totalProgressItems > 0 && (
                  <div className="flex items-center gap-3" data-testid="section-progress-tracker">
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                      {completedReflections + completedExercises}/{totalProgressItems}
                    </span>
                    <Progress value={sectionProgress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground font-medium w-8 text-right">
                      {sectionProgress}%
                    </span>
                  </div>
                )}

                {/* Auto-save indicators */}
                {!weekIsLocked && (
                  <div className="flex items-center justify-end gap-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="save-indicator">
                      {(saveStatus === "saving" || exerciseSaveStatus === "saving") && (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Saving...</span>
                        </>
                      )}
                      {saveStatus === "saved" && exerciseSaveStatus !== "saving" && (
                        <>
                          <Cloud className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Saved</span>
                        </>
                      )}
                      {exerciseSaveStatus === "saved" && saveStatus !== "saving" && saveStatus !== "saved" && (
                        <>
                          <Cloud className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Saved</span>
                        </>
                      )}
                      {saveStatus === "idle" && exerciseSaveStatus === "idle" && (reflectionsLoaded || exercisesLoaded) && (
                        <>
                          <Cloud className="h-3 w-3" />
                          <span>Auto-save on</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Teaching Sections with embedded Reflections and Exercises */}
                {weekContent.teaching && weekContent.teaching.length > 0 && (
                  <div className="space-y-3" data-testid="section-teaching">
                    <div className="flex items-center justify-between gap-2 flex-wrap px-1">
                      <h2 className="text-lg font-semibold">Lessons</h2>
                      <span className="text-xs text-muted-foreground">
                        {weekContent.teaching.length} topic{weekContent.teaching.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {weekContent.teaching.map((section, idx) => {
                        const sectionReflection = weekContent.reflectionQuestions?.[idx];
                        const sectionExercise = weekContent.exercises?.[idx];
                        const hasReflectionAnswer = sectionReflection && (reflectionAnswers[sectionReflection.id] || "").trim().length > 0;
                        const hasExerciseAnswer = sectionExercise && sectionExercise.fields.every(
                          (field) => (exerciseAnswers[`${sectionExercise.id}-${field.id}`] || "").trim().length > 0
                        );
                        const sectionItemCount = (sectionReflection ? 1 : 0) + (sectionExercise ? 1 : 0);
                        const sectionCompletedCount = (hasReflectionAnswer ? 1 : 0) + (hasExerciseAnswer ? 1 : 0);
                        const sectionDone = sectionItemCount > 0 && sectionCompletedCount === sectionItemCount;

                        return (
                          <Card key={section.id} className="overflow-visible">
                            <Accordion type="multiple" className="w-full">
                              <AccordionItem value={section.id} className="border-0">
                                <AccordionTrigger 
                                  className="text-left px-4 py-4 md:px-6 md:py-5 hover:no-underline group min-h-[52px]"
                                  data-testid={`accordion-teaching-${idx}`}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
                                      sectionDone 
                                        ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400' 
                                        : 'bg-muted text-muted-foreground'
                                    }`}>
                                      {sectionDone ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                      ) : (
                                        idx + 1
                                      )}
                                    </span>
                                    <span className="font-medium text-sm md:text-base">{section.title}</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="px-4 pb-5 md:px-6 md:pb-6 space-y-6">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground pl-10">
                                      <TextToSpeech 
                                        text={section.content.join('. ')} 
                                        label={`Listen to "${section.title}"`} 
                                      />
                                      <span>Listen to this section</span>
                                    </div>
                                    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed pl-10">
                                      {section.content.map((paragraph, pIdx) => (
                                        <p key={pIdx}>{paragraph}</p>
                                      ))}
                                    </div>

                                    {/* Embedded Reflection for this section */}
                                    {sectionReflection && (
                                      <div className="rounded-md border bg-muted/30 dark:bg-muted/10 p-4 md:p-5 space-y-3 ml-10">
                                        <div className="flex items-start gap-2">
                                          <PenLine className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                          <div className="flex-1 space-y-1">
                                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Reflection</span>
                                            <Label 
                                              htmlFor={`reflection-${sectionReflection.id}`}
                                              className="text-sm font-medium leading-relaxed block"
                                              data-testid={`label-reflection-${idx}`}
                                            >
                                              {sectionReflection.question}
                                            </Label>
                                          </div>
                                        </div>
                                        <Textarea
                                          id={`reflection-${sectionReflection.id}`}
                                          placeholder={weekIsLocked ? "This week has been completed. Your answers are saved." : "Write your reflection here..."}
                                          className={`min-h-[120px] resize-none ${weekIsLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                          value={reflectionAnswers[sectionReflection.id] || ""}
                                          onChange={(e) => handleReflectionChange(sectionReflection.id, e.target.value)}
                                          disabled={weekIsLocked}
                                          data-testid={`input-reflection-${idx}`}
                                        />
                                      </div>
                                    )}

                                    {/* Embedded Exercise for this section */}
                                    {sectionExercise && (
                                      <div className="rounded-md border overflow-visible ml-10">
                                        <div className="flex items-center gap-3 px-4 py-3 md:px-5 border-b bg-muted/20">
                                          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Exercise</span>
                                          <span className="text-sm font-medium">{sectionExercise.title}</span>
                                        </div>
                                        <div className="p-4 md:p-5 space-y-4">
                                          <p className="text-sm text-muted-foreground leading-relaxed">
                                            {sectionExercise.instructions}
                                          </p>
                                          <div className="space-y-4">
                                            {sectionExercise.fields.map((field, fIdx) => (
                                              <div key={field.id} className="space-y-2">
                                                <Label 
                                                  htmlFor={`${sectionExercise.id}-${field.id}`}
                                                  className="text-sm font-medium"
                                                >
                                                  {field.label}
                                                </Label>
                                                {field.type === "textarea" ? (
                                                  <Textarea
                                                    id={`${sectionExercise.id}-${field.id}`}
                                                    placeholder={weekIsLocked ? "This week has been completed." : field.placeholder}
                                                    className={`min-h-[120px] resize-none ${weekIsLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    value={exerciseAnswers[`${sectionExercise.id}-${field.id}`] || ""}
                                                    onChange={(e) => handleExerciseChange(`${sectionExercise.id}-${field.id}`, e.target.value)}
                                                    disabled={weekIsLocked}
                                                    data-testid={`input-exercise-${idx}-${fIdx}`}
                                                  />
                                                ) : field.type === "number" ? (
                                                  <Input
                                                    id={`${sectionExercise.id}-${field.id}`}
                                                    type="number"
                                                    placeholder={weekIsLocked ? "" : field.placeholder}
                                                    className={weekIsLocked ? 'opacity-70 cursor-not-allowed' : ''}
                                                    value={exerciseAnswers[`${sectionExercise.id}-${field.id}`] || ""}
                                                    onChange={(e) => handleExerciseChange(`${sectionExercise.id}-${field.id}`, e.target.value)}
                                                    disabled={weekIsLocked}
                                                    data-testid={`input-exercise-${idx}-${fIdx}`}
                                                  />
                                                ) : (
                                                  <Input
                                                    id={`${sectionExercise.id}-${field.id}`}
                                                    type="text"
                                                    placeholder={weekIsLocked ? "" : field.placeholder}
                                                    className={weekIsLocked ? 'opacity-70 cursor-not-allowed' : ''}
                                                    value={exerciseAnswers[`${sectionExercise.id}-${field.id}`] || ""}
                                                    onChange={(e) => handleExerciseChange(`${sectionExercise.id}-${field.id}`, e.target.value)}
                                                    disabled={weekIsLocked}
                                                    data-testid={`input-exercise-${idx}-${fIdx}`}
                                                  />
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Week Completion */}
                {weekIsLocked ? (
                  <Card data-testid="section-week-completed">
                    <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-semibold">Week {weekNumber} Completed</h3>
                          <p className="text-sm text-muted-foreground">
                            Your answers are saved and viewable above.
                          </p>
                        </div>
                      </div>
                      {weekNumber < 16 && (
                        <Button
                          onClick={() => setLocation(`/week/${weekNumber + 1}`)}
                          className="w-full sm:w-auto"
                          data-testid="button-next-week-locked"
                        >
                          Week {weekNumber + 1}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-6 space-y-5">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                          checked={affirmComplete}
                          onChange={(e) => setAffirmComplete(e.target.checked)}
                          data-testid="checkbox-affirm-complete"
                        />
                        <span className="text-sm leading-relaxed text-muted-foreground">
                          I affirm that I have completed all readings, reflections, and exercises <strong className="text-foreground">honestly and in full</strong>.
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={markWeekComplete}
                          disabled={isWeekCompleted || !affirmComplete || markCompleteMutation.isPending}
                          className="w-full gap-2"
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
                        <p className="text-xs text-muted-foreground text-center">
                          {isWeekCompleted
                            ? weekNumber === 16 
                              ? "Congratulations! You have completed the program!"
                              : `Week ${weekNumber} completed! Week ${weekNumber + 1} is now unlocked.`
                            : weekNumber === 16
                              ? "Complete all exercises to finish the program."
                              : `Complete all exercises to unlock Week ${weekNumber + 1}.`}
                        </p>
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
          </div>
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
            <p className="text-sm leading-relaxed text-muted-foreground">
              {weekSummary.congrats}
            </p>

            {/* What You Learned */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">What You Learned</h3>
              <ul className="space-y-2">
                {weekSummary.learnings.map((learning, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span>{learning}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Personal Insights from Reflections */}
            {hasReflectionAnswers && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Your Insights</h3>
                <div className="rounded-md border p-4 space-y-3">
                  {weekContent?.reflectionQuestions?.map((q) => {
                    const answer = reflectionAnswers[q.id];
                    if (!answer?.trim()) return null;
                    return (
                      <div key={q.id} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{q.question}</p>
                        <p className="text-sm italic text-muted-foreground">"{answer.substring(0, 150)}{answer.length > 150 ? '...' : ''}"</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next Week Cliffhanger / Continuing Journey */}
            {weekNumber === 16 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Your Continuing Journey</h3>
                <p className="text-sm text-muted-foreground">
                  Remember: recovery is a journey, not a destination. Continue practicing the skills you've learned, stay connected to your support network, and be compassionate with yourself. You've done remarkable work.
                </p>
              </div>
            ) : weekSummary.nextWeekTeaser ? (
              <div className="rounded-md border-l-4 border-l-primary bg-muted/40 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                  <h3 className="text-sm font-semibold">Coming in Week {weekNumber + 1}</h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {weekSummary.nextWeekTeaser}
                </p>
                {!nextWeekUnlocked && (
                  <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
                    <Lock className="h-3 w-3" />
                    Unlocks based on your program schedule
                  </p>
                )}
              </div>
            ) : null}

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

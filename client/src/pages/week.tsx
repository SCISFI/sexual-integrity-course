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
import { ArrowLeft, CheckCircle2, ClipboardList, PartyPopper, ArrowRight, Loader2, Lock, Eye, CreditCard, Cloud, BarChart3, PenLine, Map, Brain, Anchor, Sunset, Heart, MessageCircle, Shield, Leaf, Feather, Compass, Droplets, Footprints, Circle, ShieldCheck, Sunrise, RefreshCw, Lightbulb, Waves, Users, Wind, Star, Mountain, Target, BookOpen, Infinity, AlertTriangle, ChevronDown } from "lucide-react";
import { WEEK_CONTENT, WEEK_TITLES, type Exercise } from "@/data/curriculum";
import { ADOLESCENT_CURRICULUM, ADOLESCENT_WEEK_TITLES } from "@/data/adolescent-curriculum";
import { useAuth } from "@/lib/auth";
import { WEEK_PODCASTS } from "@/data/podcasts";
import { BIBLICAL_REFLECTIONS } from "@/data/biblical-reflections";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { CrisisResources } from "@/components/CrisisResources";
import { TextToSpeech } from "@/components/TextToSpeech";
import { DeepDivePlayer } from "@/components/DeepDivePlayer";
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
    congrats: "You built the map. That's not a small thing — most men spend years inside a cycle they've never looked at directly. You looked.",
    learnings: [
      "You named the lie — 'it just happens' — and replaced it with the truth: there is always a sequence",
      "You mapped your specific triggers, rituals, and permission slips in your own words",
      "You identified your exit ramps and understood why early intervention is the only intervention that works"
    ],
    nextWeekTeaser: "You know your triggers. But what happens in the 10 seconds between trigger and choice? Week 3 exposes the thought patterns — the distortions, the rationalizations your mind runs automatically — and gives you tools to interrupt them before they gain momentum."
  },
  3: {
    congrats: "You looked directly at the voice your mind uses to justify the cycle — and you started learning to talk back to it. That's not easy. Most men never do it.",
    learnings: [
      "You identified the automatic thoughts that bridge your triggers to your behavior — and named them as thoughts, not facts",
      "You mapped your personal distortion profile: the specific patterns your mind runs and the more accurate versions of each",
      "You practiced urge surfing — observing the wave without feeding it — and proved to yourself it's survivable"
    ],
    nextWeekTeaser: "You can see the thoughts now. But seeing isn't stopping. Week 4 gives you the physiological tools — techniques that work on your nervous system in real-time when an urge hits. This is where insight becomes capability."
  },
  4: {
    congrats: "You didn't just understand the urge cycle this week — you started interrupting it at the physiological level. That's a different kind of work, and you did it.",
    learnings: [
      "You learned what actually happens in your brain and body when an urge hits — and why willpower alone can't override it",
      "You practiced the 10-second window technique: creating a gap between trigger and automatic response",
      "You built a personal toolkit of physiological regulation tools that work in real conditions"
    ],
    nextWeekTeaser: "You have tools for the urge. But there's an emotion underneath almost every relapse that none of those tools can touch on their own. Week 5 goes directly after shame — the fuel source you haven't fully confronted. Understanding how it operates, and how it's different from guilt, changes everything."
  },
  5: {
    congrats: "You went directly at the emotion that drives more relapse than any trigger. That's not comfortable work. You did it anyway.",
    learnings: [
      "You drew the line between shame ('I am broken') and guilt ('I did something wrong') — and understood why that distinction is the difference between spiral and recovery",
      "You traced your shame origins: where the core belief that you are fundamentally defective came from",
      "You began building self-compassion not as self-excuse but as a strategic counter to the shame cycle"
    ],
    nextWeekTeaser: "You've been working on yourself. Week 6 turns the lens outward — toward the people you've been living around, and what the space between you has actually looked like. Your patterns didn't develop in a vacuum."
  },
  6: {
    congrats: "You looked at what this behavior has done to the relationships that matter most to you. That's one of the hardest things in the program. You didn't flinch.",
    learnings: [
      "You examined how your attachment history shaped the relational wounds underneath the behavior",
      "You named the impact on specific relationships — not in general, but in concrete terms",
      "You identified where emotional intimacy has been replaced by digital escape, and what rebuilding actually requires"
    ],
    nextWeekTeaser: "You understand what's driven the distance. Week 7 teaches you what to do about it — specifically how to have the conversations you've been avoiding, say what you actually need, and start building real accountability with the people who matter."
  },
  7: {
    congrats: "You did the work of naming what needs to be said — and started building the communication tools to actually say it. That's harder than it sounds.",
    learnings: [
      "You learned assertive communication as a recovery tool, not just a life skill",
      "You identified the specific conversations you've been avoiding and what's kept you from having them",
      "You practiced expressing needs and boundaries in ways that can rebuild trust rather than erode it"
    ],
    nextWeekTeaser: "Seven weeks of understanding — the cycle, the triggers, the thoughts, the body, the shame, the relationships — now get encoded into a single plan. Week 8 is where everything comes together into the structure that holds when things get hard."
  },
  8: {
    congrats: "Phase 1 is complete. You built the foundation — cycle awareness, trigger mapping, cognitive tools, physiological regulation, shame work, relational honesty, communication, prevention planning. That is real work.",
    learnings: [
      "You mapped the full spectrum of warning signs — emotional, behavioral, cognitive, physical — and built your initial zone-based prevention plan",
      "You understood the critical difference between a lapse and a relapse, and what happens in the 24 hours that determines which one it becomes",
      "You identified what Phase 1 tools are strongest for you, and where the work continues"
    ],
    nextWeekTeaser: "Phase 1 gave you better weapons for the fight. Phase 2 asks a harder question: what if fighting is the wrong strategy? Week 9 challenges everything you've been doing — and introduces an approach that changes your relationship with the struggle itself."
  },
  9: {
    congrats: "You examined the control strategy honestly. Most men never do — they just try harder. You asked whether trying harder has been working. That's the beginning of something different.",
    learnings: [
      "You calculated the real cost of the control strategy — the energy, the life unlived, the relationships organized around hiding",
      "You understood why suppression backfires neurologically: the rebound effect, experiential avoidance, the cycle powered by dirty pain",
      "You encountered willingness — not as wanting the discomfort, but as choosing to make room for it rather than running from it"
    ],
    nextWeekTeaser: "You've seen what the control strategy costs. Week 10 gives you the first major ACT tool: defusion. The ability to step back from a thought — to see it as a thought rather than a command — is one of the most powerful skills in Phase 2. Watch what happens to an urge you stop arguing with."
  },
  10: {
    congrats: "You practiced defusion under real conditions — with actual thoughts, actual urges, actual pressure. That's where it matters. You showed up for it.",
    learnings: [
      "You identified the specific thoughts and stories your mind runs that most reliably hook you into the behavior",
      "You practiced naming the recurring stories, adding 'I'm having the thought that...', and watching the grip loosen",
      "You applied defusion to urges specifically: the separation between 'I am this urge' and 'I am noticing this urge'"
    ],
    nextWeekTeaser: "You can step back from your thoughts. Week 11 goes deeper — behind the thoughts to the one who is doing the noticing. The observer self is the most stable ground in recovery. You're going to find it."
  },
  11: {
    congrats: "You found the part of you that hasn't been broken — that couldn't be broken — by anything you've done or felt. That's the ground everything else is built on.",
    learnings: [
      "You identified the identity labels you've fused with — 'I am broken,' 'I am my behavior' — and began to see them as stories rather than facts",
      "You practiced connecting with the observing self: the continuous aware presence that has been watching this whole story without being defined by it",
      "You built a values-based identity — 'I am a man who...' — grounded in direction rather than history"
    ],
    nextWeekTeaser: "You found stable ground. Week 12 asks: what are you actually living for? Not what you should care about — what you genuinely do. Clarifying your values isn't therapy-speak. It's the architecture of a life that doesn't need escape."
  },
  12: {
    congrats: "You did real work this week — not a worksheet, but an honest examination of what you're actually living for. The values you identified are the reason the rest of this makes sense.",
    learnings: [
      "You distinguished values from goals — values are the direction you face, not the finish line you cross — and understood why that makes recovery more durable",
      "You clarified what you genuinely care about across the full span of your life: relationships, integrity, health, meaning, contribution",
      "You mapped the gap between your values and how you're actually living — and understood that gap as motivation rather than just evidence of failure"
    ],
    nextWeekTeaser: "You know what you're living for. Week 13 brings the hardest skill in the program: acceptance. Not resignation — the active, courageous choice to stop running from what hurts. This is where everything changes."
  },
  13: {
    congrats: "You practiced acceptance — the hardest skill in the program. Not performing it, but actually sitting with discomfort and making room for it instead of running. That's real.",
    learnings: [
      "You separated clean pain from dirty pain — and understood that most of your suffering comes not from the original discomfort, but from the war you wage against it",
      "You practiced urge surfing: observing without acting, watching the wave rise and fall without feeding it or fighting it",
      "You built a daily acceptance practice — not as a technique to get through, but as a fundamental shift in how you relate to your inner experience"
    ],
    nextWeekTeaser: "You've stopped running. Week 14 is where you start moving — specifically, with intention, toward the values you've identified. Committed action is the difference between insight and actual change."
  },
  14: {
    congrats: "You closed the gap between knowing and doing — at least for this week. That gap is where most men stay permanently. You chose to cross it.",
    learnings: [
      "You identified where the knowing-doing gap has been most costly in your recovery — and what has lived in that gap",
      "You learned that commitment is a choice maintained by values, not motivation — and built practices unconditional on how you feel",
      "You translated your values into specific committed actions with time, frequency, and a way of tracking — and shared them with someone before the week started"
    ],
    nextWeekTeaser: "You've built something real over fourteen weeks. Week 15 is about protecting it — understanding why the next phase is actually the most dangerous one, and building the structure that holds when the urgency fades."
  },
  15: {
    congrats: "You did the hardest planning work in the program — not the exciting early planning, but the sober, realistic planning for the long game. That's where recovery actually lives.",
    learnings: [
      "You built your zone system with your specific indicators — not generic descriptions, but what green, yellow, and orange/red actually look like in your life",
      "You wrote your emergency protocol in advance — decided now, while thinking clearly, for the version of yourself who won't be thinking clearly",
      "You designed your post-program structure: the daily practices, weekly accountability, and ongoing support that carry you forward after this program ends"
    ],
    nextWeekTeaser: "One week left. Not the end — the beginning of what this was always building toward. Week 16 is the honest inventory: what has actually changed, what work continues, and who you're becoming. Most men don't make it this far. You did."
  },
  16: {
    congrats: "You completed all 16 weeks. Not perfectly — honestly. You showed up for the hard weeks, the ones that asked you to look at things you'd been avoiding for years. You looked. That changes a person.",
    learnings: [
      "You completed the honest inventory — what genuinely changed, what work continues, who you're becoming — without inflating the progress or dismissing it",
      "You wrote your personal definition of sexual integrity, your vision for the year ahead, and your forward commitment in your own words",
      "You wrote the letter to your future self — the man six months from now who will need to remember what you learned and why it matters"
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

const WEEK_INFOGRAPHICS: Record<number, string> = {
  1:  "/infographics/week-1.jpg",
  2:  "/infographics/week-2.jpg",
  3:  "/infographics/week-3.jpg",
  4:  "/infographics/week-4.jpg",
  5:  "/infographics/week-5.jpg",
  6:  "/infographics/week-6.jpg",
  7:  "/infographics/week-7.jpg",
  8:  "/infographics/week-8.jpg",
  9:  "/infographics/week-9.jpg",
  10: "/infographics/week-10.jpg",
  11: "/infographics/week-11.jpg",
  12: "/infographics/week-12.jpg",
  13: "/infographics/week-13.jpg",
  14: "/infographics/week-14.jpg",
  15: "/infographics/week-15.jpg",
  16: "/infographics/week-16.jpg",
};

const WEEK_HERO: Record<number, WeekHero> = {
  1:  { icon: Eye,          accent: BookOpen,     gradient: "from-slate-900 to-cyan-900",    tagline: "Face what you've been hiding" },
  2:  { icon: Map,          accent: RefreshCw,    gradient: "from-slate-900 to-indigo-900",  tagline: "Every trigger. Every ritual. Every exit ramp." },
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

  const { user } = useAuth();
  const isAdolescent = (user as any)?.programType === "adolescent";
  const weekContent = isAdolescent ? ADOLESCENT_CURRICULUM[weekNumber] : WEEK_CONTENT[weekNumber];
  const title = isAdolescent
    ? (ADOLESCENT_WEEK_TITLES[weekNumber] ?? `Week ${weekNumber}`)
    : (WEEK_TITLES[weekNumber] ?? "Week");
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
  const [storyOpen, setStoryOpen] = useState(false);
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
  const { data: unlockedWeeksData } = useQuery<{ unlockedWeeks: number[]; isInCohort: boolean; completedWeeks: number[] }>({
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

  // Cohort-aware incomplete-prior-week warning
  const isInCohort = unlockedWeeksData?.isInCohort ?? false;
  const unlockedCompletedWeeks = unlockedWeeksData?.completedWeeks || [];
  const hasPriorIncompleteWeek = isInCohort && weekNumber > 1 && !unlockedCompletedWeeks.includes(weekNumber - 1);

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
        qBiblical: r.qBiblical || "",
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
    mutationFn: async (data: { q1?: string; q2?: string; q3?: string; q4?: string; q5?: string; q6?: string; qBiblical?: string }) => {
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
        qBiblical: answers.qBiblical ?? "",
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
            qBiblical: answers.qBiblical ?? "",
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
        qBiblical: reflectionAnswers.qBiblical ?? "",
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
          {/* Infographic image (weeks with custom artwork) or themed gradient hero */}
          {WEEK_INFOGRAPHICS[weekNumber] ? (
            <img
              src={WEEK_INFOGRAPHICS[weekNumber]}
              alt={`Week ${weekNumber} infographic`}
              className="w-full object-cover max-h-72 md:max-h-96"
              data-testid="img-week-infographic"
            />
          ) : (
            (() => {
              const hero = WEEK_HERO[weekNumber];
              if (!hero) return null;
              const PrimaryIcon = hero.icon;
              const AccentIcon = hero.accent;
              return (
                <div className={`relative flex flex-col items-center justify-center bg-gradient-to-br ${hero.gradient} h-44 md:h-52 overflow-hidden px-6`}>
                  <PrimaryIcon className="absolute left-4 top-4 h-28 w-28 text-white opacity-5 rotate-12" />
                  <AccentIcon className="absolute right-4 bottom-4 h-24 w-24 text-white opacity-5 -rotate-12" />
                  <div className="relative flex items-center justify-center gap-4 mb-3">
                    <AccentIcon className="h-7 w-7 text-white/40" />
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
                      <PrimaryIcon className="h-8 w-8 text-white" />
                    </div>
                    <AccentIcon className="h-7 w-7 text-white/40" />
                  </div>
                  <p className="text-white/90 text-sm md:text-base font-medium tracking-wide text-center max-w-xs">
                    {hero.tagline}
                  </p>
                  <span className="absolute top-3 right-3 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/70 font-medium">
                    Week {weekNumber} of 16
                  </span>
                </div>
              );
            })()
          )}

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

        {/* Cohort prior-week incomplete warning */}
        {hasPriorIncompleteWeek && !weekIsLocked && (
          <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30" data-testid="banner-prior-week-incomplete">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  Week {weekNumber - 1} hasn't been marked complete yet.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Finish that material when you can to stay prepared for your group.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/week/${weekNumber - 1}`)}
                className="flex-shrink-0 text-xs border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                data-testid="button-go-prior-week"
              >
                Go to Week {weekNumber - 1}
              </Button>
            </CardContent>
          </Card>
        )}

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
            {/* Deep Dive Podcast Player */}
            {WEEK_PODCASTS[weekNumber] && (
              <DeepDivePlayer
                title={WEEK_PODCASTS[weekNumber].title}
                src={WEEK_PODCASTS[weekNumber].file}
                description={WEEK_PODCASTS[weekNumber].description}
              />
            )}

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

                {/* A Story Worth Knowing */}
                {BIBLICAL_REFLECTIONS[weekNumber] && (() => {
                  const reflection = BIBLICAL_REFLECTIONS[weekNumber];
                  return (
                    <Collapsible open={storyOpen} onOpenChange={setStoryOpen} data-testid="section-biblical-reflection">
                      <Card className="border-slate-200 dark:border-slate-700">
                        <CollapsibleTrigger asChild>
                          <button className="w-full text-left">
                            <CardContent className="flex items-center justify-between py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                  <BookOpen className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">A Story Worth Knowing</p>
                                  <p className="text-xs text-muted-foreground">{reflection.character}</p>
                                </div>
                              </div>
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${storyOpen ? "rotate-180" : ""}`} />
                            </CardContent>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="px-6 pb-6 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 pt-4">{reflection.title}</h3>
                            <div className="space-y-3">
                              {reflection.story.map((paragraph, idx) => (
                                <p key={idx} className="text-sm leading-relaxed text-muted-foreground">{paragraph}</p>
                              ))}
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                <span className="font-semibold">Takeaway:</span> {reflection.takeaway}
                              </p>
                              <p className="text-sm italic text-muted-foreground border-l-2 border-slate-300 dark:border-slate-600 pl-3">
                                <span className="not-italic font-medium text-slate-600 dark:text-slate-400">Optional Reflection:</span> {reflection.reflection}
                              </p>
                              {!weekIsLocked && (
                                <Textarea
                                  placeholder="Write your response here..."
                                  value={reflectionAnswers.qBiblical || ""}
                                  onChange={(e) => handleReflectionChange("qBiblical", e.target.value)}
                                  className="mt-1 min-h-[100px] text-sm resize-none"
                                  data-testid="input-biblical-reflection"
                                />
                              )}
                              {weekIsLocked && reflectionAnswers.qBiblical && (
                                <p className="text-sm italic text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-md px-3 py-2 border border-slate-100 dark:border-slate-800">
                                  "{reflectionAnswers.qBiblical}"
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })()}

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

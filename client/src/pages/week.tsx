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
import { ArrowLeft, CheckCircle2, BookOpen, HelpCircle, ClipboardList, ListChecks, PartyPopper, ArrowRight, Loader2, Lock } from "lucide-react";
import { WEEK_CONTENT, WEEK_TITLES, PHASE_INFO } from "@/data/curriculum";
import { useToast } from "@/hooks/use-toast";
import { AIEncouragement } from "@/components/AIEncouragement";
import { CrisisResources } from "@/components/CrisisResources";

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
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});
  const [reflectionsLoaded, setReflectionsLoaded] = useState(false);
  const [homeworkLoaded, setHomeworkLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  const { data: completionsData } = useQuery<{ completedWeeks: number[] }>({
    queryKey: ['/api/progress/completions'],
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

  // Check if this week is already completed (locked)
  const weekIsLocked = completionsData?.completedWeeks?.includes(weekNumber) || false;
  
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
      setReflectionAnswers({
        q1: r.q1 || "",
        q2: r.q2 || "",
        q3: r.q3 || "",
        q4: r.q4 || "",
      });
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
      setHomeworkLoaded(true);
    }
  }, [homeworkData, homeworkLoaded]);

  // Mutation to save reflections
  const saveReflectionMutation = useMutation({
    mutationFn: async (data: { q1?: string; q2?: string; q3?: string; q4?: string }) => {
      const res = await apiRequest("PUT", `/api/progress/reflection/${weekNumber}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress/reflection', weekNumber] });
    },
    onError: () => {
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

  // Cleanup debounced saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (homeworkSaveTimeoutRef.current) {
        clearTimeout(homeworkSaveTimeoutRef.current);
      }
    };
  }, []);

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
      debouncedSaveHomework(updated);
      return updated;
    });
  };

  const handleReflectionChange = (questionId: string, value: string) => {
    if (weekIsLocked) return; // Don't allow changes if week is locked
    
    const newAnswers = {
      ...reflectionAnswers,
      [questionId]: value
    };
    setReflectionAnswers(newAnswers);
    debouncedSaveReflections(newAnswers);
  };

  const weekSummary = WEEK_SUMMARIES[weekNumber] || {
    congrats: "Congratulations on completing this week! Your dedication to growth is inspiring.",
    learnings: ["You've taken another important step in your recovery journey."]
  };

  const hasReflectionAnswers = Object.values(reflectionAnswers).some(answer => answer.trim().length > 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-3 flex-wrap border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <div className="font-semibold">Sexual Integrity Program</div>
            <div className="text-xs text-muted-foreground">
              Phase {phase}: {phaseInfo.name}
            </div>
          </div>
        </div>
        <CrisisResources />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold" data-testid="text-week-title">
              Week {weekNumber}: {title}
            </h1>
            <CardDescription data-testid="text-week-overview">
              {weekContent?.overview ?? "Content coming soon."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* AI Encouragement section - only show if week is accessible */}
            {!isTimeLocked && (
              <AIEncouragement weekNumber={weekNumber} />
            )}

            {/* Show time-locked message if week is not yet accessible */}
            {isTimeLocked && (
              <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="week-time-locked">
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
              </div>
            )}

            {!isTimeLocked && (
            <Tabs defaultValue="read">
              <TabsList>
                <TabsTrigger value="read" data-testid="tab-read">Read</TabsTrigger>
                <TabsTrigger value="listen" data-testid="tab-listen">Listen</TabsTrigger>
                <TabsTrigger value="video" data-testid="tab-video">Video</TabsTrigger>
              </TabsList>

              <TabsContent value="read" className="space-y-8">
                {weekContent ? (
                  <>
                    {/* Teaching Sections */}
                    {weekContent.teaching && weekContent.teaching.length > 0 && (
                      <section className="space-y-4" data-testid="section-teaching">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <h2 className="text-xl font-semibold">Teaching</h2>
                        </div>
                        <Accordion type="multiple" className="w-full">
                          {weekContent.teaching.map((section, idx) => (
                            <AccordionItem key={section.id} value={section.id}>
                              <AccordionTrigger 
                                className="text-left"
                                data-testid={`accordion-teaching-${idx}`}
                              >
                                {section.title}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 text-sm text-muted-foreground">
                                  {section.content.map((paragraph, pIdx) => (
                                    <p key={pIdx}>{paragraph}</p>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </section>
                    )}

                    <Separator />

                    {/* Reflection Questions */}
                    {weekContent.reflectionQuestions && weekContent.reflectionQuestions.length > 0 && (
                      <section className="space-y-4" data-testid="section-reflection">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-5 w-5 text-primary" />
                          <h2 className="text-xl font-semibold">Reflection Questions</h2>
                        </div>
                        <div className="space-y-4">
                          {weekContent.reflectionQuestions.map((q, idx) => (
                            <div key={q.id} className="space-y-2">
                              <Label 
                                htmlFor={`reflection-${q.id}`}
                                className="text-sm font-medium"
                                data-testid={`label-reflection-${idx}`}
                              >
                                {idx + 1}. {q.question}
                              </Label>
                              <Textarea
                                id={`reflection-${q.id}`}
                                placeholder={weekIsLocked ? "This week has been completed. Your answers are saved." : "Write your reflection here..."}
                                className={`min-h-[100px] ${weekIsLocked ? 'bg-muted cursor-not-allowed' : ''}`}
                                value={reflectionAnswers[q.id] || ""}
                                onChange={(e) => handleReflectionChange(q.id, e.target.value)}
                                disabled={weekIsLocked}
                                data-testid={`input-reflection-${idx}`}
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <Separator />

                    {/* Exercises */}
                    {weekContent.exercises && weekContent.exercises.length > 0 && (
                      <section className="space-y-4" data-testid="section-exercises">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-primary" />
                          <h2 className="text-xl font-semibold">Exercises</h2>
                        </div>
                        <Accordion type="multiple" className="w-full">
                          {weekContent.exercises.map((exercise, idx) => (
                            <AccordionItem key={exercise.id} value={exercise.id}>
                              <AccordionTrigger 
                                className="text-left"
                                data-testid={`accordion-exercise-${idx}`}
                              >
                                {exercise.title}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground">
                                    {exercise.instructions}
                                  </p>
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
                                            className="min-h-[120px]"
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
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </section>
                    )}

                    <Separator />

                    {/* Homework Checklist */}
                    {weekContent.homeworkChecklist && weekContent.homeworkChecklist.length > 0 && (
                      <section className="space-y-4" data-testid="section-homework">
                        <div className="flex items-center gap-2">
                          <ListChecks className="h-5 w-5 text-primary" />
                          <h2 className="text-xl font-semibold">Homework Checklist</h2>
                        </div>
                        <div className="space-y-2 rounded-lg border p-4">
                          {weekContent.homeworkChecklist.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-start gap-3"
                              data-testid={`homework-item-${idx}`}
                            >
                              <Checkbox
                                id={`homework-${idx}`}
                                checked={homeworkCompleted[idx] || false}
                                onCheckedChange={() => toggleHomework(idx)}
                                disabled={weekIsLocked}
                                data-testid={`checkbox-homework-${idx}`}
                              />
                              <label
                                htmlFor={`homework-${idx}`}
                                className={`text-sm ${weekIsLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${homeworkCompleted[idx] ? 'line-through text-muted-foreground' : ''}`}
                              >
                                {item}
                              </label>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <Separator />
                  </>
                ) : (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Content for Week {weekNumber} is coming soon.
                    </p>
                  </div>
                )}

                {/* Week Completion */}
                {weekIsLocked ? (
                  <div className="rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Week {weekNumber} Completed</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      You completed this week. Your reflection answers are saved and viewable above.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                      <label className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={affirmComplete}
                          onChange={(e) => setAffirmComplete(e.target.checked)}
                          data-testid="checkbox-affirm-complete"
                        />
                        <span>
                          By marking this week complete, I affirm that I have
                          completed all required readings, reflections, and
                          exercises <strong>honestly and in full</strong>. I
                          understand that partial completion or skipping undermines
                          the purpose of this program.
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        {isWeekCompleted
                          ? weekNumber === 16 
                            ? "Congratulations! You have completed the program!"
                            : `Week ${weekNumber} completed! Week ${weekNumber + 1} is now unlocked.`
                          : weekNumber === 16
                            ? "Complete all exercises to finish the program."
                            : `Complete all exercises to unlock Week ${weekNumber + 1}.`}
                      </div>

                      <Button
                        onClick={markWeekComplete}
                        disabled={isWeekCompleted || !affirmComplete || markCompleteMutation.isPending}
                        data-testid="button-mark-complete"
                      >
                        {markCompleteMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : isWeekCompleted ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Week {weekNumber} Completed
                          </>
                        ) : (
                          `Mark Week ${weekNumber} Complete`
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="listen">
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Audio narration coming soon.
                </div>
              </TabsContent>

              <TabsContent value="video">
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Video content coming soon.
                </div>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <PartyPopper className="h-6 w-6 text-primary" />
              Week {weekNumber} Complete!
            </DialogTitle>
            <DialogDescription className="sr-only">
              Congratulations on completing Week {weekNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Congratulations Message */}
            <div className="rounded-lg bg-primary/10 p-4">
              <p className="text-sm leading-relaxed">
                {weekSummary.congrats}
              </p>
            </div>

            {/* What You Learned */}
            <div className="space-y-3">
              <h3 className="font-semibold">What You Learned This Week:</h3>
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
                <h3 className="font-semibold">Your Personal Insights:</h3>
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

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold">
                {weekNumber === 16 ? "Your Continuing Journey:" : "Next Steps:"}
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
                onClick={() => setLocation("/dashboard")}
                className="w-full"
                data-testid="button-go-dashboard"
              >
                Return to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {weekNumber < 16 && nextWeekUnlocked && (
                <Button 
                  variant="outline"
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
    </div>
  );
}

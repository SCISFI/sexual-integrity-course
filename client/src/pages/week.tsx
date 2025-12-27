import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle2, Circle, BookOpen, MessageSquare, PenLine, ClipboardList, AlertTriangle, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { WEEK_CONTENT, WEEK_TITLES, PHASE_INFO } from "@/data/curriculum";
import headerImage from "@assets/generated_images/calming_therapy_header_image.png";
import { AddictionCycleDiagram } from "@/components/addiction-cycle-diagram";
import { BrainDiagram } from "@/components/brain-diagram";

const STORAGE_LAST_WEEK = "si_last_week";
const STORAGE_LAST_SECTION = "si_last_section";
const STORAGE_LAST_TAB = "si_last_tab";

type SectionId =
  | "top"
  | "teaching"
  | "reflection"
  | "exercise"
  | "homework"
  | "relapse";

type ReflectionAnswers = {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
};

function safeNumber(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function WeekPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/week/:week");
  const weekNumber = useMemo(() => safeNumber(params?.week, 1), [params?.week]);
  const title = WEEK_TITLES[weekNumber] ?? "Week";
  const weekContent = WEEK_CONTENT[weekNumber];
  const phase = weekNumber <= 8 ? 1 : 2;
  const phaseInfo = PHASE_INFO[phase];

  const [tab, setTab] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_LAST_TAB);
    return saved || "read";
  });

  const [commitment, setCommitment] = useState<string>("");
  const [commitmentStatus, setCommitmentStatus] = useState<"idle" | "saving" | "saved" | "loading">("loading");

  const [reflection, setReflection] = useState<ReflectionAnswers>({ q1: "", q2: "", q3: "", q4: "" });
  const [reflectionStatus, setReflectionStatus] = useState<"idle" | "saving" | "saved" | "loading">("loading");

  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const isWeekCompleted = completedWeeks.includes(weekNumber);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [manualHomeworkChecks, setManualHomeworkChecks] = useState<Set<number>>(() => {
    const saved = localStorage.getItem(`si_homework_checks_${weekNumber}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const homeworkCompletion = useMemo(() => {
    if (!weekContent) return [];
    
    const teachingSectionIds = weekContent.teaching.map(s => s.id);
    const allTeachingRead = teachingSectionIds.every(id => expandedSections.has(id));
    const allReflectionsComplete = reflection.q1.trim() && reflection.q2.trim() && reflection.q3.trim() && reflection.q4.trim();
    const commitmentComplete = commitment.trim().length > 10;
    
    return weekContent.homeworkChecklist.map((item, idx) => {
      if (item.toLowerCase().includes("read all week")) {
        return allTeachingRead;
      }
      if (item.toLowerCase().includes("reflection questions")) {
        return !!allReflectionsComplete;
      }
      if (item.toLowerCase().includes("my story in brief") || item.toLowerCase().includes("sexual integrity means")) {
        return commitmentComplete;
      }
      return manualHomeworkChecks.has(idx);
    });
  }, [weekContent, expandedSections, reflection, commitment, manualHomeworkChecks]);

  const toggleManualHomework = (idx: number) => {
    setManualHomeworkChecks(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      localStorage.setItem(`si_homework_checks_${weekNumber}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const reflectionRes = await fetch(`/api/progress/reflection/${weekNumber}`, { credentials: "include" });
        if (reflectionRes.ok) {
          const { reflection: r } = await reflectionRes.json();
          if (r) {
            setReflection({ q1: r.q1 || "", q2: r.q2 || "", q3: r.q3 || "", q4: r.q4 || "" });
          }
        }
        setReflectionStatus("idle");

        const commitmentRes = await fetch(`/api/progress/commitment/${weekNumber}`, { credentials: "include" });
        if (commitmentRes.ok) {
          const { commitment: c } = await commitmentRes.json();
          if (c) {
            setCommitment(c.statement || "");
          }
        }
        setCommitmentStatus("idle");

        const completionsRes = await fetch("/api/progress/completions", { credentials: "include" });
        if (completionsRes.ok) {
          const { completedWeeks: cw } = await completionsRes.json();
          setCompletedWeeks(cw || []);
        }
      } catch (error) {
        console.error("Failed to load progress data:", error);
        setReflectionStatus("idle");
        setCommitmentStatus("idle");
      }
    }
    loadData();
  }, [weekNumber]);

  const reflectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveReflection = useCallback(
    (data: ReflectionAnswers) => {
      if (reflectionTimeoutRef.current) {
        clearTimeout(reflectionTimeoutRef.current);
      }
      setReflectionStatus("saving");
      reflectionTimeoutRef.current = setTimeout(async () => {
        try {
          await apiRequest("PUT", `/api/progress/reflection/${weekNumber}`, data);
          setReflectionStatus("saved");
        } catch (error) {
          console.error("Failed to save reflection:", error);
          setReflectionStatus("idle");
        }
      }, 600);
    },
    [weekNumber]
  );

  const commitmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveCommitment = useCallback(
    (statement: string) => {
      if (commitmentTimeoutRef.current) {
        clearTimeout(commitmentTimeoutRef.current);
      }
      setCommitmentStatus("saving");
      commitmentTimeoutRef.current = setTimeout(async () => {
        try {
          await apiRequest("PUT", `/api/progress/commitment/${weekNumber}`, { statement });
          setCommitmentStatus("saved");
        } catch (error) {
          console.error("Failed to save commitment:", error);
          setCommitmentStatus("idle");
        }
      }, 600);
    },
    [weekNumber]
  );

  const handleReflectionChange = (field: keyof ReflectionAnswers, value: string) => {
    const newReflection = { ...reflection, [field]: value };
    setReflection(newReflection);
    saveReflection(newReflection);
  };

  const handleCommitmentChange = (value: string) => {
    setCommitment(value);
    saveCommitment(value);
  };

  const markWeekComplete = async () => {
    try {
      await apiRequest("POST", `/api/progress/completions/${weekNumber}`, {});
      setCompletedWeeks((prev) => Array.from(new Set([...prev, weekNumber])).sort((a, b) => a - b));
    } catch (error) {
      console.error("Failed to mark week complete:", error);
    }
  };

  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    top: null,
    teaching: null,
    reflection: null,
    exercise: null,
    homework: null,
    relapse: null,
  });

  const scrollToSection = (id: SectionId) => {
    localStorage.setItem(STORAGE_LAST_WEEK, String(weekNumber));
    localStorage.setItem(STORAGE_LAST_SECTION, id);
    const el = sectionRefs.current[id];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_LAST_WEEK, String(weekNumber));
  }, [weekNumber]);

  useEffect(() => {
    localStorage.setItem(STORAGE_LAST_TAB, tab);
  }, [tab]);

  useEffect(() => {
    const lastWeek = safeNumber(localStorage.getItem(STORAGE_LAST_WEEK), 1);
    const lastSection = (localStorage.getItem(STORAGE_LAST_SECTION) || "top") as SectionId;
    setTimeout(() => {
      if (lastWeek === weekNumber && sectionRefs.current[lastSection]) {
        sectionRefs.current[lastSection]?.scrollIntoView({ behavior: "auto", block: "start" });
      } else {
        sectionRefs.current.top?.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }, 50);
  }, [weekNumber]);

  useEffect(() => {
    const ids: SectionId[] = ["teaching", "reflection", "exercise", "homework", "relapse"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target) {
          const found = ids.find((id) => sectionRefs.current[id] === visible.target);
          if (found) {
            localStorage.setItem(STORAGE_LAST_WEEK, String(weekNumber));
            localStorage.setItem(STORAGE_LAST_SECTION, found);
          }
        }
      },
      { root: null, threshold: [0.2, 0.35, 0.5, 0.7] }
    );
    ids.forEach((id) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [weekNumber]);

  const statusText = (status: "idle" | "saving" | "saved" | "loading") => {
    if (status === "loading") return "Loading...";
    if (status === "saving") return "Saving...";
    if (status === "saved") return "Saved";
    return "";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
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
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="relative rounded-lg overflow-hidden mb-6">
          <img 
            src={headerImage} 
            alt="Calming nature background" 
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 flex items-center px-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Week {weekNumber}: {title}</h1>
              <p className="text-white/80 text-sm mt-1">Phase {phase}: {phaseInfo.name}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>
              {weekContent?.overview || "Choose your format. We'll remember where you left off."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div ref={(el) => (sectionRefs.current.top = el)} />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => scrollToSection("teaching")} data-testid="button-nav-teaching">
                <BookOpen className="h-4 w-4 mr-2" />
                Teaching
              </Button>
              <Button variant="outline" onClick={() => scrollToSection("reflection")} data-testid="button-nav-reflection">
                <MessageSquare className="h-4 w-4 mr-2" />
                Reflection
              </Button>
              <Button variant="outline" onClick={() => scrollToSection("exercise")} data-testid="button-nav-exercise">
                <PenLine className="h-4 w-4 mr-2" />
                Exercise
              </Button>
              <Button variant="outline" onClick={() => scrollToSection("homework")} data-testid="button-nav-homework">
                <ClipboardList className="h-4 w-4 mr-2" />
                Homework
              </Button>
              <Button variant="outline" onClick={() => scrollToSection("relapse")} data-testid="button-nav-relapse">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Relapse Plan
              </Button>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="read" data-testid="tab-read">Read</TabsTrigger>
                <TabsTrigger value="listen" data-testid="tab-listen">Listen (AI Voice)</TabsTrigger>
                <TabsTrigger value="video" data-testid="tab-video">Video</TabsTrigger>
              </TabsList>

              <TabsContent value="read" className="space-y-6">
                {!weekContent ? (
                  <div className="rounded-lg border p-4">
                    <div className="font-medium">Content coming soon</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Week {weekNumber} content is being prepared and will be available soon.
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      ref={(el) => (sectionRefs.current.teaching = el)}
                      className="rounded-lg border p-5 space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Teaching</h3>
                      </div>
                      
                      {weekContent.teaching.map((section) => (
                        <div key={section.id} className="border rounded-md">
                          <button
                            className="w-full flex items-center justify-between p-4 text-left hover-elevate"
                            onClick={() => toggleSection(section.id)}
                            data-testid={`button-expand-${section.id}`}
                          >
                            <span className="font-medium text-sm">{section.title}</span>
                            {expandedSections.has(section.id) ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          {expandedSections.has(section.id) && (
                            <div className="px-4 pb-4 space-y-3">
                              {section.id === "addiction-cycle" && (
                                <AddictionCycleDiagram />
                              )}
                              {section.id === "brain-science" && (
                                <BrainDiagram />
                              )}
                              {section.id === "healthy-vs-csbd" ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm border-collapse">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left p-3 font-semibold bg-muted/50">Healthy Sexuality</th>
                                        <th className="text-left p-3 font-semibold bg-muted/50">CSBD</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {section.content.map((row, idx) => {
                                        const parts = row.split(" | ");
                                        const healthy = parts[0]?.replace("Healthy Sexuality: ", "") || "";
                                        const csbd = parts[1]?.replace("CSBD: ", "") || "";
                                        return (
                                          <tr key={idx} className="border-b last:border-b-0">
                                            <td className="p-3 text-muted-foreground">{healthy}</td>
                                            <td className="p-3 text-muted-foreground">{csbd}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                section.content.map((paragraph, idx) => (
                                  <p key={idx} className="text-sm text-muted-foreground">
                                    {paragraph}
                                  </p>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div
                      ref={(el) => (sectionRefs.current.reflection = el)}
                      className="rounded-lg border p-5 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Reflection Questions</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Take time to answer honestly. Your answers autosave as you type.
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {statusText(reflectionStatus)}
                        </div>
                      </div>

                      {weekContent.reflectionQuestions.map((q, idx) => (
                        <div key={q.id} className="space-y-2">
                          <div className="text-sm font-medium">
                            {idx + 1}) {q.question}
                          </div>
                          <textarea
                            className="w-full min-h-[110px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            value={reflection[q.id as keyof ReflectionAnswers] || ""}
                            onChange={(e) => handleReflectionChange(q.id as keyof ReflectionAnswers, e.target.value)}
                            placeholder="Write your answer..."
                            data-testid={`input-reflection-${q.id}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div
                      ref={(el) => (sectionRefs.current.exercise = el)}
                      className="rounded-lg border p-5 space-y-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <PenLine className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Exercises</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Complete these exercises to deepen your understanding.
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {statusText(commitmentStatus)}
                        </div>
                      </div>

                      {weekContent.exercises.map((exercise) => (
                        <div key={exercise.id} className="space-y-3 border-t pt-4 first:border-t-0 first:pt-0">
                          <div>
                            <h4 className="font-medium text-sm">{exercise.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{exercise.instructions}</p>
                          </div>
                          {exercise.fields.map((field) => (
                            <div key={field.id} className="space-y-1">
                              <label className="text-sm font-medium">{field.label}</label>
                              <textarea
                                className="w-full min-h-[120px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                placeholder={field.placeholder || "Write your answer..."}
                                data-testid={`input-exercise-${exercise.id}-${field.id}`}
                              />
                            </div>
                          ))}
                        </div>
                      ))}

                      <div className="space-y-3 border-t pt-4">
                        <div>
                          <h4 className="font-medium text-sm">Commitment Statement</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Answer this question honestly: "Why am I choosing to pursue sexual integrity right now?"
                          </p>
                        </div>
                        <textarea
                          className="w-full min-h-[160px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Start typing your commitment statement here..."
                          value={commitment}
                          onChange={(e) => handleCommitmentChange(e.target.value)}
                          data-testid="input-commitment"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Your commitment statement autosaves as you type.</span>
                          <span>{commitment.trim().length} characters</span>
                        </div>
                      </div>
                    </div>

                    <div
                      ref={(el) => (sectionRefs.current.homework = el)}
                      className="rounded-lg border p-5 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Week {weekNumber} Homework Checklist</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Complete these items before moving to the next week:
                      </p>
                      <ul className="space-y-2">
                        {weekContent.homeworkChecklist.map((item, idx) => {
                          const isComplete = homeworkCompletion[idx];
                          const isAutoTracked = item.toLowerCase().includes("read all week") || 
                                                item.toLowerCase().includes("reflection questions") ||
                                                item.toLowerCase().includes("my story in brief") ||
                                                item.toLowerCase().includes("sexual integrity means");
                          return (
                            <li 
                              key={idx} 
                              className={`flex items-start gap-2 text-sm ${!isAutoTracked ? 'cursor-pointer hover-elevate rounded p-1 -m-1' : ''}`}
                              onClick={!isAutoTracked ? () => toggleManualHomework(idx) : undefined}
                              data-testid={`homework-item-${idx}`}
                            >
                              {isComplete ? (
                                <div className="h-4 w-4 mt-0.5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              ) : (
                                <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className={isComplete ? 'text-muted-foreground line-through' : ''}>{item}</span>
                              {!isAutoTracked && (
                                <span className="text-xs text-muted-foreground ml-auto">(click to toggle)</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div
                      ref={(el) => (sectionRefs.current.relapse = el)}
                      className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 p-5 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                          If a Relapse Occurs
                        </h3>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        A relapse does NOT remove you from the program. Continuing requires completion
                        of a <strong>Relapse Analysis Exercise</strong>.
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        This helps identify warning signs, what was missed, and what changes going
                        forward. Remember: A lapse is not a relapse. What you do next matters more than the slip itself.
                      </p>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        {isWeekCompleted
                          ? `Week ${weekNumber} completed! Week ${weekNumber + 1} is now unlocked.`
                          : `Complete all exercises to unlock Week ${weekNumber + 1}.`}
                      </div>
                      <Button
                        onClick={markWeekComplete}
                        disabled={isWeekCompleted}
                        data-testid="button-mark-complete"
                      >
                        {isWeekCompleted ? (
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

              <TabsContent value="listen" className="space-y-3">
                <div className="rounded-lg border p-5">
                  <div className="font-medium">Listen (AI Voice)</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    AI-generated audio narration for this week's content will be available here.
                  </p>
                  <div className="mt-3">
                    <Button variant="outline" disabled data-testid="button-play-audio">
                      Play audio (coming soon)
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="video" className="space-y-3">
                <div className="rounded-lg border p-5">
                  <div className="font-medium">Video</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Video content with slides and voiceover will be available here.
                  </p>
                  <div className="mt-3">
                    <Button variant="outline" disabled data-testid="button-watch-video">
                      Watch video (coming soon)
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button variant="outline" onClick={() => setLocation("/dashboard")} data-testid="button-back-bottom">
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}

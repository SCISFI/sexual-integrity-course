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
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const WEEK_TITLES: Record<number, string> = {
  1: "Foundations of Sexual Integrity",
  2: "Understanding Your Patterns",
  3: "Triggers & High-Risk Situations",
  4: "Building a Recovery Plan",
  5: "Accountability That Works",
  6: "Managing Urges & Cravings",
  7: "Shame Resilience & Self-Compassion",
  8: "Healthy Sexuality & Values",
  9: "Emotional Regulation Skills",
  10: "Repairing Trust in Relationships",
  11: "Boundaries & Technology Safety",
  12: "Relapse Prevention Plan",
  13: "Relapse Analysis (If It Happens)",
  14: "Identity, Purpose, and Growth",
  15: "Sustaining Momentum",
  16: "Long-Term Maintenance Plan",
};

const STORAGE_LAST_WEEK = "si_last_week";
const STORAGE_LAST_SECTION = "si_last_section";
const STORAGE_LAST_TAB = "si_last_tab";

type SectionId =
  | "top"
  | "teaching"
  | "reflection"
  | "exercise"
  | "expectations"
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

  // Load data from API on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Load reflection
        const reflectionRes = await fetch(`/api/progress/reflection/${weekNumber}`, { credentials: "include" });
        if (reflectionRes.ok) {
          const { reflection: r } = await reflectionRes.json();
          if (r) {
            setReflection({ q1: r.q1 || "", q2: r.q2 || "", q3: r.q3 || "", q4: r.q4 || "" });
          }
        }
        setReflectionStatus("idle");

        // Load commitment
        const commitmentRes = await fetch(`/api/progress/commitment/${weekNumber}`, { credentials: "include" });
        if (commitmentRes.ok) {
          const { commitment: c } = await commitmentRes.json();
          if (c) {
            setCommitment(c.statement || "");
          }
        }
        setCommitmentStatus("idle");

        // Load completed weeks
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

  // Debounced save for reflection
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

  // Debounced save for commitment
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
    expectations: null,
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
    const ids: SectionId[] = ["teaching", "reflection", "exercise", "expectations", "relapse"];
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
            <div className="text-xs text-muted-foreground">Week {weekNumber}</div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Week {weekNumber}: {title}
            </CardTitle>
            <CardDescription>Choose your format. We'll remember where you left off.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div ref={(el) => (sectionRefs.current.top = el)} />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => scrollToSection("teaching")} data-testid="button-nav-teaching">
                Teaching
              </Button>
              <Button variant="outline" onClick={() => scrollToSection("reflection")} data-testid="button-nav-reflection">
                Reflection
              </Button>
              <Button variant="outline" onClick={() => scrollToSection("exercise")} data-testid="button-nav-exercise">
                Exercise
              </Button>
              <Button variant="outline" onClick={() => scrollToSection("expectations")} data-testid="button-nav-expectations">
                Expectations
              </Button>
              <Button variant="outline" onClick={() => scrollToSection("relapse")} data-testid="button-nav-relapse">
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
                {weekNumber !== 1 ? (
                  <div className="rounded-lg border p-4">
                    <div className="font-medium">Content coming next</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      We'll build Weeks 2–16 after Week 1 is perfect.
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      ref={(el) => (sectionRefs.current.teaching = el)}
                      className="rounded-lg border p-5 space-y-2"
                    >
                      <h3 className="text-lg font-semibold">Teaching</h3>
                      <p className="text-sm text-muted-foreground">
                        Sexual integrity is not simply about stopping a behavior — it's aligning your
                        actions with your values, identity, and long-term goals. Compulsive behavior
                        thrives in secrecy, emotional avoidance, and unexamined patterns.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This week is about slowing down: clarifying your "why," identifying patterns,
                        and building a simple structure that you can actually follow.
                      </p>
                    </div>

                    <div
                      ref={(el) => (sectionRefs.current.reflection = el)}
                      className="rounded-lg border p-5 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">Reflection (Write Your Answers)</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your answers autosave as you type.
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {statusText(reflectionStatus)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          1) Why is sexual integrity important to me right now?
                        </div>
                        <textarea
                          className="w-full min-h-[110px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          value={reflection.q1}
                          onChange={(e) => handleReflectionChange("q1", e.target.value)}
                          placeholder="Write your answer..."
                          data-testid="input-reflection-q1"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          2) What has my behavior cost me (emotionally, relationally, spiritually)?
                        </div>
                        <textarea
                          className="w-full min-h-[110px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          value={reflection.q2}
                          onChange={(e) => handleReflectionChange("q2", e.target.value)}
                          placeholder="Write your answer..."
                          data-testid="input-reflection-q2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          3) What fears or doubts do I have about changing?
                        </div>
                        <textarea
                          className="w-full min-h-[110px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          value={reflection.q3}
                          onChange={(e) => handleReflectionChange("q3", e.target.value)}
                          placeholder="Write your answer..."
                          data-testid="input-reflection-q3"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          4) What will staying the same cost me in 5 years?
                        </div>
                        <textarea
                          className="w-full min-h-[110px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          value={reflection.q4}
                          onChange={(e) => handleReflectionChange("q4", e.target.value)}
                          placeholder="Write your answer..."
                          data-testid="input-reflection-q4"
                        />
                      </div>
                    </div>

                    <div
                      ref={(el) => (sectionRefs.current.exercise = el)}
                      className="rounded-lg border p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">Required Exercise: Commitment Statement</h3>
                          <p className="text-sm text-muted-foreground mt-1">Answer this question honestly:</p>
                          <p className="text-sm font-medium italic">
                            "Why am I choosing to pursue sexual integrity right now?"
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {statusText(commitmentStatus)}
                        </div>
                      </div>

                      <textarea
                        className="w-full min-h-[160px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Start typing your commitment statement here..."
                        value={commitment}
                        onChange={(e) => handleCommitmentChange(e.target.value)}
                        data-testid="input-commitment"
                      />

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Your statement autosaves as you type.</span>
                        <span>{commitment.trim().length} characters</span>
                      </div>
                    </div>

                    <div
                      ref={(el) => (sectionRefs.current.expectations = el)}
                      className="rounded-lg border p-5 space-y-2"
                    >
                      <h3 className="text-lg font-semibold">Expectations</h3>
                      <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                        <li>Daily check-ins are required to continue progressing</li>
                        <li>Skipping days or abandoning the course disqualifies refunds</li>
                        <li>Relapse does not disqualify you — avoidance does</li>
                        <li>Honesty is more important than performance</li>
                      </ul>
                    </div>

                    <div
                      ref={(el) => (sectionRefs.current.relapse = el)}
                      className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 p-5 space-y-2"
                    >
                      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                        If a Relapse Occurs
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        A relapse does NOT remove you from the program. Continuing requires completion
                        of a <strong>Relapse Analysis Exercise</strong>.
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        This helps identify warning signs, what was missed, and what changes going
                        forward.
                      </p>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        {isWeekCompleted
                          ? "Week 1 completed! Week 2 is now unlocked."
                          : "Complete all exercises to unlock Week 2."}
                      </div>
                      <Button
                        onClick={markWeekComplete}
                        disabled={isWeekCompleted}
                        data-testid="button-mark-complete"
                      >
                        {isWeekCompleted ? "Week 1 Completed" : "Mark Week 1 Complete"}
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="listen" className="space-y-3">
                <div className="rounded-lg border p-5">
                  <div className="font-medium">Listen (AI Voice)</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Next step: we'll generate AI-voice audio for this week and play it here.
                  </p>
                  <div className="mt-3">
                    <Button variant="outline" disabled data-testid="button-play-audio">
                      Play audio (coming next)
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="video" className="space-y-3">
                <div className="rounded-lg border p-5">
                  <div className="font-medium">Video</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Since you don't want to be on camera, we can do slides + voiceover videos instead.
                  </p>
                  <div className="mt-3">
                    <Button variant="outline" disabled data-testid="button-watch-video">
                      Watch video (coming next)
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

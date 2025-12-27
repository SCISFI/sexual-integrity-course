import { useEffect, useMemo, useRef, useState } from "react";
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
const STORAGE_WEEK1_COMMITMENT = "si_week1_commitment";
const STORAGE_WEEK1_REFLECTION = "si_week1_reflection_answers";
const STORAGE_COMPLETED_WEEKS = "si_completed_weeks";

type SectionId =
  | "top"
  | "teaching"
  | "reflection"
  | "exercise"
  | "expectations"
  | "relapse";

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
  const [commitment, setCommitment] = useState<string>(() => {
    return localStorage.getItem(STORAGE_WEEK1_COMMITMENT) || "";
  });

  const [commitmentStatus, setCommitmentStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  type ReflectionAnswers = {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  };

  const [reflection, setReflection] = useState<ReflectionAnswers>(() => {
    const raw = localStorage.getItem(STORAGE_WEEK1_REFLECTION);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<ReflectionAnswers>;
        return {
          q1: parsed.q1 || "",
          q2: parsed.q2 || "",
          q3: parsed.q3 || "",
          q4: parsed.q4 || "",
        };
      } catch {}
    }
    return { q1: "", q2: "", q3: "", q4: "" };
  });

  const [reflectionStatus, setReflectionStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");

  useEffect(() => {
    if (weekNumber !== 1) return;

    setReflectionStatus("saving");
    const t = setTimeout(() => {
      localStorage.setItem(
        STORAGE_WEEK1_REFLECTION,
        JSON.stringify(reflection),
      );
      setReflectionStatus("saved");
    }, 400);

    return () => clearTimeout(t);
  }, [reflection, weekNumber]);
  // =============================
  // Week completion state
  // =============================
  const [completedWeeks, setCompletedWeeks] = useState<number[]>(() => {
    const raw = localStorage.getItem(STORAGE_COMPLETED_WEEKS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map(Number).filter((n) => Number.isFinite(n))
        : [];
    } catch {
      return [];
    }
  });

  const isWeekCompleted = completedWeeks.includes(weekNumber);

  const markWeekComplete = () => {
    const next = Array.from(new Set([...completedWeeks, weekNumber])).sort(
      (a, b) => a - b,
    );

    setCompletedWeeks(next);
    localStorage.setItem(STORAGE_COMPLETED_WEEKS, JSON.stringify(next));
  };

  useEffect(() => {
    // Only autosave for Week 1
    if (weekNumber !== 1) return;

    setCommitmentStatus("saving");
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_WEEK1_COMMITMENT, commitment);
      setCommitmentStatus("saved");
    }, 400); // debounce

    return () => clearTimeout(t);
  }, [commitment, weekNumber]);

  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    top: null,
    teaching: null,
    reflection: null,
    exercise: null,
    expectations: null,
    relapse: null,
  });

  const scrollToSection = (id: SectionId) => {
    // Save “last location”
    localStorage.setItem(STORAGE_LAST_WEEK, String(weekNumber));
    localStorage.setItem(STORAGE_LAST_SECTION, id);

    const el = sectionRefs.current[id];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Remember last week + tab anytime week or tab changes
  useEffect(() => {
    localStorage.setItem(STORAGE_LAST_WEEK, String(weekNumber));
  }, [weekNumber]);

  useEffect(() => {
    localStorage.setItem(STORAGE_LAST_TAB, tab);
  }, [tab]);

  // On load: jump to last section if this is the last week visited
  useEffect(() => {
    const lastWeek = safeNumber(localStorage.getItem(STORAGE_LAST_WEEK), 1);
    const lastSection = (localStorage.getItem(STORAGE_LAST_SECTION) ||
      "top") as SectionId;

    // Small delay so layout renders before scroll
    setTimeout(() => {
      if (lastWeek === weekNumber && sectionRefs.current[lastSection]) {
        sectionRefs.current[lastSection]?.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      } else {
        sectionRefs.current.top?.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      }
    }, 50);
  }, [weekNumber]);

  // Update last section automatically as you scroll (no clicking required)
  useEffect(() => {
    const ids: SectionId[] = [
      "teaching",
      "reflection",
      "exercise",
      "expectations",
      "relapse",
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        // pick the most visible intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          )[0];

        if (visible?.target) {
          const found = ids.find(
            (id) => sectionRefs.current[id] === visible.target,
          );
          if (found) {
            localStorage.setItem(STORAGE_LAST_WEEK, String(weekNumber));
            localStorage.setItem(STORAGE_LAST_SECTION, found);
          }
        }
      },
      { root: null, threshold: [0.2, 0.35, 0.5, 0.7] },
    );

    ids.forEach((id) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [weekNumber]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <div className="font-semibold">Sexual Integrity Program</div>
            <div className="text-xs text-muted-foreground">
              Week {weekNumber}
            </div>
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
            <CardDescription>
              Choose your format. We’ll remember where you left off.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div ref={(el) => (sectionRefs.current.top = el)} />

            {/* Quick section navigation */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => scrollToSection("teaching")}
              >
                Teaching
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollToSection("reflection")}
              >
                Reflection
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollToSection("exercise")}
              >
                Exercise
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollToSection("expectations")}
              >
                Expectations
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollToSection("relapse")}
              >
                Relapse Plan
              </Button>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="read">Read</TabsTrigger>
                <TabsTrigger value="listen">Listen (AI Voice)</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
              </TabsList>

              <TabsContent value="read" className="space-y-6">
                {weekNumber !== 1 ? (
                  <div className="rounded-lg border p-4">
                    <div className="font-medium">Content coming next</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      We’ll build Weeks 2–16 after Week 1 is perfect.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Teaching */}
                    <div
                      ref={(el) => (sectionRefs.current.teaching = el)}
                      className="rounded-lg border p-5 space-y-2"
                    >
                      <h3 className="text-lg font-semibold">Teaching</h3>
                      <p className="text-sm text-muted-foreground">
                        Sexual integrity is not simply about stopping a behavior
                        — it’s aligning your actions with your values, identity,
                        and long-term goals. Compulsive behavior thrives in
                        secrecy, emotional avoidance, and unexamined patterns.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This week is about slowing down: clarifying your “why,”
                        identifying patterns, and building a simple structure
                        that you can actually follow.
                      </p>
                    </div>

                    {/* Reflection */}
                    <div
                      ref={(el) => (sectionRefs.current.reflection = el)}
                      className="rounded-lg border p-5 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Reflection (Write Your Answers)
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your answers autosave as you type.
                          </p>
                        </div>

                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {weekNumber === 1 &&
                            reflectionStatus === "saving" &&
                            "Saving…"}
                          {weekNumber === 1 &&
                            reflectionStatus === "saved" &&
                            "Saved"}
                          {weekNumber === 1 &&
                            reflectionStatus === "idle" &&
                            ""}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          1) Why is sexual integrity important to me right now?
                        </div>
                        <textarea
                          className="w-full min-h-[110px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          value={reflection.q1}
                          onChange={(e) => {
                            setReflectionStatus("idle");
                            setReflection((prev) => ({
                              ...prev,
                              q1: e.target.value,
                            }));
                          }}
                          placeholder="Write your answer…"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          2) What has my behavior cost me (emotionally,
                          relationally, spiritually)?
                        </div>
                        <textarea
                          className="w-full min-h-[110px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          value={reflection.q2}
                          onChange={(e) => {
                            setReflectionStatus("idle");
                            setReflection((prev) => ({
                              ...prev,
                              q2: e.target.value,
                            }));
                          }}
                          placeholder="Write your answer…"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          3) What fears or doubts do I have about changing?
                        </div>
                        <textarea
                          className="w-full min-h-[110px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          value={reflection.q3}
                          onChange={(e) => {
                            setReflectionStatus("idle");
                            setReflection((prev) => ({
                              ...prev,
                              q3: e.target.value,
                            }));
                          }}
                          placeholder="Write your answer…"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          4) What will staying the same cost me in 5 years?
                        </div>
                        <textarea
                          className="w-full min-h-[110px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          value={reflection.q4}
                          onChange={(e) => {
                            setReflectionStatus("idle");
                            setReflection((prev) => ({
                              ...prev,
                              q4: e.target.value,
                            }));
                          }}
                          placeholder="Write your answer…"
                        />
                      </div>
                    </div>

                    {/* Exercise */}
                    <div
                      ref={(el) => (sectionRefs.current.exercise = el)}
                      className="rounded-lg border p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Required Exercise: Commitment Statement
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Answer this question honestly:
                          </p>
                          <p className="text-sm font-medium italic">
                            “Why am I choosing to pursue sexual integrity right
                            now?”
                          </p>
                        </div>

                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {weekNumber === 1 &&
                            commitmentStatus === "saving" &&
                            "Saving…"}
                          {weekNumber === 1 &&
                            commitmentStatus === "saved" &&
                            "Saved"}
                          {weekNumber === 1 &&
                            commitmentStatus === "idle" &&
                            ""}
                        </div>
                      </div>

                      <textarea
                        className="w-full min-h-[160px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Start typing your commitment statement here…"
                        value={commitment}
                        onChange={(e) => {
                          setCommitmentStatus("idle");
                          setCommitment(e.target.value);
                        }}
                      />

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Your statement autosaves as you type.</span>
                        <span>{commitment.trim().length} characters</span>
                      </div>
                    </div>

                    {/* Expectations */}
                    <div
                      ref={(el) => (sectionRefs.current.expectations = el)}
                      className="rounded-lg border p-5 space-y-2"
                    >
                      <h3 className="text-lg font-semibold">Expectations</h3>
                      <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                        <li>
                          Daily check-ins are required to continue progressing
                        </li>
                        <li>
                          Skipping days or abandoning the course disqualifies
                          refunds
                        </li>
                        <li>
                          Relapse does not disqualify you — avoidance does
                        </li>
                        <li>Honesty is more important than performance</li>
                      </ul>
                    </div>

                    {/* Relapse */}
                    <div
                      ref={(el) => (sectionRefs.current.relapse = el)}
                      className="rounded-lg border border-red-300 bg-red-50 p-5 space-y-2"
                    >
                      <h3 className="text-lg font-semibold text-red-700">
                        If a Relapse Occurs
                      </h3>
                      <p className="text-sm text-red-700">
                        A relapse does NOT remove you from the program.
                        Continuing requires completion of a{" "}
                        <strong>Relapse Analysis Exercise</strong>.
                      </p>
                      <p className="text-sm text-red-700">
                        This helps identify warning signs, what was missed, and
                        what changes going forward.
                      </p>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        Next: we’ll make “Mark Complete” real and unlock Week 2.
                      </div>
                      <Button disabled>
                        Mark Week 1 Complete (coming next)
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="listen" className="space-y-3">
                <div className="rounded-lg border p-5">
                  <div className="font-medium">Listen (AI Voice)</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Next step: we’ll generate AI-voice audio for this week and
                    play it here.
                  </p>
                  <div className="mt-3">
                    <Button variant="outline" disabled>
                      Play audio (coming next)
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="video" className="space-y-3">
                <div className="rounded-lg border p-5">
                  <div className="font-medium">Video</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Since you don’t want to be on camera, we can do slides +
                    voiceover videos instead.
                  </p>
                  <div className="mt-3">
                    <Button variant="outline" disabled>
                      Watch video (coming next)
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}

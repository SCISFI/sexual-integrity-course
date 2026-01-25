import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { WEEK_CONTENT, WEEK_TITLES, PHASE_INFO } from "@/data/curriculum";

function safeNumber(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function WeekPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/week/:week");

  const weekNumber = useMemo(() => safeNumber(params?.week, 1), [params?.week]);

  const weekContent = WEEK_CONTENT[weekNumber];
  const title = WEEK_TITLES[weekNumber] ?? "Week";
  const phase = weekNumber <= 8 ? 1 : 2;
  const phaseInfo = PHASE_INFO[phase];

  const [isWeekCompleted, setIsWeekCompleted] = useState(false);
  const [affirmComplete, setAffirmComplete] = useState(false);

  useEffect(() => {
    setAffirmComplete(false);
  }, [weekNumber]);

  const markWeekComplete = () => {
    setIsWeekCompleted(true);
  };

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
              Phase {phase}: {phaseInfo.name}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">
              Week {weekNumber}: {title}
            </h1>
            <CardDescription>
              {weekContent?.overview ?? "Content coming soon."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs defaultValue="read">
              <TabsList>
                <TabsTrigger value="read">Read</TabsTrigger>
                <TabsTrigger value="listen">Listen</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
              </TabsList>

              <TabsContent value="read" className="space-y-6">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Teaching, reflections, and exercises are completed above.
                  </p>
                </div>

                <Separator />

                <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={affirmComplete}
                      onChange={(e) => setAffirmComplete(e.target.checked)}
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
                      ? `Week ${weekNumber} completed! Week ${weekNumber + 1} is now unlocked.`
                      : `Complete all exercises to unlock Week ${weekNumber + 1}.`}
                  </div>

                  <Button
                    onClick={markWeekComplete}
                    disabled={isWeekCompleted || !affirmComplete}
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

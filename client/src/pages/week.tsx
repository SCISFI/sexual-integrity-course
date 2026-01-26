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
import { ArrowLeft, CheckCircle2, BookOpen, HelpCircle, ClipboardList, ListChecks } from "lucide-react";
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
  const [homeworkCompleted, setHomeworkCompleted] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setAffirmComplete(false);
    setHomeworkCompleted({});
  }, [weekNumber]);

  const markWeekComplete = () => {
    setIsWeekCompleted(true);
  };

  const toggleHomework = (index: number) => {
    setHomeworkCompleted(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
                                placeholder="Write your reflection here..."
                                className="min-h-[100px]"
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
                                data-testid={`checkbox-homework-${idx}`}
                              />
                              <label
                                htmlFor={`homework-${idx}`}
                                className={`text-sm cursor-pointer ${homeworkCompleted[idx] ? 'line-through text-muted-foreground' : ''}`}
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
                    disabled={isWeekCompleted || !affirmComplete}
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

import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Calendar, CheckCircle2, Clock, FileText, MessageSquare, RotateCcw, ListChecks, Send, Pencil, X, Save, BarChart3 } from "lucide-react";
import { getPromptForDate } from "@/data/journal-prompts";
import { WEEK_CONTENT } from "@/data/curriculum";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const DAILY_CHECK_LABELS: Record<string, string> = {
  "no-acting-out": "Did not engage in compulsive sexual behavior today",
  "no-rituals": "Did not engage in ritualistic behaviors leading to acting out",
  "triggers-managed": "Successfully managed triggers when they occurred",
  "sleep": "Got adequate sleep (7-8 hours)",
  "exercise": "Got physical exercise or movement",
  "connection": "Had meaningful connection with others",
  "values-aligned": "Took at least one values-aligned action",
  "honest": "Was honest in my interactions today",
};

function formatEveningChecks(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

type ClientProgress = {
  client: {
    id: string;
    name: string;
    email: string;
    startDate: string | null;
    allFeesWaived: boolean;
  };
  completedWeeks: number[];
  checkins: Array<{
    id: string;
    dateKey: string;
    morningChecks: string | null;
    eveningChecks: string | null;
    journalEntry: string | null;
    moodLevel: number | null;
    urgeLevel: number | null;
  }>;
  reflections: Array<{
    weekNumber: number;
    q1: string | null;
    q2: string | null;
    q3: string | null;
    q4: string | null;
    q5: string | null;
    q6: string | null;
  }>;
  homeworkCompletions: Array<{
    weekNumber: number;
    completedItems: number[];
    updatedAt: string;
  }>;
  feedback: Array<{
    id: string;
    feedbackType: string;
    content: string;
    weekNumber: number | null;
    createdAt: string;
    editedAt: string | null;
    editedBy: string | null;
  }>;
  therapists: Array<{ id: string; name: string | null; email: string }>;
};

export default function AdminClientPage() {
  const [, setLocation] = useLocation();
  const { clientId } = useParams<{ clientId: string }>();
  const { toast } = useToast();
  const [resetWeekNumber, setResetWeekNumber] = useState<number | null>(null);
  const [newFeedback, setNewFeedback] = useState("");
  const [feedbackWeek, setFeedbackWeek] = useState<number | null>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const { data, isLoading, error } = useQuery<ClientProgress>({
    queryKey: ['/api/admin/clients', clientId, 'progress'],
    enabled: !!clientId,
  });

  const resetWeekMutation = useMutation({
    mutationFn: async (weekNumber: number) => {
      const res = await apiRequest("DELETE", `/api/admin/clients/${clientId}/completions/${weekNumber}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to reset week");
      }
      return res.json();
    },
    onSuccess: (_, weekNumber) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'progress'] });
      setResetWeekNumber(null);
      toast({ title: `Week ${weekNumber} has been reset`, description: "The client can now redo this week." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: { feedbackType: string; content: string; weekNumber?: number }) => {
      const res = await apiRequest("POST", `/api/admin/clients/${clientId}/feedback`, data);
      if (!res.ok) throw new Error("Failed to add feedback");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'progress'] });
      setNewFeedback("");
      setFeedbackWeek(null);
      toast({ title: "Feedback added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add feedback", variant: "destructive" });
    },
  });

  const editFeedbackMutation = useMutation({
    mutationFn: async (data: { feedbackId: string; content: string }) => {
      const res = await apiRequest("PUT", `/api/admin/feedback/${data.feedbackId}`, { content: data.content });
      if (!res.ok) throw new Error("Failed to update feedback");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'progress'] });
      setEditingFeedbackId(null);
      setEditingContent("");
      toast({ title: "Feedback updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update feedback", variant: "destructive" });
    },
  });

  const handleSubmitFeedback = () => {
    if (!newFeedback.trim()) return;
    feedbackMutation.mutate({
      feedbackType: feedbackWeek ? "week_specific" : "general",
      content: newFeedback,
      weekNumber: feedbackWeek || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <Button variant="ghost" onClick={() => setLocation("/admin")} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <Card className="mt-6">
            <CardContent className="py-12 text-center text-muted-foreground">
              Client not found or error loading data.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { client, completedWeeks, checkins, reflections, homeworkCompletions, feedback, therapists } = data;

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/admin")} data-testid="button-back">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              {client.name || "Unnamed Client"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-sm break-all">{client.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium text-sm">{client.startDate || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mentor(s)</p>
                <p className="font-medium text-sm">
                  {therapists.length > 0 
                    ? therapists.map(t => t.name || t.email).join(", ") 
                    : "None assigned"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {client.allFeesWaived && (
                <Badge variant="secondary">All Fees Waived</Badge>
              )}
              <Badge variant="outline">{completedWeeks.length} / 16 Weeks</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/analytics/${clientId}`)}
                className="ml-auto"
                data-testid="button-view-analytics"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="progress" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="checkins">Check-ins</TabsTrigger>
              <TabsTrigger value="reflections">Reflections</TabsTrigger>
              <TabsTrigger value="homework">Homework</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="progress" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Week Completion Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((week) => {
                    const isCompleted = completedWeeks.includes(week);
                    return (
                      <div
                        key={week}
                        className={`relative flex h-11 w-full items-center justify-center rounded-md border text-sm font-medium ${
                          isCompleted
                            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                            : "border-border bg-muted/20 text-muted-foreground"
                        }`}
                        data-testid={`week-status-${week}`}
                      >
                        {week}
                        {isCompleted && (
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResetWeekNumber(week);
                            }}
                            className="absolute -top-2 -right-2 h-5 w-5"
                            title={`Reset Week ${week}`}
                            data-testid={`button-reset-week-${week}`}
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Tap the reset button on a completed week to allow the client to redo it.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkins" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Daily Check-ins ({checkins.length} total)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checkins.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No check-ins recorded yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {checkins.slice(0, 30).map((checkin) => (
                      <div
                        key={checkin.id}
                        className="rounded-md border p-4"
                        data-testid={`checkin-${checkin.dateKey}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="font-medium text-sm">{checkin.dateKey}</span>
                          <div className="flex gap-2">
                            {checkin.moodLevel !== null && (
                              <Badge variant="outline" className="text-xs">Mood: {checkin.moodLevel}/10</Badge>
                            )}
                            {checkin.urgeLevel !== null && (
                              <Badge variant="outline" className="text-xs">Urge: {checkin.urgeLevel}/10</Badge>
                            )}
                          </div>
                        </div>
                        {checkin.eveningChecks && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1.5">Daily Items</p>
                            <div className="space-y-1">
                              {formatEveningChecks(checkin.eveningChecks).map((id) => (
                                <div key={id} className="flex items-start gap-2 text-sm" data-testid={`checkin-item-${id}`}>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                  <span>{DAILY_CHECK_LABELS[id] || id}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {checkin.journalEntry && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                              Journal Prompt: <em>{getPromptForDate(checkin.dateKey)}</em>
                            </p>
                            <p className="text-sm mt-1">{checkin.journalEntry}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reflections" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Week Reflections</CardTitle>
              </CardHeader>
              <CardContent>
                {reflections.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No reflections recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reflections.map((reflection) => (
                      <div
                        key={reflection.weekNumber}
                        className="rounded-md border p-4"
                        data-testid={`reflection-week-${reflection.weekNumber}`}
                      >
                        <h4 className="font-medium text-sm mb-3">Week {reflection.weekNumber}</h4>
                        <div className="space-y-3">
                          {(() => {
                            const weekData = WEEK_CONTENT[reflection.weekNumber];
                            const rqs = weekData?.reflectionQuestions || [];
                            const defaultLabels = ["Key insight", "What went well", "Challenges faced", "Goals for next week", "Reflection 5", "Reflection 6"];
                            return [reflection.q1, reflection.q2, reflection.q3, reflection.q4, reflection.q5, reflection.q6].map((answer, idx) => {
                              if (!answer) return null;
                              const label = rqs[idx]?.question || defaultLabels[idx];
                              return (
                                <div key={idx}>
                                  <p className="text-xs text-muted-foreground">{label}</p>
                                  <p className="text-sm mt-0.5">{answer}</p>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homework" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Homework Completions</CardTitle>
              </CardHeader>
              <CardContent>
                {homeworkCompletions?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No homework completions recorded yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {homeworkCompletions?.map((hw) => (
                      <div
                        key={hw.weekNumber}
                        className="rounded-md border p-4"
                        data-testid={`homework-week-${hw.weekNumber}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm">Week {hw.weekNumber}</h4>
                          <Badge variant="outline" className="text-xs">
                            {hw.completedItems.length} items
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(hw.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackWeek && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">For Week {feedbackWeek}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setFeedbackWeek(null)}>
                        Clear
                      </Button>
                    </div>
                  )}
                  <Textarea
                    placeholder="Write your feedback, encouragement, or technique reminders here..."
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    className="min-h-[100px]"
                    data-testid="input-feedback"
                  />
                  <Button 
                    onClick={handleSubmitFeedback}
                    disabled={!newFeedback.trim() || feedbackMutation.isPending}
                    className="w-full sm:w-auto"
                    data-testid="button-submit-feedback"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {feedbackMutation.isPending ? "Sending..." : "Send Feedback"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Previous Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {feedback?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No feedback given yet.</p>
                ) : (
                  <div className="space-y-3">
                    {feedback?.map((fb) => (
                      <div
                        key={fb.id}
                        className="rounded-md border p-4"
                        data-testid={`feedback-${fb.id}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {fb.weekNumber && <Badge variant="outline" className="text-xs">Week {fb.weekNumber}</Badge>}
                            <Badge variant="secondary" className="text-xs">{fb.feedbackType}</Badge>
                            {fb.editedAt && (
                              <span className="text-[10px] text-muted-foreground italic" data-testid={`edited-indicator-${fb.id}`}>
                                Edited &middot; {new Date(fb.editedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(fb.createdAt).toLocaleDateString()}
                            </span>
                            {editingFeedbackId !== fb.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingFeedbackId(fb.id); setEditingContent(fb.content); }}
                                data-testid={`button-edit-feedback-${fb.id}`}
                              >
                                <Pencil className="h-3 w-3 mr-1" /> Edit
                              </Button>
                            )}
                          </div>
                        </div>
                        {editingFeedbackId === fb.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={4}
                              data-testid={`textarea-edit-feedback-${fb.id}`}
                            />
                            <div className="flex flex-wrap gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setEditingFeedbackId(null); setEditingContent(""); }}
                                data-testid={`button-cancel-edit-${fb.id}`}
                              >
                                <X className="h-3 w-3 mr-1" /> Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => editFeedbackMutation.mutate({ feedbackId: fb.id, content: editingContent })}
                                disabled={editFeedbackMutation.isPending || !editingContent.trim()}
                                data-testid={`button-save-edit-${fb.id}`}
                              >
                                <Save className="h-3 w-3 mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm">{fb.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={resetWeekNumber !== null} onOpenChange={(open) => !open && setResetWeekNumber(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Week {resetWeekNumber}?</DialogTitle>
            <DialogDescription>
              This will remove the completion status for Week {resetWeekNumber}, allowing the client to redo this week. 
              Their previous responses (reflections, homework) will be preserved but the week will no longer show as completed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setResetWeekNumber(null)} className="w-full sm:w-auto" data-testid="button-cancel-reset-week">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => resetWeekNumber && resetWeekMutation.mutate(resetWeekNumber)}
              disabled={resetWeekMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-confirm-reset-week"
            >
              {resetWeekMutation.isPending ? "Resetting..." : "Reset Week"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

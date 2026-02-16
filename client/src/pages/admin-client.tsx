import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Calendar, CheckCircle2, Clock, FileText, MessageSquare, RotateCcw, ListChecks, Send } from "lucide-react";
import { getPromptForDate } from "@/data/journal-prompts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

  const handleSubmitFeedback = () => {
    if (!newFeedback.trim()) return;
    feedbackMutation.mutate({
      feedbackType: feedbackWeek ? "week" : "general",
      content: newFeedback,
      weekNumber: feedbackWeek || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
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
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <Button variant="ghost" onClick={() => setLocation("/admin")} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <Card className="mt-6">
            <CardContent className="py-8 text-center text-muted-foreground">
              Client not found or error loading data.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { client, completedWeeks, checkins, reflections, homeworkCompletions, feedback, therapists } = data;

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/admin")} data-testid="button-back">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {client.name || "Unnamed Client"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{client.startDate || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mentor(s)</p>
                <p className="font-medium">
                  {therapists.length > 0 
                    ? therapists.map(t => t.name || t.email).join(", ") 
                    : "None assigned"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {client.allFeesWaived && (
                <Badge variant="secondary">All Fees Waived</Badge>
              )}
              <Badge variant="outline">{completedWeeks.length} / 16 Weeks Completed</Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="checkins">Check-ins</TabsTrigger>
            <TabsTrigger value="reflections">Reflections</TabsTrigger>
            <TabsTrigger value="homework">Homework</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Week Completion Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((week) => {
                    const isCompleted = completedWeeks.includes(week);
                    return (
                      <div
                        key={week}
                        className={`relative flex h-12 w-12 items-center justify-center rounded-lg border-2 text-sm font-medium ${
                          isCompleted
                            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "border-muted bg-muted/20 text-muted-foreground"
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
                            className="absolute -top-2 -right-2"
                            title={`Reset Week ${week}`}
                            data-testid={`button-reset-week-${week}`}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Click the reset button on a completed week to allow the client to redo it.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Check-ins ({checkins.length} total)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checkins.length === 0 ? (
                  <p className="text-muted-foreground">No check-ins recorded yet.</p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {checkins.slice(0, 30).map((checkin) => (
                      <div
                        key={checkin.id}
                        className="rounded-lg border p-4"
                        data-testid={`checkin-${checkin.dateKey}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{checkin.dateKey}</span>
                          <div className="flex gap-2">
                            {checkin.moodLevel !== null && (
                              <Badge variant="outline">Mood: {checkin.moodLevel}/10</Badge>
                            )}
                            {checkin.urgeLevel !== null && (
                              <Badge variant="outline">Urge: {checkin.urgeLevel}/10</Badge>
                            )}
                          </div>
                        </div>
                        {checkin.eveningChecks && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Daily Items</p>
                            <p className="text-sm">{checkin.eveningChecks}</p>
                          </div>
                        )}
                        {checkin.journalEntry && (
                          <div className="mt-2">
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

          <TabsContent value="reflections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Week Reflections
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reflections.length === 0 ? (
                  <p className="text-muted-foreground">No reflections recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reflections.map((reflection) => (
                      <div
                        key={reflection.weekNumber}
                        className="rounded-lg border p-4"
                        data-testid={`reflection-week-${reflection.weekNumber}`}
                      >
                        <h4 className="font-medium mb-3">Week {reflection.weekNumber}</h4>
                        <div className="space-y-3">
                          {reflection.q1 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Key insight</p>
                              <p className="text-sm">{reflection.q1}</p>
                            </div>
                          )}
                          {reflection.q2 && (
                            <div>
                              <p className="text-xs text-muted-foreground">What went well</p>
                              <p className="text-sm">{reflection.q2}</p>
                            </div>
                          )}
                          {reflection.q3 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Challenges faced</p>
                              <p className="text-sm">{reflection.q3}</p>
                            </div>
                          )}
                          {reflection.q4 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Goals for next week</p>
                              <p className="text-sm">{reflection.q4}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homework" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  Homework Completions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {homeworkCompletions?.length === 0 ? (
                  <p className="text-muted-foreground">No homework completions recorded yet.</p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {homeworkCompletions?.map((hw) => (
                      <div
                        key={hw.weekNumber}
                        className="rounded-lg border p-4"
                        data-testid={`homework-week-${hw.weekNumber}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Week {hw.weekNumber}</h4>
                          <Badge variant="outline">
                            {hw.completedItems.length} items completed
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

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Add Feedback
                </CardTitle>
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
                    className="min-h-24"
                    data-testid="input-feedback"
                  />
                  <Button 
                    onClick={handleSubmitFeedback}
                    disabled={!newFeedback.trim() || feedbackMutation.isPending}
                    data-testid="button-submit-feedback"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {feedbackMutation.isPending ? "Sending..." : "Send Feedback"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Previous Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {feedback?.length === 0 ? (
                  <p className="text-muted-foreground">No feedback given yet.</p>
                ) : (
                  <div className="space-y-4">
                    {feedback?.map((fb) => (
                      <div
                        key={fb.id}
                        className="rounded-lg border p-4"
                        data-testid={`feedback-${fb.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {fb.weekNumber && <Badge variant="outline">Week {fb.weekNumber}</Badge>}
                            <Badge variant="secondary">{fb.feedbackType}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{fb.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reset Week Confirmation Dialog */}
      <Dialog open={resetWeekNumber !== null} onOpenChange={(open) => !open && setResetWeekNumber(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Week {resetWeekNumber}?</DialogTitle>
            <DialogDescription>
              This will remove the completion status for Week {resetWeekNumber}, allowing the client to redo this week. 
              Their previous responses (reflections, homework) will be preserved but the week will no longer show as completed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetWeekNumber(null)} data-testid="button-cancel-reset-week">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => resetWeekNumber && resetWeekMutation.mutate(resetWeekNumber)}
              disabled={resetWeekMutation.isPending}
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

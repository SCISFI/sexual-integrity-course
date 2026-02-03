import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Calendar, CheckCircle2, Clock, FileText, MessageSquare, Send, ListChecks } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ClientProgress = {
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
};

type ClientInfo = {
  id: number;
  name: string;
  email: string;
  startDate: string | null;
  completedWeeks: number[];
  currentWeek: number;
};

export default function TherapistClient() {
  const [, setLocation] = useLocation();
  const { id: clientId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [newFeedback, setNewFeedback] = useState("");
  const [feedbackWeek, setFeedbackWeek] = useState<number | null>(null);

  const { data: clientsData } = useQuery<{ clients: ClientInfo[] }>({
    queryKey: ['/api/therapist/clients'],
  });

  const { data: progressData, isLoading: loadingProgress } = useQuery<ClientProgress>({
    queryKey: ['/api/therapist/clients', clientId, 'progress'],
    enabled: !!clientId,
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: { feedbackType: string; content: string; weekNumber?: number }) => {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/feedback`, data);
      if (!res.ok) throw new Error("Failed to add feedback");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'progress'] });
      setNewFeedback("");
      setFeedbackWeek(null);
      toast({ title: "Feedback added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add feedback", variant: "destructive" });
    },
  });

  const client = clientsData?.clients?.find(c => c.id === parseInt(clientId || "0"));
  const completedWeeks = progressData?.completedWeeks || [];
  const checkins = progressData?.checkins || [];
  const reflections = progressData?.reflections || [];
  const homeworkCompletions = progressData?.homeworkCompletions || [];
  const feedback = progressData?.feedback || [];

  const getWeekStatus = (weekNum: number) => {
    if (completedWeeks.includes(weekNum)) return "completed";
    if (client?.startDate) {
      const daysSinceStart = Math.floor((Date.now() - new Date(client.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const daysRequired = (weekNum - 1) * 7;
      if (daysSinceStart >= daysRequired) return "available";
    }
    return "locked";
  };

  const handleSubmitFeedback = () => {
    if (!newFeedback.trim()) return;
    feedbackMutation.mutate({
      feedbackType: feedbackWeek ? 'week' : 'general',
      content: newFeedback,
      weekNumber: feedbackWeek || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/therapist")}
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>

        {!client ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Client not found or you don't have access to view this client.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {client.name}
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
                    <p className="font-medium">
                      {client.startDate ? new Date(client.startDate).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="font-medium">{completedWeeks.length} / 16 Weeks</p>
                  </div>
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
                      <Calendar className="h-5 w-5" />
                      Weekly Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingProgress ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                        {Array.from({ length: 16 }, (_, i) => i + 1).map(weekNum => {
                          const status = getWeekStatus(weekNum);
                          return (
                            <div
                              key={weekNum}
                              className={`flex flex-col items-center justify-center rounded-lg border p-3 ${
                                status === "completed"
                                  ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950"
                                  : status === "available"
                                    ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950"
                                    : "border-muted bg-muted/30"
                              }`}
                              data-testid={`week-status-${weekNum}`}
                            >
                              <span className="text-xs text-muted-foreground">Week</span>
                              <span className="font-bold">{weekNum}</span>
                              {status === "completed" && (
                                <CheckCircle2 className="mt-1 h-4 w-4 text-green-600 dark:text-green-400" />
                              )}
                              {status === "available" && (
                                <Clock className="mt-1 h-4 w-4 text-amber-600 dark:text-amber-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="checkins" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Check-ins ({checkins.length} total)</CardTitle>
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
                                <p className="text-xs text-muted-foreground">Journal</p>
                                <p className="text-sm">{checkin.journalEntry}</p>
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
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">Week {reflection.weekNumber}</h4>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setFeedbackWeek(reflection.weekNumber);
                                  document.querySelector('[data-value="feedback"]')?.dispatchEvent(new Event('click', { bubbles: true }));
                                }}
                              >
                                Add Feedback
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {reflection.q1 && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Key insight from this week</p>
                                  <p className="text-sm bg-muted/50 p-2 rounded">{reflection.q1}</p>
                                </div>
                              )}
                              {reflection.q2 && (
                                <div>
                                  <p className="text-xs text-muted-foreground">What went well</p>
                                  <p className="text-sm bg-muted/50 p-2 rounded">{reflection.q2}</p>
                                </div>
                              )}
                              {reflection.q3 && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Challenges faced</p>
                                  <p className="text-sm bg-muted/50 p-2 rounded">{reflection.q3}</p>
                                </div>
                              )}
                              {reflection.q4 && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Goals for next week</p>
                                  <p className="text-sm bg-muted/50 p-2 rounded">{reflection.q4}</p>
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
                      Homework Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {homeworkCompletions.length === 0 ? (
                      <p className="text-muted-foreground">No homework tracked yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {homeworkCompletions
                          .sort((a, b) => a.weekNumber - b.weekNumber)
                          .map((hw) => (
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
                    {feedback.length === 0 ? (
                      <p className="text-muted-foreground">No feedback given yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {feedback.map((fb) => (
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
          </>
        )}
      </div>
    </div>
  );
}

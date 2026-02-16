import { useState, useEffect } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Calendar, CheckCircle2, Clock, FileText, MessageSquare, Send, ListChecks, BarChart3, Flame, TrendingDown, TrendingUp, Target, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getPromptForDate } from "@/data/journal-prompts";

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
    checkinDateKey: string | null;
    createdAt: string;
  }>;
};

type ClientInfo = {
  id: string;
  name: string;
  email: string;
  startDate: string | null;
  completedWeeks: number[];
  currentWeek: number;
};

export default function TherapistClient() {
  const [, setLocation] = useLocation();
  const { id: clientId } = useParams<{ id: string }>();
  const searchString = useSearch();
  const { toast } = useToast();
  const [newFeedback, setNewFeedback] = useState("");
  const [feedbackWeek, setFeedbackWeek] = useState<number | null>(null);
  const [feedbackCheckinDate, setFeedbackCheckinDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("progress");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const searchParams = new URLSearchParams(searchString);
  const reviewWeek = searchParams.get('reviewWeek') ? parseInt(searchParams.get('reviewWeek')!) : null;

  const submitReviewMutation = useMutation({
    mutationFn: async ({ clientId, weekNumber, reviewNotes }: { clientId: string; weekNumber: number; reviewNotes: string }) => {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/review/${weekNumber}`, { reviewNotes });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit review");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'progress'] });
      setReviewNotes("");
      toast({
        title: "Review Submitted",
        description: "The week has been marked as reviewed.",
      });
      setLocation("/therapist");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: clientsData } = useQuery<{ clients: ClientInfo[] }>({
    queryKey: ['/api/therapist/clients'],
  });

  const { data: progressData, isLoading: loadingProgress } = useQuery<ClientProgress>({
    queryKey: ['/api/therapist/clients', clientId, 'progress'],
    enabled: !!clientId,
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: { feedbackType: string; content: string; weekNumber?: number; checkinDateKey?: string }) => {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/feedback`, data);
      if (!res.ok) throw new Error("Failed to add feedback");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'progress'] });
      setNewFeedback("");
      setFeedbackWeek(null);
      setFeedbackCheckinDate(null);
      toast({ title: "Feedback added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add feedback", variant: "destructive" });
    },
  });

  const client = clientsData?.clients?.find(c => c.id === clientId);
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
      feedbackType: feedbackCheckinDate ? 'checkin' : feedbackWeek ? 'week' : 'general',
      content: newFeedback,
      weekNumber: feedbackWeek || undefined,
      checkinDateKey: feedbackCheckinDate || undefined,
    });
  };

  const handleGenerateAIDraft = async () => {
    if (!clientId) return;
    setIsGeneratingDraft(true);
    try {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/generate-feedback`, {
        weekNumber: feedbackWeek || undefined,
      });
      if (!res.ok) throw new Error("Failed to generate draft");
      const data = await res.json();
      setNewFeedback(data.draft);
      toast({ title: "AI draft generated - feel free to edit before sending" });
    } catch (error) {
      toast({ title: "Failed to generate AI draft", variant: "destructive" });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleAddFeedbackForWeek = (weekNumber: number) => {
    setFeedbackWeek(weekNumber);
    setFeedbackCheckinDate(null);
    setActiveTab("feedback");
  };

  const handleAddFeedbackForCheckin = (dateKey: string) => {
    setFeedbackCheckinDate(dateKey);
    setFeedbackWeek(null);
    setActiveTab("feedback");
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

            {reviewWeek && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Reviewing Week {reviewWeek} for {client.name}
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300/80">
                        Review their progress below, then scroll to the bottom to add notes and mark the review complete.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="checkins">Check-ins</TabsTrigger>
                <TabsTrigger value="reflections">Reflections</TabsTrigger>
                <TabsTrigger value="homework">Homework</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>

              <TabsContent value="analytics" className="space-y-4">
                {/* Client Analytics Summary */}
                {(() => {
                  // Calculate analytics data - sort checkins by date first for accuracy
                  const sortedCheckins = [...checkins].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
                  const totalCheckins = sortedCheckins.length;
                  const last14Days = Array.from({ length: 14 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    return date.toISOString().split('T')[0];
                  });
                  const checkinsLast14 = sortedCheckins.filter(c => last14Days.includes(c.dateKey)).length;
                  const completionRate = Math.round((checkinsLast14 / 14) * 100);
                  
                  // Calculate streak from sorted dates
                  let currentStreak = 0;
                  const uniqueDateSet = new Set(sortedCheckins.map(c => c.dateKey));
                  const today = new Date().toISOString().split('T')[0];
                  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                  
                  if (uniqueDateSet.has(today) || uniqueDateSet.has(yesterday)) {
                    let checkDate = uniqueDateSet.has(today) ? new Date() : new Date(Date.now() - 86400000);
                    while (true) {
                      const dateKey = checkDate.toISOString().split('T')[0];
                      if (uniqueDateSet.has(dateKey)) {
                        currentStreak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                      } else {
                        break;
                      }
                    }
                  }
                  
                  // Calculate mood and urge averages from recent sorted checkins
                  const recentCheckins = sortedCheckins.slice(0, 14);
                  const moodValues = recentCheckins.filter(c => c.moodLevel !== null).map(c => c.moodLevel!);
                  const urgeValues = recentCheckins.filter(c => c.urgeLevel !== null).map(c => c.urgeLevel!);
                  const avgMood = moodValues.length > 0 ? (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1) : '--';
                  const avgUrge = urgeValues.length > 0 ? (urgeValues.reduce((a, b) => a + b, 0) / urgeValues.length).toFixed(1) : '--';
                  
                  // Trend calculation (compare older half to newer half)
                  // firstHalf = older data, secondHalf = newer data (from most recent)
                  const olderHalf = urgeValues.slice(Math.floor(urgeValues.length / 2));
                  const newerHalf = urgeValues.slice(0, Math.floor(urgeValues.length / 2));
                  const olderAvg = olderHalf.length > 0 ? olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length : 0;
                  const newerAvg = newerHalf.length > 0 ? newerHalf.reduce((a, b) => a + b, 0) / newerHalf.length : 0;
                  const urgeTrend = newerHalf.length > 0 && olderHalf.length > 0 ? (olderAvg > newerAvg ? 'improving' : olderAvg < newerAvg ? 'increasing' : 'stable') : 'stable';
                  
                  return (
                    <>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Engagement Streak */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Current Streak</p>
                                <p className="text-2xl font-bold">{currentStreak} days</p>
                              </div>
                              <Flame className={`h-8 w-8 ${currentStreak >= 7 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Completion Rate */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">14-Day Completion</p>
                                <p className="text-2xl font-bold">{completionRate}%</p>
                              </div>
                              <Target className={`h-8 w-8 ${completionRate >= 70 ? 'text-green-500' : completionRate >= 40 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Average Mood */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Avg Mood (14d)</p>
                                <p className="text-2xl font-bold">{avgMood}/10</p>
                              </div>
                              <TrendingUp className="h-8 w-8 text-primary" />
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Urge Trend */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Avg Urge Level</p>
                                <p className="text-2xl font-bold">{avgUrge}/10</p>
                              </div>
                              {urgeTrend === 'improving' ? (
                                <TrendingDown className="h-8 w-8 text-green-500" />
                              ) : urgeTrend === 'increasing' ? (
                                <TrendingUp className="h-8 w-8 text-red-500" />
                              ) : (
                                <BarChart3 className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Insights Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Client Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {currentStreak >= 7 && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                              <Flame className="h-4 w-4 text-green-600 mt-0.5" />
                              <p className="text-sm text-green-700 dark:text-green-300">
                                Strong engagement with {currentStreak}-day streak. Client is staying consistent with daily practice.
                              </p>
                            </div>
                          )}
                          {currentStreak < 3 && totalCheckins > 0 && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                              <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
                              <p className="text-sm text-amber-700 dark:text-amber-300">
                                Check-in consistency has dropped. Consider reaching out to encourage re-engagement.
                              </p>
                            </div>
                          )}
                          {urgeTrend === 'improving' && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                              <TrendingDown className="h-4 w-4 text-green-600 mt-0.5" />
                              <p className="text-sm text-green-700 dark:text-green-300">
                                Urge levels are trending down. The tools and techniques appear to be helping.
                              </p>
                            </div>
                          )}
                          {urgeTrend === 'increasing' && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                              <TrendingUp className="h-4 w-4 text-red-600 mt-0.5" />
                              <p className="text-sm text-red-700 dark:text-red-300">
                                Urge levels are increasing. Client may benefit from additional support or crisis resources.
                              </p>
                            </div>
                          )}
                          {totalCheckins === 0 && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border">
                              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm text-muted-foreground">
                                No check-in data yet. Client hasn't started tracking their daily progress.
                              </p>
                            </div>
                          )}
                          <div className="pt-2 text-sm text-muted-foreground">
                            <p>Program Progress: {completedWeeks.length}/16 weeks completed ({Math.round((completedWeeks.length / 16) * 100)}%)</p>
                            <p>Total Check-ins: {totalCheckins}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </TabsContent>

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
                        {checkins.slice(0, 30).map((checkin) => {
                          const checkinFeedback = feedback.filter(fb => fb.checkinDateKey === checkin.dateKey);
                          return (
                            <div
                              key={checkin.id}
                              className="rounded-lg border p-4"
                              data-testid={`checkin-${checkin.dateKey}`}
                            >
                              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                <span className="font-medium">{checkin.dateKey}</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {checkin.moodLevel !== null && (
                                    <Badge variant="outline">Mood: {checkin.moodLevel}/10</Badge>
                                  )}
                                  {checkin.urgeLevel !== null && (
                                    <Badge variant="outline">Urge: {checkin.urgeLevel}/10</Badge>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddFeedbackForCheckin(checkin.dateKey)}
                                    data-testid={`button-checkin-feedback-${checkin.dateKey}`}
                                  >
                                    <MessageSquare className="mr-1 h-3 w-3" />
                                    {checkinFeedback.length > 0 ? `Feedback (${checkinFeedback.length})` : "Give Feedback"}
                                  </Button>
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
                              {checkinFeedback.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {checkinFeedback.map(fb => (
                                    <div key={fb.id} className="bg-muted/50 rounded p-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <Badge variant="secondary">Mentor Feedback</Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(fb.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-sm">{fb.content}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
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
                                onClick={() => handleAddFeedbackForWeek(reflection.weekNumber)}
                                data-testid={`button-add-feedback-week-${reflection.weekNumber}`}
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
                      {(feedbackWeek || feedbackCheckinDate) && (
                        <div className="flex items-center gap-2">
                          {feedbackWeek && <Badge variant="secondary">For Week {feedbackWeek}</Badge>}
                          {feedbackCheckinDate && <Badge variant="secondary">For Check-in: {feedbackCheckinDate}</Badge>}
                          <Button variant="ghost" size="sm" onClick={() => { setFeedbackWeek(null); setFeedbackCheckinDate(null); }}>
                            Clear
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={handleGenerateAIDraft}
                          disabled={isGeneratingDraft}
                          data-testid="button-generate-ai-draft"
                        >
                          {isGeneratingDraft ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate AI Draft
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Write your feedback, encouragement, or technique reminders here... or click 'Generate AI Draft' to get a personalized starting point based on this client's progress."
                        value={newFeedback}
                        onChange={(e) => setNewFeedback(e.target.value)}
                        className="min-h-32"
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
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                              <div className="flex items-center gap-2">
                                {fb.weekNumber && <Badge variant="outline">Week {fb.weekNumber}</Badge>}
                                {fb.checkinDateKey && <Badge variant="outline">Check-in: {fb.checkinDateKey}</Badge>}
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

            {reviewWeek && (
              <Card className="border-primary/30 bg-primary/5" data-testid="card-complete-review">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Complete Review - Week {reviewWeek}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Review Notes (optional)
                    </label>
                    <Textarea
                      placeholder="Add any notes about this client's progress for this week..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="min-h-24"
                      data-testid="textarea-review-notes"
                    />
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="outline" onClick={() => setLocation("/therapist")} data-testid="button-cancel-review">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (clientId && reviewWeek) {
                          submitReviewMutation.mutate({
                            clientId,
                            weekNumber: reviewWeek,
                            reviewNotes,
                          });
                        }
                      }}
                      disabled={submitReviewMutation.isPending}
                      data-testid="button-mark-reviewed"
                    >
                      {submitReviewMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                      ) : (
                        "Mark Reviewed"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

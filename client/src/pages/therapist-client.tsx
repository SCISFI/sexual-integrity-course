import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Calendar, CheckCircle2, Clock, FileText, MessageSquare, Send, ListChecks, BarChart3, Flame, TrendingDown, TrendingUp, Target, Sparkles, Loader2, AlertTriangle, ShieldAlert, Eye, CheckSquare, Download, FileBarChart } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getPromptForDate } from "@/data/journal-prompts";
import { WEEK_CONTENT } from "@/data/curriculum";

type RelapseAutopsyData = {
  id: string;
  userId: string;
  date: string;
  lapseOrRelapse: string;
  summary: string | null;
  whenStarted: string | null;
  duration: string | null;
  context: string | null;
  triggers: string | null;
  emotions: string | null;
  thoughts: string | null;
  body: string | null;
  boundariesBroken: string | null;
  warningSigns: string | null;
  decisionPoints: string | null;
  immediateActions: string | null;
  ruleChanges: string | null;
  environmentChanges: string | null;
  supportPlan: string | null;
  next24HoursPlan: string | null;
  status: string;
  completedAt: string | null;
  reviewedByTherapist: boolean | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ItemReview = {
  itemType: string;
  itemKey: string;
  reviewedAt: string | null;
};

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
    editedAt: string | null;
    editedBy: string | null;
  }>;
  exerciseAnswers?: Array<{
    weekNumber: number;
    answers: string;
    updatedAt: string;
  }>;
  relapseAutopsies?: RelapseAutopsyData[];
  itemReviews?: ItemReview[];
  weekReviews?: Array<{ weekNumber: number }>;
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
  const { toast } = useToast();
  const [newFeedback, setNewFeedback] = useState("");
  const [feedbackWeek, setFeedbackWeek] = useState<number | null>(null);
  const [feedbackDateKey, setFeedbackDateKey] = useState<string | null>(null);
  const [feedbackAutopsyId, setFeedbackAutopsyId] = useState<string | null>(null);
  const [feedbackInsightType, setFeedbackInsightType] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("progress");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [expandedAutopsy, setExpandedAutopsy] = useState<string | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/unreviewed-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/pending-reviews'] });
      setNewFeedback("");
      setFeedbackWeek(null);
      setFeedbackDateKey(null);
      setFeedbackAutopsyId(null);
      setFeedbackInsightType(null);
      toast({ title: "Feedback added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add feedback", variant: "destructive" });
    },
  });

  const markReviewedMutation = useMutation({
    mutationFn: async (autopsyId: string) => {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/autopsies/${autopsyId}/review`, {});
      if (!res.ok) throw new Error("Failed to mark as reviewed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/unreviewed-autopsies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/unreviewed-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/pending-reviews'] });
      toast({ title: "Autopsy marked as reviewed" });
    },
    onError: () => {
      toast({ title: "Failed to mark as reviewed", variant: "destructive" });
    },
  });

  const markItemReviewedMutation = useMutation({
    mutationFn: async (data: { itemType: string; itemKey: string }) => {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/review-item`, data);
      if (!res.ok) throw new Error("Failed to mark as reviewed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/unreviewed-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/pending-reviews'] });
      toast({ title: "Marked as reviewed" });
    },
    onError: () => {
      toast({ title: "Failed to mark as reviewed", variant: "destructive" });
    },
  });

  const { data: summariesData } = useQuery<{ summaries: Array<{ weekNumber: number; createdAt: string | null }> }>({
    queryKey: ['/api/therapist/clients', clientId, 'weekly-summaries'],
    queryFn: async () => {
      const res = await fetch(`/api/therapist/clients/${clientId}/weekly-summaries`, { credentials: 'include' });
      if (!res.ok) return { summaries: [] };
      return res.json();
    },
    enabled: !!clientId,
  });

  const existingSummaries = summariesData?.summaries || [];

  const handleGenerateReport = async (weekNum: number) => {
    setGeneratingReport(weekNum);
    try {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/weekly-summary/${weekNum}`, {});
      if (!res.ok) throw new Error("Failed to generate report");
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'weekly-summaries'] });
      toast({ title: `Week ${weekNum} summary generated` });
    } catch (error) {
      toast({ title: "Failed to generate report", variant: "destructive" });
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleDownloadPDF = async (weekNum: number) => {
    try {
      const res = await fetch(`/api/therapist/clients/${clientId}/weekly-summary/${weekNum}/pdf`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `week-${weekNum}-summary.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Failed to download PDF", variant: "destructive" });
    }
  };

  const client = clientsData?.clients?.find(c => c.id === clientId);
  const completedWeeks = progressData?.completedWeeks || [];
  const checkins = progressData?.checkins || [];
  const reflections = progressData?.reflections || [];
  const homeworkCompletions = progressData?.homeworkCompletions || [];
  const feedback = progressData?.feedback || [];
  const exerciseAnswers = progressData?.exerciseAnswers || [];
  const relapseAutopsies = progressData?.relapseAutopsies || [];
  const itemReviews = progressData?.itemReviews || [];
  const weekReviews = progressData?.weekReviews || [];
  const unreviewedAutopsies = relapseAutopsies.filter(a => a.status === "completed" && !a.reviewedByTherapist);
  const reviewedWeekNumbers = new Set(weekReviews.map(r => r.weekNumber));
  const pendingWeekReviewCount = completedWeeks.filter(w => !reviewedWeekNumbers.has(w)).length;

  const isItemReviewed = (itemType: string, itemKey: string) => {
    return itemReviews.some(r => r.itemType === itemType && r.itemKey === itemKey);
  };

  const getUnreviewedCheckinCount = () => {
    let count = 0;
    checkins.forEach(c => { if (!isItemReviewed('checkin', c.dateKey)) count++; });
    return count;
  };

  const getUnreviewedReflectionCount = () => {
    let count = 0;
    reflections.forEach(r => { if (!isItemReviewed('reflection', String(r.weekNumber))) count++; });
    exerciseAnswers.forEach(e => { if (!isItemReviewed('exercise', String(e.weekNumber))) count++; });
    return count;
  };

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
    let feedbackType = 'general';
    let checkinDateKeyValue: string | undefined = undefined;
    if (feedbackAutopsyId) {
      feedbackType = 'autopsy';
      checkinDateKeyValue = feedbackAutopsyId;
    } else if (feedbackInsightType) {
      feedbackType = 'general';
      checkinDateKeyValue = `insight-${feedbackInsightType}`;
    } else if (feedbackDateKey) {
      feedbackType = 'checkin';
      checkinDateKeyValue = feedbackDateKey;
    } else if (feedbackWeek) {
      feedbackType = 'week';
    }
    feedbackMutation.mutate({
      feedbackType,
      content: newFeedback,
      weekNumber: feedbackWeek || undefined,
      checkinDateKey: checkinDateKeyValue,
    });
  };

  const handleGenerateAIDraft = async (dateKey?: string) => {
    if (!clientId) return;
    setIsGeneratingDraft(true);

    let endpoint: string;
    let body: Record<string, any>;

    if (feedbackAutopsyId) {
      endpoint = `/api/therapist/generate-autopsy-feedback`;
      body = { clientId, autopsyId: feedbackAutopsyId };
    } else if (dateKey) {
      endpoint = `/api/therapist/generate-checkin-feedback`;
      body = { clientId, dateKey };
    } else {
      endpoint = `/api/therapist/clients/${clientId}/generate-feedback`;
      body = { clientId, weekNumber: feedbackWeek };
    }

    try {
      const res = await apiRequest("POST", endpoint, body);

      if (!res.ok) throw new Error("Failed to generate draft");
      const data = await res.json();

      if (dateKey) {
        setFeedbackDateKey(dateKey);
        setFeedbackWeek(null);
        setFeedbackAutopsyId(null);
        setActiveTab("feedback");
      }

      setNewFeedback(data.draft);
      toast({ title: feedbackAutopsyId ? "AI draft generated with relapse trend analysis - review before sending" : "AI draft generated - review before sending" });
    } catch (error) {
      toast({ title: "Failed to generate AI draft", variant: "destructive" });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleAddFeedbackForWeek = (weekNumber: number) => {
    setFeedbackWeek(weekNumber);
    setFeedbackDateKey(null);
    setFeedbackAutopsyId(null);
    setFeedbackInsightType(null);
    setActiveTab("feedback");
  };

  const handleAddFeedbackForDate = (dateKey: string) => {
    setFeedbackDateKey(dateKey);
    setFeedbackWeek(null);
    setFeedbackAutopsyId(null);
    setFeedbackInsightType(null);
    setActiveTab("feedback");
  };

  const handleAddFeedbackForAutopsy = (autopsyId: string) => {
    setFeedbackAutopsyId(autopsyId);
    setFeedbackWeek(null);
    setFeedbackDateKey(null);
    setFeedbackInsightType(null);
    setActiveTab("feedback");
  };

  const handleAddFeedbackForInsight = (insightType: string) => {
    setFeedbackInsightType(insightType);
    setFeedbackWeek(null);
    setFeedbackDateKey(null);
    setFeedbackAutopsyId(null);
    setNewFeedback("");
    setActiveTab("feedback");
  };

  const sortedFeedback = [...feedback].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
            {unreviewedAutopsies.length > 0 && (
              <div className="p-4 rounded-lg border-2 border-red-400 bg-red-50 dark:bg-red-950/50 dark:border-red-700 flex items-start gap-3" data-testid="banner-unreviewed-autopsies">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-red-800 dark:text-red-200">
                    Immediate Attention Required
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {client.name} has {unreviewedAutopsies.length} unreviewed relapse {unreviewedAutopsies.length === 1 ? 'autopsy' : 'autopsies'} that need your review.
                    Timely response is critical for recovery.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-2"
                    onClick={() => setActiveTab("autopsies")}
                    data-testid="button-go-to-autopsies"
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Review Now
                  </Button>
                </div>
              </div>
            )}

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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full overflow-x-auto flex-nowrap">
                <TabsTrigger value="analytics" data-testid="tab-analytics" className="flex-1">Analytics</TabsTrigger>
                <TabsTrigger value="progress" data-testid="tab-progress" className="relative flex-1">
                  Progress
                  {pendingWeekReviewCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white" data-testid="badge-pending-week-reviews">
                      {pendingWeekReviewCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="checkins" data-testid="tab-checkins" className="relative flex-1">
                  Check-ins
                  {getUnreviewedCheckinCount() > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white" data-testid="badge-unreviewed-checkins">
                      {getUnreviewedCheckinCount()}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="autopsies" data-testid="tab-autopsies" className="relative flex-1">
                  Autopsies
                  {unreviewedAutopsies.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse" data-testid="badge-unreviewed-autopsies">
                      {unreviewedAutopsies.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reflections" data-testid="tab-reflections" className="relative flex-1">
                  Reflections
                  {getUnreviewedReflectionCount() > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white" data-testid="badge-unreviewed-reflections">
                      {getUnreviewedReflectionCount()}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="feedback" data-testid="tab-feedback" className="flex-1">Feedback</TabsTrigger>
                <TabsTrigger value="reports" data-testid="tab-reports" className="flex-1">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="analytics" className="space-y-4">
                {(() => {
                  const sortedByDateAsc = [...checkins].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
                  const sortedCheckins = [...checkins].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
                  const totalCheckins = sortedCheckins.length;

                  const MIN_ENTRIES = 5;
                  const MCID = 2.0;

                  const oldestCheckinDate = sortedByDateAsc[0]?.dateKey ? new Date(sortedByDateAsc[0].dateKey) : new Date();
                  const programStart = client?.startDate ? new Date(client.startDate) : null;
                  const effectiveStart = programStart && programStart < oldestCheckinDate ? programStart : oldestCheckinDate;
                  const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - effectiveStart.getTime()) / 86400000) + 1);
                  const windowSize = Math.min(14, daysSinceFirst);
                  const windowStart = new Date();
                  windowStart.setDate(windowStart.getDate() - windowSize + 1);
                  const recentDates = new Set(checkins.filter(c => new Date(c.dateKey) >= windowStart).map(c => c.dateKey));
                  const completionRate = Math.round((recentDates.size / windowSize) * 100);

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

                  const moodValues = sortedByDateAsc.filter(c => c.moodLevel !== null).map(c => c.moodLevel!);
                  const urgeValues = sortedByDateAsc.filter(c => c.urgeLevel !== null).map(c => c.urgeLevel!);
                  const avgMood = moodValues.length > 0 ? (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1) : '--';
                  const avgUrge = urgeValues.length > 0 ? (urgeValues.reduce((a, b) => a + b, 0) / urgeValues.length).toFixed(1) : '--';

                  function computeTrendLocal(values: number[]): 'increasing' | 'decreasing' | 'stable' | 'consistently_same' | 'insufficient_data' {
                    if (values.length < MIN_ENTRIES) return 'insufficient_data';
                    if (values.every(v => v === values[0])) return 'consistently_same';
                    const mid = Math.floor(values.length / 2);
                    const firstAvg = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
                    const secondAvg = values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);
                    const diff = secondAvg - firstAvg;
                    if (Math.abs(diff) < MCID) return 'stable';
                    return diff > 0 ? 'increasing' : 'decreasing';
                  }
                  const urgeTrend = computeTrendLocal(urgeValues);

                  const insightItems: Array<{type: string; color: string; icon: any; text: string; show: boolean}> = [
                    { type: 'unreviewed-autopsies', color: 'red', icon: AlertTriangle, text: `${unreviewedAutopsies.length} unreviewed relapse ${unreviewedAutopsies.length === 1 ? 'autopsy' : 'autopsies'} — immediate review recommended.`, show: unreviewedAutopsies.length > 0 },
                    { type: 'strong-streak', color: 'green', icon: Flame, text: `Strong engagement with ${currentStreak}-day streak. Client is staying consistent with daily practice.`, show: currentStreak >= 7 },
                    { type: 'low-streak', color: 'amber', icon: Clock, text: `Check-in consistency has dropped. Consider reaching out to encourage re-engagement.`, show: currentStreak < 3 && totalCheckins > 0 },
                    { type: 'urge-improving', color: 'green', icon: TrendingDown, text: `Urge levels are meaningfully decreasing. The tools and techniques appear to be helping.`, show: urgeTrend === 'decreasing' },
                    { type: 'urge-increasing', color: 'red', icon: TrendingUp, text: `Urge levels are meaningfully increasing. Client may benefit from additional support or crisis resources.`, show: urgeTrend === 'increasing' },
                    { type: 'no-checkins', color: 'muted', icon: Clock, text: `No check-in data yet. Client hasn't started tracking their daily progress.`, show: totalCheckins === 0 },
                  ];
                  const activeInsights = insightItems.filter(i => i.show);

                  return (
                    <>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">{windowSize}-Day Completion</p>
                                <p className="text-2xl font-bold">{completionRate}%</p>
                              </div>
                              <Target className={`h-8 w-8 ${completionRate >= 70 ? 'text-green-500' : completionRate >= 40 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Avg Mood ({Math.min(totalCheckins, 14)}d)</p>
                                <p className="text-2xl font-bold">{avgMood}/10</p>
                              </div>
                              <TrendingUp className="h-8 w-8 text-primary" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Avg Urge Level</p>
                                <p className="text-2xl font-bold">{avgUrge}/10</p>
                              </div>
                              {urgeTrend === 'decreasing' ? (
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

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Client Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {activeInsights.map((insight) => {
                            const IconComp = insight.icon;
                            const insightFeedback = feedback.filter(f => f.feedbackType === 'general' && f.checkinDateKey === `insight-${insight.type}`);
                            const colorMap: Record<string, string> = {
                              red: 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300',
                              green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
                              amber: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
                              muted: 'bg-muted border text-muted-foreground',
                            };
                            const iconColorMap: Record<string, string> = {
                              red: 'text-red-600', green: 'text-green-600', amber: 'text-amber-600', muted: 'text-muted-foreground',
                            };
                            return (
                              <div key={insight.type} className={`p-3 rounded-lg border ${colorMap[insight.color]}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <IconComp className={`h-4 w-4 mt-0.5 ${iconColorMap[insight.color]}`} />
                                    <p className="text-sm font-medium">{insight.text}</p>
                                  </div>
                                  {activeInsights.length > 1 && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      {insightFeedback.length > 0 && (
                                        <Badge variant="outline" className="text-[10px] h-5 border-green-300 text-green-700">
                                          <CheckCircle2 className="h-3 w-3 mr-0.5" /> Feedback
                                        </Badge>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => {
                                          setFeedbackInsightType(insight.type);
                                          setFeedbackWeek(null);
                                          setFeedbackDateKey(null);
                                          setFeedbackAutopsyId(null);
                                          setNewFeedback("");
                                          setActiveTab("feedback");
                                        }}
                                        data-testid={`button-feedback-insight-${insight.type}`}
                                      >
                                        <MessageSquare className="h-3 w-3 mr-1" /> Respond
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {insightFeedback.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-dashed">
                                    {insightFeedback.map(f => (
                                      <div key={f.id} className="text-sm bg-primary/5 p-2 rounded mb-1">
                                        <p>{f.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div className="pt-2 text-sm text-muted-foreground">
                            <p>Program Progress: {completedWeeks.length}/16 weeks completed ({Math.round((completedWeeks.length / 16) * 100)}%)</p>
                            <p>Total Check-ins: {totalCheckins}</p>
                            {relapseAutopsies.filter(a => a.status === "completed").length > 0 && (
                              <p>Relapse/Lapse Reports: {relapseAutopsies.filter(a => a.status === "completed").length}</p>
                            )}
                          </div>
                          <div className="pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/analytics/${clientId}`)}
                              data-testid="button-view-full-analytics"
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Full Analytics Page
                            </Button>
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
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                          {Array.from({ length: 16 }, (_, i) => i + 1).map(weekNum => {
                            const status = getWeekStatus(weekNum);
                            const weekContent = WEEK_CONTENT[weekNum];
                            const hw = homeworkCompletions.find(h => h.weekNumber === weekNum);
                            const totalItems = weekContent?.homeworkChecklist?.length || 0;
                            const completedItems = hw ? (Array.isArray(hw.completedItems) ? hw.completedItems.length : JSON.parse(hw.completedItems as any || '[]').length) : 0;
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
                                {totalItems > 0 && (status === "completed" || status === "available") && (
                                  <span className={`text-[10px] mt-1 ${completedItems === totalItems ? 'text-green-600 dark:text-green-400 font-bold' : 'text-muted-foreground'}`}>
                                    HW: {completedItems}/{totalItems}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {[...checkins].sort((a, b) => b.dateKey.localeCompare(a.dateKey)).slice(0, 30).map((checkin) => {
                          const existingFeedback = feedback.filter(f => f.checkinDateKey === checkin.dateKey);
                          const reviewed = isItemReviewed('checkin', checkin.dateKey);
                          return (
                            <div
                              key={checkin.id}
                              className={`rounded-lg border p-4 bg-card ${!reviewed ? 'border-l-4 border-l-amber-400' : ''}`}
                              data-testid={`checkin-${checkin.dateKey}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg">{checkin.dateKey}</span>
                                  {existingFeedback.length > 0 && (
                                    <Badge variant="outline" className="text-[10px] h-5 border-green-300 text-green-700 dark:text-green-400">
                                      <MessageSquare className="h-3 w-3 mr-0.5" /> Feedback ({existingFeedback.length})
                                    </Badge>
                                  )}
                                  {reviewed ? (
                                    <Badge variant="outline" className="text-[10px] h-5 border-green-300 text-green-700 dark:text-green-400">
                                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Reviewed
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] h-5 border-amber-400 text-amber-600">
                                      Needs Review
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {!reviewed && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => markItemReviewedMutation.mutate({ itemType: 'checkin', itemKey: checkin.dateKey })}
                                      disabled={markItemReviewedMutation.isPending}
                                      data-testid={`button-review-checkin-${checkin.dateKey}`}
                                    >
                                      <CheckSquare className="mr-1.5 h-3.5 w-3.5" /> Mark Reviewed
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => handleAddFeedbackForDate(checkin.dateKey)}
                                    data-testid={`button-feedback-checkin-${checkin.dateKey}`}
                                  >
                                    <MessageSquare className="mr-2 h-3.5 w-3.5" /> Feedback
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => handleGenerateAIDraft(checkin.dateKey)}
                                    disabled={isGeneratingDraft}
                                    data-testid={`button-ai-checkin-${checkin.dateKey}`}
                                  >
                                    {isGeneratingDraft ? (
                                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                                    )}
                                    AI Insight
                                  </Button>
                                </div>
                              </div>
                              <div className="flex gap-4 mb-3">
                                {checkin.moodLevel !== null && (
                                  <Badge variant="outline" className="px-3 py-1">Mood: {checkin.moodLevel}/10</Badge>
                                )}
                                {checkin.urgeLevel !== null && (
                                  <Badge variant={Number(checkin.urgeLevel) > 6 ? "destructive" : "outline"} className="px-3 py-1">
                                    Urge: {checkin.urgeLevel}/10
                                  </Badge>
                                )}
                              </div>
                              {checkin.eveningChecks && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground">Daily Items</p>
                                  <p className="text-sm">{checkin.eveningChecks}</p>
                                </div>
                              )}
                              {checkin.journalEntry && (
                                <div className="mt-3 p-3 bg-muted/30 rounded-md border-l-4 border-primary/20">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    Journal Prompt: <em className="normal-case">{getPromptForDate(checkin.dateKey)}</em>
                                  </p>
                                  <p className="text-sm italic">"{checkin.journalEntry}"</p>
                                </div>
                              )}
                              {existingFeedback.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-dashed">
                                  <p className="text-xs font-bold text-primary mb-2 flex items-center">
                                    <MessageSquare className="h-3 w-3 mr-1" /> Mentor Response:
                                  </p>
                                  {existingFeedback.map(f => (
                                    <div key={f.id} className="text-sm bg-primary/5 p-2 rounded mb-1">
                                      <p>{f.content}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
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

              <TabsContent value="autopsies" className="space-y-4">
                {unreviewedAutopsies.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      {unreviewedAutopsies.length} unreviewed — these require immediate attention.
                    </p>
                  </div>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5" />
                      Relapse Autopsies ({relapseAutopsies.filter(a => a.status === "completed").length} submitted)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {relapseAutopsies.filter(a => a.status === "completed").length === 0 ? (
                      <p className="text-muted-foreground">No relapse autopsies submitted.</p>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {relapseAutopsies
                          .filter(a => a.status === "completed")
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((autopsy) => {
                            const isExpanded = expandedAutopsy === autopsy.id;
                            const isUnreviewed = !autopsy.reviewedByTherapist;
                            const autopsyFeedback = feedback.filter(f => f.checkinDateKey === autopsy.id);
                            return (
                              <div
                                key={autopsy.id}
                                className={`rounded-lg border-2 p-4 ${
                                  isUnreviewed
                                    ? "border-red-400 bg-red-50/50 dark:bg-red-950/30 dark:border-red-700"
                                    : "border-green-300 bg-card dark:border-green-700"
                                }`}
                                data-testid={`autopsy-${autopsy.id}`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-lg">{autopsy.date}</span>
                                    <Badge variant={autopsy.lapseOrRelapse === "relapse" ? "destructive" : "secondary"}>
                                      {autopsy.lapseOrRelapse === "relapse" ? "Relapse" : "Lapse"}
                                    </Badge>
                                    {isUnreviewed ? (
                                      <Badge variant="destructive" className="animate-pulse">Needs Review</Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-green-300 text-green-700 dark:text-green-400">
                                        <CheckCircle2 className="mr-1 h-3 w-3" /> Reviewed
                                      </Badge>
                                    )}
                                    {autopsyFeedback.length > 0 && (
                                      <Badge variant="outline" className="text-[10px] h-5 border-green-300 text-green-700 dark:text-green-400">
                                        <MessageSquare className="h-3 w-3 mr-0.5" /> Feedback ({autopsyFeedback.length})
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    {isUnreviewed && (
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => markReviewedMutation.mutate(autopsy.id)}
                                        disabled={markReviewedMutation.isPending}
                                        data-testid={`button-mark-reviewed-${autopsy.id}`}
                                      >
                                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                                        {markReviewedMutation.isPending ? "..." : "Mark Reviewed"}
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => handleAddFeedbackForAutopsy(autopsy.id)}
                                      data-testid={`button-feedback-autopsy-${autopsy.id}`}
                                    >
                                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Feedback
                                    </Button>
                                  </div>
                                </div>

                                {autopsy.summary && (
                                  <p className="text-sm mb-3">{autopsy.summary}</p>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedAutopsy(isExpanded ? null : autopsy.id)}
                                  className="mb-2"
                                  data-testid={`button-expand-autopsy-${autopsy.id}`}
                                >
                                  {isExpanded ? "Hide Details" : "Show Full Details"}
                                </Button>

                                {isExpanded && (
                                  <div className="space-y-3 mt-2 p-3 bg-muted/30 rounded-md">
                                    {[
                                      { label: "When it started", value: autopsy.whenStarted },
                                      { label: "Duration", value: autopsy.duration },
                                      { label: "Context / Situation", value: autopsy.context },
                                      { label: "Triggers", value: autopsy.triggers },
                                      { label: "Emotions felt", value: autopsy.emotions },
                                      { label: "Thoughts at the time", value: autopsy.thoughts },
                                      { label: "Physical sensations", value: autopsy.body },
                                      { label: "Boundaries broken", value: autopsy.boundariesBroken },
                                      { label: "Warning signs missed", value: autopsy.warningSigns },
                                      { label: "Decision points", value: autopsy.decisionPoints },
                                      { label: "Immediate actions planned", value: autopsy.immediateActions },
                                      { label: "Rule changes", value: autopsy.ruleChanges },
                                      { label: "Environment changes", value: autopsy.environmentChanges },
                                      { label: "Support plan", value: autopsy.supportPlan },
                                      { label: "Next 24 hours plan", value: autopsy.next24HoursPlan },
                                    ].filter(item => item.value).map((item, idx) => (
                                      <div key={idx}>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                                        <p className="text-sm mt-0.5">{item.value}</p>
                                      </div>
                                    ))}
                                    {autopsy.completedAt && (
                                      <p className="text-xs text-muted-foreground pt-2">
                                        Submitted: {new Date(autopsy.completedAt).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {autopsyFeedback.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-dashed">
                                    <p className="text-xs font-bold text-primary mb-2 flex items-center">
                                      <MessageSquare className="h-3 w-3 mr-1" /> Mentor Response:
                                    </p>
                                    {autopsyFeedback.map(f => (
                                      <div key={f.id} className="text-sm bg-primary/5 p-2 rounded mb-1">
                                        <p>{f.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
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
                      Week Reflections & Exercises
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reflections.length === 0 && exerciseAnswers.length === 0 ? (
                      <p className="text-muted-foreground">No reflections or exercises recorded yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {[...reflections].sort((a, b) => b.weekNumber - a.weekNumber).map((reflection) => {
                          const weekFeedback = feedback.filter(f => f.feedbackType === 'week' && f.weekNumber === reflection.weekNumber);
                          const reviewed = isItemReviewed('reflection', String(reflection.weekNumber));
                          const weekExercise = exerciseAnswers.find(e => e.weekNumber === reflection.weekNumber);
                          const exerciseReviewed = isItemReviewed('exercise', String(reflection.weekNumber));
                          let parsedAnswers: Record<string, string> = {};
                          try { parsedAnswers = weekExercise ? JSON.parse(weekExercise.answers) : {}; } catch {}
                          const answerEntries = Object.entries(parsedAnswers).filter(([, v]) => v && String(v).trim());

                          return (
                            <div
                              key={reflection.weekNumber}
                              className={`rounded-lg border p-4 ${!reviewed ? 'border-l-4 border-l-amber-400' : ''}`}
                              data-testid={`reflection-week-${reflection.weekNumber}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">Week {reflection.weekNumber}</h4>
                                  {reviewed ? (
                                    <Badge variant="outline" className="text-[10px] h-5 border-green-300 text-green-700 dark:text-green-400">
                                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Reviewed
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] h-5 border-amber-400 text-amber-600">
                                      Needs Review
                                    </Badge>
                                  )}
                                  {weekFeedback.length > 0 && (
                                    <Badge variant="outline" className="text-[10px] h-5 border-green-300 text-green-700 dark:text-green-400">
                                      <MessageSquare className="h-3 w-3 mr-0.5" /> Feedback ({weekFeedback.length})
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {!reviewed && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => markItemReviewedMutation.mutate({ itemType: 'reflection', itemKey: String(reflection.weekNumber) })}
                                      disabled={markItemReviewedMutation.isPending}
                                      data-testid={`button-review-reflection-${reflection.weekNumber}`}
                                    >
                                      <CheckSquare className="mr-1.5 h-3.5 w-3.5" /> Mark Reviewed
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddFeedbackForWeek(reflection.weekNumber)}
                                    data-testid={`button-add-feedback-week-${reflection.weekNumber}`}
                                  >
                                    <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Add Feedback
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-3">
                                {(() => {
                                  const weekData = WEEK_CONTENT[reflection.weekNumber];
                                  const rqs = weekData?.reflectionQuestions || [];
                                  const defaultLabels = ["Key insight from this week", "What went well", "Challenges faced", "Goals for next week"];
                                  return [reflection.q1, reflection.q2, reflection.q3, reflection.q4].map((answer, idx) => {
                                    if (!answer) return null;
                                    const label = rqs[idx]?.question || defaultLabels[idx];
                                    return (
                                      <div key={idx}>
                                        <p className="text-xs text-muted-foreground">{label}</p>
                                        <p className="text-sm bg-muted/50 p-2 rounded">{answer}</p>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>

                              {answerEntries.length > 0 && (
                                <div className="mt-4 pt-3 border-t">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Exercise Answers</p>
                                    {!exerciseReviewed && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => markItemReviewedMutation.mutate({ itemType: 'exercise', itemKey: String(reflection.weekNumber) })}
                                        disabled={markItemReviewedMutation.isPending}
                                        data-testid={`button-review-exercise-${reflection.weekNumber}`}
                                      >
                                        <CheckSquare className="mr-1 h-3 w-3" /> Mark Exercises Reviewed
                                      </Button>
                                    )}
                                    {exerciseReviewed && (
                                      <Badge variant="outline" className="text-[10px] h-5 border-green-300 text-green-700 dark:text-green-400">
                                        <CheckCircle2 className="h-3 w-3 mr-0.5" /> Exercises Reviewed
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    {answerEntries.map(([key, value]) => {
                                      const weekData = WEEK_CONTENT[reflection.weekNumber];
                                      let fieldLabel = key.replace(/-/g, ' ');
                                      if (weekData?.exercises) {
                                        for (const ex of weekData.exercises) {
                                          for (const f of ex.fields) {
                                            if (`${ex.id}-${f.id}` === key) {
                                              fieldLabel = f.label;
                                              break;
                                            }
                                          }
                                        }
                                      }
                                      return (
                                        <div key={key}>
                                          <p className="text-xs text-muted-foreground">{fieldLabel}</p>
                                          <p className="text-sm bg-muted/50 p-2 rounded">{value}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {weekFeedback.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-dashed">
                                  <p className="text-xs font-bold text-primary mb-2 flex items-center">
                                    <MessageSquare className="h-3 w-3 mr-1" /> Mentor Response:
                                  </p>
                                  {weekFeedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(f => (
                                    <div key={f.id} className="text-sm bg-primary/5 p-2 rounded mb-1">
                                      <p>{f.content}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
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
                      {(feedbackWeek || feedbackDateKey || feedbackAutopsyId || feedbackInsightType) && (
                        <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded-md">
                          <Badge variant="secondary">
                            Target: {feedbackAutopsyId ? `Relapse Autopsy` : feedbackInsightType ? `Insight: ${feedbackInsightType.replace(/-/g, ' ')}` : feedbackDateKey ? `Check-in ${feedbackDateKey}` : `Week ${feedbackWeek}`}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-6" onClick={() => { setFeedbackWeek(null); setFeedbackDateKey(null); setFeedbackAutopsyId(null); setFeedbackInsightType(null); }}>
                            Clear
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleGenerateAIDraft()}
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
                        placeholder="Write your feedback, encouragement, or technique reminders here... or click 'Generate AI Draft' for a personalized starting point."
                        value={newFeedback}
                        onChange={(e) => setNewFeedback(e.target.value)}
                        className="min-h-32"
                        data-testid="input-feedback"
                      />
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={!newFeedback.trim() || feedbackMutation.isPending}
                        className="w-full"
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
                        {sortedFeedback.map((fb) => (
                          <div
                            key={fb.id}
                            className="rounded-lg border p-4"
                            data-testid={`feedback-${fb.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {fb.weekNumber && <Badge variant="outline">Week {fb.weekNumber}</Badge>}
                                {fb.checkinDateKey && !fb.checkinDateKey.startsWith('insight-') && <Badge variant="outline">Check-in {fb.checkinDateKey}</Badge>}
                                {fb.checkinDateKey?.startsWith('insight-') && <Badge variant="outline">Insight</Badge>}
                                <Badge variant="secondary">{fb.feedbackType}</Badge>
                                {fb.editedAt && (
                                  <span className="text-[10px] text-muted-foreground italic">
                                    Edited by Admin &middot; {new Date(fb.editedAt).toLocaleDateString()}
                                  </span>
                                )}
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

              <TabsContent value="reports" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileBarChart className="h-5 w-5" />
                      Weekly Summary Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate AI-powered weekly summary reports with progress data, mood/urge trends, and personalized observations. Download as PDF.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Array.from({ length: 16 }, (_, i) => i + 1).map(weekNum => {
                        const isCompleted = completedWeeks.includes(weekNum);
                        const existingSummary = existingSummaries.find(s => s.weekNumber === weekNum);
                        const isGenerating = generatingReport === weekNum;
                        const weekTitle = WEEK_CONTENT[weekNum]?.title || `Week ${weekNum}`;

                        return (
                          <div
                            key={weekNum}
                            className={`rounded-lg border p-4 ${isCompleted ? 'bg-card' : 'bg-muted/30 opacity-60'}`}
                            data-testid={`report-week-${weekNum}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-semibold text-sm">Week {weekNum}</span>
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{weekTitle}</p>
                              </div>
                              {existingSummary && (
                                <Badge variant="outline" className="text-[10px] h-5 border-green-300 text-green-700 dark:text-green-400">
                                  <CheckCircle2 className="h-3 w-3 mr-0.5" /> Ready
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant={existingSummary ? "outline" : "default"}
                                onClick={() => handleGenerateReport(weekNum)}
                                disabled={!isCompleted || isGenerating}
                                className="text-xs flex-1"
                                data-testid={`button-generate-report-${weekNum}`}
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="mr-1 h-3 w-3" />
                                    {existingSummary ? "Regenerate" : "Generate"}
                                  </>
                                )}
                              </Button>
                              {existingSummary && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadPDF(weekNum)}
                                  className="text-xs"
                                  data-testid={`button-download-pdf-${weekNum}`}
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  PDF
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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

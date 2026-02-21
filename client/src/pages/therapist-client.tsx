import { useState, useEffect } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Calendar, CheckCircle2, Clock, FileText, MessageSquare, Send, ListChecks, BarChart3, Flame, TrendingDown, TrendingUp, Target, Sparkles, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getPromptForDate } from "@/data/journal-prompts";

type RelapseAutopsyItem = {
  id: string;
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
  createdAt: string;
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
  }>;
  relapseAutopsies?: RelapseAutopsyItem[];
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
  const [feedbackAutopsyId, setFeedbackAutopsyId] = useState<string | null>(null); // Added for contextual feedback
  const [activeTab, setActiveTab] = useState("progress");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const searchParams = new URLSearchParams(searchString);
  const reviewWeek = searchParams.get('reviewWeek') ? parseInt(searchParams.get('reviewWeek')!) : null;
  const tabParam = searchParams.get('tab');

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
      setFeedbackAutopsyId(null);
      toast({ title: "Feedback added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add feedback", variant: "destructive" });
    },
  });

  const handleGenerateAIDraft = async () => {
    if (!clientId) return;
    setIsGeneratingDraft(true);
    try {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/generate-feedback`, {
        weekNumber: feedbackWeek || undefined,
        checkinDateKey: feedbackCheckinDate || undefined,
        relapseAutopsyId: feedbackAutopsyId || undefined,
      });
      if (!res.ok) throw new Error("Failed to generate draft");
      const data = await res.json();
      setNewFeedback(data.draft);
      toast({ title: "AI draft generated based on specific focus" });
    } catch (error) {
      toast({ title: "Failed to generate AI draft", variant: "destructive" });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleAddFeedbackForWeek = (weekNumber: number) => {
    setFeedbackWeek(weekNumber);
    setFeedbackCheckinDate(null);
    setFeedbackAutopsyId(null);
    setActiveTab("feedback");
  };

  const handleAddFeedbackForCheckin = (dateKey: string) => {
    setFeedbackCheckinDate(dateKey);
    setFeedbackWeek(null);
    setFeedbackAutopsyId(null);
    setActiveTab("feedback");
  };

  const handleAddFeedbackForAutopsy = (autopsyId: string) => {
    setFeedbackAutopsyId(autopsyId);
    setFeedbackCheckinDate(null);
    setFeedbackWeek(null);
    setActiveTab("feedback");
  };

  const client = clientsData?.clients?.find(c => c.id === clientId);
  const checkins = progressData?.checkins || [];
  const feedback = progressData?.feedback || [];
  const clientRelapseAutopsies = progressData?.relapseAutopsies || [];

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/therapist")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>

        {client && (
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
                    <p className="font-medium">{client.startDate ? new Date(client.startDate).toLocaleDateString() : "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full flex-wrap gap-1">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="checkins">Check-ins</TabsTrigger>
                <TabsTrigger value="autopsies">Autopsies</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>

              <TabsContent value="autopsies" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Relapse Autopsies</CardTitle></CardHeader>
                  <CardContent>
                    {clientRelapseAutopsies.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No submissions.</p>
                    ) : (
                      <div className="space-y-4">
                        {clientRelapseAutopsies.map((autopsy) => (
                          <div key={autopsy.id} className="rounded-lg border p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{autopsy.date}</span>
                                <Badge variant={autopsy.lapseOrRelapse === "relapse" ? "destructive" : "secondary"}>
                                  {autopsy.lapseOrRelapse}
                                </Badge>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handleAddFeedbackForAutopsy(autopsy.id)}>
                                Give Specific Feedback
                              </Button>
                            </div>
                            <p className="text-sm"><strong>Prevention Plan:</strong> {autopsy.preventionPlan}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="feedback" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Compose Feedback</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      {feedbackAutopsyId && <Badge variant="destructive">Focus: Relapse Autopsy</Badge>}
                      {feedbackCheckinDate && <Badge variant="secondary">Focus: Check-in {feedbackCheckinDate}</Badge>}
                      {feedbackWeek && <Badge variant="outline">Focus: Week {feedbackWeek}</Badge>}
                      {(feedbackAutopsyId || feedbackCheckinDate || feedbackWeek) && (
                        <Button variant="ghost" size="sm" onClick={() => { setFeedbackAutopsyId(null); setFeedbackCheckinDate(null); setFeedbackWeek(null); }}>
                          Clear Focus
                        </Button>
                      )}
                    </div>
                    <Button variant="outline" onClick={handleGenerateAIDraft} disabled={isGeneratingDraft}>
                      {isGeneratingDraft ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Generate Contextual AI Draft
                    </Button>
                    <Textarea 
                      placeholder="Write feedback here..." 
                      value={newFeedback} 
                      onChange={(e) => setNewFeedback(e.target.value)}
                      className="min-h-32" 
                    />
                    <Button onClick={() => feedbackMutation.mutate({ feedbackType: 'general', content: newFeedback })}>
                      Send to Client
                    </Button>
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
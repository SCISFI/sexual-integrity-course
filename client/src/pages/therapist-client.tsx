import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Calendar, CheckCircle2, Clock, FileText, MessageSquare, Send, BarChart3, Flame, TrendingDown, TrendingUp, Target, Sparkles, Loader2, AlertTriangle, ShieldAlert, Eye, CheckSquare, Download, FileBarChart, Lightbulb, ChevronRight, Mail, RefreshCw, PenSquare, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getPromptForDate } from "@/data/journal-prompts";
import { WEEK_CONTENT } from "@/data/curriculum";

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

type ParentInfoData = {
  parent: { id: string; name: string | null; email: string } | null;
  messages: Array<{ id: string; content: string; sentBy: string; createdAt: string; readAt: string | null }>;
} | undefined;

function ParentSection({ clientId, parentData, onMessageSent }: { clientId: string; parentData: ParentInfoData; onMessageSent: () => void }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  if (!parentData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-amber-500" />
            Parent / Guardian
            <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">Teen</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No parent account linked yet. The consent email may still be pending.</p>
        </CardContent>
      </Card>
    );
  }

  async function sendMessage() {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await apiRequest("POST", `/api/therapist/clients/${clientId}/parent-message`, { content: draft.trim() });
      setDraft("");
      onMessageSent();
      toast({ title: "Message sent to parent" });
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4 text-amber-500" />
          Parent / Guardian
          <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">Teen Program</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {parentData.parent ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 border px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-300">
              {(parentData.parent.name || parentData.parent.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{parentData.parent.name || "(No name)"}</p>
              <p className="text-xs text-muted-foreground">{parentData.parent.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Consent approved but parent account not yet fully set up.</p>
        )}

        {(parentData.messages?.length ?? 0) > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(parentData.messages ?? []).map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.sentBy === "mentor"
                    ? "bg-primary/10 border ml-4"
                    : "bg-muted/50 border mr-4"
                }`}
                data-testid={`parent-msg-${msg.id}`}
              >
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {msg.sentBy === "mentor" ? "You" : "Parent"}
                </p>
                <p>{msg.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Send a message to the parent…"
            className="flex-1 min-h-[70px] resize-none text-sm"
            data-testid="input-parent-message"
          />
          <Button
            size="sm"
            className="self-end"
            disabled={!draft.trim() || sending}
            onClick={sendMessage}
            data-testid="button-send-parent-message"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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
  const validTabs = ["analytics", "progress", "checkins", "autopsies", "guidance", "reports"];
  const initialTab = (() => {
    const t = new URLSearchParams(window.location.search).get("tab") || "";
    return validTabs.includes(t) ? t : "progress";
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [expandedAutopsy, setExpandedAutopsy] = useState<string | null>(null);
  const [activeFeedbackTarget, setActiveFeedbackTarget] = useState<{ type: string; key: string } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const [sentSuggestionIds, setSentSuggestionIds] = useState<Set<string>>(new Set());
  const [draftedSuggestionIds, setDraftedSuggestionIds] = useState<Set<string>>(new Set());

  // Sheet compose panel state — single compose UI for ALL message contexts
  type SheetCtx =
    | { kind: 'week'; weekNumber: number }
    | { kind: 'autopsy'; autopsyId: string }
    | { kind: 'general' }
    | { kind: 'guidance'; suggestion: { id: string; title: string; detail: string; action: string } }
    | { kind: 'draft'; feedbackId: string }
    | null;
  const [sheetCtx, setSheetCtx] = useState<SheetCtx>(() => {
    const saved = localStorage.getItem(`sheet_ctx_${clientId}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [sheetSubject, setSheetSubject] = useState(() => {
    return localStorage.getItem(`sheet_subject_${clientId}`) || "";
  });
  const [sheetMessage, setSheetMessage] = useState(() => {
    return localStorage.getItem(`sheet_message_${clientId}`) || "";
  });

  // Persist sheet state
  useEffect(() => {
    if (!clientId) return;
    if (sheetCtx) localStorage.setItem(`sheet_ctx_${clientId}`, JSON.stringify(sheetCtx));
    else localStorage.removeItem(`sheet_ctx_${clientId}`);
  }, [sheetCtx, clientId]);

  useEffect(() => {
    if (clientId) localStorage.setItem(`sheet_subject_${clientId}`, sheetSubject);
  }, [sheetSubject, clientId]);

  useEffect(() => {
    if (clientId) localStorage.setItem(`sheet_message_${clientId}`, sheetMessage);
  }, [sheetMessage, clientId]);

  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetSending, setSheetSending] = useState(false);
  const [sheetSaving, setSheetSaving] = useState(false);
  const [sheetFailed, setSheetFailed] = useState(false);
  const [messagedWeekNums, setMessagedWeekNums] = useState<Set<number>>(new Set());
  const [messagedAutopsyIds, setMessagedAutopsyIds] = useState<Set<string>>(new Set());

  const { data: clientsData } = useQuery<{ clients: ClientInfo[] }>({
    queryKey: ['/api/therapist/clients'],
  });

  const clientMeta = clientsData?.clients.find(c => c.id === clientId);
  const isAdolescent = (clientMeta as any)?.programType === "adolescent";

  type ParentInfo = {
    parent: { id: string; name: string | null; email: string } | null;
    messages: Array<{ id: string; content: string; sentBy: string; createdAt: string; readAt: string | null }>;
  };
  const { data: parentData, refetch: refetchParent } = useQuery<ParentInfo>({
    queryKey: ['/api/therapist/clients', clientId, 'parent-info'],
    enabled: !!clientId && isAdolescent,
  });

  const { data: progressData, isLoading: loadingProgress } = useQuery<ClientProgress>({
    queryKey: ['/api/therapist/clients', clientId, 'progress'],
    enabled: !!clientId,
  });

  type MentorSuggestion = { id: string; priority: "urgent" | "followup" | "curriculum" | "recognition"; title: string; detail: string; action: string };
  const { data: suggestionsData, isLoading: loadingSuggestions } = useQuery<{ suggestions: MentorSuggestion[] }>({
    queryKey: ['/api/therapist/clients', clientId, 'suggestions'],
    enabled: !!clientId,
    staleTime: 60000,
  });

  const { data: unreviewedAutopsiesData } = useQuery<{ unreviewedCounts: Record<string, number> }>({
    queryKey: ["/api/therapist/unreviewed-autopsies"],
  });

  const { data: unreviewedItemsData } = useQuery<{ unreviewedItemCounts: Record<string, number> }>({
    queryKey: ["/api/therapist/unreviewed-items"],
  });

  const { data: pendingReviewsData } = useQuery<{ pendingReviews: Array<{ clientId: string; weekNumber: number }> }>({
    queryKey: ["/api/therapist/pending-reviews"],
  });

  const { data: urgentSuggestionData } = useQuery<{ urgentCounts: Record<string, number> }>({
    queryKey: ["/api/therapist/urgent-suggestion-counts"],
  });

  const urgentCount = urgentSuggestionData?.urgentCounts?.[clientId as string] ?? 0;
  const autopsyCount = unreviewedAutopsiesData?.unreviewedCounts?.[clientId as string] || 0;
  const unreviewedItemCount = unreviewedItemsData?.unreviewedItemCounts?.[clientId as string] || 0;
  const pendingWeekReviewCount = pendingReviewsData?.pendingReviews?.filter(r => r.clientId === clientId).length || 0;
  const reviewCount = unreviewedItemCount + pendingWeekReviewCount;

  const isNeedsAttention = urgentCount > 0 || autopsyCount > 0 || reviewCount > 0;


  


  
  const feedbackMutation = useMutation({
    mutationFn: async (data: { feedbackType: string; content: string; weekNumber?: number; checkinDateKey?: string; status?: string; subject?: string }) => {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/feedback`, data);
      if (!res.ok) throw new Error("Failed to add message");
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
      setActiveFeedbackTarget(null);
      toast({ title: "Message sent" });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const openGuidanceSheet = useCallback(async (suggestion: { id: string; title: string; detail: string; action: string }) => {
    setSheetCtx({ kind: 'guidance', suggestion });
    setSheetSubject("");
    setSheetMessage("");
    setSheetLoading(true);
    setSheetFailed(false);
    try {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/generate-guidance-message`, {
        suggestionId: suggestion.id,
        suggestionTitle: suggestion.title,
        suggestionDetail: suggestion.detail
      });
      if (res.ok) {
        const data = await res.json();
        setSheetSubject(data.subject || "");
        setSheetMessage(data.draftText || "");
      } else {
        setSheetFailed(true);
      }
    } catch (err) {
      setSheetFailed(true);
    } finally {
      setSheetLoading(false);
    }
  }, [clientId]);

  const nudgeTriggeredRef = useRef(false);
  useEffect(() => {
    if (nudgeTriggeredRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") !== "nudge") return;
    if (params.get("tab") !== "guidance") return;
    // suggestionsData may still be loading — wait until it's available
    const fallbackSuggestion = {
      id: "curriculum-behind",
      title: "Behind on Curriculum Pace",
      detail: "Client is behind their expected weekly curriculum pace.",
      action: "behind-pace-nudge",
    };
    const behindSuggestion = suggestionsData?.suggestions?.find((s: any) => s.id === "curriculum-behind") ?? fallbackSuggestion;
    nudgeTriggeredRef.current = true;
    openGuidanceSheet(behindSuggestion);
    params.delete("action");
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", newUrl);
  }, [suggestionsData, openGuidanceSheet]);
  

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

  const submitWeekReviewMutation = useMutation({
    mutationFn: async (weekNumber: number) => {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/review/${weekNumber}`, { reviewNotes: "" });
      if (!res.ok) throw new Error("Failed to submit week review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/unreviewed-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/pending-reviews'] });
      toast({ title: "Week reviewed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to submit week review", variant: "destructive" });
    },
  });

  // Draft messages query
  const { data: draftsData, refetch: refetchDrafts } = useQuery<{ drafts: Array<{ id: string; subject: string | null; content: string; createdAt: string }> }>({
    queryKey: ['/api/therapist/clients', clientId, 'messages', 'drafts'],
    enabled: !!clientId,
    staleTime: 30000,
  });

  const dismissSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/dismiss-suggestion`, { suggestionId });
      if (!res.ok) throw new Error("Failed to dismiss suggestion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/urgent-suggestion-counts'] });
    },
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async (data: { feedbackId: string; content: string; subject: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/therapist/clients/${clientId}/feedback/${data.feedbackId}`, {
        content: data.content,
        subject: data.subject,
        status: data.status,
      });
      if (!res.ok) throw new Error("Failed to update message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'messages', 'drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'progress'] });
    },
  });

  // ── Sheet compose handlers (all contexts) ──────────────────────────────
  const closeSheet = () => {
    setSheetCtx(null);
    setSheetSubject("");
    setSheetMessage("");
    setSheetFailed(false);
  };

  const openWeekSheet = async (weekNumber: number) => {
    setSheetCtx({ kind: 'week', weekNumber });
    setSheetSubject(`Week ${weekNumber} — A Personal Note`);
    setSheetMessage("");
    setSheetFailed(false);
    setSheetLoading(true);
    try {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/generate-feedback`, { weekNumber });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setSheetMessage(data.draft || "");
    } catch {
      setSheetFailed(true);
    } finally {
      setSheetLoading(false);
    }
  };

  const openAutopsySheet = async (autopsyId: string) => {
    setSheetCtx({ kind: 'autopsy', autopsyId });
    setSheetSubject("Your Relapse Report — A Personal Note");
    setSheetMessage("");
    setSheetFailed(false);
    setSheetLoading(true);
    try {
      const res = await apiRequest("POST", `/api/therapist/generate-autopsy-feedback`, { clientId, autopsyId });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setSheetMessage(data.draft || "");
    } catch {
      setSheetFailed(true);
    } finally {
      setSheetLoading(false);
    }
  };

  const openGeneralSheet = () => {
    setSheetCtx({ kind: 'general' });
    setSheetSubject("");
    setSheetMessage("");
    setSheetFailed(false);
    setSheetLoading(false);
  };


  const openDraftSheet = (draft: { id: string; subject: string | null; content: string }) => {
    setSheetCtx({ kind: 'draft', feedbackId: draft.id });
    setSheetSubject(draft.subject || "");
    setSheetMessage(draft.content);
    setSheetFailed(false);
    setSheetLoading(false);
  };

  const handleSheetSend = async () => {
    if (!sheetMessage.trim() || !sheetCtx) return;
    setSheetSending(true);
    try {
      if (sheetCtx.kind === 'draft') {
        const res = await apiRequest("PUT", `/api/therapist/clients/${clientId}/feedback/${sheetCtx.feedbackId}`, {
          content: sheetMessage, subject: sheetSubject, status: "sent",
        });
        if (!res.ok) throw new Error("Failed to send");
        queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'messages', 'drafts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'progress'] });
      } else {
        let feedbackType = 'general';
        let weekNumber: number | undefined;
        let checkinDateKey: string | undefined;
        if (sheetCtx.kind === 'week') { feedbackType = 'week'; weekNumber = sheetCtx.weekNumber; }
        else if (sheetCtx.kind === 'autopsy') { feedbackType = 'autopsy'; checkinDateKey = sheetCtx.autopsyId; }
        else if (sheetCtx.kind === 'guidance') { feedbackType = 'guidance'; }

        const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/feedback`, {
          feedbackType, content: sheetMessage, subject: sheetSubject, status: 'sent',
          weekNumber, checkinDateKey,
        });
        if (!res.ok) throw new Error("Failed to send");

        if (sheetCtx.kind === 'week') {
          await apiRequest("POST", `/api/therapist/clients/${clientId}/review/${sheetCtx.weekNumber}`, { reviewNotes: "" });
          setMessagedWeekNums(prev => new Set(prev).add((sheetCtx as { kind: 'week'; weekNumber: number }).weekNumber));
        } else if (sheetCtx.kind === 'autopsy') {
          await apiRequest("POST", `/api/therapist/clients/${clientId}/autopsies/${sheetCtx.autopsyId}/review`, {});
          setMessagedAutopsyIds(prev => new Set(prev).add((sheetCtx as { kind: 'autopsy'; autopsyId: string }).autopsyId));
        } else if (sheetCtx.kind === 'guidance') {
          const sid = sheetCtx.suggestion.id;
          setSentSuggestionIds(prev => new Set(prev).add(sid));
          await apiRequest("POST", `/api/therapist/clients/${clientId}/dismiss-suggestion`, { suggestionId: sid });
          queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'suggestions'] });
          queryClient.invalidateQueries({ queryKey: ['/api/therapist/urgent-suggestion-counts'] });
        }

        queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'progress'] });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/therapist/unreviewed-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/unreviewed-autopsies'] });

      toast({ title: `Message sent to ${client?.name || "client"}` });
      closeSheet();
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setSheetSending(false);
    }
  };

  const handleSheetSaveDraft = async () => {
    if (!sheetMessage.trim() || !sheetCtx) return;
    setSheetSaving(true);
    try {
      if (sheetCtx.kind === 'draft') {
        const res = await apiRequest("PUT", `/api/therapist/clients/${clientId}/feedback/${sheetCtx.feedbackId}`, {
          content: sheetMessage, subject: sheetSubject, status: "draft",
        });
        if (!res.ok) throw new Error("Failed to update draft");
      } else {
        let feedbackType = 'general';
        let weekNumber: number | undefined;
        if (sheetCtx.kind === 'week') { feedbackType = 'week'; weekNumber = sheetCtx.weekNumber; }
        else if (sheetCtx.kind === 'autopsy') { feedbackType = 'autopsy'; }
        else if (sheetCtx.kind === 'guidance') { feedbackType = 'guidance'; }

        await apiRequest("POST", `/api/therapist/clients/${clientId}/feedback`, {
          feedbackType, content: sheetMessage, subject: sheetSubject, status: 'draft', weekNumber,
        });

        if (sheetCtx.kind === 'guidance') {
          setDraftedSuggestionIds(prev => new Set(prev).add(sheetCtx.suggestion.id));
        }
      }
      queryClient.invalidateQueries({ queryKey: ['/api/therapist/clients', clientId, 'messages', 'drafts'] });
      toast({ title: "Draft saved — find it at the top of the Guidance tab" });
      closeSheet();
    } catch {
      toast({ title: "Failed to save draft", variant: "destructive" });
    } finally {
      setSheetSaving(false);
    }
  };

  const handleSheetRegenerateDraft = async () => {
    if (!sheetCtx) return;
    setSheetLoading(true);
    setSheetFailed(false);
    try {
      if (sheetCtx.kind === 'week') {
        const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/generate-feedback`, { weekNumber: sheetCtx.weekNumber });
        if (!res.ok) throw new Error("Generation failed");
        const data = await res.json();
        setSheetMessage(data.draft || "");
      } else if (sheetCtx.kind === 'autopsy') {
        const res = await apiRequest("POST", `/api/therapist/generate-autopsy-feedback`, { clientId, autopsyId: sheetCtx.autopsyId });
        if (!res.ok) throw new Error("Generation failed");
        const data = await res.json();
        setSheetMessage(data.draft || "");
      } else if (sheetCtx.kind === 'guidance') {
        const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/generate-guidance-message`, {
          suggestionId: sheetCtx.suggestion.id,
          suggestionTitle: sheetCtx.suggestion.title,
          suggestionDetail: sheetCtx.suggestion.detail,
          suggestionAction: sheetCtx.suggestion.action,
        });
        if (!res.ok) throw new Error("Generation failed");
        const data = await res.json();
        setSheetMessage(data.draftText || "");
      }
    } catch {
      setSheetFailed(true);
    } finally {
      setSheetLoading(false);
    }
  };

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

  const isItemReviewed = (itemType: string, itemKey: string) => {
    return itemReviews.some(r => r.itemType === itemType && r.itemKey === itemKey);
  };

  // A week is fully reviewed if there's a week-level review record OR
  // all of its submitted content items (reflection + exercise) are individually reviewed.
  // This handles cases where items were reviewed through different paths.
  const isWeekFullyReviewed = (weekNum: number) => {
    if (reviewedWeekNumbers.has(weekNum)) return true;
    const hasReflection = reflections.some(r => r.weekNumber === weekNum);
    const hasExercise = exerciseAnswers.some(e => e.weekNumber === weekNum);
    if (!hasReflection && !hasExercise) return false;
    const reflectionOk = !hasReflection || isItemReviewed('reflection', String(weekNum));
    const exerciseOk = !hasExercise || isItemReviewed('exercise', String(weekNum));
    return reflectionOk && exerciseOk;
  };

  const pendingWeekReviewCountLocal = completedWeeks.filter(w => !isWeekFullyReviewed(w)).length;

  const getUnreviewedCheckinCount = () => {
    let count = 0;
    checkins.forEach(c => { if (!isItemReviewed('checkin', c.dateKey)) count++; });
    return count;
  };

  const getUnreviewedReflectionCount = () => {
    let count = 0;
    const completedSet = new Set(completedWeeks);
    reflections.forEach(r => {
      if (completedSet.has(r.weekNumber) && !isWeekFullyReviewed(r.weekNumber) && !isItemReviewed('reflection', String(r.weekNumber))) {
        count++;
      }
    });
    exerciseAnswers.forEach(e => {
      if (completedSet.has(e.weekNumber) && !isWeekFullyReviewed(e.weekNumber) && !isItemReviewed('exercise', String(e.weekNumber))) {
        count++;
      }
    });
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

  const getCheckinWeekNum = (dateKey: string, startDate: string): number => {
    const daysSinceStart = Math.floor((new Date(dateKey).getTime() - new Date(startDate).getTime()) / 86400000);
    return Math.max(1, Math.floor(daysSinceStart / 7) + 1);
  };

  const weekHasActivity = (weekNum: number): boolean => {
    if (completedWeeks.includes(weekNum)) return true;
    if (reflections.some(r => r.weekNumber === weekNum)) return true;
    if (exerciseAnswers.some(e => e.weekNumber === weekNum)) return true;
    if (homeworkCompletions.some(h => h.weekNumber === weekNum)) return true;
    if (client?.startDate && checkins.some(c => getCheckinWeekNum(c.dateKey, client.startDate!) === weekNum)) return true;
    return false;
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
        setActiveFeedbackTarget({ type: 'checkin', key: dateKey });
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
    setNewFeedback("");
    setActiveFeedbackTarget({ type: 'week', key: String(weekNumber) });
  };

  const handleAddFeedbackForDate = (dateKey: string) => {
    setFeedbackDateKey(dateKey);
    setFeedbackWeek(null);
    setFeedbackAutopsyId(null);
    setFeedbackInsightType(null);
    setNewFeedback("");
    setActiveFeedbackTarget({ type: 'checkin', key: dateKey });
  };

  const handleAddFeedbackForAutopsy = (autopsyId: string) => {
    setFeedbackAutopsyId(autopsyId);
    setFeedbackWeek(null);
    setFeedbackDateKey(null);
    setFeedbackInsightType(null);
    setNewFeedback("");
    setActiveFeedbackTarget({ type: 'autopsy', key: autopsyId });
  };

  const handleAddFeedbackForInsight = (insightType: string) => {
    setFeedbackInsightType(insightType);
    setFeedbackWeek(null);
    setFeedbackDateKey(null);
    setFeedbackAutopsyId(null);
    setNewFeedback("");
    setActiveFeedbackTarget({ type: 'insight', key: insightType });
  };

  const renderInlineFeedback = (targetType: string, targetKey: string, dateKeyForAI?: string) => {
    if (activeFeedbackTarget?.type !== targetType || activeFeedbackTarget.key !== targetKey) return null;
    return (
      <div className="mt-4 p-4 rounded-lg border bg-card space-y-3" data-testid={`inline-feedback-${targetType}-${targetKey}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Feedback</p>
          <Button variant="ghost" size="sm" onClick={() => { setActiveFeedbackTarget(null); setNewFeedback(""); }} data-testid="button-cancel-inline-feedback">Cancel</Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => handleGenerateAIDraft(dateKeyForAI)} disabled={isGeneratingDraft} data-testid="button-generate-ai-draft">
            {isGeneratingDraft ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Generating...</> : <><Sparkles className="mr-1.5 h-3.5 w-3.5" />AI Draft</>}
          </Button>
        </div>
        <Textarea placeholder="Write your feedback..." value={newFeedback} onChange={(e) => setNewFeedback(e.target.value)} className="min-h-[120px]" data-testid="input-feedback" />
        <Button className="w-full sm:w-auto" onClick={handleSubmitFeedback} disabled={!newFeedback.trim() || feedbackMutation.isPending} data-testid="button-submit-feedback">
          <Send className="mr-1.5 h-3.5 w-3.5" />{feedbackMutation.isPending ? "Sending..." : "Send Feedback"}
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-6 sm:py-8">
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
            <CardContent className="py-12 text-center text-muted-foreground">
              Client not found or you don't have access to view this client.
            </CardContent>
          </Card>
        ) : (
          <>
            {unreviewedAutopsies.length > 0 && (
              <Card className="border-destructive/50" data-testid="banner-unreviewed-autopsies">
                <CardContent className="py-4 flex flex-col sm:flex-row items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Attention Required
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {client.name} has {unreviewedAutopsies.length} unreviewed relapse {unreviewedAutopsies.length === 1 ? 'autopsy' : 'autopsies'} that need your review.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-3 w-full sm:w-auto"
                      onClick={() => setActiveTab("autopsies")}
                      data-testid="button-go-to-autopsies"
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Review Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold truncate">{client.name}</h2>
                      {isAdolescent && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
                          Teen
                        </Badge>
                      )}
                      {isNeedsAttention && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          Needs Attention
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="truncate">{client.email}</span>
                      <span className="hidden sm:inline">|</span>
                      <span>
                        {client.startDate ? `Started ${new Date(client.startDate).toLocaleDateString()}` : "Not started"}
                      </span>
                      <span className="hidden sm:inline">|</span>
                      <span>{completedWeeks.length} / 16 weeks</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={openGeneralSheet} data-testid="button-new-message">
                    <PenSquare className="h-3.5 w-3.5 mr-1.5" />
                    New Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Parent section for adolescent clients */}
            {isAdolescent && (
              <ParentSection
                clientId={clientId!}
                parentData={parentData}
                onMessageSent={() => refetchParent()}
              />
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex w-auto min-w-full sm:w-full">
                  <TabsTrigger value="analytics" data-testid="tab-analytics" className="flex-1 min-w-[80px]">Analytics</TabsTrigger>
                  <TabsTrigger value="progress" data-testid="tab-progress" className="relative flex-1 min-w-[80px]">
                    Progress
                    {reviewCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-background" data-testid="badge-pending-week-reviews">
                        {pendingWeekReviewCountLocal + getUnreviewedReflectionCount()}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="checkins" data-testid="tab-checkins" className="relative flex-1 min-w-[80px]">
                    Check-ins
                    {getUnreviewedCheckinCount() > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-background" data-testid="badge-unreviewed-checkins">
                        {getUnreviewedCheckinCount()}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="autopsies" data-testid="tab-autopsies" className="relative flex-1 min-w-[80px]">
                    Autopsies
                    {unreviewedAutopsies.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-background" data-testid="badge-unreviewed-autopsies">
                        {unreviewedAutopsies.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="guidance" data-testid="tab-guidance" className="relative flex-1 min-w-[80px]">
                    Guidance
                    {(suggestionsData?.suggestions.length ?? 0) > 0 && (
                      <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-background ${suggestionsData!.suggestions.some(s => s.priority === "urgent") ? "bg-destructive" : "bg-slate-400"}`}>
                        {suggestionsData!.suggestions.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="reports" data-testid="tab-reports" className="flex-1 min-w-[80px]">Reports</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="analytics" className="space-y-6 mt-6">
                {(() => {
                  const sortedByDateAsc = [...checkins].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
                  const sortedCheckins = [...checkins].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
                  const totalCheckins = sortedCheckins.length;

                  const MIN_ENTRIES = 5;
                  const MCID = 2.0;

                  const oldestCheckinDate = sortedByDateAsc[0]?.dateKey ? new Date(sortedByDateAsc[0].dateKey) : new Date();
                  const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - oldestCheckinDate.getTime()) / 86400000) + 1);
                  const windowSize = Math.min(14, daysSinceFirst);
                  const windowStart = new Date();
                  windowStart.setDate(windowStart.getDate() - windowSize + 1);
                  windowStart.setUTCHours(0, 0, 0, 0);
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

                  const insightItems: Array<{type: string; severity: 'high' | 'positive' | 'warning' | 'neutral'; icon: any; text: string; show: boolean}> = [
                    { type: 'unreviewed-autopsies', severity: 'high', icon: AlertTriangle, text: `${unreviewedAutopsies.length} unreviewed relapse ${unreviewedAutopsies.length === 1 ? 'autopsy' : 'autopsies'} — immediate review recommended.`, show: unreviewedAutopsies.length > 0 },
                    { type: 'strong-streak', severity: 'positive', icon: Flame, text: `Strong engagement with ${currentStreak}-day streak. Client is staying consistent with daily practice.`, show: currentStreak >= 7 },
                    { type: 'low-streak', severity: 'warning', icon: Clock, text: `Check-in consistency has dropped. Consider reaching out to encourage re-engagement.`, show: currentStreak < 3 && totalCheckins > 0 },
                    { type: 'urge-improving', severity: 'positive', icon: TrendingDown, text: `Urge levels are meaningfully decreasing. The tools and techniques appear to be helping.`, show: urgeTrend === 'decreasing' },
                    { type: 'urge-increasing', severity: 'high', icon: TrendingUp, text: `Urge levels are meaningfully increasing. Client may benefit from additional support or crisis resources.`, show: urgeTrend === 'increasing' },
                    { type: 'no-checkins', severity: 'neutral', icon: Clock, text: `No check-in data yet. Client hasn't started tracking their daily progress.`, show: totalCheckins === 0 },
                  ];
                  const activeInsights = insightItems.filter(i => i.show);

                  return (
                    <>
                      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <Card>
                          <CardContent className="pt-5 pb-4">
                            <p className="text-xs text-muted-foreground">Current Streak</p>
                            <p className="text-2xl font-bold mt-1">{currentStreak} <span className="text-sm font-normal text-muted-foreground">days</span></p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-5 pb-4">
                            <p className="text-xs text-muted-foreground">{windowSize}-Day Completion</p>
                            <p className="text-2xl font-bold mt-1">{completionRate}<span className="text-sm font-normal text-muted-foreground">%</span></p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-5 pb-4">
                            <p className="text-xs text-muted-foreground">Avg Mood</p>
                            <p className="text-2xl font-bold mt-1">{avgMood}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="pt-5 pb-4">
                            <p className="text-xs text-muted-foreground">Avg Urge Level</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-2xl font-bold">{avgUrge}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
                              {urgeTrend === 'decreasing' && (
                                <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                              )}
                              {urgeTrend === 'increasing' && (
                                <TrendingUp className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Client Insights</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {activeInsights.map((insight) => {
                            const IconComp = insight.icon;
                            const insightFeedback = feedback.filter(f => f.feedbackType === 'general' && f.checkinDateKey === `insight-${insight.type}`);
                            return (
                              <div key={insight.type} className={`p-3 rounded-lg border ${
                                insight.severity === 'high' ? 'border-destructive/30' :
                                insight.severity === 'warning' ? 'border-amber-200 dark:border-amber-800' :
                                ''
                              }`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <IconComp className={`h-4 w-4 mt-0.5 shrink-0 ${
                                      insight.severity === 'high' ? 'text-destructive' :
                                      insight.severity === 'positive' ? 'text-green-600 dark:text-green-400' :
                                      insight.severity === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                      'text-muted-foreground'
                                    }`} />
                                    <p className="text-sm">{insight.text}</p>
                                  </div>
                                  {activeInsights.length > 1 && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      {insightFeedback.length > 0 && (
                                        <Badge variant="outline" className="text-[10px]">
                                          <CheckCircle2 className="h-3 w-3 mr-0.5" /> Sent
                                        </Badge>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddFeedbackForInsight(insight.type)}
                                        data-testid={`button-feedback-insight-${insight.type}`}
                                      >
                                        <MessageSquare className="h-3.5 w-3.5 mr-1" /> Respond
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {insightFeedback.length > 0 && (
                                  <div className="mt-3 pt-2 border-t">
                                    {insightFeedback.map(f => (
                                      <div key={f.id} className="text-sm bg-muted/50 p-2.5 rounded-md mb-1.5">
                                        <p>{f.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {renderInlineFeedback('insight', insight.type)}
                              </div>
                            );
                          })}
                          <div className="pt-3 text-sm text-muted-foreground space-y-1">
                            <p>Program Progress: {completedWeeks.length}/16 weeks ({Math.round((completedWeeks.length / 16) * 100)}%)</p>
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
                              View Full Analytics
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </TabsContent>

              <TabsContent value="progress" className="space-y-6 mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Weekly Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingProgress ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                          {Array.from({ length: 16 }, (_, i) => i + 1).map(weekNum => {
                            const status = getWeekStatus(weekNum);
                            const weekContent = WEEK_CONTENT[weekNum];
                            const hw = homeworkCompletions.find(h => h.weekNumber === weekNum);
                            const totalItems = weekContent?.homeworkChecklist?.length || 0;
                            const completedItems = hw ? (Array.isArray(hw.completedItems) ? hw.completedItems.length : JSON.parse(hw.completedItems as any || '[]').length) : 0;
                            const needsReview = status === "completed" && !isWeekFullyReviewed(weekNum);
                            const isSelected = selectedWeek === weekNum;
                            const hasActivity = weekHasActivity(weekNum);
                            return (
                              <div
                                key={weekNum}
                                onClick={() => setSelectedWeek(isSelected ? null : weekNum)}
                                className={`flex flex-col items-center justify-center rounded-md border p-2.5 cursor-pointer transition-all ${
                                  isSelected
                                    ? "ring-2 ring-primary border-primary"
                                    : needsReview
                                      ? "border-amber-300 dark:border-amber-700 hover:ring-1 hover:ring-amber-300"
                                      : status === "completed"
                                        ? "border-green-200 dark:border-green-800 hover:ring-1 hover:ring-green-300"
                                        : hasActivity
                                          ? "border-border hover:ring-1 hover:ring-border"
                                          : "border-muted opacity-50"
                                }`}
                                data-testid={`week-status-${weekNum}`}
                              >
                                <span className="text-[10px] text-muted-foreground">Wk</span>
                                <span className="font-bold text-sm">{weekNum}</span>
                                {needsReview ? (
                                  <Eye className="mt-0.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                ) : status === "completed" ? (
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                ) : status === "available" ? (
                                  <Clock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                                ) : null}
                                {totalItems > 0 && (status === "completed" || status === "available") && (
                                  <span className={`text-[9px] mt-0.5 ${completedItems === totalItems ? 'text-green-600 dark:text-green-400 font-bold' : 'text-muted-foreground'}`}>
                                    {completedItems}/{totalItems}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {pendingWeekReviewCount > 0 && (
                          <Card className="border-amber-200 dark:border-amber-800">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                Weeks Needing Review ({pendingWeekReviewCount})
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {completedWeeks.filter(w => !isWeekFullyReviewed(w)).sort((a, b) => a - b).map(weekNum => {
                                  const weekContent = WEEK_CONTENT[weekNum];
                                  const hasReflection = reflections.some(r => r.weekNumber === weekNum);
                                  const hasExercise = exerciseAnswers.some(e => e.weekNumber === weekNum);
                                  return (
                                    <div key={weekNum} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border p-3" data-testid={`pending-review-week-${weekNum}`}>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm">Week {weekNum}</span>
                                        <span className="text-xs text-muted-foreground">{weekContent?.title || ""}</span>
                                        {hasReflection && <Badge variant="outline" className="text-[10px]">Reflection</Badge>}
                                        {hasExercise && <Badge variant="outline" className="text-[10px]">Exercise</Badge>}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setSelectedWeek(weekNum)}
                                          data-testid={`button-view-week-${weekNum}`}
                                        >
                                          <FileText className="mr-1 h-3.5 w-3.5" /> View
                                        </Button>
                                        {messagedWeekNums.has(weekNum) ? (
                                          <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Messaged
                                          </Badge>
                                        ) : (
                                          <Button
                                            size="sm"
                                            onClick={() => openWeekSheet(weekNum)}
                                            data-testid={`button-message-week-${weekNum}`}
                                          >
                                            <Mail className="mr-1 h-3.5 w-3.5" /> Send Message
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedWeek !== null && (() => {
                  const wkCheckins = client?.startDate
                    ? [...checkins].filter(c => getCheckinWeekNum(c.dateKey, client.startDate!) === selectedWeek).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
                    : [];
                  const wkReflection = reflections.find(r => r.weekNumber === selectedWeek);
                  const wkExercise = exerciseAnswers.find(e => e.weekNumber === selectedWeek);
                  const wkHomework = homeworkCompletions.find(h => h.weekNumber === selectedWeek);
                  const wkFeedback = feedback.filter(f => f.feedbackType === 'week' && f.weekNumber === selectedWeek);
                  const hasAnyWork = wkCheckins.length > 0 || !!wkReflection || !!wkExercise || !!wkHomework;
                  const reflectionReviewed = isItemReviewed('reflection', String(selectedWeek));
                  const exerciseReviewed = isItemReviewed('exercise', String(selectedWeek));
                  const weekData = WEEK_CONTENT[selectedWeek];
                  let parsedExerciseAnswers: Record<string, string> = {};
                  try { parsedExerciseAnswers = wkExercise ? JSON.parse(wkExercise.answers) : {}; } catch {}
                  const exerciseAnswerEntries = Object.entries(parsedExerciseAnswers).filter(([, v]) => v && String(v).trim());
                  const wkHwItems = wkHomework
                    ? (Array.isArray(wkHomework.completedItems) ? wkHomework.completedItems : (() => { try { return JSON.parse(wkHomework.completedItems as any || '[]'); } catch { return []; } })())
                    : [];
                  const totalHwItems = weekData?.homeworkChecklist?.length || 0;

                  return (
                    <Card className="border-primary/30" data-testid={`week-detail-panel-${selectedWeek}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Week {selectedWeek}{weekData?.title ? ` — ${weekData.title}` : ""}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedWeek(null)}
                            data-testid="button-close-week-detail"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {!hasAnyWork ? (
                          <p className="text-sm text-muted-foreground py-6 text-center">No work recorded for Week {selectedWeek} yet.</p>
                        ) : (
                          <>
                            {wkCheckins.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                  Daily Check-ins ({wkCheckins.length})
                                </p>
                                <div className="space-y-4">
                                  {wkCheckins.map((checkin) => {
                                    const existingFeedback = feedback.filter(f => f.checkinDateKey === checkin.dateKey);
                                    const reviewed = isItemReviewed('checkin', checkin.dateKey);
                                    return (
                                      <div key={checkin.id} className="rounded-lg border p-4" data-testid={`wk-detail-checkin-${checkin.dateKey}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium">{checkin.dateKey}</span>
                                            {reviewed ? (
                                              <Badge variant="outline" className="text-[10px]">
                                                <CheckCircle2 className="h-3 w-3 mr-0.5" /> Reviewed
                                              </Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-[10px]">Needs Review</Badge>
                                            )}
                                            {existingFeedback.length > 0 && (
                                              <Badge variant="outline" className="text-[10px]">
                                                <MessageSquare className="h-3 w-3 mr-0.5" /> {existingFeedback.length}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex gap-2 flex-wrap">
                                            {!reviewed && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => markItemReviewedMutation.mutate({ itemType: 'checkin', itemKey: checkin.dateKey })}
                                                disabled={markItemReviewedMutation.isPending}
                                                data-testid={`button-review-checkin-wk-${checkin.dateKey}`}
                                              >
                                                <CheckSquare className="mr-1.5 h-3.5 w-3.5" /> Reviewed
                                              </Button>
                                            )}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleAddFeedbackForDate(checkin.dateKey)}
                                              data-testid={`button-feedback-checkin-wk-${checkin.dateKey}`}
                                            >
                                              <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Feedback
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleGenerateAIDraft(checkin.dateKey)}
                                              disabled={isGeneratingDraft}
                                              data-testid={`button-ai-checkin-wk-${checkin.dateKey}`}
                                            >
                                              {isGeneratingDraft ? (
                                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                              ) : (
                                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                              )}
                                              AI Insight
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="flex gap-3 mb-3 flex-wrap">
                                          {checkin.moodLevel !== null && (
                                            <span className="text-sm text-muted-foreground">Mood: <span className="font-medium text-foreground">{checkin.moodLevel}/10</span></span>
                                          )}
                                          {checkin.urgeLevel !== null && (
                                            <span className="text-sm text-muted-foreground">Urge: <span className={`font-medium ${Number(checkin.urgeLevel) > 6 ? 'text-destructive' : 'text-foreground'}`}>{checkin.urgeLevel}/10</span></span>
                                          )}
                                        </div>
                                        {checkin.eveningChecks && (
                                          <div className="mt-2">
                                            <p className="text-xs text-muted-foreground mb-1.5">Daily Items</p>
                                            <div className="space-y-1.5">
                                              {formatEveningChecks(checkin.eveningChecks).map((id) => (
                                                <div key={id} className="flex items-center gap-2 text-sm">
                                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                                  <span>{DAILY_CHECK_LABELS[id] || id}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {checkin.journalEntry && (
                                          <div className="mt-3 p-3 bg-muted/30 rounded-md">
                                            <p className="text-xs text-muted-foreground mb-1">
                                              Journal: <em>{getPromptForDate(checkin.dateKey)}</em>
                                            </p>
                                            <p className="text-sm italic">"{checkin.journalEntry}"</p>
                                          </div>
                                        )}
                                        {existingFeedback.length > 0 && (
                                          <div className="mt-4 pt-3 border-t">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                                              <MessageSquare className="h-3 w-3 mr-1" /> Mentor Response
                                            </p>
                                            {existingFeedback.map(f => (
                                              <div key={f.id} className="text-sm bg-muted/40 p-2.5 rounded-md mb-1.5">
                                                <p>{f.content}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {renderInlineFeedback('checkin', checkin.dateKey, checkin.dateKey)}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {(wkReflection || wkExercise) && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                  Weekly Work
                                </p>
                                <div className="rounded-lg border p-4" id={`reflection-week-${selectedWeek}`} data-testid={`reflection-week-${selectedWeek}`}>
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-medium">Week {selectedWeek} Reflection</h4>
                                      {reflectionReviewed ? (
                                        <Badge variant="outline" className="text-[10px]">
                                          <CheckCircle2 className="h-3 w-3 mr-0.5" /> Reviewed
                                        </Badge>
                                      ) : wkReflection ? (
                                        <Badge variant="secondary" className="text-[10px]">Needs Review</Badge>
                                      ) : null}
                                      {wkFeedback.length > 0 && (
                                        <Badge variant="outline" className="text-[10px]">
                                          <MessageSquare className="h-3 w-3 mr-0.5" /> {wkFeedback.length}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                      {wkReflection && !reflectionReviewed && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => markItemReviewedMutation.mutate({ itemType: 'reflection', itemKey: String(selectedWeek) })}
                                          disabled={markItemReviewedMutation.isPending}
                                          data-testid={`button-review-reflection-${selectedWeek}`}
                                        >
                                          <CheckSquare className="mr-1.5 h-3.5 w-3.5" /> Mark Reviewed
                                        </Button>
                                      )}
                                      {messagedWeekNums.has(selectedWeek) ? (
                                        <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                          <CheckCircle2 className="h-3 w-3 mr-1" /> Messaged
                                        </Badge>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={() => openWeekSheet(selectedWeek)}
                                          data-testid={`button-message-week-${selectedWeek}`}
                                        >
                                          <Mail className="mr-1 h-3.5 w-3.5" /> Send Message
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {wkReflection && (
                                    <div className="space-y-3">
                                      {(() => {
                                        const rqs = weekData?.reflectionQuestions || [];
                                        const defaultLabels = ["Key insight from this week", "What went well", "Challenges faced", "Goals for next week"];
                                        return [wkReflection.q1, wkReflection.q2, wkReflection.q3, wkReflection.q4].map((answer, idx) => {
                                          if (!answer) return null;
                                          const label = rqs[idx]?.question || defaultLabels[idx];
                                          return (
                                            <div key={idx}>
                                              <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                              <p className="text-sm bg-muted/40 p-2.5 rounded-md">{answer}</p>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  )}

                                  {exerciseAnswerEntries.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exercise Answers</p>
                                        {!exerciseReviewed ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => markItemReviewedMutation.mutate({ itemType: 'exercise', itemKey: String(selectedWeek) })}
                                            disabled={markItemReviewedMutation.isPending}
                                            data-testid={`button-review-exercise-${selectedWeek}`}
                                          >
                                            <CheckSquare className="mr-1 h-3 w-3" /> Mark Exercises Reviewed
                                          </Button>
                                        ) : (
                                          <Badge variant="outline" className="text-[10px]">
                                            <CheckCircle2 className="h-3 w-3 mr-0.5" /> Reviewed
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="space-y-3">
                                        {exerciseAnswerEntries.map(([key, value]) => {
                                          let fieldLabel = key.replace(/-/g, ' ');
                                          if (weekData?.exercises) {
                                            for (const ex of weekData.exercises) {
                                              if (!ex) continue;
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
                                              <p className="text-xs text-muted-foreground mb-1">{fieldLabel}</p>
                                              <p className="text-sm bg-muted/40 p-2.5 rounded-md">{value}</p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {wkFeedback.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                                        <MessageSquare className="h-3 w-3 mr-1" /> Mentor Responses
                                      </p>
                                      {wkFeedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(f => (
                                        <div key={f.id} className="text-sm bg-muted/40 p-2.5 rounded-md mb-1.5">
                                          <p>{f.content}</p>
                                          <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {renderInlineFeedback('week', String(selectedWeek))}
                                </div>
                              </div>
                            )}

                            {wkHomework && totalHwItems > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                  Homework
                                </p>
                                <div className="rounded-lg border p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium">
                                      {wkHwItems.length}/{totalHwItems} items completed
                                    </p>
                                    <Badge variant={wkHwItems.length === totalHwItems ? "outline" : "secondary"} className={wkHwItems.length === totalHwItems ? "text-green-600 border-green-300 text-xs" : "text-xs"}>
                                      {wkHwItems.length === totalHwItems ? "All done" : "In progress"}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1.5">
                                    {weekData?.homeworkChecklist?.map((item: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2 text-sm">
                                        {wkHwItems.includes(idx) ? (
                                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        ) : (
                                          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 flex-shrink-0" />
                                        )}
                                        <span className={wkHwItems.includes(idx) ? "" : "text-muted-foreground"}>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </TabsContent>

              <TabsContent value="checkins" className="space-y-6 mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Daily Check-ins <span className="text-sm font-normal text-muted-foreground">({checkins.length} total)</span></CardTitle>
                  </CardHeader>
                  <CardContent>
                    {checkins.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No check-ins recorded yet.</p>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {[...checkins].sort((a, b) => b.dateKey.localeCompare(a.dateKey)).slice(0, 30).map((checkin) => {
                          const existingFeedback = feedback.filter(f => f.checkinDateKey === checkin.dateKey);
                          const reviewed = isItemReviewed('checkin', checkin.dateKey);
                          return (
                            <div
                              key={checkin.id}
                              className="rounded-lg border p-4"
                              data-testid={`checkin-${checkin.dateKey}`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{checkin.dateKey}</span>
                                  {reviewed ? (
                                    <Badge variant="outline" className="text-[10px]">
                                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Reviewed
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Needs Review
                                    </Badge>
                                  )}
                                  {existingFeedback.length > 0 && (
                                    <Badge variant="outline" className="text-[10px]">
                                      <MessageSquare className="h-3 w-3 mr-0.5" /> {existingFeedback.length}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {!reviewed && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => markItemReviewedMutation.mutate({ itemType: 'checkin', itemKey: checkin.dateKey })}
                                      disabled={markItemReviewedMutation.isPending}
                                      data-testid={`button-review-checkin-${checkin.dateKey}`}
                                    >
                                      <CheckSquare className="mr-1.5 h-3.5 w-3.5" /> Reviewed
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddFeedbackForDate(checkin.dateKey)}
                                    data-testid={`button-feedback-checkin-${checkin.dateKey}`}
                                  >
                                    <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Feedback
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerateAIDraft(checkin.dateKey)}
                                    disabled={isGeneratingDraft}
                                    data-testid={`button-ai-checkin-${checkin.dateKey}`}
                                  >
                                    {isGeneratingDraft ? (
                                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    AI Insight
                                  </Button>
                                </div>
                              </div>
                              <div className="flex gap-3 mb-3 flex-wrap">
                                {checkin.moodLevel !== null && (
                                  <span className="text-sm text-muted-foreground">Mood: <span className="font-medium text-foreground">{checkin.moodLevel}/10</span></span>
                                )}
                                {checkin.urgeLevel !== null && (
                                  <span className="text-sm text-muted-foreground">Urge: <span className={`font-medium ${Number(checkin.urgeLevel) > 6 ? 'text-destructive' : 'text-foreground'}`}>{checkin.urgeLevel}/10</span></span>
                                )}
                              </div>
                              {checkin.eveningChecks && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-1.5">Daily Items</p>
                                  <div className="space-y-1.5">
                                    {formatEveningChecks(checkin.eveningChecks).map((id) => (
                                      <div key={id} className="flex items-center gap-2 text-sm" data-testid={`checkin-item-${id}`}>
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        <span>{DAILY_CHECK_LABELS[id] || id}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {checkin.journalEntry && (
                                <div className="mt-3 p-3 bg-muted/30 rounded-md">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Journal: <em>{getPromptForDate(checkin.dateKey)}</em>
                                  </p>
                                  <p className="text-sm italic">"{checkin.journalEntry}"</p>
                                </div>
                              )}
                              {existingFeedback.length > 0 && (
                                <div className="mt-4 pt-3 border-t">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                                    <MessageSquare className="h-3 w-3 mr-1" /> Mentor Response
                                  </p>
                                  {existingFeedback.map(f => (
                                    <div key={f.id} className="text-sm bg-muted/40 p-2.5 rounded-md mb-1.5">
                                      <p>{f.content}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {renderInlineFeedback('checkin', checkin.dateKey, checkin.dateKey)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="autopsies" className="space-y-6 mt-6">
                {unreviewedAutopsies.length > 0 && (
                  <Card className="border-destructive/30">
                    <CardContent className="py-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-sm">
                        {unreviewedAutopsies.length} unreviewed — these require immediate attention.
                      </p>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Relapse Autopsies <span className="text-sm font-normal text-muted-foreground">({relapseAutopsies.filter(a => a.status === "completed").length} submitted)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {relapseAutopsies.filter(a => a.status === "completed").length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No relapse autopsies submitted.</p>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
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
                                className={`rounded-lg border p-4 ${
                                  isUnreviewed ? "border-destructive/30" : ""
                                }`}
                                data-testid={`autopsy-${autopsy.id}`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{autopsy.date}</span>
                                    <Badge variant={autopsy.lapseOrRelapse === "relapse" ? "destructive" : "secondary"}>
                                      {autopsy.lapseOrRelapse === "relapse" ? "Relapse" : "Lapse"}
                                    </Badge>
                                    {isUnreviewed ? (
                                      <Badge variant="secondary">Needs Review</Badge>
                                    ) : (
                                      <Badge variant="outline">
                                        <CheckCircle2 className="mr-1 h-3 w-3" /> Reviewed
                                      </Badge>
                                    )}
                                    {autopsyFeedback.length > 0 && (
                                      <Badge variant="outline" className="text-[10px]">
                                        <MessageSquare className="h-3 w-3 mr-0.5" /> {autopsyFeedback.length}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    {isUnreviewed && !messagedAutopsyIds.has(autopsy.id) ? (
                                      <Button
                                        size="sm"
                                        onClick={() => openAutopsySheet(autopsy.id)}
                                        data-testid={`button-message-autopsy-${autopsy.id}`}
                                      >
                                        <Mail className="mr-1.5 h-3.5 w-3.5" /> Send Required Message
                                      </Button>
                                    ) : messagedAutopsyIds.has(autopsy.id) ? (
                                      <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Messaged
                                      </Badge>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openAutopsySheet(autopsy.id)}
                                        data-testid={`button-message-autopsy-again-${autopsy.id}`}
                                      >
                                        <Mail className="mr-1.5 h-3.5 w-3.5" /> Send Message
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {autopsy.summary && (
                                  <p className="text-sm mb-3 text-muted-foreground">{autopsy.summary}</p>
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
                                  <div className="mt-4 pt-3 border-t">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                                      <MessageSquare className="h-3 w-3 mr-1" /> Mentor Response
                                    </p>
                                    {autopsyFeedback.map(f => (
                                      <div key={f.id} className="text-sm bg-muted/40 p-2.5 rounded-md mb-1.5">
                                        <p>{f.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {renderInlineFeedback('autopsy', autopsy.id)}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6 mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Weekly Summary Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate AI-powered weekly summary reports with progress data, mood/urge trends, and personalized observations.
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
                            className={`rounded-lg border p-4 ${!isCompleted ? 'opacity-50' : ''}`}
                            data-testid={`report-week-${weekNum}`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <span className="font-medium text-sm">Week {weekNum}</span>
                                <p className="text-xs text-muted-foreground truncate">{weekTitle}</p>
                              </div>
                              {existingSummary && (
                                <Badge variant="outline" className="text-[10px] shrink-0">
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

              <TabsContent value="guidance" className="space-y-4 mt-6">
                {/* Draft inbox section */}
                {draftsData && draftsData.drafts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Unsent Drafts</p>
                      <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0 text-[10px] font-bold">
                        {draftsData.drafts.length}
                      </span>
                    </div>
                    {draftsData.drafts.map((draft) => (
                      <Card key={draft.id} className="border-l-4 border-amber-400 dark:border-amber-700" data-testid={`draft-card-${draft.id}`}>
                        <CardContent className="py-3 px-4 flex items-center justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{draft.subject || "Untitled draft"}</p>
                            <p className="text-xs text-muted-foreground truncate">{draft.content.slice(0, 80)}{draft.content.length > 80 ? "…" : ""}</p>
                            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                              Saved {new Date(draft.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDraftSheet(draft)}
                            data-testid={`button-edit-draft-${draft.id}`}
                          >
                            Edit &amp; Send
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {loadingSuggestions ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                  </div>
                ) : !suggestionsData?.suggestions.length ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Lightbulb className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="font-semibold">No guidance suggestions right now</p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        More client data is needed to generate meaningful guidance. Encourage daily check-ins.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="rounded-lg border bg-muted/40 px-4 py-3 flex items-start gap-3">
                      <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        These suggestions are generated from this client's check-in data, curriculum pace, and relapse history.
                        They are starting points for your judgment — not directives.
                      </p>
                    </div>

                    {(["urgent", "followup", "curriculum", "recognition"] as const).map((priority) => {
                      const items = suggestionsData.suggestions.filter(s => s.priority === priority);
                      if (items.length === 0) return null;

                      const config = {
                        urgent: { label: "Needs Attention", color: "border-red-400 dark:border-red-700", badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", dot: "bg-red-500" },
                        followup: { label: "Follow Up", color: "border-amber-400 dark:border-amber-700", badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
                        curriculum: { label: "This Week's Lesson", color: "border-blue-400 dark:border-blue-700", badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
                        recognition: { label: "Positive Signal", color: "border-green-400 dark:border-green-700", badge: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", dot: "bg-green-500" },
                      }[priority];

                      return (
                        <div key={priority} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{config.label}</p>
                          </div>
                          {items.map((suggestion) => {
                            const isSent = sentSuggestionIds.has(suggestion.id);
                            const isDrafted = draftedSuggestionIds.has(suggestion.id);

                            return (
                              <Card key={suggestion.id} className={`border-l-4 ${config.color} ${isSent ? "opacity-60" : ""}`} data-testid={`card-suggestion-${suggestion.id}`}>
                                <CardHeader className="pb-2 pt-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-sm font-semibold leading-snug">{suggestion.title}</CardTitle>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isSent && (
                                        <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                                          <CheckCircle2 className="h-3 w-3" /> Sent
                                        </span>
                                      )}
                                      {isDrafted && !isSent && (
                                        <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold">
                                          Draft saved
                                        </span>
                                      )}
                                      {!isSent && !isDrafted && (
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}>
                                          {config.label}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pb-4 space-y-3">
                                  <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.detail}</p>
                                  <div className="rounded-md bg-muted/60 px-3 py-2.5 flex items-start gap-2">
                                    <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-xs font-medium leading-relaxed">{suggestion.action}</p>
                                  </div>
                                  {!isSent && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-8"
                                        onClick={() => openGuidanceSheet(suggestion)}
                                        data-testid={`button-write-message-${suggestion.id}`}
                                      >
                                        <Mail className="h-3.5 w-3.5 mr-1.5" />Write Message
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => dismissSuggestionMutation.mutate(suggestion.id)}
                                        disabled={dismissSuggestionMutation.isPending}
                                        data-testid={`button-mark-addressed-${suggestion.id}`}
                                      >
                                        Mark Addressed
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* ── Compose Sheet (all message contexts) ── */}
      <Sheet open={!!sheetCtx} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {sheetCtx?.kind === 'week' && `Message for Week ${sheetCtx.weekNumber}`}
              {sheetCtx?.kind === 'autopsy' && "Autopsy Response Message"}
              {sheetCtx?.kind === 'general' && "New Message"}
              {sheetCtx?.kind === 'guidance' && sheetCtx.suggestion.title}
              {sheetCtx?.kind === 'draft' && "Edit Draft"}
            </SheetTitle>
            <SheetDescription>
              {sheetCtx?.kind === 'week' && "Required — sending this message will also mark the week as reviewed."}
              {sheetCtx?.kind === 'autopsy' && "Required — sending this message will also mark the autopsy as reviewed."}
              {sheetCtx?.kind === 'general' && `Send an unsolicited message to ${client?.name || "this client"}.`}
              {sheetCtx?.kind === 'guidance' && "AI-generated draft — review before sending."}
              {sheetCtx?.kind === 'draft' && `Edit and resend this saved draft to ${client?.name || "this client"}.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {sheetCtx?.kind !== 'general' && sheetCtx?.kind !== 'draft' && (
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI-generated draft — review before sending</span>
                </div>
                {!sheetLoading && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleSheetRegenerateDraft} disabled={sheetLoading} data-testid="button-sheet-regenerate">
                    <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
                  </Button>
                )}
              </div>
            )}

            {sheetLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <>
                {sheetFailed && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    Draft generation failed — write your message below.
                  </p>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Subject</label>
                  <Input
                    value={sheetSubject}
                    onChange={e => setSheetSubject(e.target.value)}
                    placeholder="Subject line…"
                    data-testid="input-sheet-subject"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Message</label>
                  <Textarea
                    value={sheetMessage}
                    onChange={e => setSheetMessage(e.target.value)}
                    placeholder="Write your message…"
                    className="min-h-[200px] resize-none"
                    data-testid="input-sheet-message"
                  />
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t shrink-0 flex flex-col sm:flex-row justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSheetSaveDraft}
              disabled={sheetSaving || sheetSending || sheetLoading || !sheetMessage.trim()}
              data-testid="button-sheet-save-draft"
            >
              {sheetSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={handleSheetSend}
              disabled={sheetSending || sheetSaving || sheetLoading || !sheetMessage.trim()}
              data-testid="button-sheet-send"
            >
              {sheetSending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Mail className="h-3.5 w-3.5 mr-1.5" />}
              Send to {client?.name || "Client"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

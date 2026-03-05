import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  LogOut,
  Key,
  Search,
  CreditCard,
  Loader2,
  XCircle,
  UserCircle,
  ChevronDown,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Clock,
  Bell,
  BookOpen,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ClientWithProgress = {
  id: string;
  name: string | null;
  email: string;
  startDate: string | null;
  completedWeeks: number[];
  lastCompletionDate: string | null;
  currentWeek: number;
  lastActivity: string | null;
  isReadyForSubmission?: boolean;
  activeWeek?: number;
};

export default function TherapistHome() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const subscriptionConfirmedRef = useRef(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success" && !subscriptionConfirmedRef.current) {
      subscriptionConfirmedRef.current = true;
      toast({ title: "Subscription Activated", description: "Welcome! Your mentor subscription is now active." });
      window.history.replaceState({}, "", "/therapist-home");
      queryClient.invalidateQueries({ queryKey: ["/api/payments/subscription"] });
    } else if (paymentStatus === "cancelled") {
      window.history.replaceState({}, "", "/therapist-home");
    }
  }, [toast]);

  const { data: subscriptionData, isLoading: loadingSubscription } = useQuery<{
    subscription: any;
    allFeesWaived: boolean;
    cancelAtPeriodEnd?: boolean;
    periodEnd?: string | null;
  }>({ queryKey: ["/api/payments/subscription"], staleTime: 0, refetchOnMount: "always" });

  const subscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/checkout/subscription", {});
      return res.json();
    },
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: () => toast({ title: "Checkout Error", description: "Failed to start checkout.", variant: "destructive" }),
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/account/cancel-subscription", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Cancelled",
        description: data.accessEndsAt
          ? `Active until ${new Date(data.accessEndsAt).toLocaleDateString()}. No refunds.`
          : "Cancelled. No refunds.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/subscription"] });
    },
    onError: () => toast({ title: "Cancellation Failed", description: "Please try again.", variant: "destructive" }),
  });

  const hasActiveSubscription =
    subscriptionData?.subscription?.status === "active" ||
    subscriptionData?.subscription?.status === "trialing" ||
    subscriptionData?.allFeesWaived === true;

  const subscriptionCancelledButActive = hasActiveSubscription && subscriptionData?.cancelAtPeriodEnd === true;

  const { data: clientsData, isLoading } = useQuery<{ clients: ClientWithProgress[] }>({
    queryKey: ["/api/therapist/clients"],
    enabled: hasActiveSubscription,
  });

  const { data: unreviewedAutopsiesData } = useQuery<{ unreviewedCounts: Record<string, number> }>({
    queryKey: ["/api/therapist/unreviewed-autopsies"],
    enabled: hasActiveSubscription,
  });
  const unreviewedCounts = unreviewedAutopsiesData?.unreviewedCounts || {};

  const { data: unreviewedItemsData } = useQuery<{ unreviewedItemCounts: Record<string, number> }>({
    queryKey: ["/api/therapist/unreviewed-items"],
    enabled: hasActiveSubscription,
  });
  const unreviewedItemCounts = unreviewedItemsData?.unreviewedItemCounts || {};

  const { data: pendingReviewsData } = useQuery<{ pendingReviews: Array<{ clientId: string; weekNumber: number }> }>({
    queryKey: ["/api/therapist/pending-reviews"],
    enabled: hasActiveSubscription,
  });

  const { data: urgentSuggestionData } = useQuery<{ urgentCounts: Record<string, number> }>({
    queryKey: ["/api/therapist/urgent-suggestion-counts"],
    enabled: hasActiveSubscription,
  });
  const urgentSuggestionCounts = urgentSuggestionData?.urgentCounts || {};

  const pendingReviewCounts: Record<string, number> = {};
  for (const pr of pendingReviewsData?.pendingReviews || []) {
    pendingReviewCounts[pr.clientId] = (pendingReviewCounts[pr.clientId] || 0) + 1;
  }

  const combinedReviewCounts: Record<string, number> = { ...unreviewedItemCounts };
  for (const [clientId, count] of Object.entries(pendingReviewCounts)) {
    combinedReviewCounts[clientId] = (combinedReviewCounts[clientId] || 0) + count;
  }

  const allClients = clientsData?.clients || [];

  const getBestAttentionTab = (clientId: string): string => {
    if ((unreviewedCounts[clientId] || 0) > 0) return "autopsies";
    if ((urgentSuggestionCounts[clientId] || 0) > 0) return "guidance";
    if ((combinedReviewCounts[clientId] || 0) > 0) return "progress";
    return "progress";
  };

  const { data: clientMessagesData } = useQuery<{ feedback: any[] }>({
    queryKey: ["/api/therapist/all-client-feedback"],
    enabled: hasActiveSubscription,
  });
  const allClientFeedback = clientMessagesData?.feedback || [];

  const getClientStatus = (client: ClientWithProgress) => {
    if (!client.startDate) return "Pending";
    const urgentCount = urgentSuggestionCounts[client.id] ?? 0;
    const autopsyCount = unreviewedCounts[client.id] || 0;
    const reviewCount = combinedReviewCounts[client.id] || 0;

    if (urgentCount > 0 || autopsyCount > 0 || reviewCount > 0 || client.isReadyForSubmission) return "Needs Attention";
    
    const daysSinceStart = client.startDate ? Math.floor((Date.now() - new Date(client.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Logic update: Behind Pace is now based on the last time they submitted a week as completed.
    let referenceDate = client.startDate ? new Date(client.startDate) : null;
    if (client.lastCompletionDate) {
      referenceDate = new Date(client.lastCompletionDate);
    }

    let isActuallyBehind = false;
    if (referenceDate) {
      const daysSinceReference = Math.floor((Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      isActuallyBehind = daysSinceReference >= 14 && client.completedWeeks.length < 16;
    }

    if (isActuallyBehind) {
      const hasSentNudge = allClientFeedback.some(f => 
        f.clientId === client.id && 
        f.feedbackType === "guidance" && 
        f.status === "sent" &&
        (f.subject?.toLowerCase().includes("curriculum") || f.content?.toLowerCase().includes("curriculum"))
      );
      return hasSentNudge ? "Behind (Nudged)" : "Behind";
    }
    
    if (client.completedWeeks.length >= expectedWeek) return "On Track";
    return "Active";
  };

  const clients = searchQuery.trim()
    ? allClients.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allClients;

  const sortedClients = [...clients].sort((a, b) => {
    const statusA = getClientStatus(a);
    const statusB = getClientStatus(b);
    const priority = (s: string) => {
      if (s === "Needs Attention") return 0;
      if (s === "Behind") return 1;
      if (s === "Behind (Nudged)") return 2;
      if (s === "Active") return 3;
      if (s === "On Track") return 4;
      return 5;
    };
    return priority(statusA) - priority(statusB);
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setLocation("/login");
  };

  // Summary stats
  const totalClients = allClients.length;
  const totalUnreviewed = Object.values(combinedReviewCounts).reduce((a, b) => a + b, 0) +
    Object.values(unreviewedCounts).reduce((a, b) => a + b, 0);
  const needsAttentionCount = allClients.filter(c => getClientStatus(c) === "Needs Attention").length;

  if (loadingSubscription) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 py-12 px-4">
          <div className="mx-auto max-w-5xl">
            <Skeleton className="h-8 w-48 bg-white/10 mb-3" />
            <Skeleton className="h-5 w-72 bg-white/10" />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 py-12 px-4">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">Mentor Portal</p>
              <h1 className="text-3xl font-bold text-white" data-testid="text-therapist-title">Mentor Dashboard</h1>
            </div>
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-10">
          <Card data-testid="card-subscription-required">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <CreditCard className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Subscription Required</h3>
              <Badge variant="secondary" data-testid="badge-first-month-free" className="mb-4">First Month FREE</Badge>
              <p className="max-w-md text-muted-foreground mb-8">
                Start with a <span className="font-semibold text-foreground">30-day free trial</span>, then{" "}
                <span className="font-semibold text-foreground">$49/month</span> to access the mentor dashboard,
                manage your clients, and guide them through the 16-week program.
              </p>
              <ul className="text-left text-sm text-muted-foreground space-y-3 mb-8 w-full max-w-xs">
                {["Unlimited client management", "Real-time progress monitoring", "AI-powered guidance suggestions", "Cancel anytime"].map(f => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button size="lg" className="w-full sm:w-auto" onClick={() => subscriptionMutation.mutate()} disabled={subscriptionMutation.isPending} data-testid="button-subscribe">
                {subscriptionMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><CreditCard className="mr-2 h-4 w-4" />Start Free Trial</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 py-10 px-4">
        <div className="mx-auto max-w-5xl flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-2 flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              Mentor Portal
            </p>
            <h1 className="text-3xl font-bold text-white tracking-tight" data-testid="text-therapist-title">
              {(user as any)?.name || "Mentor"}
            </h1>
            <p className="mt-1.5 text-white/60 text-sm">
              {totalClients > 0
                ? `${totalClients} client${totalClients !== 1 ? "s" : ""} in the program`
                : "No clients assigned yet"}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" data-testid="button-profile-menu">
                <UserCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{(user as any)?.name || "Account"}</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{(user as any)?.name || "Mentor"}</p>
                  <p className="text-xs text-muted-foreground">{(user as any)?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/change-password")} data-testid="menu-change-password">
                <Key className="h-4 w-4 mr-2" /> Change Password
              </DropdownMenuItem>
              {!subscriptionCancelledButActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowCancelDialog(true)} className="text-destructive focus:text-destructive" data-testid="menu-cancel-subscription">
                    <XCircle className="h-4 w-4 mr-2" /> Cancel Subscription
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                <LogOut className="h-4 w-4 mr-2" /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stat strip inside hero */}
        {totalClients > 0 && (
          <div className="mx-auto max-w-5xl mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-3 flex items-center gap-3">
              <Users className="h-5 w-5 text-cyan-400 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold text-white">{totalClients}</p>
                <p className="text-xs text-white/50">Clients</p>
              </div>
            </div>
            <div className="rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-3 flex items-center gap-3">
              <Bell className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold text-white">{totalUnreviewed}</p>
                <p className="text-xs text-white/50">To Review</p>
              </div>
            </div>
            <div
              className={`rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-3 flex items-center gap-3 ${needsAttentionCount > 0 ? "cursor-pointer hover:ring-red-400/50 hover:bg-white/[0.15] transition-all" : ""}`}
              onClick={() => {
                if (needsAttentionCount > 0) {
                  const firstFlagged = sortedClients.find(c => getClientStatus(c) === "Needs Attention");
                  if (firstFlagged) {
                    setLocation(`/therapist/clients/${firstFlagged.id}?tab=${getBestAttentionTab(String(firstFlagged.id))}`);
                  }
                }
              }}
              data-testid="card-needs-attention-summary"
            >
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${needsAttentionCount > 0 ? "text-red-400" : "text-white/30"}`} />
              <div>
                <p className={`text-2xl font-bold ${needsAttentionCount > 0 ? "text-red-300" : "text-white"}`}>{needsAttentionCount}</p>
                <p className="text-xs text-white/50">Need Attention</p>
              </div>
              {needsAttentionCount > 0 && <ChevronRight className="h-4 w-4 text-white/30 ml-auto" />}
            </div>
          </div>
        )}
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {subscriptionCancelledButActive && subscriptionData?.periodEnd && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm" data-testid="banner-subscription-ending">
            <span className="font-semibold">Subscription Ending: </span>
            <span className="text-muted-foreground">Full access until {new Date(subscriptionData.periodEnd).toLocaleDateString()}.</span>
          </div>
        )}

        {/* Client list */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h2 className="text-lg font-semibold">
              Your Clients
              {allClients.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">({allClients.length})</span>
              )}
            </h2>
            {allClients.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                  data-testid="input-client-search"
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : sortedClients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 opacity-20" />
                <p className="font-semibold text-lg">No clients yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {searchQuery ? "No clients match your search." : "Contact your administrator to get clients assigned to you."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedClients.map((client) => {
                const status = getClientStatus(client);
                const clientId = String(client.id);
                const reviewCount = combinedReviewCounts[clientId] || 0;
                const autopsyCount = unreviewedCounts[clientId] || 0;
                const completedCount = client.completedWeeks.length;
                const progressPct = Math.round((completedCount / 16) * 100);
                const isNeedsAttention = status === "Needs Attention";
                const isBehind = status === "Behind" || status === "Behind (Nudged)";
                const isNudged = status === "Behind (Nudged)";
                const isOnTrack = status === "On Track";

                return (
                  <div
                    key={client.id}
                    className={`rounded-xl border bg-card p-4 cursor-pointer hover-elevate transition-all ${isNeedsAttention ? "border-amber-200 dark:border-amber-800" : isBehind ? "border-slate-200 dark:border-slate-800" : ""}`}
                    onClick={() => setLocation(`/therapist/clients/${client.id}`)}
                    data-testid={`row-client-${client.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        {/* Avatar */}
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isNeedsAttention ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" :
                          isOnTrack ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {(client.name || client.email).charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Name + badges row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{client.name || client.email}</p>
                            {isNeedsAttention && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-700 dark:text-amber-400 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/therapist/clients/${client.id}?tab=${getBestAttentionTab(clientId)}`);
                                }}
                                data-testid={`badge-needs-attention-${client.id}`}
                              >
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                Needs Attention
                              </Badge>
                            )}
                            {isBehind && (
                              <Badge
                                variant={isNudged ? "outline" : "secondary"}
                                className={`text-[10px] px-1.5 py-0 cursor-pointer transition-colors ${
                                  isNudged 
                                    ? "border-blue-400 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                                    : "border-slate-300 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/therapist/clients/${client.id}?tab=guidance&action=nudge`);
                                }}
                                data-testid={`badge-behind-${client.id}`}
                              >
                                {isNudged ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <Clock className="h-2.5 w-2.5 mr-0.5" />}
                                {isNudged ? "Behind (Nudged)" : "Behind Pace"}
                              </Badge>
                            )}
                            {status !== "Pending" && !isNeedsAttention && !isBehind && (
                              <Badge
                                variant={isOnTrack ? "outline" : "secondary"}
                                className={`text-[10px] px-1.5 py-0 ${
                                  isOnTrack ? "border-green-400 text-green-700 dark:text-green-400" : ""
                                }`}
                              >
                                {isOnTrack && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                                {status}
                              </Badge>
                            )}
                            {autopsyCount > 0 && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0" data-testid={`badge-autopsy-alert-${client.id}`}>
                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                {autopsyCount} autopsy
                              </Badge>
                            )}
                            {reviewCount > 0 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0" data-testid={`badge-unreviewed-items-${client.id}`}>
                                {reviewCount} to review
                              </Badge>
                            )}
                          </div>

                          {/* Email + meta row */}
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{client.email}</p>

                          {/* Progress row */}
                          <div className="flex items-center gap-3 mt-2.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <BookOpen className="h-3 w-3" />
                              <span>Week {completedCount}/16</span>
                            </div>
                            <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isNeedsAttention ? "bg-amber-500" : isBehind ? "bg-slate-400" : isOnTrack ? "bg-green-500" : "bg-primary"}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{progressPct}%</span>
                            {client.startDate && (
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                <Activity className="h-3 w-3 inline mr-0.5" />
                                Started {new Date(client.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to cancel your subscription?</p>
              <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
                <li>Your subscription remains active until the end of your billing period</li>
                <li>No refunds will be issued for unused time</li>
                <li>You will lose dashboard access after the billing period ends</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-keep-subscription">Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelSubscriptionMutation.mutate()}
              className="bg-destructive text-destructive-foreground"
              disabled={cancelSubscriptionMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelSubscriptionMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelling...</> : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  id: number;
  name: string;
  email: string;
  startDate: string | null;
  completedWeeks: number[];
  currentWeek: number;
  lastActivity: string | null;
};

export default function TherapistHome() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const subscriptionConfirmedRef = useRef(false);
  const isStaff = user?.role === "admin" || user?.role === "therapist";

  const [draftClientId, setDraftClientId] = useState("");
  const [draftFocus, setDraftFocus] = useState("");
  const [draftTone, setDraftTone] = useState<"neutral" | "direct" | "warm">(
    "neutral",
  );
  const [draftConstraints, setDraftConstraints] = useState(
    "Avoid shame language. No diagnosis. No risk scoring.",
  );
  const [draftText, setDraftText] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);

  async function generateStaffDraft() {
    if (!draftClientId.trim()) {
      toast({
        title: "Client ID required",
        description: "Enter a client ID to generate a draft.",
      });
      return;
    }
    if (!draftFocus.trim()) {
      toast({
        title: "Focus required",
        description: "Enter what you want the draft to be about.",
      });
      return;
    }

    setDraftLoading(true);
    setDraftText("");

    try {
      const res = await apiRequest(
        "POST",
        `/api/staff/clients/${encodeURIComponent(draftClientId.trim())}/ai-draft`,
        {
          focus: draftFocus.trim(),
          tone: draftTone,
          constraints: draftConstraints.trim(),
        },
      );

      const data = await res.json();
      setDraftText(data?.draftText || "");
    } catch (err) {
      console.error(err);
      toast({
        title: "Draft failed",
        description: "Could not generate a draft. Check server logs.",
      });
    } finally {
      setDraftLoading(false);
    }
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentStatus = searchParams.get("payment");

    if (paymentStatus === "success" && !subscriptionConfirmedRef.current) {
      subscriptionConfirmedRef.current = true;
      toast({
        title: "Subscription Activated",
        description: "Welcome! Your mentor subscription is now active.",
      });
      window.history.replaceState({}, "", "/therapist-home");
      queryClient.invalidateQueries({
        queryKey: ["/api/payments/subscription"],
      });
    } else if (paymentStatus === "cancelled") {
      window.history.replaceState({}, "", "/therapist-home");
    }
  }, [toast]);

  const { data: subscriptionData, isLoading: loadingSubscription } = useQuery<{
    subscription: any;
    allFeesWaived: boolean;
    cancelAtPeriodEnd?: boolean;
    periodEnd?: string | null;
  }>({
    queryKey: ["/api/payments/subscription"],
    staleTime: 0,
    refetchOnMount: "always",
  });

  const subscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        "/api/payments/checkout/subscription",
        {},
      );
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Checkout Error",
        description: "Failed to start subscription checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        "/api/account/cancel-subscription",
        {},
      );
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Cancelled",
        description: data.accessEndsAt
          ? `Your subscription will remain active until ${new Date(data.accessEndsAt).toLocaleDateString()}. No refunds will be issued.`
          : "Your subscription has been cancelled. No refunds will be issued.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/payments/subscription"],
      });
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const hasActiveSubscription =
    subscriptionData?.subscription?.status === "active" ||
    subscriptionData?.subscription?.status === "trialing" ||
    subscriptionData?.allFeesWaived === true;

  const subscriptionCancelledButActive =
    hasActiveSubscription && subscriptionData?.cancelAtPeriodEnd === true;

  const { data: clientsData, isLoading } = useQuery<{
    clients: ClientWithProgress[];
  }>({
    queryKey: ["/api/therapist/clients"],
    enabled: hasActiveSubscription,
  });

  const { data: unreviewedAutopsiesData } = useQuery<{
    unreviewedCounts: Record<string, number>;
  }>({
    queryKey: ["/api/therapist/unreviewed-autopsies"],
    enabled: hasActiveSubscription,
  });
  const unreviewedCounts = unreviewedAutopsiesData?.unreviewedCounts || {};

  const { data: unreviewedItemsData } = useQuery<{
    unreviewedItemCounts: Record<string, number>;
  }>({
    queryKey: ["/api/therapist/unreviewed-items"],
    enabled: hasActiveSubscription,
  });
  const unreviewedItemCounts = unreviewedItemsData?.unreviewedItemCounts || {};

  const { data: pendingReviewsData } = useQuery<{
    pendingReviews: Array<{ clientId: string; weekNumber: number }>;
  }>({
    queryKey: ["/api/therapist/pending-reviews"],
    enabled: hasActiveSubscription,
  });
  const pendingReviewCounts: Record<string, number> = {};
  for (const pr of pendingReviewsData?.pendingReviews || []) {
    pendingReviewCounts[pr.clientId] = (pendingReviewCounts[pr.clientId] || 0) + 1;
  }

  const combinedReviewCounts: Record<string, number> = { ...unreviewedItemCounts };
  for (const [clientId, count] of Object.entries(pendingReviewCounts)) {
    combinedReviewCounts[clientId] = (combinedReviewCounts[clientId] || 0) + count;
  }

  const allClients = clientsData?.clients || [];

  const clients = searchQuery.trim()
    ? allClients.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allClients;

  const getClientStatus = (client: ClientWithProgress) => {
    if (!client.startDate) return "Pending";
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(client.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const expectedWeek = Math.min(16, Math.floor(daysSinceStart / 7) + 1);

    if (client.completedWeeks.length >= expectedWeek) return "On Track";
    if (client.completedWeeks.length < expectedWeek - 1)
      return "Needs Attention";
    return "Active";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Needs Attention":
        return <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
      case "On Track":
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
      case "Active":
        return <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const sortedClients = [...clients].sort((a, b) => {
    const statusA = getClientStatus(a);
    const statusB = getClientStatus(b);
    const priority = (status: string) =>
      status === "Needs Attention"
        ? 0
        : status === "Active"
          ? 1
          : status === "On Track"
            ? 2
            : 3;
    return priority(statusA) - priority(statusB);
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setLocation("/login");
  };

  if (loadingSubscription) {
    return (
      <div className="min-h-screen bg-background px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-5xl flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-background px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
            <h1 className="text-2xl font-bold" data-testid="text-therapist-title">
              Mentor Dashboard
            </h1>
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <Card data-testid="card-subscription-required">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <CreditCard className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Subscription Required
              </h3>
              <Badge
                variant="secondary"
                data-testid="badge-first-month-free"
                className="mb-4"
              >
                First Month FREE
              </Badge>
              <p className="max-w-md text-muted-foreground mb-8">
                Start with a{" "}
                <span className="font-semibold text-foreground">
                  30-day free trial
                </span>
                , then{" "}
                <span className="font-semibold text-foreground">$49/month</span>{" "}
                to access the mentor dashboard, manage your clients, and monitor
                their progress through the 16-week program.
              </p>
              <ul className="text-left text-sm text-muted-foreground space-y-3 mb-8 w-full max-w-xs">
                <li className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Unlimited client management
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Real-time progress monitoring
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Client check-in data access
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Cancel anytime
                </li>
              </ul>
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => subscriptionMutation.mutate()}
                disabled={subscriptionMutation.isPending}
                data-testid="button-subscribe"
              >
                {subscriptionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Start Free Trial
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {subscriptionCancelledButActive && subscriptionData?.periodEnd && (
          <Card
            className="border-amber-200 dark:border-amber-800"
            data-testid="banner-subscription-ending"
          >
            <CardContent className="py-4">
              <p className="font-medium text-sm">
                Subscription Ending
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your subscription will end on{" "}
                {new Date(subscriptionData.periodEnd).toLocaleDateString()}. You
                will retain full access until then.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold"
              data-testid="text-therapist-title"
            >
              Welcome back, {(user as any)?.name || 'Mentor'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your clients and monitor their progress
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-profile-menu">
                <UserCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">
                  {(user as any)?.name || "Account"}
                </span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {(user as any)?.name || "Mentor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(user as any)?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLocation("/change-password")}
                data-testid="menu-change-password"
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </DropdownMenuItem>
              {!subscriptionCancelledButActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowCancelDialog(true)}
                    className="text-destructive focus:text-destructive"
                    data-testid="menu-cancel-subscription"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                data-testid="menu-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>Are you sure you want to cancel your subscription?</p>
                  <Card className="mt-4 border-amber-200 dark:border-amber-800">
                    <CardContent className="py-3">
                      <p className="font-medium text-sm">
                        Important:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside space-y-1">
                        <li>
                          Your subscription will remain active until the end of
                          your billing period
                        </li>
                        <li>No refunds will be issued for any unused time</li>
                        <li>
                          You will lose access to the dashboard after your billing
                          period ends
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-keep-subscription">
                  Keep Subscription
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  className="bg-destructive text-destructive-foreground"
                  disabled={cancelSubscriptionMutation.isPending}
                  data-testid="button-confirm-cancel"
                >
                  {cancelSubscriptionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">
                Your Clients
                {allClients.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({allClients.length})
                  </span>
                )}
              </CardTitle>
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
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : clients.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 h-8 w-8 opacity-40" />
                <p className="font-medium">No clients assigned yet</p>
                <p className="text-sm mt-1">
                  Contact your administrator to get clients assigned.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table view */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 px-3 font-medium">Client</th>
                        <th className="text-left py-3 px-3 font-medium">Email</th>
                        <th className="text-left py-3 px-3 font-medium">Progress</th>
                        <th className="text-left py-3 px-3 font-medium">Status</th>
                        <th className="text-left py-3 px-3 font-medium">Start Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedClients.map((client) => {
                        const status = getClientStatus(client);
                        return (
                          <tr
                            key={client.id}
                            className="border-b last:border-b-0 hover-elevate cursor-pointer"
                            onClick={() =>
                              setLocation(`/therapist/clients/${client.id}`)
                            }
                            data-testid={`row-client-${client.id}`}
                          >
                            <td className="py-3 px-3 font-medium">
                              <span className="flex items-center gap-2 flex-wrap">
                                {client.name}
                                {combinedReviewCounts[String(client.id)] > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                    data-testid={`badge-unreviewed-items-${client.id}`}
                                  >
                                    {combinedReviewCounts[String(client.id)]} to review
                                  </Badge>
                                )}
                                {unreviewedCounts[String(client.id)] > 0 && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px]"
                                    data-testid={`badge-autopsy-alert-${client.id}`}
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-0.5" />
                                    {unreviewedCounts[String(client.id)]} autopsy
                                  </Badge>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">
                              {client.email}
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm">Week {client.currentWeek} / 16</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({client.completedWeeks.length} done)
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="flex items-center gap-1.5 text-sm">
                                {getStatusIcon(status)}
                                {status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">
                              {client.startDate
                                ? new Date(client.startDate).toLocaleDateString()
                                : "Not set"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden space-y-3">
                  {sortedClients.map((client) => {
                    const status = getClientStatus(client);
                    return (
                      <div
                        key={client.id}
                        className="rounded-lg border p-4 hover-elevate cursor-pointer"
                        onClick={() =>
                          setLocation(`/therapist/clients/${client.id}`)
                        }
                        data-testid={`row-client-${client.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{client.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        </div>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="text-sm text-muted-foreground">
                            Week {client.currentWeek}/16
                          </span>
                          <span className="flex items-center gap-1 text-sm">
                            {getStatusIcon(status)}
                            <span className="text-muted-foreground">{status}</span>
                          </span>
                          {combinedReviewCounts[String(client.id)] > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px]"
                              data-testid={`badge-unreviewed-items-${client.id}`}
                            >
                              {combinedReviewCounts[String(client.id)]} to review
                            </Badge>
                          )}
                          {unreviewedCounts[String(client.id)] > 0 && (
                            <Badge
                              variant="destructive"
                              className="text-[10px]"
                              data-testid={`badge-autopsy-alert-${client.id}`}
                            >
                              <AlertTriangle className="h-3 w-3 mr-0.5" />
                              autopsy
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, LogOut, Key, Search, CreditCard, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const subscriptionConfirmedRef = useRef(false);

  // Handle subscription success callback
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentStatus = searchParams.get('payment');
    
    if (paymentStatus === 'success' && !subscriptionConfirmedRef.current) {
      subscriptionConfirmedRef.current = true;
      toast({
        title: "Subscription Activated",
        description: "Welcome! Your therapist subscription is now active.",
      });
      // Clear URL and refresh subscription data
      window.history.replaceState({}, '', '/therapist-home');
      queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription'] });
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, '', '/therapist-home');
    }
  }, [toast]);

  // Check subscription status
  const { data: subscriptionData, isLoading: loadingSubscription } = useQuery<{ subscription: any; allFeesWaived: boolean }>({
    queryKey: ['/api/payments/subscription'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Subscription checkout mutation
  const subscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/checkout/subscription", {});
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

  const hasActiveSubscription = subscriptionData?.subscription?.status === 'active' || 
                                 subscriptionData?.subscription?.status === 'trialing' ||
                                 subscriptionData?.allFeesWaived === true;

  const { data: clientsData, isLoading } = useQuery<{ clients: ClientWithProgress[] }>({
    queryKey: ['/api/therapist/clients'],
    enabled: hasActiveSubscription, // Only fetch clients if subscribed or fees waived
  });

  const allClients = clientsData?.clients || [];
  
  // Filter clients based on search query
  const clients = searchQuery.trim()
    ? allClients.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allClients;

  const getClientStatus = (client: ClientWithProgress) => {
    if (!client.startDate) return "Pending";
    const daysSinceStart = Math.floor((Date.now() - new Date(client.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const expectedWeek = Math.min(16, Math.floor(daysSinceStart / 7) + 1);
    
    if (client.completedWeeks.length >= expectedWeek) return "On Track";
    if (client.completedWeeks.length < expectedWeek - 1) return "Needs Attention";
    return "Active";
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Needs Attention":
        return "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:bg-amber-950";
      case "On Track":
      case "Active":
        return "border-green-300 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-400 dark:bg-green-950";
      case "Pending":
        return "border-muted text-muted-foreground bg-muted/40";
      default:
        return "";
    }
  };

  const sortedClients = [...clients].sort((a, b) => {
    const statusA = getClientStatus(a);
    const statusB = getClientStatus(b);
    const priority = (status: string) =>
      status === "Needs Attention" ? 0 : status === "Active" ? 1 : status === "On Track" ? 2 : 3;
    return priority(statusA) - priority(statusB);
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setLocation("/login");
  };

  // Show loading while checking subscription
  if (loadingSubscription) {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-5xl flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show subscription wall if no active subscription
  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Therapist Dashboard</h1>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
          
          <Card data-testid="card-subscription-required">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Subscription Required</h3>
              <div className="mb-4 rounded-lg border-2 border-green-600/30 dark:border-green-500/30 bg-green-600/10 dark:bg-green-500/10 px-4 py-2">
                <Badge className="bg-green-600 dark:bg-green-600 text-white" data-testid="badge-first-month-free">
                  First Month FREE
                </Badge>
              </div>
              <p className="max-w-md text-muted-foreground mb-6">
                Start with a <span className="font-semibold text-foreground">30-day free trial</span>, then <span className="font-semibold text-foreground">$49/month</span> to access the therapist dashboard, manage your clients, and monitor their progress through the 16-week program.
              </p>
              <div className="space-y-4">
                <ul className="text-left text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Unlimited client management
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Real-time progress monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Client check-in data access
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Cancel anytime
                  </li>
                </ul>
                <Button
                  size="lg"
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-therapist-title">Therapist Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your assigned clients and monitor their progress
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/change-password">
              <Button variant="ghost" size="icon" title="Change Password" data-testid="button-change-password">
                <Key className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Assigned Clients
                {allClients.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {allClients.length}
                  </Badge>
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
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : clients.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No clients assigned to you yet.</p>
                <p className="text-sm">Contact your administrator to get clients assigned.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Client Name</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Progress</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedClients.map((client) => {
                      const status = getClientStatus(client);
                      return (
                        <tr
                          key={client.id}
                          className="border-b hover-elevate cursor-pointer"
                          onClick={() => setLocation(`/therapist/clients/${client.id}`)}
                          data-testid={`row-client-${client.id}`}
                        >
                          <td className="p-3 font-medium">{client.name}</td>
                          <td className="p-3 text-muted-foreground">{client.email}</td>
                          <td className="p-3">
                            Week {client.currentWeek} / 16
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({client.completedWeeks.length} completed)
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={getStatusBadgeStyle(status)}
                            >
                              {status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {client.startDate 
                              ? new Date(client.startDate).toLocaleDateString()
                              : "Not set"
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

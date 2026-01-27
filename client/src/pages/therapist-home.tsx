import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, LogOut, Key } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

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

  const { data: clientsData, isLoading } = useQuery<{ clients: ClientWithProgress[] }>({
    queryKey: ['/api/therapist/clients'],
  });

  const clients = clientsData?.clients || [];

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
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Assigned Clients
            </CardTitle>
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

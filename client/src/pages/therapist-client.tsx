import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

type ClientProgress = {
  completedWeeks: number[];
  checkins: Array<{
    dateKey: string;
    morningChecks: string | null;
    eveningReflection: string | null;
    triggers: string | null;
    copingUsed: string | null;
    mood: number | null;
    urgeLevel: number | null;
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

  const { data: clientsData } = useQuery<{ clients: ClientInfo[] }>({
    queryKey: ['/api/therapist/clients'],
  });

  const { data: progressData, isLoading: loadingProgress } = useQuery<ClientProgress>({
    queryKey: ['/api/therapist/clients', clientId, 'progress'],
    enabled: !!clientId,
  });

  const client = clientsData?.clients?.find(c => c.id === parseInt(clientId || "0"));
  const completedWeeks = progressData?.completedWeeks || [];
  const checkins = progressData?.checkins || [];

  const getWeekStatus = (weekNum: number) => {
    if (completedWeeks.includes(weekNum)) return "completed";
    if (client?.startDate) {
      const daysSinceStart = Math.floor((Date.now() - new Date(client.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const daysRequired = (weekNum - 1) * 7;
      if (daysSinceStart >= daysRequired) return "available";
    }
    return "locked";
  };

  const recentCheckins = checkins.slice(0, 7);
  const averageMood = checkins.length > 0 
    ? checkins.filter(c => c.mood !== null).reduce((acc, c) => acc + (c.mood || 0), 0) / checkins.filter(c => c.mood !== null).length
    : null;
  const averageUrge = checkins.length > 0
    ? checkins.filter(c => c.urgeLevel !== null).reduce((acc, c) => acc + (c.urgeLevel || 0), 0) / checkins.filter(c => c.urgeLevel !== null).length
    : null;

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/therapist")}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>

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
                  Client Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium" data-testid="text-client-name">{client.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {client.startDate 
                        ? new Date(client.startDate).toLocaleDateString()
                        : "Not set"
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Week</p>
                    <p className="font-medium">Week {client.currentWeek} of 16</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProgress ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
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
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span>Completed ({completedWeeks.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span>Available but not completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted" />
                    <span>Locked</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Check-in Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {checkins.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No check-ins recorded yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Average Mood (last 30 days)</p>
                        <p className="text-2xl font-bold">
                          {averageMood !== null ? averageMood.toFixed(1) : "N/A"} / 10
                        </p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Average Urge Level (last 30 days)</p>
                        <p className="text-2xl font-bold">
                          {averageUrge !== null ? averageUrge.toFixed(1) : "N/A"} / 10
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 font-medium">Recent Check-ins</h4>
                      <div className="space-y-2">
                        {recentCheckins.map((checkin) => (
                          <div
                            key={checkin.dateKey}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div>
                              <span className="font-medium">
                                {new Date(checkin.dateKey).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-muted-foreground">
                                Mood: <span className="font-medium text-foreground">{checkin.mood ?? "-"}</span>
                              </div>
                              <div className="text-muted-foreground">
                                Urge: <span className="font-medium text-foreground">{checkin.urgeLevel ?? "-"}</span>
                              </div>
                              {checkin.morningChecks && (
                                <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-400 dark:bg-green-950">
                                  AM
                                </Badge>
                              )}
                              {checkin.eveningReflection && (
                                <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:bg-blue-950">
                                  PM
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

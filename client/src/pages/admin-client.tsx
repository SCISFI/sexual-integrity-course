import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Calendar, CheckCircle2, Clock, FileText, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ClientProgress = {
  client: {
    id: string;
    name: string;
    email: string;
    startDate: string | null;
    allFeesWaived: boolean;
  };
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
  therapists: Array<{ id: string; name: string | null; email: string }>;
};

export default function AdminClientPage() {
  const [, setLocation] = useLocation();
  const { clientId } = useParams<{ clientId: string }>();

  const { data, isLoading, error } = useQuery<ClientProgress>({
    queryKey: ['/api/admin/clients', clientId, 'progress'],
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <Button variant="ghost" onClick={() => setLocation("/admin")} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <Card className="mt-6">
            <CardContent className="py-8 text-center text-muted-foreground">
              Client not found or error loading data.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { client, completedWeeks, checkins, reflections, therapists } = data;

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/admin")} data-testid="button-back">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {client.name || "Unnamed Client"}
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
                <p className="font-medium">{client.startDate || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Therapist(s)</p>
                <p className="font-medium">
                  {therapists.length > 0 
                    ? therapists.map(t => t.name || t.email).join(", ") 
                    : "None assigned"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {client.allFeesWaived && (
                <Badge variant="secondary">All Fees Waived</Badge>
              )}
              <Badge variant="outline">{completedWeeks.length} / 16 Weeks Completed</Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="progress" className="w-full">
          <TabsList>
            <TabsTrigger value="progress">Week Progress</TabsTrigger>
            <TabsTrigger value="checkins">Check-ins</TabsTrigger>
            <TabsTrigger value="reflections">Reflections</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Week Completion Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((week) => {
                    const isCompleted = completedWeeks.includes(week);
                    return (
                      <div
                        key={week}
                        className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-sm font-medium ${
                          isCompleted
                            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "border-muted bg-muted/20 text-muted-foreground"
                        }`}
                        data-testid={`week-status-${week}`}
                      >
                        {week}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Check-ins ({checkins.length} total)
                </CardTitle>
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
                        {checkin.morningChecks && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Morning</p>
                            <p className="text-sm">{checkin.morningChecks}</p>
                          </div>
                        )}
                        {checkin.eveningChecks && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Evening</p>
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
                        <h4 className="font-medium mb-3">Week {reflection.weekNumber}</h4>
                        <div className="space-y-3">
                          {reflection.q1 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Key insight</p>
                              <p className="text-sm">{reflection.q1}</p>
                            </div>
                          )}
                          {reflection.q2 && (
                            <div>
                              <p className="text-xs text-muted-foreground">What went well</p>
                              <p className="text-sm">{reflection.q2}</p>
                            </div>
                          )}
                          {reflection.q3 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Challenges faced</p>
                              <p className="text-sm">{reflection.q3}</p>
                            </div>
                          )}
                          {reflection.q4 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Goals for next week</p>
                              <p className="text-sm">{reflection.q4}</p>
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
        </Tabs>
      </div>
    </div>
  );
}

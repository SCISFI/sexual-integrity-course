import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Calendar,
  CheckCircle2,
  MessageSquare,
  BookOpen,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function TherapistClientPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/therapist/clients/${id}/progress`],
    enabled: !!id,
  });

  // Strict role check to match original file security
  if (user && (user as any).role !== "therapist") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Error Loading Client Data</h2>
        <Button className="mt-4" onClick={() => setLocation("/therapist")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const { client, completedWeeks = [], checkins = [], reflections = [] } = data;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/therapist")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{client.name || "Client Record"}</CardTitle>
              <p className="text-sm text-muted-foreground">{client.email}</p>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="progress">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">Weekly Progress</TabsTrigger>
            <TabsTrigger value="checkins">Daily Check-ins</TabsTrigger>
            <TabsTrigger value="reflections">Weekly Reflections</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                  Course Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                          completedWeeks.includes(i + 1)
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Week
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkins" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-blue-500" />
                  Daily History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checkins.length === 0 ? (
                  <p className="text-muted-foreground">
                    No check-in data recorded.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {checkins.map((checkin: any) => (
                      <div
                        key={checkin.id}
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <div>
                          <p className="font-medium">{checkin.dateKey}</p>
                          <p className="text-sm text-muted-foreground">
                            Mood: {checkin.moodLevel} | Urge:{" "}
                            {checkin.urgeLevel}
                          </p>
                        </div>
                        <Badge
                          variant={
                            checkin.urgeLevel > 7 ? "destructive" : "secondary"
                          }
                        >
                          Urge: {checkin.urgeLevel}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reflections" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-purple-500" />
                  Written Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reflections.length === 0 ? (
                  <p className="text-muted-foreground">
                    No reflections submitted yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {reflections.map((reflection: any) => (
                      <div key={reflection.id} className="space-y-2">
                        <Badge>Week {reflection.weekNumber}</Badge>
                        <p className="text-sm font-semibold italic">
                          "{reflection.q1}"
                        </p>
                        <hr />
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

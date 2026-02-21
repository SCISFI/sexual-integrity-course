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
  Activity,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function AdminClientPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/admin/clients/${id}/progress`],
    enabled: !!id,
  });

  if (isLoading)
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );

  if (error || !data?.client)
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Error Loading Profile</h2>
        <Button className="mt-4" onClick={() => setLocation("/admin")}>
          Back to Dashboard
        </Button>
      </div>
    );

  const {
    client,
    checkins = [],
    reflections = [],
    completedWeeks = [],
    relapseAutopsies = [],
  } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{client.name}</CardTitle>
              <p className="text-muted-foreground">{client.email}</p>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checkins">Check-ins</TabsTrigger>
            <TabsTrigger value="reflections">Reflections</TabsTrigger>
            <TabsTrigger value="autopsies" className="text-red-600">
              Autopsies ({relapseAutopsies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Program Progress</h3>
                <p>Completed Weeks: {completedWeeks.length} / 16</p>
                <div className="flex gap-2 mt-2">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-4 w-4 rounded-sm ${completedWeeks.includes(i + 1) ? "bg-green-500" : "bg-slate-200"}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkins" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-4 flex items-center">
                  <Activity className="mr-2 h-5 w-5" /> Recent Activity
                </h3>
                {checkins.length === 0 ? (
                  <p className="text-muted-foreground">No recent check-ins.</p>
                ) : (
                  <div className="space-y-2">
                    {checkins.slice(0, 10).map((c: any) => (
                      <div
                        key={c.id}
                        className="text-sm border-b pb-2 flex justify-between"
                      >
                        <span>{c.dateKey}</span>
                        <span className="font-medium">
                          Mood: {c.moodLevel} | Urge: {c.urgeLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reflections" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-4 flex items-center">
                  <FileText className="mr-2 h-5 w-5" /> Weekly Insights
                </h3>
                {reflections.length === 0 ? (
                  <p className="text-muted-foreground">
                    No reflections submitted.
                  </p>
                ) : (
                  reflections.map((r: any) => (
                    <div key={r.id} className="mb-4 text-sm border-b pb-2">
                      <p className="font-bold">Week {r.weekNumber}</p>
                      <p className="italic">"{r.q1?.substring(0, 100)}..."</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="autopsies" className="mt-4">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-red-700">
                  Relapse Autopsy History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {relapseAutopsies.length === 0 ? (
                  <p className="text-muted-foreground">No autopsy records.</p>
                ) : (
                  relapseAutopsies.map((a: any) => (
                    <div key={a.id} className="border-b pb-6 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="destructive" className="uppercase">
                          {a.lapseOrRelapse}
                        </Badge>
                        <span className="text-sm text-slate-500 font-medium">
                          {a.date}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">
                            The Situation
                          </p>
                          <p className="text-slate-700">
                            {a.situationDescription}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded border border-green-100">
                          <p className="text-xs font-bold text-green-600 uppercase">
                            The Prevention Plan
                          </p>
                          <p className="text-green-800 italic">
                            {a.preventionPlan}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, AlertCircle } from "lucide-react";

export default function AdminClientPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  // This fetches the data directly from the bridge we built in routes.ts
  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/admin/clients/${id}/progress`],
    enabled: !!id,
    retry: 1,
  });

  if (isLoading)
    return (
      <div className="p-8 text-center">
        <Skeleton className="h-20 w-full mb-4" />
        <p>Fetching Client Records...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Connection Error</h2>
        <p className="text-muted-foreground">
          The server is awake, but the data request failed.
        </p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );

  // Fallback values so the screen NEVER goes blank
  const clientName = data?.client?.name || "Member";
  const clientEmail = data?.client?.email || "No email on file";
  const autopsies = data?.relapseAutopsies || [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/admin")}
          className="bg-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center space-x-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{clientName}</CardTitle>
              <p className="text-muted-foreground">{clientEmail}</p>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center">
            Relapse Autopsies
            <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
              {autopsies.length}
            </span>
          </h3>

          {autopsies.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No autopsy records found for this client.
              </CardContent>
            </Card>
          ) : (
            autopsies.map((a: any) => (
              <Card
                key={a.id}
                className="overflow-hidden border-l-4 border-l-red-500"
              >
                <CardHeader className="bg-slate-50/50 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-red-600 tracking-tight">
                      {a.lapseOrRelapse}
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                      {a.date}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Situation Description
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      {a.situationDescription}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md border border-green-100">
                    <p className="text-xs font-bold text-green-600 uppercase">
                      Prevention Plan
                    </p>
                    <p className="text-green-800 italic">{a.preventionPlan}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

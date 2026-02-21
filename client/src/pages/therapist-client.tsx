import { useState, useEffect } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  MessageSquare,
  Sparkles,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TherapistClient() {
  const [, setLocation] = useLocation();
  const { id: clientId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [newFeedback, setNewFeedback] = useState("");
  const [feedbackAutopsyId, setFeedbackAutopsyId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("autopsies");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // Get current user to check if Admin or Mentor
  const { data: authData } = useQuery<{ user: { role: string } }>({
    queryKey: ["/api/auth/me"],
  });

  const {
    data: progressData,
    isLoading: loadingProgress,
    error,
  } = useQuery<any>({
    queryKey: ["/api/therapist/clients", clientId, "progress"],
    enabled: !!clientId,
    retry: false,
  });

  const handleGenerateAIDraft = async () => {
    if (!clientId) return;
    setIsGeneratingDraft(true);
    try {
      const res = await apiRequest(
        "POST",
        `/api/therapist/clients/${clientId}/generate-feedback`,
        {
          relapseAutopsyId: feedbackAutopsyId || undefined,
        },
      );
      if (!res.ok) throw new Error("Failed to generate draft");
      const data = await res.json();
      setNewFeedback(data.draft);
      toast({ title: "AI draft generated" });
    } catch (error) {
      toast({ title: "Draft generation failed", variant: "destructive" });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  if (loadingProgress)
    return (
      <div className="p-8">
        <Skeleton className="h-32 w-full" />
      </div>
    );

  // If there is an error, show it clearly instead of a blank page
  if (error || !progressData) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Data Access Error</h2>
        <p className="text-muted-foreground">
          The server returned: {(error as any)?.message || "No data available"}
        </p>
        <Button className="mt-4" onClick={() => setLocation("/admin")}>
          Return to Admin
        </Button>
      </div>
    );
  }

  const autopsies = progressData.relapseAutopsies || [];

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() =>
              setLocation(
                authData?.user.role === "admin" ? "/admin" : "/therapist",
              )
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {authData?.user.role === "admin" && <Badge>Admin View</Badge>}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="autopsies">Autopsies</TabsTrigger>
            <TabsTrigger value="feedback">Compose Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="autopsies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Autopsies</CardTitle>
              </CardHeader>
              <CardContent>
                {autopsies.length === 0 ? (
                  <p>No autopsies found.</p>
                ) : (
                  autopsies.map((a: any) => (
                    <div key={a.id} className="border-b py-4 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">
                          {a.date} - {a.lapseOrRelapse}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => {
                            setFeedbackAutopsyId(a.id);
                            setActiveTab("feedback");
                          }}
                        >
                          Give Feedback
                        </Button>
                      </div>
                      <p className="text-sm mt-2">
                        <strong>Situation:</strong> {a.situationDescription}
                      </p>
                      <p className="text-sm mt-1">
                        <strong>Plan:</strong> {a.preventionPlan}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Draft Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedbackAutopsyId && (
                  <Badge variant="destructive">
                    Focus: Autopsy #{feedbackAutopsyId}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  onClick={handleGenerateAIDraft}
                  disabled={isGeneratingDraft}
                >
                  {isGeneratingDraft ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate AI Draft
                </Button>
                <Textarea
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  placeholder="Feedback will appear here..."
                  className="min-h-[200px]"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

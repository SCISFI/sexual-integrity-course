import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockClientProgress = {
  currentWeek: 3,

  weeklyProgress: [
    {
      week: 1,
      reflectionSubmitted: true,
      therapistReview: "pending",
      notes: ["Onboarding reflection completed", "Safety plan introduced"],
      flagged: false,
    },
    {
      week: 2,
      reflectionSubmitted: true,
      therapistReview: "completed",
      notes: ["Trigger awareness emerging", "Accountability contact confirmed"],
      flagged: false,
    },
    {
      week: 3,
      reflectionSubmitted: false,
      therapistReview: "not_started",
      notes: ["Reflection overdue"],
      flagged: true,
    },
  ],

  mostRecentReflection: {
    week: 2,
    submittedAt: "2026-01-18",
    content: `This week I noticed how quickly I shut down when stress builds.
I did not act out, but I did avoid connection and stayed isolated longer than I should have.
I am beginning to see how loneliness shows up before urges do.`,
  },

  clinicalSignals: [
    "Missed reflection this week",
    "Increased avoidance language (self-reported)",
    "Accountability contact not confirmed",
  ],
};

export default function TherapistClient() {
  const [, params] = useRoute("/therapist/clients/:id");
  const [, setLocation] = useLocation();

  const clientId = params?.id ?? "unknown";

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Client Detail - ID {clientId}</h1>
          <Button
            variant="outline"
            onClick={() => setLocation("/therapist-home")}
          >
            Back to Therapist Home
          </Button>
        </div>

        <Tabs defaultValue="progress">
          <TabsList>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="notes">Therapist Notes</TabsTrigger>
            <TabsTrigger value="flags">Flags</TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Client Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <h2>Weekly Progress (Temporary)</h2>
                <div>Week 1 - Submitted</div>
                <div>Week 2 - Submitted</div>
                <div>Week 3 - Not submitted</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Private Therapist Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Your private notes will appear here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flags">
            <Card>
              <CardHeader>
                <CardTitle>Needs Attention</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Therapist-only attention flags live here.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

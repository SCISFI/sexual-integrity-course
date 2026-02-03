import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, Calendar, Heart, Brain, Shield, Loader2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DailyCheckItem {
  id: string;
  category: string;
  label: string;
  description?: string;
}

// Unified daily check-in items - complete once per day
const DAILY_ITEMS: DailyCheckItem[] = [
  { id: "no-acting-out", category: "Recovery", label: "Did not engage in compulsive sexual behavior today" },
  { id: "no-rituals", category: "Recovery", label: "Did not engage in ritualistic behaviors leading to acting out" },
  { id: "triggers-managed", category: "Recovery", label: "Successfully managed triggers when they occurred" },
  { id: "sleep", category: "Wellness", label: "Got adequate sleep (7-8 hours)", description: "Rest is crucial for self-regulation" },
  { id: "exercise", category: "Wellness", label: "Got physical exercise or movement" },
  { id: "connection", category: "Relationships", label: "Had meaningful connection with others" },
  { id: "values-aligned", category: "Values", label: "Took at least one values-aligned action" },
  { id: "honest", category: "Integrity", label: "Was honest in my interactions today" },
];

const HALT_ITEMS = [
  { id: "hungry", letter: "H", label: "Hungry", description: "Am I neglecting my physical needs?" },
  { id: "angry", letter: "A", label: "Angry", description: "Am I holding onto resentment or frustration?" },
  { id: "lonely", letter: "L", label: "Lonely", description: "Am I feeling isolated or disconnected?" },
  { id: "tired", letter: "T", label: "Tired", description: "Am I physically or emotionally exhausted?" },
];

export default function DailyCheckinPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dailyChecks, setDailyChecks] = useState<Record<string, boolean>>({});
  const [haltChecks, setHaltChecks] = useState<Record<string, boolean>>({});
  const [urgeLevel, setUrgeLevel] = useState([0]);
  const [moodLevel, setMoodLevel] = useState([5]);
  const [journalEntry, setJournalEntry] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const todayDate = new Date();
  const dateKey = todayDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const today = todayDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Fetch existing check-in data for today
  const { data: checkinData, isLoading } = useQuery<{ checkin: any }>({
    queryKey: ['/api/progress/checkin', dateKey],
  });

  // Load existing data when fetched
  useEffect(() => {
    if (checkinData?.checkin && !dataLoaded) {
      const c = checkinData.checkin;
      try {
        const halt = c.haltChecks ? JSON.parse(c.haltChecks) : [];
        // Daily checks are stored in eveningChecks column for compatibility
        const daily = c.eveningChecks ? JSON.parse(c.eveningChecks) : [];
        
        setHaltChecks(halt.reduce((acc: Record<string, boolean>, id: string) => ({ ...acc, [id]: true }), {}));
        setDailyChecks(daily.reduce((acc: Record<string, boolean>, id: string) => ({ ...acc, [id]: true }), {}));
        setUrgeLevel([c.urgeLevel ?? 0]);
        setMoodLevel([c.moodLevel ?? 5]);
        setJournalEntry(c.journalEntry || "");
      } catch (e) {
        console.error("Error parsing check-in data:", e);
      }
      setDataLoaded(true);
    }
  }, [checkinData, dataLoaded]);

  // Mutation to save check-in data
  const saveCheckinMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/progress/checkin/${dateKey}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress/checkin', dateKey] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/checkin-stats'] });
    },
  });

  const toggleDailyCheck = (id: string) => {
    setDailyChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleHaltCheck = (id: string) => {
    setHaltChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    const dailyCheckIds = Object.entries(dailyChecks).filter(([, v]) => v).map(([k]) => k);
    const haltCheckIds = Object.entries(haltChecks).filter(([, v]) => v).map(([k]) => k);
    
    try {
      await saveCheckinMutation.mutateAsync({
        morningChecks: [], // No longer used
        haltChecks: haltCheckIds,
        urgeLevel: urgeLevel[0],
        moodLevel: moodLevel[0],
        eveningChecks: dailyCheckIds, // Store unified daily checks here
        journalEntry,
      });
      setSubmitted(true);
      toast({
        title: "Check-in saved!",
        description: "Your daily check-in has been recorded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save check-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUrgeLabel = (level: number) => {
    if (level <= 2) return "Low";
    if (level <= 4) return "Mild";
    if (level <= 6) return "Moderate";
    if (level <= 8) return "High";
    return "Severe";
  };

  const getMoodLabel = (level: number) => {
    if (level <= 2) return "Very Low";
    if (level <= 4) return "Low";
    if (level <= 6) return "Neutral";
    if (level <= 8) return "Good";
    return "Excellent";
  };

  const anyHaltChecked = Object.values(haltChecks).some(v => v);
  const checkedCount = Object.values(dailyChecks).filter(v => v).length;
  const progressPercent = Math.round((checkedCount / DAILY_ITEMS.length) * 100);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3 sticky top-0 bg-background z-50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <div className="font-semibold">Daily Check-in</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {today}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {submitted ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
              <h2 className="text-2xl font-bold">Check-in Complete!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Great job taking time to reflect on your day. Self-awareness is a powerful tool in your recovery journey.
              </p>
              <div className="flex flex-col gap-2 pt-4 max-w-xs mx-auto">
                <Button onClick={() => setLocation("/dashboard")} data-testid="button-go-dashboard">
                  Return to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSubmitted(false);
                  }}
                  data-testid="button-edit-checkin"
                >
                  Edit Today's Check-in
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Instructions */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">
                  Complete this check-in <strong>once per day</strong>, anytime that works for you. 
                  Check the items that apply to your day so far. You can update it later if needed.
                </p>
              </CardContent>
            </Card>

            {/* Daily Recovery & Wellness Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Today's Check-in
                    </CardTitle>
                    <CardDescription>
                      Check all that apply to your day
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{checkedCount}/{DAILY_ITEMS.length}</div>
                    <div className="text-xs text-muted-foreground">{progressPercent}% complete</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {DAILY_ITEMS.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-3 rounded-lg hover-elevate cursor-pointer border"
                    onClick={() => toggleDailyCheck(item.id)}
                    data-testid={`daily-item-${item.id}`}
                  >
                    <Checkbox
                      id={`daily-${item.id}`}
                      checked={dailyChecks[item.id] || false}
                      onCheckedChange={() => toggleDailyCheck(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`checkbox-daily-${item.id}`}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`daily-${item.id}`}
                        className={`text-sm font-medium cursor-pointer ${dailyChecks[item.id] ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {item.label}
                      </label>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* HALT Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  HALT Check
                </CardTitle>
                <CardDescription>
                  Are you experiencing any of these vulnerability states? Check any that apply.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {HALT_ITEMS.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        haltChecks[item.id] 
                          ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' 
                          : 'hover-elevate'
                      }`}
                      onClick={() => toggleHaltCheck(item.id)}
                      data-testid={`halt-item-${item.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`halt-${item.id}`}
                          checked={haltChecks[item.id] || false}
                          onCheckedChange={() => toggleHaltCheck(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-halt-${item.id}`}
                        />
                        <div>
                          <span className="font-bold text-lg">{item.letter}</span>
                          <span className="text-sm ml-1">- {item.label}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">{item.description}</p>
                    </div>
                  ))}
                </div>
                {anyHaltChecked && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      You've identified some vulnerability states. Take extra care today and use your coping strategies.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Urge & Mood Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Current State
                </CardTitle>
                <CardDescription>
                  Rate your urge and mood levels right now
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Urge Level</Label>
                      <span className="text-sm font-medium px-2 py-1 rounded bg-muted">
                        {urgeLevel[0]}/10 - {getUrgeLabel(urgeLevel[0])}
                      </span>
                    </div>
                    <Slider
                      value={urgeLevel}
                      onValueChange={setUrgeLevel}
                      max={10}
                      min={0}
                      step={1}
                      className="py-2"
                      data-testid="slider-urge"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>No urges</span>
                      <span>Overwhelming</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Mood Level</Label>
                      <span className="text-sm font-medium px-2 py-1 rounded bg-muted">
                        {moodLevel[0]}/10 - {getMoodLabel(moodLevel[0])}
                      </span>
                    </div>
                    <Slider
                      value={moodLevel}
                      onValueChange={setMoodLevel}
                      max={10}
                      min={0}
                      step={1}
                      className="py-2"
                      data-testid="slider-mood"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Very low</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Journal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Daily Journal
                </CardTitle>
                <CardDescription>
                  Optional: Write about your day, feelings, or insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="What's on your mind today? Any wins to celebrate? Challenges you faced? Insights you gained?"
                  className="min-h-[120px]"
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  data-testid="input-journal"
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <Card>
              <CardContent className="py-6">
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleSubmit}
                  disabled={saveCheckinMutation.isPending}
                  data-testid="button-submit-checkin"
                >
                  {saveCheckinMutation.isPending ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                  )}
                  {saveCheckinMutation.isPending ? "Saving..." : "Complete Today's Check-in"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

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
import { ArrowLeft, CheckCircle2, Calendar, Heart, Brain, Shield, Loader2, Activity, Lightbulb, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { getTodaysPrompt } from "@/data/journal-prompts";

interface DailyCheckItem {
  id: string;
  category: string;
  label: string;
  description?: string;
}

const DAILY_ITEMS: DailyCheckItem[] = [
  { id: "no-acting-out", category: "Recovery", label: "Did not engage in compulsive sexual behavior today", description: "This tracks your core recovery goal. Even partial days of sobriety matter and build momentum." },
  { id: "no-rituals", category: "Recovery", label: "Did not engage in ritualistic behaviors leading to acting out", description: "Rituals are the habitual steps that precede acting out (e.g., browsing patterns, isolation). Catching them early breaks the cycle." },
  { id: "triggers-managed", category: "Recovery", label: "Successfully managed triggers when they occurred", description: "Triggers are situations, emotions, or thoughts that create urges. Managing them means you used a coping strategy instead of reacting automatically." },
  { id: "sleep", category: "Wellness", label: "Got adequate sleep (7-8 hours)", description: "Sleep deprivation weakens self-control and increases vulnerability to urges. Consistent rest is a foundation of recovery." },
  { id: "exercise", category: "Wellness", label: "Got physical exercise or movement", description: "Physical activity reduces stress hormones, improves mood, and provides a healthy outlet for tension and restless energy." },
  { id: "connection", category: "Relationships", label: "Had meaningful connection with others", description: "Isolation fuels compulsive behavior. Even brief genuine interactions with family, friends, or support groups protect your recovery." },
  { id: "values-aligned", category: "Values", label: "Took at least one values-aligned action", description: "A values-aligned action is anything you did intentionally because it reflects who you want to be (e.g., being present with family, doing honest work, showing kindness). This concept is explored in depth in Weeks 11-13." },
  { id: "honest", category: "Integrity", label: "Was honest in my interactions today", description: "Honesty is the opposite of the secrecy that sustains compulsive behavior. Tracking it helps build a habit of transparency in all areas of life." },
];

const HALTBS_ITEMS = [
  { id: "hungry", letter: "H", label: "Hungry", description: "Am I neglecting my physical needs?" },
  { id: "angry", letter: "A", label: "Angry", description: "Am I holding onto resentment or frustration?" },
  { id: "lonely", letter: "L", label: "Lonely", description: "Am I feeling isolated or disconnected?" },
  { id: "tired", letter: "T", label: "Tired", description: "Am I physically or emotionally exhausted?" },
  { id: "bored", letter: "B", label: "Bored", description: "Am I lacking purpose or stimulation?" },
  { id: "stressed", letter: "S", label: "Stressed", description: "Am I feeling overwhelmed or anxious?" },
];

export default function DailyCheckinPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dailyChecks, setDailyChecks] = useState<Record<string, boolean>>({});
  const [haltChecks, setHaltChecks] = useState<Record<string, boolean>>({});
  const [urgeLevel, setUrgeLevel] = useState([0]);
  const [moodLevel, setMoodLevel] = useState([5]);
  const [journalEntry, setJournalEntry] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  function getLocalDateKey(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const dateKey = getLocalDateKey();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data: checkinData, isLoading } = useQuery<{ checkin: any }>({
    queryKey: ['/api/progress/checkin', dateKey],
  });

  useEffect(() => {
    if (checkinData?.checkin && !dataLoaded) {
      const c = checkinData.checkin;
      try {
        const halt = c.haltChecks ? JSON.parse(c.haltChecks) : [];
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
        morningChecks: [],
        haltChecks: haltCheckIds,
        urgeLevel: urgeLevel[0],
        moodLevel: moodLevel[0],
        eveningChecks: dailyCheckIds,
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
      <header className="flex items-center gap-3 border-b px-4 py-3 sticky top-0 bg-background z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight" data-testid="text-page-title">Daily Check-in</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{today}</span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-8">
        {submitted ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 mx-auto text-primary" />
              <h2 className="text-2xl font-bold" data-testid="text-checkin-complete">Check-in Complete!</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Great job taking time to reflect on your day. Self-awareness is a powerful tool in your recovery journey.
              </p>
              <div className="flex flex-col gap-3 pt-4 max-w-xs mx-auto">
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
            <p className="text-sm text-muted-foreground">
              Complete this check-in <strong>toward the end of your day</strong> for the most accurate reflection. 
              Reviewing your whole day helps you see patterns and build honest self-awareness.
            </p>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <Activity className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    Today's Check-in
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Check all that apply to your day
                  </CardDescription>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold" data-testid="text-progress-count">{checkedCount}/{DAILY_ITEMS.length}</div>
                  <div className="text-xs text-muted-foreground">{progressPercent}%</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {DAILY_ITEMS.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-start gap-3 py-3.5 cursor-pointer"
                      onClick={() => toggleDailyCheck(item.id)}
                      data-testid={`daily-item-${item.id}`}
                    >
                      <Checkbox
                        id={`daily-${item.id}`}
                        checked={dailyChecks[item.id] || false}
                        onCheckedChange={() => toggleDailyCheck(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                        data-testid={`checkbox-daily-${item.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1.5">
                          <label
                            htmlFor={`daily-${item.id}`}
                            className={`text-sm leading-snug cursor-pointer select-none ${dailyChecks[item.id] ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {item.label}
                          </label>
                          {item.description && (
                            <Tooltip>
                              <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5 cursor-help" data-testid={`tooltip-trigger-${item.id}`} />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs" data-testid={`tooltip-content-${item.id}`}>
                                <p>{item.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  HALT-BS Check
                </CardTitle>
                <CardDescription>
                  Are you experiencing any of these vulnerability states?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {HALTBS_ITEMS.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-colors min-h-[56px] ${
                        haltChecks[item.id] 
                          ? 'border-foreground/20 bg-muted/50' 
                          : 'hover-elevate'
                      }`}
                      onClick={() => toggleHaltCheck(item.id)}
                      data-testid={`halt-item-${item.id}`}
                    >
                      <Checkbox
                        id={`halt-${item.id}`}
                        checked={haltChecks[item.id] || false}
                        onCheckedChange={() => toggleHaltCheck(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                        data-testid={`checkbox-halt-${item.id}`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-tight">
                          <span className="font-semibold">{item.letter}</span> — {item.label}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {anyHaltChecked && (
                  <p className="text-sm text-muted-foreground" data-testid="text-halt-warning">
                    You've identified some vulnerability states. Take extra care today and use your coping strategies.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-muted-foreground" />
                  Current State
                </CardTitle>
                <CardDescription>
                  Rate your urge and mood levels right now
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Urge Level</Label>
                    <span className="text-sm text-muted-foreground" data-testid="text-urge-value">
                      {urgeLevel[0]}/10 — {getUrgeLabel(urgeLevel[0])}
                    </span>
                  </div>
                  <Slider
                    value={urgeLevel}
                    onValueChange={setUrgeLevel}
                    max={10}
                    min={0}
                    step={1}
                    className="py-3"
                    data-testid="slider-urge"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>No urges</span>
                    <span>Overwhelming</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Mood Level</Label>
                    <span className="text-sm text-muted-foreground" data-testid="text-mood-value">
                      {moodLevel[0]}/10 — {getMoodLabel(moodLevel[0])}
                    </span>
                  </div>
                  <Slider
                    value={moodLevel}
                    onValueChange={setMoodLevel}
                    max={10}
                    min={0}
                    step={1}
                    className="py-3"
                    data-testid="slider-mood"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Very low</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  Daily Journal
                </CardTitle>
                <CardDescription>
                  Writing about your day builds self-awareness and strengthens recovery.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground" data-testid="text-journal-prompt">
                  <span className="font-medium">Today's prompt:</span> {getTodaysPrompt()}
                </div>
                <Textarea
                  placeholder="What's on your mind today? Any wins to celebrate? Challenges you faced? Insights you gained?"
                  className="min-h-[140px] text-base"
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  data-testid="input-journal"
                />
              </CardContent>
            </Card>

            <div className="pb-6">
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
            </div>
          </>
        )}
      </main>
    </div>
  );
}

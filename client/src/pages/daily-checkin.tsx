import { useState } from "react";
import { useLocation } from "wouter";
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
import { ArrowLeft, CheckCircle2, Calendar, Heart, Brain, Shield, Moon, Sun } from "lucide-react";

interface DailyCheckItem {
  id: string;
  category: string;
  label: string;
  description?: string;
}

const MORNING_ITEMS: DailyCheckItem[] = [
  { id: "sleep", category: "Physical", label: "Got adequate sleep (7-8 hours)", description: "Rest is crucial for self-regulation" },
  { id: "morning-routine", category: "Routine", label: "Completed morning routine", description: "Shower, healthy breakfast, etc." },
  { id: "intention", category: "Mindset", label: "Set a positive intention for the day" },
  { id: "gratitude", category: "Mindset", label: "Practiced gratitude (3 things I'm thankful for)" },
  { id: "accountability", category: "Support", label: "Connected with accountability partner or support person" },
];

const EVENING_ITEMS: DailyCheckItem[] = [
  { id: "triggers-managed", category: "Recovery", label: "Successfully managed triggers today" },
  { id: "values-aligned", category: "Values", label: "Took at least one values-aligned action" },
  { id: "honest", category: "Integrity", label: "Was honest in my interactions today" },
  { id: "no-acting-out", category: "Recovery", label: "Did not engage in compulsive sexual behavior" },
  { id: "no-rituals", category: "Recovery", label: "Did not engage in ritualistic behaviors leading to acting out" },
  { id: "emotions-processed", category: "Emotional", label: "Processed difficult emotions healthily" },
  { id: "exercise", category: "Physical", label: "Got physical exercise or movement" },
  { id: "connection", category: "Relationships", label: "Had meaningful connection with others" },
];

const HALT_ITEMS = [
  { id: "hungry", letter: "H", label: "Hungry", description: "Am I neglecting my physical needs?" },
  { id: "angry", letter: "A", label: "Angry", description: "Am I holding onto resentment or frustration?" },
  { id: "lonely", letter: "L", label: "Lonely", description: "Am I feeling isolated or disconnected?" },
  { id: "tired", letter: "T", label: "Tired", description: "Am I physically or emotionally exhausted?" },
];

export default function DailyCheckinPage() {
  const [, setLocation] = useLocation();
  const [morningChecks, setMorningChecks] = useState<Record<string, boolean>>({});
  const [eveningChecks, setEveningChecks] = useState<Record<string, boolean>>({});
  const [haltChecks, setHaltChecks] = useState<Record<string, boolean>>({});
  const [urgeLevel, setUrgeLevel] = useState([3]);
  const [moodLevel, setMoodLevel] = useState([5]);
  const [journalEntry, setJournalEntry] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const toggleMorningCheck = (id: string) => {
    setMorningChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleEveningCheck = (id: string) => {
    setEveningChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleHaltCheck = (id: string) => {
    setHaltChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // In a real app, this would save to the backend
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
            <div className="font-semibold">Daily Self-Monitoring</div>
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
                    setMorningChecks({});
                    setEveningChecks({});
                    setHaltChecks({});
                    setUrgeLevel([3]);
                    setMoodLevel([5]);
                    setJournalEntry("");
                  }}
                  data-testid="button-new-checkin"
                >
                  Start New Check-in
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Morning Check-in */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  Morning Check-in
                </CardTitle>
                <CardDescription>
                  Start your day with intention and awareness
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {MORNING_ITEMS.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                    onClick={() => toggleMorningCheck(item.id)}
                    data-testid={`morning-item-${item.id}`}
                  >
                    <Checkbox
                      id={`morning-${item.id}`}
                      checked={morningChecks[item.id] || false}
                      onCheckedChange={() => toggleMorningCheck(item.id)}
                      data-testid={`checkbox-morning-${item.id}`}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`morning-${item.id}`}
                        className={`text-sm font-medium cursor-pointer ${morningChecks[item.id] ? 'line-through text-muted-foreground' : ''}`}
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
                  Check if you're experiencing any of these vulnerability states
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
                  Rate your current urge and mood levels
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
                      min={1}
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
                      min={1}
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

            {/* Evening Check-in */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-500" />
                  Evening Reflection
                </CardTitle>
                <CardDescription>
                  Review your day and celebrate your progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {EVENING_ITEMS.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                    onClick={() => toggleEveningCheck(item.id)}
                    data-testid={`evening-item-${item.id}`}
                  >
                    <Checkbox
                      id={`evening-${item.id}`}
                      checked={eveningChecks[item.id] || false}
                      onCheckedChange={() => toggleEveningCheck(item.id)}
                      data-testid={`checkbox-evening-${item.id}`}
                    />
                    <label
                      htmlFor={`evening-${item.id}`}
                      className={`text-sm cursor-pointer ${eveningChecks[item.id] ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
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
                  data-testid="button-submit-checkin"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Complete Today's Check-in
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";

function formatDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DailyCheckInPage() {
  const [, setLocation] = useLocation();

  const dateKey = useMemo(() => formatDateKey(new Date()), []);

  const [mood, setMood] = useState<string>("");
  const [triggers, setTriggers] = useState("");
  const [wins, setWins] = useState("");
  const [tomorrow, setTomorrow] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("loading");

  // Load existing check-in for today from API
  useEffect(() => {
    async function loadCheckin() {
      try {
        const res = await fetch(`/api/progress/checkin/${dateKey}`, { credentials: "include" });
        if (res.ok) {
          const { checkin } = await res.json();
          if (checkin) {
            setMood(checkin.mood !== null ? String(checkin.mood) : "");
            setTriggers(checkin.triggers ?? "");
            setWins(checkin.wins ?? "");
            setTomorrow(checkin.tomorrow ?? "");
            setStatus("saved");
            return;
          }
        }
        setStatus("idle");
      } catch (error) {
        console.error("Failed to load check-in:", error);
        setStatus("idle");
      }
    }
    loadCheckin();
  }, [dateKey]);

  function clampMood(n: number) {
    if (Number.isNaN(n)) return undefined;
    return Math.max(1, Math.min(10, n));
  }

  async function handleSave() {
    setStatus("saving");
    try {
      const payload = {
        mood: mood ? clampMood(Number(mood)) : undefined,
        triggers,
        wins,
        tomorrow,
      };
      await apiRequest("PUT", `/api/progress/checkin/${dateKey}`, payload);
      setStatus("saved");
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1200);
    } catch (error) {
      console.error("Failed to save check-in:", error);
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <button
          className="text-sm text-muted-foreground hover:underline"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-back-dashboard"
        >
          Back to Dashboard
        </button>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Daily Check-In</CardTitle>
            <CardDescription>
              {dateKey} — keep it simple and honest. Consistency matters more than perfection.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {status === "loading" ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Mood (1-10)</div>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="Enter a number from 1 to 10"
                    data-testid="input-mood"
                  />
                  <div className="text-xs text-muted-foreground">1 = rough day, 10 = great day</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Triggers / High-risk moments today</div>
                  <Textarea
                    placeholder="What situations, emotions, or moments were challenging?"
                    value={triggers}
                    onChange={(e) => setTriggers(e.target.value)}
                    rows={4}
                    data-testid="input-triggers"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Wins / progress today</div>
                  <Textarea
                    placeholder="Any wins, boundaries kept, honesty, reaching out, etc."
                    value={wins}
                    onChange={(e) => setWins(e.target.value)}
                    rows={4}
                    data-testid="input-wins"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">What I need tomorrow</div>
                  <Textarea
                    placeholder="One small step you will take tomorrow."
                    value={tomorrow}
                    onChange={(e) => setTomorrow(e.target.value)}
                    rows={3}
                    data-testid="input-tomorrow"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handleSave} data-testid="button-save">
                    Save Check-In
                  </Button>

                  {status === "saving" && <span className="text-sm text-muted-foreground">Saving...</span>}
                  {status === "saved" && <span className="text-sm text-green-600">Saved</span>}
                  {status === "error" && <span className="text-sm text-red-600">Failed to save</span>}
                </div>

                <div className="text-xs text-muted-foreground">
                  Your check-in is saved to the server and will be available across all your devices.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

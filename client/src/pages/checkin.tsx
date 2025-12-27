import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";

const STORAGE_PREFIX = "sip_checkin_";

function formatDateKey(d: Date) {
  // YYYY-MM-DD (local time)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type CheckIn = {
  dateKey: string;
  mood: number; // 1-10
  triggers: string;
  wins: string;
  tomorrow: string;
  updatedAt: string; // ISO
};

export default function DailyCheckInPage() {
  const [, setLocation] = useLocation();

  const dateKey = useMemo(() => formatDateKey(new Date()), []);
  const storageKey = useMemo(() => `${STORAGE_PREFIX}${dateKey}`, [dateKey]);

  const [mood, setMood] = useState<string>("7");
  const [triggers, setTriggers] = useState("");
  const [wins, setWins] = useState("");
  const [tomorrow, setTomorrow] = useState("");

  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Load existing check-in for today (if any)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CheckIn;

      setMood(String(parsed.mood ?? "7"));
      setTriggers(parsed.triggers ?? "");
      setWins(parsed.wins ?? "");
      setTomorrow(parsed.tomorrow ?? "");
      setStatus("saved");
    } catch {
      // ignore
    }
  }, [storageKey]);

  function clampMood(n: number) {
    if (Number.isNaN(n)) return 7;
    return Math.max(1, Math.min(10, n));
  }

  async function handleSave() {
    setStatus("saving");
    try {
      const payload: CheckIn = {
        dateKey,
        mood: clampMood(Number(mood)),
        triggers,
        wins,
        tomorrow,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setStatus("saved");
      // small “saved” flash
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1200);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <button className="text-sm text-muted-foreground hover:underline" onClick={() => setLocation("/dashboard")}>
          ← Back to Dashboard
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
            <div className="space-y-2">
              <div className="text-sm font-medium">Mood (1–10)</div>
              <Input
                type="number"
                min={1}
                max={10}
                value={mood}
                onChange={(e) => setMood(e.target.value)}
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
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Wins / progress today</div>
              <Textarea
                placeholder="Any wins, boundaries kept, honesty, reaching out, etc."
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">What I need tomorrow</div>
              <Textarea
                placeholder="One small step you will take tomorrow."
                value={tomorrow}
                onChange={(e) => setTomorrow(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave}>Save Check-In</Button>

              {status === "saving" && <span className="text-sm text-muted-foreground">Saving…</span>}
              {status === "saved" && <span className="text-sm text-green-600">Saved ✓</span>}
              {status === "error" && <span className="text-sm text-red-600">Couldn’t save</span>}
            </div>

            <div className="text-xs text-muted-foreground">
              Saved locally in this browser for now. We can move this to the database later.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

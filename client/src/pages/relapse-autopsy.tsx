import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Save, CheckCircle2 } from "lucide-react";

type AutopsyData = {
  date: string;
  lapseOrRelapse: "lapse" | "relapse";
  summary: string;

  // Timeline
  whenStarted: string;
  duration: string;
  context: string;

  // Triggers + states
  triggers: string;
  emotions: string;
  thoughts: string;
  body: string;

  // Breakdowns
  boundariesBroken: string;
  warningSigns: string;
  decisionPoints: string;

  // Repair plan
  immediateActions: string;
  ruleChanges: string;
  environmentChanges: string;
  supportPlan: string;

  // Commitment
  next24HoursPlan: string;
};

const STORAGE_KEY = "relapse_autopsy_draft_v1";

export default function RelapseAutopsyPage() {
  const [status, setStatus] = useState<"idle" | "saved" | "completed">("idle");

  const [data, setData] = useState<AutopsyData>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return {
      date: new Date().toISOString().slice(0, 10),
      lapseOrRelapse: "lapse",
      summary: "",
      whenStarted: "",
      duration: "",
      context: "",
      triggers: "",
      emotions: "",
      thoughts: "",
      body: "",
      boundariesBroken: "",
      warningSigns: "",
      decisionPoints: "",
      immediateActions: "",
      ruleChanges: "",
      environmentChanges: "",
      supportPlan: "",
      next24HoursPlan: "",
    };
  });

  function update<K extends keyof AutopsyData>(key: K, value: AutopsyData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
  }

  function saveDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setStatus("saved");
    window.setTimeout(() => setStatus("idle"), 1200);
  }

  function markComplete() {
    // For now we just save and mark complete locally.
    // Later we can POST to your server + attach to week/user.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, completedAt: new Date().toISOString() }));
    setStatus("completed");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relapse Autopsy</h1>
          <p className="mt-2 text-muted-foreground">
            No shame. No stories. Just facts, patterns, and corrective action.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back</Link>
        </Button>
      </div>

      {/* Warning box */}
      <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <div className="font-semibold text-destructive">If a relapse occurs</div>
            <p className="mt-1 text-sm text-muted-foreground">
              A relapse does <span className="font-semibold">not</span> remove you from the program.
              Continuing requires completing a <span className="font-semibold">Relapse Autopsy</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button onClick={saveDraft} className="sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          Save draft
        </Button>
        <Button variant="secondary" onClick={markComplete} className="sm:w-auto">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark complete
        </Button>
        <div className="text-sm text-muted-foreground sm:ml-auto sm:self-center">
          {status === "saved" && "Draft saved."}
          {status === "completed" && "Marked complete."}
        </div>
      </div>

      {/* Section 1 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">1) Incident summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input value={data.date} onChange={(e) => update("date", e.target.value)} type="date" />
          </div>

          <div className="grid gap-2">
            <Label>Lapse or relapse?</Label>
            <div className="flex gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={data.lapseOrRelapse === "lapse"}
                  onChange={() => update("lapseOrRelapse", "lapse")}
                />
                Lapse (brief slip)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={data.lapseOrRelapse === "relapse"}
                  onChange={() => update("lapseOrRelapse", "relapse")}
                />
                Relapse (returned to old pattern)
              </label>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>What happened? (facts only)</Label>
            <Textarea
              value={data.summary}
              onChange={(e) => update("summary", e.target.value)}
              placeholder="Write a short, factual summary. No self-attacks. No justification."
              className="min-h-[110px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">2) Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>When did it start?</Label>
            <Input value={data.whenStarted} onChange={(e) => update("whenStarted", e.target.value)} placeholder="e.g., 10:30pm" />
          </div>
          <div className="grid gap-2">
            <Label>How long did it last?</Label>
            <Input value={data.duration} onChange={(e) => update("duration", e.target.value)} placeholder="e.g., 25 minutes" />
          </div>
          <div className="grid gap-2">
            <Label>Where were you / what was happening?</Label>
            <Textarea
              value={data.context}
              onChange={(e) => update("context", e.target.value)}
              placeholder="Environment + situation. Example: alone, laptop in bed, late night, tired."
              className="min-h-[90px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">3) Triggers and internal state</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Triggers (external + internal)</Label>
            <Textarea value={data.triggers} onChange={(e) => update("triggers", e.target.value)} className="min-h-[90px]" />
          </div>
          <div className="grid gap-2">
            <Label>Emotions</Label>
            <Textarea value={data.emotions} onChange={(e) => update("emotions", e.target.value)} className="min-h-[80px]" />
          </div>
          <div className="grid gap-2">
            <Label>Thoughts / beliefs in the moment</Label>
            <Textarea value={data.thoughts} onChange={(e) => update("thoughts", e.target.value)} className="min-h-[80px]" />
          </div>
          <div className="grid gap-2">
            <Label>Body state (tired, wired, stressed, hungry, etc.)</Label>
            <Textarea value={data.body} onChange={(e) => update("body", e.target.value)} className="min-h-[70px]" />
          </div>
        </CardContent>
      </Card>

      {/* Section 4 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">4) Breakdown points</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Boundaries broken</Label>
            <Textarea value={data.boundariesBroken} onChange={(e) => update("boundariesBroken", e.target.value)} className="min-h-[80px]" />
          </div>
          <div className="grid gap-2">
            <Label>Warning signs you ignored</Label>
            <Textarea value={data.warningSigns} onChange={(e) => update("warningSigns", e.target.value)} className="min-h-[80px]" />
          </div>
          <div className="grid gap-2">
            <Label>Decision points (where you could have exited)</Label>
            <Textarea value={data.decisionPoints} onChange={(e) => update("decisionPoints", e.target.value)} className="min-h-[90px]" />
          </div>
        </CardContent>
      </Card>

      {/* Section 5 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">5) Corrective action plan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Immediate actions (today)</Label>
            <Textarea value={data.immediateActions} onChange={(e) => update("immediateActions", e.target.value)} className="min-h-[90px]" />
          </div>
          <div className="grid gap-2">
            <Label>Rule changes (boundaries you will enforce)</Label>
            <Textarea value={data.ruleChanges} onChange={(e) => update("ruleChanges", e.target.value)} className="min-h-[90px]" />
          </div>
          <div className="grid gap-2">
            <Label>Environment changes (remove access)</Label>
            <Textarea value={data.environmentChanges} onChange={(e) => update("environmentChanges", e.target.value)} className="min-h-[90px]" />
          </div>
          <div className="grid gap-2">
            <Label>Support plan (who you will involve)</Label>
            <Textarea value={data.supportPlan} onChange={(e) => update("supportPlan", e.target.value)} className="min-h-[90px]" />
          </div>
          <div className="grid gap-2">
            <Label>Next 24 hours plan</Label>
            <Textarea value={data.next24HoursPlan} onChange={(e) => update("next24HoursPlan", e.target.value)} className="min-h-[90px]" />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={saveDraft}>
          <Save className="mr-2 h-4 w-4" />
          Save draft
        </Button>
        <Button variant="secondary" onClick={markComplete}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark complete
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Note: This page currently saves locally in your browser (draft). Next step is saving to your database per user/week.
      </p>
    </div>
  );
}

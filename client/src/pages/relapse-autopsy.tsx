import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Save, CheckCircle2, Plus, Clock, Loader2, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AutopsyData = {
  id?: string;
  date: string;
  lapseOrRelapse: "lapse" | "relapse";
  summary: string;
  whenStarted: string;
  duration: string;
  context: string;
  triggers: string;
  emotions: string;
  thoughts: string;
  body: string;
  boundariesBroken: string;
  warningSigns: string;
  decisionPoints: string;
  immediateActions: string;
  ruleChanges: string;
  environmentChanges: string;
  supportPlan: string;
  next24HoursPlan: string;
  status?: string;
  completedAt?: string;
  createdAt?: string;
};

const emptyAutopsy: AutopsyData = {
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

export default function RelapseAutopsyPage() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [data, setData] = useState<AutopsyData>(emptyAutopsy);
  const [showForm, setShowForm] = useState(false);

  const { data: autopsiesData, isLoading } = useQuery<{ autopsies: AutopsyData[] }>({
    queryKey: ['/api/relapse-autopsies'],
  });

  const autopsies = autopsiesData?.autopsies || [];

  const createMutation = useMutation({
    mutationFn: async (autopsyData: AutopsyData) => {
      const res = await apiRequest("POST", "/api/relapse-autopsies", autopsyData);
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/relapse-autopsies'] });
      setEditingId(result.autopsy.id);
      toast({ title: "Draft created" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, autopsyData }: { id: string; autopsyData: AutopsyData }) => {
      const res = await apiRequest("PUT", `/api/relapse-autopsies/${id}`, autopsyData);
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/relapse-autopsies'] });
      toast({ title: "Draft saved" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/relapse-autopsies/${id}/complete`);
      if (!res.ok) throw new Error("Failed to complete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/relapse-autopsies'] });
      setShowForm(false);
      setEditingId(null);
      setData(emptyAutopsy);
      toast({ title: "Relapse Autopsy submitted", description: "Your mentor has been notified and will provide feedback." });
    },
  });

  function update<K extends keyof AutopsyData>(key: K, value: AutopsyData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function startNew() {
    setData(emptyAutopsy);
    setEditingId(null);
    setShowForm(true);
  }

  function editExisting(autopsy: AutopsyData) {
    setData(autopsy);
    setEditingId(autopsy.id || null);
    setShowForm(true);
  }

  function handleSave() {
    if (editingId) {
      saveMutation.mutate({ id: editingId, autopsyData: data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleComplete() {
    if (!editingId) {
      createMutation.mutate(data, {
        onSuccess: (result) => {
          completeMutation.mutate(result.autopsy.id);
        }
      });
      return;
    }
    saveMutation.mutate({ id: editingId, autopsyData: data }, {
      onSuccess: () => {
        completeMutation.mutate(editingId);
      }
    });
  }

  const isSaving = createMutation.isPending || saveMutation.isPending;
  const isCompleting = completeMutation.isPending;

  if (!showForm) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-autopsy-title">Relapse Autopsy</h1>
            <p className="mt-2 text-muted-foreground">
              No shame. No stories. Just facts, patterns, and corrective action.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={startNew} data-testid="button-new-autopsy">
              <Plus className="mr-2 h-4 w-4" />
              New Autopsy
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-border bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div>
              <div className="font-semibold text-foreground">Protocol reminder</div>
              <p className="mt-1 text-sm text-muted-foreground">
                A relapse does <span className="font-semibold">not</span> remove you from the program.
                Complete a <span className="font-semibold">Relapse Autopsy</span> and your mentor will review it and provide feedback.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : autopsies.length === 0 ? (
          <div className="mt-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">What is a Relapse Autopsy?</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                <p>
                  When a patient dies, doctors perform a clinical autopsy — not to assign blame, but to determine the exact cause of death. Every factor is examined, documented, and analyzed so it can be understood and, where possible, prevented in the future.
                </p>
                <p>
                  This program uses the same method. If you experience a lapse or relapse, you complete a Relapse Autopsy: a structured, factual investigation into exactly what happened and why. What were the triggers? What warning signs were present but ignored? Where were the decision points — the exits you had but didn't take?
                </p>
                <p>
                  The goal is <span className="font-semibold text-foreground">forensic clarity</span>, not self-punishment. A setback analyzed honestly becomes prevention intelligence. That's what this tool is for.
                </p>
              </CardContent>
            </Card>

            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">You haven't needed one yet.</span> That's a good sign. If a lapse or relapse does occur, this tool is here and ready — completing it is the right next step. It keeps you in the program and gives your mentor what they need to help you move forward.
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {autopsies.map((a) => (
              <Card key={a.id} className="hover-elevate cursor-pointer" onClick={() => a.status === "draft" ? editExisting(a) : undefined}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      {a.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          {a.date}
                          <Badge variant={a.lapseOrRelapse === "relapse" ? "destructive" : "secondary"}>
                            {a.lapseOrRelapse === "relapse" ? "Relapse" : "Lapse"}
                          </Badge>
                          <Badge variant={a.status === "completed" ? "default" : "outline"}>
                            {a.status === "completed" ? "Submitted" : "Draft"}
                          </Badge>
                        </div>
                        {a.summary && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{a.summary}</p>
                        )}
                      </div>
                    </div>
                    {a.status === "draft" && (
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); editExisting(a); }} data-testid={`button-edit-autopsy-${a.id}`}>
                        Continue editing
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relapse Autopsy</h1>
          <p className="mt-2 text-muted-foreground">
            No shame. No stories. Just facts, patterns, and corrective action.
          </p>
        </div>
        <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setData(emptyAutopsy); }}>
          Back to list
        </Button>
      </div>

      <div className="mt-6 rounded-md border border-border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div>
            <div className="font-semibold text-foreground">Protocol reminder</div>
            <p className="mt-1 text-sm text-muted-foreground">
              A relapse does <span className="font-semibold">not</span> remove you from the program.
              Continuing requires completing a <span className="font-semibold">Relapse Autopsy</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button onClick={handleSave} disabled={isSaving} className="sm:w-auto" data-testid="button-save-draft">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save draft
        </Button>
        <Button variant="secondary" onClick={handleComplete} disabled={isCompleting || isSaving} className="sm:w-auto" data-testid="button-submit-autopsy">
          {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Submit to Mentor
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">1) Incident summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input value={data.date} onChange={(e) => update("date", e.target.value)} type="date" data-testid="input-autopsy-date" />
          </div>
          <div className="grid gap-2">
            <Label>Lapse or relapse?</Label>
            <div className="flex gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={data.lapseOrRelapse === "lapse"} onChange={() => update("lapseOrRelapse", "lapse")} data-testid="radio-lapse" />
                Lapse (brief slip)
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={data.lapseOrRelapse === "relapse"} onChange={() => update("lapseOrRelapse", "relapse")} data-testid="radio-relapse" />
                Relapse (returned to old pattern)
              </label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>What happened? (facts only)</Label>
            <Textarea value={data.summary} onChange={(e) => update("summary", e.target.value)} placeholder="Write a short, factual summary. No self-attacks. No justification." className="min-h-[110px]" data-testid="textarea-summary" />
          </div>
        </CardContent>
      </Card>

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
            <Textarea value={data.context} onChange={(e) => update("context", e.target.value)} placeholder="Environment + situation. Example: alone, laptop in bed, late night, tired." className="min-h-[90px]" />
          </div>
        </CardContent>
      </Card>

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
        <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-draft-bottom">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save draft
        </Button>
        <Button variant="secondary" onClick={handleComplete} disabled={isCompleting || isSaving} data-testid="button-submit-autopsy-bottom">
          {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Submit to Mentor
        </Button>
      </div>
    </div>
  );
}

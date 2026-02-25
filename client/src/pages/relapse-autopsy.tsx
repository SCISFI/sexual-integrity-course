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
import {
  Info, Save, CheckCircle2, Plus, Clock, Loader2, Search,
  FileText, Brain, AlertOctagon, ShieldCheck, ArrowLeft,
} from "lucide-react";
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

function SectionHeader({
  number,
  icon: Icon,
  title,
  description,
  accent,
}: {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${accent}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
          Section {number}
        </p>
        <CardTitle className="text-base leading-tight">{title}</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-sm font-semibold text-foreground">{children}</Label>
  );
}

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
                  This program uses the same method. If you experience a lapse or relapse, you complete a Relapse Autopsy: a structured, factual investigation into exactly what happened and why. What were the triggers? What warning signs were present? Where were the decision points — the exits you had but didn't take?
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
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 py-10 px-6 -mx-4 mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 mb-4">
          <Search className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight text-center">Relapse Autopsy</h1>
        <p className="mt-2 text-sm text-white/60 text-center max-w-sm">
          No shame. No stories. Just facts, patterns, and corrective action.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-white/60 hover:text-white hover:bg-white/10"
          onClick={() => { setShowForm(false); setEditingId(null); setData(emptyAutopsy); }}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row mb-8">
        <Button onClick={handleSave} disabled={isSaving} className="sm:w-auto" data-testid="button-save-draft">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save draft
        </Button>
        <Button variant="secondary" onClick={handleComplete} disabled={isCompleting || isSaving} className="sm:w-auto" data-testid="button-submit-autopsy">
          {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Submit to Mentor
        </Button>
      </div>

      <div className="space-y-5">
        <Card className="border-l-4 border-l-cyan-600">
          <CardHeader className="pb-4">
            <SectionHeader
              number={1}
              icon={FileText}
              title="What happened"
              description="Factual summary only. No self-attacks, no justification, no minimizing."
              accent="bg-cyan-600"
            />
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <FieldLabel>Date</FieldLabel>
              <Input value={data.date} onChange={(e) => update("date", e.target.value)} type="date" data-testid="input-autopsy-date" />
            </div>
            <div className="grid gap-2">
              <FieldLabel>Lapse or relapse?</FieldLabel>
              <p className="text-xs text-muted-foreground -mt-1">A lapse is a brief slip. A relapse is a return to the full pattern.</p>
              <div className="flex gap-4 text-sm mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={data.lapseOrRelapse === "lapse"} onChange={() => update("lapseOrRelapse", "lapse")} data-testid="radio-lapse" />
                  <span>Lapse — brief slip</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={data.lapseOrRelapse === "relapse"} onChange={() => update("lapseOrRelapse", "relapse")} data-testid="radio-relapse" />
                  <span>Relapse — returned to old pattern</span>
                </label>
              </div>
            </div>
            <div className="grid gap-2">
              <FieldLabel>What happened? Write it as a factual account.</FieldLabel>
              <Textarea
                value={data.summary}
                onChange={(e) => update("summary", e.target.value)}
                placeholder="State the facts plainly. What did you do, in what order? Leave out the self-attack and the justification — just the sequence of events."
                className="min-h-[120px]"
                data-testid="textarea-summary"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-4">
            <SectionHeader
              number={2}
              icon={Clock}
              title="When and where"
              description="Context and situation. The environment shapes behavior — document it precisely."
              accent="bg-blue-600"
            />
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <FieldLabel>When did it start?</FieldLabel>
              <Input value={data.whenStarted} onChange={(e) => update("whenStarted", e.target.value)} placeholder="e.g., 10:30pm on a Tuesday after getting home from work" />
            </div>
            <div className="grid gap-2">
              <FieldLabel>How long before you stopped?</FieldLabel>
              <Input value={data.duration} onChange={(e) => update("duration", e.target.value)} placeholder="e.g., 25 minutes" />
            </div>
            <div className="grid gap-2">
              <FieldLabel>Where were you and what was happening around you?</FieldLabel>
              <Textarea
                value={data.context}
                onChange={(e) => update("context", e.target.value)}
                placeholder="Alone or with people? Device, location, time of day. What had the last few hours looked like? Be specific — the details matter."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <CardHeader className="pb-4">
            <SectionHeader
              number={3}
              icon={Brain}
              title="What drove it"
              description="The internal state — triggers, emotions, thoughts, body — that built the momentum toward the behavior."
              accent="bg-indigo-600"
            />
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <FieldLabel>What set it off?</FieldLabel>
              <Textarea
                value={data.triggers}
                onChange={(e) => update("triggers", e.target.value)}
                placeholder="List both external triggers (something you saw, heard, a situation) and internal ones (a thought, a memory, a craving that appeared). What was the first thing that moved you in this direction?"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel>What were you feeling before and during?</FieldLabel>
              <Textarea
                value={data.emotions}
                onChange={(e) => update("emotions", e.target.value)}
                placeholder="Name the emotions specifically — not just 'stressed.' Lonely? Angry? Bored? Rejected? Ashamed? What emotional state created the opening?"
                className="min-h-[90px]"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel>What was your mind telling you?</FieldLabel>
              <Textarea
                value={data.thoughts}
                onChange={(e) => update("thoughts", e.target.value)}
                placeholder="What thoughts gave you permission? What rationalizations ran? 'Just this once.' 'I've been doing well.' 'No one will know.' Write the actual thought, not a summary."
                className="min-h-[90px]"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel>What was your physical state? (HALT check)</FieldLabel>
              <Textarea
                value={data.body}
                onChange={(e) => update("body", e.target.value)}
                placeholder="Hungry, Angry, Lonely, Tired — plus anything else physical. Sleep-deprived? Sick? Coming off a stressful day? The body sets the table."
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-4">
            <SectionHeader
              number={4}
              icon={AlertOctagon}
              title="Where it broke down"
              description="The specific failure points — where the prevention plan didn't hold and why."
              accent="bg-amber-500"
            />
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <FieldLabel>What boundaries or commitments did you cross?</FieldLabel>
              <Textarea
                value={data.boundariesBroken}
                onChange={(e) => update("boundariesBroken", e.target.value)}
                placeholder="Which specific lines from your prevention plan, your bottom lines, or commitments to your mentor or yourself did you cross — and in what order?"
                className="min-h-[90px]"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel>What warning signs were present?</FieldLabel>
              <Textarea
                value={data.warningSigns}
                onChange={(e) => update("warningSigns", e.target.value)}
                placeholder="Looking back: what were the yellow and orange zone signs that were showing? Mood changes, isolation, fantasy, skipping check-ins, minimizing? List what was there to see."
                className="min-h-[90px]"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel>Where could you have exited?</FieldLabel>
              <Textarea
                value={data.decisionPoints}
                onChange={(e) => update("decisionPoints", e.target.value)}
                placeholder="Identify the specific moments where a different choice was available. What would you have needed to do at each of those points to change the outcome?"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel>What gap in your prevention plan did this reveal?</FieldLabel>
              <Textarea
                value={data.ruleChanges}
                onChange={(e) => update("ruleChanges", e.target.value)}
                placeholder="This is the key question. Your plan had a hole — what was it? A trigger not accounted for, a boundary that wasn't specific enough, a warning sign you didn't know to watch for? Name the gap precisely."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="pb-4">
            <SectionHeader
              number={5}
              icon={ShieldCheck}
              title="Moving forward"
              description="Concrete, specific action — not intentions. What changes, who you tell, what the next 24 hours look like."
              accent="bg-green-600"
            />
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <FieldLabel>What will you do today?</FieldLabel>
              <Textarea
                value={data.immediateActions}
                onChange={(e) => update("immediateActions", e.target.value)}
                placeholder="Immediate, concrete actions — not vague intentions. 'I will call my accountability partner by 8pm.' 'I will delete the app.' 'I will tell my mentor.' What happens in the next few hours?"
                className="min-h-[90px]"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel>What environment changes will you make?</FieldLabel>
              <Textarea
                value={data.environmentChanges}
                onChange={(e) => update("environmentChanges", e.target.value)}
                placeholder="Remove access, change the setup, close the opening. What specifically changes in your physical or digital environment to close the door this came through?"
                className="min-h-[90px]"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel>Who will you tell, and what do you need from them?</FieldLabel>
              <Textarea
                value={data.supportPlan}
                onChange={(e) => update("supportPlan", e.target.value)}
                placeholder="Name the people. What will you say? What do you need from each of them — accountability, support, a check-in at a specific time? Be specific about the ask."
                className="min-h-[90px]"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel>What does the next 24 hours look like?</FieldLabel>
              <Textarea
                value={data.next24HoursPlan}
                onChange={(e) => update("next24HoursPlan", e.target.value)}
                placeholder="Hour by hour if needed. Not a general intention — an actual plan. Where will you be, what will you do, who will you be in contact with, and what are your commitments for the next 24 hours?"
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

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

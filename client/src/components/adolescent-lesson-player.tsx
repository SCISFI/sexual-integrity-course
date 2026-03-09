import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle2, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import type { AdolescentDynamicWeek } from "@/data/adolescent-dynamic-weeks";

interface Props {
  weekNumber: number;
  dynamicWeek: AdolescentDynamicWeek;
  isCompleted: boolean;
}

export default function AdolescentLessonPlayer({ weekNumber, dynamicWeek, isCompleted }: Props) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const screens = dynamicWeek.screens;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textDraft, setTextDraft] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [done, setDone] = useState(isCompleted);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: savedData } = useQuery<{ answers: string }>({
    queryKey: ["/api/progress/exercises", weekNumber],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/progress/exercises/${weekNumber}`);
      return res.json();
    },
  });

  useEffect(() => {
    if (savedData && !loaded) {
      try {
        const parsed = JSON.parse(savedData.answers || "{}");
        setAnswers(parsed);
        const step = typeof parsed.__current_step === "number" ? parsed.__current_step : 0;
        if (!isCompleted) setCurrentStep(Math.min(step, screens.length - 1));
        if (isCompleted) setCurrentStep(screens.length - 1);
      } catch {
        // ignore parse errors
      }
      setLoaded(true);
    } else if (!savedData && !loaded) {
      setLoaded(true);
    }
  }, [savedData, loaded, screens.length, isCompleted]);

  useEffect(() => {
    const screen = screens[currentStep];
    if (screen?.responseMode === "textarea" || screen?.responseMode === "text") {
      setTextDraft(screen.saveResponseAs ? (answers[screen.saveResponseAs] ?? "") : "");
    }
  }, [currentStep, screens, answers]);

  const saveMutation = useMutation({
    mutationFn: async (updatedAnswers: Record<string, string>) => {
      const res = await apiRequest("PUT", `/api/progress/exercises/${weekNumber}`, {
        answers: JSON.stringify(updatedAnswers),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress/exercises", weekNumber] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/progress/complete/${weekNumber}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress/completions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      setDone(true);
    },
  });

  const saveAnswers = useCallback(
    (updated: Record<string, string>) => {
      saveMutation.mutate(updated);
    },
    [saveMutation]
  );

  const advance = useCallback(
    (responseKey?: string, responseValue?: string) => {
      const nextStep = currentStep + 1;
      const updated: Record<string, string> = { ...answers };
      if (responseKey && responseValue !== undefined) {
        updated[responseKey] = responseValue;
      }
      updated.__current_step = String(nextStep);
      setAnswers(updated);
      saveAnswers(updated);

      if (nextStep < screens.length) {
        setCurrentStep(nextStep);
      }
    },
    [currentStep, answers, screens.length, saveAnswers]
  );

  const handleButtonClick = (option: string) => {
    const screen = screens[currentStep];
    if (screen.type === "completion") {
      const updated = { ...answers };
      if (screen.saveResponseAs) updated[screen.saveResponseAs] = option;
      setAnswers(updated);
      completeMutation.mutate();
      return;
    }
    advance(screen.saveResponseAs, option);
  };

  const handleTextareaChange = (value: string) => {
    setTextDraft(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const screen = screens[currentStep];
      if (!screen.saveResponseAs) return;
      const updated = { ...answers, [screen.saveResponseAs]: value };
      setAnswers(updated);
      saveAnswers(updated);
    }, 800);
  };

  const handleTextContinue = () => {
    const screen = screens[currentStep];
    const updated = { ...answers };
    if (screen.saveResponseAs) updated[screen.saveResponseAs] = textDraft;
    advance(screen.saveResponseAs, textDraft);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Week 1 Complete</h2>
        <p className="text-muted-foreground mb-8">
          You showed up and told the truth. That is how it starts.
        </p>
        <Button onClick={() => setLocation("/dashboard")} className="w-full sm:w-auto">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const screen = screens[currentStep];
  const progress = (currentStep / (screens.length - 1)) * 100;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground"
            onClick={goBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} of {screens.length}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Screen card */}
      <ScreenCard screen={screen} />

      {/* Response area */}
      <div className="mt-5">
        {(screen.responseMode === "textarea" || screen.responseMode === "text") && (
          <div className="space-y-3">
            <Textarea
              value={textDraft}
              onChange={(e) => handleTextareaChange(e.target.value)}
              placeholder={screen.placeholder ?? "Write your answer here..."}
              className="min-h-[120px] resize-none text-sm"
              data-testid={`textarea-${screen.id}`}
            />
            <Button
              className="w-full"
              onClick={handleTextContinue}
              data-testid={`button-continue-${screen.id}`}
            >
              Continue
            </Button>
          </div>
        )}

        {screen.responseMode === "buttons" && screen.responseOptions && (
          <div className="flex flex-col gap-2">
            {screen.responseOptions.map((option) => (
              <Button
                key={option}
                variant={screen.type === "completion" ? "default" : "outline"}
                className={
                  screen.type === "hook"
                    ? "h-12 text-base font-semibold"
                    : screen.type === "completion"
                    ? "h-12 text-base font-semibold"
                    : "h-10 text-sm"
                }
                onClick={() => handleButtonClick(option)}
                disabled={completeMutation.isPending}
                data-testid={`button-option-${screen.id}-${option.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {completeMutation.isPending && screen.type === "completion"
                  ? "Saving..."
                  : option}
              </Button>
            ))}
          </div>
        )}

        {screen.responseMode === "none" && (
          <Button className="w-full" onClick={() => advance()} data-testid={`button-continue-${screen.id}`}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

function ScreenCard({ screen }: { screen: ReturnType<typeof getScreen> }) {
  const { type, title, body } = screen;

  if (type === "hook") {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary/60 mb-4">
          {title}
        </p>
        <div className="space-y-3">
          {body.map((line, i) => (
            <p
              key={i}
              className={i === 0 ? "text-2xl font-bold leading-snug" : "text-xl text-muted-foreground leading-snug"}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (type === "scripture") {
    return (
      <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <BookOpen className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {body.map((line, i) => (
            <p key={i} className="text-sm italic text-amber-900 dark:text-amber-200 leading-relaxed">
              {line}
            </p>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (type === "mission") {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {body.map((line, i) => (
            <p key={i} className="text-sm font-medium leading-relaxed">
              {line}
            </p>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (type === "scenario") {
    return (
      <Card className="border-l-4 border-l-slate-400 dark:border-l-slate-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide text-xs">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {body.map((line, i) => (
            <p key={i} className="text-sm italic leading-relaxed">
              {line}
            </p>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (type === "check-in") {
    return (
      <Card className="bg-muted/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {body.map((line, i) => (
            <p key={i} className={`text-sm leading-relaxed ${i === 0 ? "" : "text-muted-foreground"}`}>
              {line}
            </p>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (type === "completion") {
    return (
      <div className="text-center py-8 px-4">
        <div className="flex justify-center mb-5">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="space-y-2">
          {body.map((line, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (type === "reflection" || type === "commitment") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {body.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed text-muted-foreground">
              {line}
            </p>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Default: micro-teaching
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {body.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed">
            {line}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

function getScreen(screens: AdolescentDynamicWeek["screens"], index: number) {
  return screens[index];
}

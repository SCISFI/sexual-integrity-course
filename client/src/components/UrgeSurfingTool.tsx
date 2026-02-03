import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Wind, Play, Pause, RotateCcw, Check, Heart, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Phase = 'intro' | 'breathing' | 'observing' | 'accepting' | 'complete';

const BREATHING_CYCLE_MS = 4000; // 4 seconds per breath phase
const TOTAL_BREATHING_CYCLES = 3;

const STEPS = [
  {
    phase: 'intro' as Phase,
    title: "You're Not Alone",
    description: "Urges are normal. They pass. Let's ride this wave together.",
    duration: 0,
  },
  {
    phase: 'breathing' as Phase,
    title: "Breathe",
    description: "Slow, deep breaths activate your calming response.",
    duration: BREATHING_CYCLE_MS * 2 * TOTAL_BREATHING_CYCLES,
  },
  {
    phase: 'observing' as Phase,
    title: "Observe",
    description: "Notice where you feel the urge in your body. It's just a sensation.",
    duration: 20000,
  },
  {
    phase: 'accepting' as Phase,
    title: "Accept",
    description: "You don't have to fight it. Just let it be there while you breathe.",
    duration: 20000,
  },
  {
    phase: 'complete' as Phase,
    title: "Well Done",
    description: "You just proved you can ride an urge. It will pass.",
    duration: 0,
  },
];

function BreathingCircle({ isActive }: { isActive: boolean }) {
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setBreathPhase(prev => prev === 'inhale' ? 'exhale' : 'inhale');
    }, BREATHING_CYCLE_MS);
    
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className={`rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 transition-all duration-[4000ms] ease-in-out flex items-center justify-center ${
          breathPhase === 'inhale' ? 'w-32 h-32 scale-100' : 'w-20 h-20 scale-75'
        }`}
      >
        <Wind className="h-8 w-8 text-white" />
      </div>
      <p className="text-xl font-medium text-cyan-600 dark:text-cyan-400 animate-pulse">
        {breathPhase === 'inhale' ? 'Breathe In...' : 'Breathe Out...'}
      </p>
    </div>
  );
}

export function UrgeSurfingTool() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const currentStepData = STEPS[currentStep];
  const totalTime = STEPS.reduce((acc, step) => acc + step.duration, 0);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsRunning(false);
    setProgress(0);
    setTimeLeft(0);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (!isRunning || currentStepData.duration === 0) return;

    setTimeLeft(currentStepData.duration / 1000);
    const startTime = Date.now();
    const duration = currentStepData.duration;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));
      
      // Calculate overall progress
      const completedTime = STEPS.slice(0, currentStep).reduce((acc, s) => acc + s.duration, 0);
      const currentProgress = ((completedTime + elapsed) / totalTime) * 100;
      setProgress(Math.min(currentProgress, 100));

      if (elapsed >= duration) {
        clearInterval(interval);
        if (currentStep < STEPS.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setIsRunning(false);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, currentStep, currentStepData.duration, totalTime]);

  const handleStart = () => {
    setCurrentStep(1);
    setIsRunning(true);
  };

  const handleTogglePause = () => {
    setIsRunning(prev => !prev);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          data-testid="button-urge-surfing"
        >
          <AlertCircle className="h-4 w-4" />
          I'm Struggling
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Urge Surfing Exercise
          </DialogTitle>
          <DialogDescription>
            A 3-minute guided exercise to ride the wave of an urge
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress bar */}
          {currentStep > 0 && currentStep < STEPS.length - 1 && (
            <Progress value={progress} className="h-2" />
          )}

          {/* Current step content */}
          <Card className={`border-2 ${
            currentStepData.phase === 'complete' 
              ? 'border-green-300 bg-green-50 dark:bg-green-950/30' 
              : 'border-cyan-200 bg-cyan-50/50 dark:bg-cyan-950/30'
          }`}>
            <CardContent className="pt-6 text-center">
              <h3 className={`text-2xl font-bold mb-3 ${
                currentStepData.phase === 'complete' 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-cyan-700 dark:text-cyan-300'
              }`}>
                {currentStepData.title}
              </h3>
              
              {currentStepData.phase === 'breathing' && (
                <div className="my-6">
                  <BreathingCircle isActive={isRunning} />
                </div>
              )}

              {currentStepData.phase === 'observing' && (
                <div className="my-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-purple-200 dark:bg-purple-800/50 flex items-center justify-center animate-pulse">
                      <span className="text-3xl">👁️</span>
                    </div>
                  </div>
                </div>
              )}

              {currentStepData.phase === 'accepting' && (
                <div className="my-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center">
                      <span className="text-3xl">🌊</span>
                    </div>
                  </div>
                </div>
              )}

              {currentStepData.phase === 'complete' && (
                <div className="my-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              )}

              <p className="text-muted-foreground">{currentStepData.description}</p>
              
              {timeLeft > 0 && isRunning && (
                <p className="text-sm text-muted-foreground mt-4">
                  {timeLeft} seconds remaining
                </p>
              )}
            </CardContent>
          </Card>

          {/* Control buttons */}
          <div className="flex justify-center gap-3">
            {currentStep === 0 && (
              <Button onClick={handleStart} className="gap-2" data-testid="button-start-exercise">
                <Play className="h-4 w-4" />
                Start Exercise
              </Button>
            )}

            {currentStep > 0 && currentStep < STEPS.length - 1 && (
              <>
                <Button variant="outline" onClick={handleTogglePause} className="gap-2">
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isRunning ? 'Pause' : 'Resume'}
                </Button>
                <Button variant="ghost" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </Button>
              </>
            )}

            {currentStep === STEPS.length - 1 && (
              <Button onClick={() => setOpen(false)} className="gap-2 bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4" />
                I Feel Better
              </Button>
            )}
          </div>
        </div>

        {/* Crisis resources reminder */}
        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          If urges persist, reach out. Text HOME to 741741 (Crisis Text Line) or call 988.
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ClipboardCheck, BookOpen, Calendar, ArrowRight } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Your Journey",
      description: "You're about to begin a 16-week program designed to help you build lasting sexual integrity. Let's quickly walk through how the program works.",
      icon: BookOpen,
    },
    {
      title: "Daily Check-ins Are Essential",
      description: "Every day, you'll complete a brief check-in to track your mood, urges, and progress. This is required to continue in the program and helps you stay accountable. Look for the 'Daily Check-in' button on your dashboard.",
      icon: ClipboardCheck,
    },
    {
      title: "Weekly Lessons Unlock Over Time",
      description: "New lessons unlock every 7 days. Each week includes reading material, reflection questions, and homework. Your answers are auto-saved as you type, so you can take breaks and come back anytime.",
      icon: Calendar,
    },
    {
      title: "You're Not Alone",
      description: "Your therapist can view your progress and provide feedback. If you're struggling, there are crisis resources available on every lesson page. Remember: relapse doesn't disqualify you — avoidance does. Honesty is more important than perfection.",
      icon: CheckCircle,
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>{currentStep.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed pt-2">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              data-testid="button-onboarding-back"
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 sm:flex-none"
            data-testid="button-onboarding-next"
          >
            {isLastStep ? (
              "Get Started"
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

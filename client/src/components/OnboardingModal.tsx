import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  ClipboardCheck,
  BookOpen,
  Search,
  Users,
  ArrowRight,
  Check,
} from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    gradient: "from-slate-900 to-cyan-900",
    icon: Shield,
    tagline: "16 weeks. Real work. Lasting change.",
    title: "Welcome to The Integrity Protocol",
    bullets: [
      "A 16-week structured program for building sexual integrity",
      "An educational and personal growth resource — not therapy or counseling",
      "Each week builds on the last. Show up consistently and it compounds.",
      "Your progress is private between you and your mentor. No one else sees it.",
    ],
  },
  {
    gradient: "from-slate-900 to-blue-900",
    icon: ClipboardCheck,
    tagline: "Two minutes. Every day. It adds up.",
    title: "The Daily Check-in",
    bullets: [
      "Complete a check-in each day — mood, urges, key recovery behaviors",
      "Takes 2–3 minutes. It's how you track patterns and build awareness.",
      "Your answers are private between you and your mentor",
      "Find it on your dashboard under \"Daily Check-in\"",
    ],
  },
  {
    gradient: "from-slate-900 to-indigo-900",
    icon: BookOpen,
    tagline: "One week at a time. No skipping ahead.",
    title: "Weekly Lessons",
    bullets: [
      "New lessons unlock every 7 days — you cannot rush the timeline",
      "Each week includes reading, reflection questions, and homework",
      "Your answers auto-save as you type. Stop and return anytime.",
      "Week 1 is already waiting for you",
    ],
  },
  {
    gradient: "from-slate-900 to-slate-700",
    icon: Search,
    tagline: "A setback is data. Use it.",
    title: "If You Slip: The Relapse Autopsy",
    bullets: [
      "When doctors perform a clinical autopsy, the goal isn't blame — it's cause. Exact cause. Documented. Preventable next time.",
      "If you experience a lapse or relapse, you complete a Relapse Autopsy: a structured investigation into what happened, what you missed, and what changes.",
      "A relapse does not remove you from the program. Completing the autopsy is what keeps you in it.",
      "Your mentor reviews every autopsy and responds with feedback.",
    ],
  },
  {
    gradient: "from-slate-900 to-green-900",
    icon: Users,
    tagline: "Honesty matters more than perfection.",
    title: "You're Not in This Alone",
    bullets: [
      "Your mentor can see your progress, check-ins, and reflections",
      "They'll provide feedback — especially when things get hard",
      "Crisis resources are available on every lesson page",
      "The only thing that ends this program is walking away. Keep showing up.",
    ],
  },
];

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const current = steps[step];
  const isLastStep = step === steps.length - 1;
  const Icon = current.icon;
  const progressValue = ((step + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="p-0 gap-0 sm:max-w-xl overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div key={step} className="animate-in fade-in duration-200">
          <div
            className={`bg-gradient-to-br ${current.gradient} flex flex-col items-center justify-center gap-3 py-10 px-6`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm font-medium text-white/70 tracking-wide text-center">
              {current.tagline}
            </p>
          </div>

          <div className="px-6 pt-5 pb-2">
            <h2 className="text-xl font-bold tracking-tight">{current.title}</h2>
            <ul className="mt-4 space-y-3">
              {current.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 pb-2 pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</span>
            </div>
            <Progress value={progressValue} className="h-1.5" />
          </div>

          <div className="flex items-center justify-between gap-3 px-6 py-4">
            {step > 0 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                data-testid="button-onboarding-back"
              >
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleNext}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

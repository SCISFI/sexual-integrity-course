import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Star, Trophy, Target, Sparkles, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";

type MilestoneType = 'week4' | 'week8' | 'week12' | 'week16';

interface MilestoneInfo {
  title: string;
  description: string;
  icon: typeof Award;
  color: string;
  bgColor: string;
  message: string;
}

const MILESTONES: Record<MilestoneType, MilestoneInfo> = {
  week4: {
    title: "1 Month Complete!",
    description: "You've finished the first month of your journey",
    icon: Star,
    color: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/50",
    message: "Four weeks of showing up for yourself. You've built a foundation of awareness and started developing new patterns. This is real progress.",
  },
  week8: {
    title: "Phase 1 Complete!",
    description: "You've mastered the CBT fundamentals",
    icon: Trophy,
    color: "text-emerald-500",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/50",
    message: "You've completed the entire CBT phase! You now have concrete tools for managing triggers, thoughts, and behaviors. Phase 2 will build on this foundation with ACT principles.",
  },
  week12: {
    title: "Three Months Strong!",
    description: "You're deep into your transformation",
    icon: Target,
    color: "text-cyan-500",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/50",
    message: "Twelve weeks of consistent work. You're now living with greater awareness, clearer values, and stronger skills. The finish line is in sight.",
  },
  week16: {
    title: "Program Complete!",
    description: "You've completed the 16-week Integrity Protocol",
    icon: PartyPopper,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/50",
    message: "This is a remarkable achievement. You've invested 16 weeks in your recovery, learned CBT and ACT skills, and proven that change is possible. This isn't the end - it's the beginning of your new life.",
  },
};

interface MilestoneDialogProps {
  weekNumber: number;
  open: boolean;
  onClose: () => void;
}

export function MilestoneDialog({ weekNumber, open, onClose }: MilestoneDialogProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  const milestoneType = weekNumber === 4 ? 'week4' 
    : weekNumber === 8 ? 'week8' 
    : weekNumber === 12 ? 'week12' 
    : weekNumber === 16 ? 'week16' 
    : null;

  const milestone = milestoneType ? MILESTONES[milestoneType] : null;

  useEffect(() => {
    if (open && milestone && !showConfetti) {
      setShowConfetti(true);
      // Fire confetti
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#0891b2', '#8b5cf6', '#f59e0b'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#0891b2', '#8b5cf6', '#f59e0b'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [open, milestone, showConfetti]);

  useEffect(() => {
    if (!open) {
      setShowConfetti(false);
    }
  }, [open]);

  if (!milestone) return null;

  const Icon = milestone.icon;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className={`w-20 h-20 rounded-full ${milestone.bgColor} flex items-center justify-center`}>
              <Icon className={`h-10 w-10 ${milestone.color}`} />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            {milestone.title}
            <Sparkles className="h-5 w-5 text-amber-400" />
          </DialogTitle>
          <DialogDescription className="text-center">
            {milestone.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-center text-muted-foreground">
            {milestone.message}
          </p>
        </div>

        <div className="flex justify-center">
          <Button onClick={onClose} className="gap-2" data-testid="button-milestone-continue">
            <Award className="h-4 w-4" />
            Continue My Journey
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function isMilestoneWeek(weekNumber: number): boolean {
  return weekNumber === 4 || weekNumber === 8 || weekNumber === 12 || weekNumber === 16;
}

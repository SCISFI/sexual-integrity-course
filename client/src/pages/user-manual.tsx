import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Download, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Shield, 
  MessageSquare, 
  Heart,
  Brain,
  Target,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  Users
} from "lucide-react";

export default function UserManualPage() {
  const [, setLocation] = useLocation();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-3 flex-wrap border-b px-4 py-3 print:hidden sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <div className="font-semibold">User Manual</div>
            <div className="text-xs text-muted-foreground">Program Guide</div>
          </div>
        </div>
        <Button onClick={handlePrint} data-testid="button-download-pdf">
          <Download className="mr-2 h-4 w-4" />
          Download as PDF
        </Button>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 print:max-w-none print:p-8">
        <div className="space-y-8 print:space-y-6">
          <div className="text-center border-b pb-8 print:pb-4">
            <h1 className="text-4xl font-bold text-primary mb-2 print:text-3xl">
              The Integrity Protocol
            </h1>
            <h2 className="text-2xl text-muted-foreground mb-4 print:text-xl">
              16-Week Comprehensive User Guide
            </h2>
            <p className="text-lg max-w-2xl mx-auto print:text-base">
              A complete guide to navigating your recovery journey through our evidence-based program
              combining Cognitive Behavioral Therapy (CBT) and Acceptance and Commitment Therapy (ACT).
            </p>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Program Overview</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>
                  The Sexual Integrity Program is a 16-week, clinically-informed curriculum designed to help
                  individuals understand and overcome Compulsive Sexual Behavior Disorder (CSBD). The program
                  is divided into two phases:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">Phase 1</Badge>
                      <span className="font-semibold">Weeks 1-8</span>
                    </div>
                    <h4 className="font-medium mb-1">Foundation & Stabilization (CBT)</h4>
                    <p className="text-sm text-muted-foreground">
                      Build foundational understanding, identify triggers, develop coping skills,
                      and learn cognitive restructuring techniques.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">Phase 2</Badge>
                      <span className="font-semibold">Weeks 9-16</span>
                    </div>
                    <h4 className="font-medium mb-1">Values & Integration (ACT)</h4>
                    <p className="text-sm text-muted-foreground">
                      Explore your values, develop psychological flexibility, practice mindfulness,
                      and create a sustainable long-term recovery plan.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4 print:break-before-page">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold">How Weeks Unlock</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>
                  Each week of the program unlocks based on time elapsed from your start date.
                  This pacing ensures you have adequate time to absorb and practice each week's concepts
                  before moving forward.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Week 1:</strong> Available immediately when you start the program (free)</li>
                  <li><strong>Week 2:</strong> Unlocks 7 days after your start date</li>
                  <li><strong>Week 3:</strong> Unlocks 14 days after your start date</li>
                  <li>...and so on, with each week unlocking 7 days after the previous</li>
                </ul>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Weeks 2-16 require payment of $14.99 per week unless your fees
                    have been waived by an administrator. Your mentor can request fee waivers on your behalf.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Daily Check-Ins</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>
                  Daily check-ins are the heart of your recovery practice. Complete one check-in each day
                  to track your progress, identify patterns, and stay accountable.
                </p>
                <h4 className="font-semibold">Each Daily Check-In Includes:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Heart className="h-4 w-4 text-red-500 mt-1" />
                      <div>
                        <span className="font-medium">Recovery Items</span>
                        <p className="text-sm text-muted-foreground">Track if you stayed sober, avoided rituals, and managed triggers</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Brain className="h-4 w-4 text-purple-500 mt-1" />
                      <div>
                        <span className="font-medium">Wellness Items</span>
                        <p className="text-sm text-muted-foreground">Sleep, exercise, and self-care tracking</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-blue-500 mt-1" />
                      <div>
                        <span className="font-medium">Relationship Items</span>
                        <p className="text-sm text-muted-foreground">Connection and honesty with others</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <span className="font-medium">Values & Integrity</span>
                        <p className="text-sm text-muted-foreground">Values-aligned actions and honesty</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-orange-500 mt-1" />
                      <div>
                        <span className="font-medium">HALT-BS Check</span>
                        <p className="text-sm text-muted-foreground">Hungry, Angry, Lonely, Tired, Bored, Stressed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-500 mt-1" />
                      <div>
                        <span className="font-medium">Mood & Urge Tracking</span>
                        <p className="text-sm text-muted-foreground">Rate your current state on 0-10 scales</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold">Understanding HALT-BS</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>
                  HALT-BS is an acronym for common vulnerability states that can trigger compulsive behavior.
                  Recognizing these states helps you intervene before urges intensify.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border">
                    <span className="font-bold text-lg text-red-600">H</span>
                    <span className="font-medium"> - Hungry</span>
                    <p className="text-sm text-muted-foreground">Not just physical hunger, but any unmet need</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <span className="font-bold text-lg text-orange-600">A</span>
                    <span className="font-medium"> - Angry</span>
                    <p className="text-sm text-muted-foreground">Unprocessed frustration or resentment</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <span className="font-bold text-lg text-yellow-600">L</span>
                    <span className="font-medium"> - Lonely</span>
                    <p className="text-sm text-muted-foreground">Feeling isolated or disconnected from others</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <span className="font-bold text-lg text-blue-600">T</span>
                    <span className="font-medium"> - Tired</span>
                    <p className="text-sm text-muted-foreground">Physical or emotional exhaustion</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <span className="font-bold text-lg text-purple-600">B</span>
                    <span className="font-medium"> - Bored</span>
                    <p className="text-sm text-muted-foreground">Lacking purpose or stimulation</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <span className="font-bold text-lg text-pink-600">S</span>
                    <span className="font-medium"> - Stressed</span>
                    <p className="text-sm text-muted-foreground">Feeling overwhelmed or anxious</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4 print:break-before-page">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold">Weekly Content Structure</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>Each week includes several components designed to build upon each other:</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Teaching Content</h4>
                      <p className="text-sm text-muted-foreground">
                        Core educational material explaining concepts, techniques, and insights for the week.
                        Available in read, listen, and video formats.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 shrink-0">
                      <MessageSquare className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Reflection Questions</h4>
                      <p className="text-sm text-muted-foreground">
                        Four reflection questions to help you internalize the week's concepts.
                        Your answers auto-save as you type and are visible to your mentor.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 shrink-0">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Exercises</h4>
                      <p className="text-sm text-muted-foreground">
                        Interactive exercises to practice the week's skills and apply concepts to your own life.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Homework Checklist</h4>
                      <p className="text-sm text-muted-foreground">
                        A list of tasks to complete throughout the week. Check items off as you complete them.
                        Your mentor can view your homework progress.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
                <Users className="h-5 w-5 text-cyan-600" />
              </div>
              <h2 className="text-2xl font-bold">Working With Your Mentor</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>
                  Your assigned mentor plays a crucial role in your recovery journey. They can:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>View your daily check-in history and identify patterns</li>
                  <li>Read your reflection answers and provide feedback</li>
                  <li>Track your homework completion progress</li>
                  <li>Send you personalized feedback and encouragement</li>
                  <li>Review your completed weeks to ensure you're getting the most from the program</li>
                </ul>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Be honest:</strong> Your mentor is there to help, not judge. The more honest
                    you are in your reflections and check-ins, the better support they can provide.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4 print:break-before-page">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold">Crisis Resources</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p>
                  If you're in crisis or experiencing severe distress, help is available 24/7.
                  The Crisis Resources button is always visible on week pages.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-5 w-5 text-red-600" />
                      <span className="font-bold">Emergency Contacts</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li><strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988</li>
                      <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                      <li><strong>Emergency Services:</strong> 911</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-5 w-5 text-pink-600" />
                      <span className="font-bold">Recovery Support</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>Sex Addicts Anonymous (SAA)</li>
                      <li>Celebrate Recovery</li>
                      <li>S-Anon (for partners)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <Sparkles className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold">Tips for Success</h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
                      <span className="text-sm">Complete your daily check-in every day, even on difficult days</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
                      <span className="text-sm">Be completely honest in your reflections</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
                      <span className="text-sm">Don't rush through weeks - take time to absorb the content</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
                      <span className="text-sm">Complete all homework items before marking a week complete</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
                      <span className="text-sm">Use the Urge Surfing tool when you feel triggered</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
                      <span className="text-sm">Review previous weeks when you need a refresher</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
                      <span className="text-sm">Communicate openly with your mentor</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
                      <span className="text-sm">Celebrate your milestones - progress matters!</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator className="my-8" />

          <div className="text-center py-8 print:py-4">
            <p className="text-muted-foreground mb-4">
              Your journey to freedom and integrity starts with a single step.
              You've already taken that step by being here.
            </p>
            <p className="font-medium text-primary">
              We believe in your ability to change and grow.
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:break-before-page { break-before: page; }
          .print\\:max-w-none { max-width: none; }
          .print\\:p-8 { padding: 2rem; }
          .print\\:space-y-6 > * + * { margin-top: 1.5rem; }
          .print\\:pb-4 { padding-bottom: 1rem; }
          .print\\:text-3xl { font-size: 1.875rem; }
          .print\\:text-xl { font-size: 1.25rem; }
          .print\\:text-base { font-size: 1rem; }
        }
      `}</style>
    </div>
  );
}

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CalendarDays,
  CheckCircle2,
  Lock,
  ArrowRight,
  Target,
  ClipboardList,
  Timer,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-card shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">The Integrity Protocol</div>
              <div className="text-xs text-muted-foreground">
                16-week recovery program • structured • private
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild data-testid="button-nav-login">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="bg-green-600 dark:bg-green-600 text-white border-green-700 dark:border-green-600" data-testid="button-nav-try-free">
              <Link href="/register/client">
                Try Week 1 Free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="space-y-6">
                <Badge variant="secondary" className="px-3 py-1">
                  This is not “tips.” This is training.
                </Badge>
                
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-primary">
                  The Integrity Protocol
                </h1>
                
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  A difficult program for a difficult problem.
                </h2>

                <p className="text-lg text-muted-foreground">
                  If you struggle with problematic sexual behavior, you
                  don’t need motivation. You need structure. This 16-week
                  program is built around evidence-informed recovery principles:
                  tracking, trigger control, planning, and repetition.
                </p>
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="text-sm font-semibold">Week 1 includes</div>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                      Baseline assessment: patterns, triggers, and high-risk
                      times.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                      A strict 24-hour plan: remove access, reduce exposure, set
                      boundaries.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                      Your first urge protocol: delay, disrupt, redirect
                      (written and practiced).
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                      Daily logging starts immediately. No “getting ready.”
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Target className="mt-0.5 h-5 w-5" />
                    <div>
                      <div className="font-semibold">Commitment (minimum)</div>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <Timer className="mt-0.5 h-4 w-4" />
                          10–15 minutes per day
                        </li>
                        <li className="flex gap-2">
                          <ClipboardList className="mt-0.5 h-4 w-4" />
                          30–45 minutes per week (lesson + exercises)
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4" />
                          No skipping ahead. One week at a time.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-green-600/30 dark:border-green-500/30 bg-green-600/10 dark:bg-green-500/10 p-4 mb-2" data-testid="card-hero-week1-free">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-600 dark:bg-green-600 text-white px-4 py-1.5 text-base font-semibold" data-testid="badge-hero-week1-free">
                      Week 1 FREE
                    </Badge>
                    <span className="text-sm text-muted-foreground" data-testid="text-no-credit-card">No credit card required to start</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" asChild className="bg-green-600 dark:bg-green-600 text-white border-green-700 dark:border-green-600" data-testid="button-hero-try-free">
                    <Link href="/register/client">
                      Try Week 1 Free <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    Private by default
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    16-week protocol
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Measurable steps
                  </div>
                </div>
              </div>

              {/* Key pillars */}
              <div className="relative">
                <div className="absolute -inset-3 -z-10 rounded-3xl bg-primary/10 blur-2xl" />

                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                  <img
                    src="/images/hero-1.webp"
                    alt="Man alone in early morning light"
                    className="h-[440px] w-full object-cover grayscale-[15%] contrast-110"
                    loading="eager"
                  />

                  <div className="border-t bg-background/80 p-4">
                    <div className="text-sm font-semibold tracking-tight">
                      Structure over motivation.
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      This program is designed for compliance, not comfort.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="rounded-2xl border bg-primary text-primary-foreground p-8 shadow-sm">
              <div className="text-sm uppercase tracking-wide opacity-80">
                Program standards
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="text-sm">
                  Daily logging is required. Missed days are visible.
                </div>
                <div className="text-sm">
                  No skipping weeks. Progress is sequential.
                </div>
                <div className="text-sm">
                  Relapse is documented, analyzed, and addressed—immediately.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who it’s for */}
        <section className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    This is for you if…
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-2">
                    <li>
                      • You keep repeating behavior you said you would stop.
                    </li>
                    <li>
                      • Your life gets smaller when you try to “white-knuckle”
                      change.
                    </li>
                    <li>
                      • You want a structured recovery plan, not inspiration.
                    </li>
                    <li>
                      • You can commit daily—even when you don’t feel like it.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    This is not for you if…
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-2">
                    <li>• You want a quick fix or “hack.”</li>
                    <li>• You are in immediate crisis or unsafe right now.</li>
                    <li>
                      • You are looking for explicit material or loopholes.
                    </li>
                    <li>
                      • You refuse tracking, structure, or accountability.
                    </li>
                  </ul>

                  <div className="mt-4 flex items-start gap-2 rounded-xl border bg-muted/30 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <p className="text-xs text-muted-foreground">
                      Not a crisis service. If you are in immediate danger or
                      feel unable to keep yourself or someone else safe, contact
                      local emergency services.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <img
                src="/images/break-1.WebP"
                alt="Quiet moment of reflection"
                className="h-[280px] w-full object-cover grayscale-[20%]"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="grid gap-8 lg:grid-cols-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  How the program works
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Each week has a single objective. You learn, you apply, you
                  log. Then you repeat. Progress is earned.
                </p>
              </div>

              <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">1) Learn</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Short lesson + weekly target. No fluff.
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">2) Apply</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Exercises that create behavior change, not just insight.
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">3) Log</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Daily check-ins. Patterns become visible. Choices improve.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Is this therapy?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  No. This is a structured self-guided recovery program. If you
                  need therapy, use this alongside professional support.
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    What if I relapse?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Relapse is data. You will document it, analyze triggers,
                  adjust your plan, and resume the protocol. No spiraling.
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    How long each week?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Daily: 10–15 minutes. Weekly: 30–45 minutes. If you can’t do
                  that, don’t start yet.
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    Is this religious?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  No. The program is values-based and practical. You can
                  integrate your beliefs if you want, but it’s not required.
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    What does it cost?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Week 1 is completely free. After that, it's $14.99 per week—only pay as you progress. No subscriptions, no hidden fees.
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    Is there mentor support?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Yes. You're assigned a dedicated mentor who monitors your progress, reviews your work, and provides personalized feedback throughout the program.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA footer */}
        <section className="border-t bg-green-50/50 dark:bg-green-950/20">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border bg-card p-8 shadow-sm md:flex-row md:items-center">
              <div>
                <Badge className="bg-green-600 dark:bg-green-600 text-white mb-3" data-testid="badge-footer-week1-free">
                  Week 1 FREE
                </Badge>
                <h3 className="text-xl font-semibold">
                  Start Week 1 today. No payment required.
                </h3>
                <p className="mt-1 text-muted-foreground">
                  Try the first week completely free. Then $14.99/week as you progress.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button size="lg" asChild className="w-full sm:w-auto bg-green-600 dark:bg-green-600 text-white border-green-700 dark:border-green-600" data-testid="button-footer-try-free">
                  <Link href="/register/client">
                    Try Week 1 Free <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground text-center" data-testid="text-disclaimer">
              This program is an educational and personal growth resource. It is not therapy, counseling, or a substitute for professional mental health treatment.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

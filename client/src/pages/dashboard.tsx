import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Calendar, Lock, LogOut, Mail, User } from "lucide-react";

type WeekItem = {
  week: number;
  title: string;
};

const WEEKS: WeekItem[] = [
  { week: 1, title: "Foundations of Sexual Integrity" },
  { week: 2, title: "Understanding Your Patterns" },
  { week: 3, title: "Triggers & High-Risk Situations" },
  { week: 4, title: "Building a Recovery Plan" },
  { week: 5, title: "Accountability That Works" },
  { week: 6, title: "Managing Urges & Cravings" },
  { week: 7, title: "Shame Resilience & Self-Compassion" },
  { week: 8, title: "Healthy Sexuality & Values" },
  { week: 9, title: "Emotional Regulation Skills" },
  { week: 10, title: "Repairing Trust in Relationships" },
  { week: 11, title: "Boundaries & Technology Safety" },
  { week: 12, title: "Relapse Prevention Plan" },
  { week: 13, title: "Relapse Analysis (If It Happens)" },
  { week: 14, title: "Identity, Purpose, and Growth" },
  { week: 15, title: "Sustaining Momentum" },
  { week: 16, title: "Long-Term Maintenance Plan" },
];

export default function Dashboard() {
  const { user, isLoading, isAuthenticating, logout } = useAuth();
  const [, setLocation] = useLocation();

  // For now: only Week 1 is available. Later we’ll unlock Week 2–16.
  const unlockedWeek = 1;

  // Keep Week 1 expanded. (Feels like “in progress”, not hidden.)
  const [showWeek1, setShowWeek1] = useState(true);

  // Used to scroll directly to Week 1 when user clicks Resume/Continue
  const week1Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticating && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, isAuthenticating, setLocation]);

  const memberSince = useMemo(() => {
    if (!user) return "";
    const createdAt = (user as any)?.createdAt;
    const dt = createdAt ? new Date(createdAt) : new Date();
    return dt.toLocaleDateString();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const resumeWeek1 = () => {
    const lastWeek = Number(localStorage.getItem("si_last_week") || "1");
    setLocation(
      `/week/${Number.isFinite(lastWeek) && lastWeek > 0 ? lastWeek : 1}`,
    );
  };

  if (isLoading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">SI</span>
              </div>
              <div>
                <div className="font-semibold leading-tight">
                  Sexual Integrity Program
                </div>
                <div className="text-xs text-muted-foreground">
                  Private member dashboard
                </div>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* My Program */}
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>My Program</CardTitle>
                <CardDescription>
                  Your weekly modules, daily practices, and progress live here.
                </CardDescription>
              </div>

              {/* Resume button */}
              <Button onClick={resumeWeek1}>Resume Week 1</Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 16-week overview */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Your 16-Week Program</h2>
              <p className="text-sm text-muted-foreground">
                Weeks unlock weekly. Right now Week 1 is available. As you
                progress, new weeks will unlock automatically.
              </p>
            </div>

            <div className="grid gap-3">
              {WEEKS.map((w) => {
                const isUnlocked = w.week <= unlockedWeek;
                const isCurrent = w.week === 1;

                return (
                  <div
                    key={w.week}
                    className="rounded-lg border p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        Week {w.week}: {w.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isUnlocked
                          ? "Available • ~60 minutes"
                          : "Locked • Unlocks weekly"}
                      </div>
                    </div>

                    {isCurrent ? (
                      <Button variant="outline" onClick={resumeWeek1}>
                        Continue
                      </Button>
                    ) : (
                      <Button variant="outline" disabled className="gap-2">
                        <Lock className="h-4 w-4" />
                        Locked
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Week 1 module (always accessible) */}
            {showWeek1 && (
              <div
                ref={week1Ref}
                className="mt-2 rounded-lg border p-6 space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-semibold">
                    Week 1: Foundations of Sexual Integrity
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Estimated time: 60 minutes • In progress
                  </p>
                </div>

                {/* Teaching */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Teaching</h3>
                  <p className="text-sm">
                    Sexual integrity is not simply about stopping a behavior —
                    it is about aligning your actions with your values,
                    identity, and long-term goals. Compulsive sexual behavior
                    thrives in secrecy, emotional avoidance, and unexamined
                    patterns.
                  </p>
                  <p className="text-sm">
                    This program begins by slowing things down. Before focusing
                    on change, you must understand <strong>why</strong> you want
                    change, <strong>what</strong> has kept the behavior going,
                    and <strong>how</strong> you will stay engaged when
                    motivation fades.
                  </p>
                  <p className="text-sm">
                    Progress in this program is not measured by perfection, but
                    by honesty, consistency, and willingness to learn —
                    especially after setbacks.
                  </p>
                </div>

                {/* Reflection */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-medium">Reflection Questions</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>
                      Why is sexual integrity important to me at this stage of
                      my life?
                    </li>
                    <li>
                      What has my behavior cost me (emotionally, relationally,
                      spiritually)?
                    </li>
                    <li>What fears or doubts do I have about changing?</li>
                    <li>What would staying the same cost me in 5 years?</li>
                  </ul>
                </div>

                {/* Required Exercise */}
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-medium">
                    Required Exercise: Commitment Statement
                  </h3>
                  <p className="text-sm">
                    Write a brief commitment statement answering the question:
                  </p>
                  <p className="text-sm font-medium italic">
                    “Why am I choosing to pursue sexual integrity right now?”
                  </p>
                  <p className="text-sm">
                    This statement will be revisited throughout the program. Be
                    honest. No one else will see this unless you choose to share
                    it with a coach.
                  </p>
                </div>

                {/* Expectations */}
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-medium">Expectations for This Program</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>
                      Daily check-ins are required to continue progressing
                    </li>
                    <li>
                      Skipping days or abandoning the course disqualifies
                      refunds
                    </li>
                    <li>Relapse does not disqualify you — avoidance does</li>
                    <li>Honesty is more important than performance</li>
                  </ul>
                </div>

                {/* Relapse Rule */}
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 space-y-2">
                  <h3 className="font-medium text-red-700">
                    If a Relapse Occurs
                  </h3>
                  <p className="text-sm text-red-700">
                    A relapse does NOT remove you from the program. However,
                    continuing requires completion of a{" "}
                    <strong>Relapse Analysis Exercise</strong>.
                  </p>
                  <p className="text-sm text-red-700">
                    This analysis helps identify what was missed, what warning
                    signs were present, and what needs to change going forward.
                  </p>
                </div>

                {/* Completion (placeholder for later) */}
                <div className="pt-2 flex items-center gap-3">
                  <Button disabled>
                    Mark Week 1 Complete (unlocks Week 2)
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    (Next: we’ll make this button real and save progress.)
                  </span>
                </div>
              </div>
            )}

            {/* Daily Check-ins (always visible) */}
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Daily Check-Ins</h3>
                <p className="text-sm mt-2 text-muted-foreground">
                  Daily check-ins will be required to keep moving forward and qualify for the guarantee.
                </p>

                <div className="mt-4">
                  <Button onClick={() => setLocation("/checkin")}>
                    Start Daily Check-In
                  </Button>
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Your Account */}
        <Card>
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>
              Profile info for this member account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">
                {(user as any)?.name ?? "Not set"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">
                {(user as any)?.email ?? "Not set"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Joined:</span>
              <span className="font-medium">{memberSince}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

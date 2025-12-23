import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
import { Database, Shield, Zap, ArrowRight, LogIn } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold tracking-tight" data-testid="text-logo">
                AuthStarter
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isLoading ? (
                <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
              ) : user ? (
                <Link href="/dashboard">
                  <Button data-testid="link-dashboard">
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button data-testid="link-sign-in">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" data-testid="text-hero-title">
                Next.js + Postgres Auth Starter
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground" data-testid="text-hero-description">
                A simple authentication starter kit with email + password login and a PostgreSQL database to persist the data. Built with Express, React, Drizzle ORM, and Passport.js.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link href="/protected">
                  <Button size="lg" data-testid="button-protected-page">
                    Protected Page
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="https://github.com/vercel/nextjs-postgres-auth-starter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="lg" data-testid="button-github">
                    View on GitHub
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="text-features-title">
                Everything you need
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Built with modern tools for a seamless developer experience
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-4xl gap-8 sm:grid-cols-3">
              <FeatureCard
                icon={<Database className="h-6 w-6" />}
                title="PostgreSQL"
                description="Persistent data storage with Drizzle ORM for type-safe database operations"
                testId="card-feature-postgres"
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6" />}
                title="Secure Auth"
                description="Password hashing with bcrypt and secure session management with Passport.js"
                testId="card-feature-auth"
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="Fast & Modern"
                description="Built with React, Express, TypeScript, and Tailwind CSS for rapid development"
                testId="card-feature-modern"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p data-testid="text-footer">
            Inspired by{" "}
            <a
              href="https://github.com/vercel/nextjs-postgres-auth-starter"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Vercel's Auth Starter
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  testId,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  testId: string;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-lg border bg-card p-6 text-center"
      data-testid={testId}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

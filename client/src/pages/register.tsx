import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Shield, User, Stethoscope, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Register() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between p-4">
        <Link href="/">
          <div className="flex cursor-pointer items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span
              className="text-xl font-semibold tracking-tight"
              data-testid="text-logo"
            >
              The Integrity Protocol
            </span>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle
              className="text-2xl font-bold"
              data-testid="text-register-title"
            >
              Create an account
            </CardTitle>
            <CardDescription data-testid="text-register-description">
              Choose how you'd like to register
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/register/client">
              <Card className="cursor-pointer transition-colors hover-elevate">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold" data-testid="text-client-option">Client</h3>
                    <p className="text-sm text-muted-foreground">
                      Begin your 16-week Integrity Protocol journey
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/register/adolescent">
              <Card className="cursor-pointer transition-colors hover-elevate border-amber-200 dark:border-amber-800/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <GraduationCap className="h-6 w-6 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold" data-testid="text-teen-option">Teen Program (Ages 13–17)</h3>
                    <p className="text-sm text-muted-foreground">
                      Requires parent or guardian approval
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/register/therapist">
              <Card className="cursor-pointer transition-colors hover-elevate">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <Stethoscope className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold" data-testid="text-therapist-option">Mentor</h3>
                    <p className="text-sm text-muted-foreground">
                      Register to support and monitor your clients
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div
              className="text-center text-sm text-muted-foreground"
              data-testid="text-login-link"
            >
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
            <p className="text-xs text-muted-foreground text-center" data-testid="text-disclaimer">
              This program is an educational and personal growth resource. It is not therapy, counseling, or a substitute for professional mental health treatment.
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

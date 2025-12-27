import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Shield, ArrowLeft, LogIn, Lock, Loader2, CheckCircle } from "lucide-react";

export default function Protected() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/">
              <div className="flex cursor-pointer items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight" data-testid="text-logo">
                  Sexual Integrity

                </span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {user ? (
                <Link href="/dashboard">
                  <Button data-testid="button-dashboard">Dashboard</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button data-testid="button-sign-in">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center py-20">
        <div className="mx-auto max-w-md px-4">
          {user ? (
            <Card data-testid="card-protected-content">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-2xl" data-testid="text-protected-title">
                  Access Granted
                </CardTitle>
                <CardDescription data-testid="text-protected-description">
                  You are viewing a protected page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-muted-foreground" data-testid="text-welcome-message">
                  Welcome, <span className="font-medium text-foreground">{user.name || user.email}</span>! 
                  This page is only visible to authenticated users.
                </p>
                <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-center">
                  <Link href="/dashboard">
                    <Button className="w-full sm:w-auto" data-testid="button-go-dashboard">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full sm:w-auto" data-testid="button-back-home">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="card-login-required">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl" data-testid="text-login-required-title">
                  Authentication Required
                </CardTitle>
                <CardDescription data-testid="text-login-required-description">
                  Please sign in to view this protected content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  This page is protected and requires authentication. Sign in with your account or create a new one to continue.
                </p>
                <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-center">
                  <Link href="/login">
                    <Button className="w-full sm:w-auto" data-testid="button-login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" className="w-full sm:w-auto" data-testid="button-register">
                      Create Account
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Shield, Loader2, AlertCircle, Mountain } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import heroImage from "../assets/images/hero-mountain.jpg";

export default function Login() {
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (shouldRedirect && user) {
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect");
      if (redirectTo && redirectTo.startsWith("/")) {
        setLocation(redirectTo);
        return;
      }
      const role = (user as any).role;
      if (role === "admin") {
        setLocation("/admin");
      } else if (role === "therapist") {
        setLocation("/therapist");
      } else if (role === "parent") {
        setLocation("/parent-dashboard");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [shouldRedirect, user, setLocation]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      setShouldRedirect(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/">
            <div className="flex cursor-pointer items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm">
                <Mountain className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                The Integrity Protocol
              </span>
            </div>
          </Link>
          <div className="space-y-5">
            <h2 className="text-4xl font-bold leading-tight">
              Your journey to
              <br />
              freedom begins here
            </h2>
            <p className="text-base text-white/70 max-w-md leading-relaxed">
              A proven 16-week program combining CBT and ACT approaches for lasting change and recovery.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-sm text-white/50">
            <span>Evidence-based</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>Professional support</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>Confidential</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:w-1/2">
        <header className="flex items-center justify-between gap-2 flex-wrap px-5 py-4 lg:justify-end">
          <Link href="/" className="lg:hidden">
            <div className="flex cursor-pointer items-center gap-2 flex-wrap">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold tracking-tight" data-testid="text-logo">
                The Integrity Protocol
              </span>
            </div>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <Card className="w-full max-w-md border-0 shadow-none lg:shadow-sm lg:border">
            <CardHeader className="space-y-2 text-center pb-2 px-6 pt-8 sm:px-8">
              <CardTitle className="text-2xl font-bold tracking-tight" data-testid="text-login-title">
                Welcome back
              </CardTitle>
              <CardDescription className="text-sm" data-testid="text-login-description">
                Sign in to continue your program
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-4 pb-2 sm:px-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {error && (
                    <div className="flex items-start gap-3 rounded-md bg-destructive/10 p-4 text-sm text-destructive" data-testid="text-login-error">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            className="h-11"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <FormLabel className="text-sm font-medium">Password</FormLabel>
                          <Link
                            href="/forgot-password"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                            data-testid="link-forgot-password"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <PasswordInput
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            className="h-11"
                            data-testid="input-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-1">
                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isLoading}
                      data-testid="button-sign-in"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-5 px-6 pt-4 pb-8 sm:px-8">
              <div className="text-center text-sm text-muted-foreground py-1" data-testid="text-signup-link">
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-primary underline underline-offset-4">
                  Sign up
                </Link>
              </div>
              <p className="text-xs text-muted-foreground/70 text-center leading-relaxed" data-testid="text-disclaimer">
                This program is an educational and personal growth resource. It is not therapy, counseling, or a substitute for professional mental health treatment.
              </p>
            </CardFooter>
          </Card>
        </main>
      </div>
    </div>
  );
}

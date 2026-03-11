import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerClientSchema, type RegisterClientInput } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Shield, Loader2, AlertCircle, User, Check, CreditCard, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type AvailableTherapist = {
  id: string;
  name: string;
  licenseState: string | null;
  isAdmin: boolean;
};

export default function RegisterClient() {
  const { refetch } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: therapistsData, isLoading: isLoadingTherapists } = useQuery<{ therapists: AvailableTherapist[] }>({
    queryKey: ["/api/therapists/available"],
  });

  const therapists = therapistsData?.therapists || [];

  const form = useForm<RegisterClientInput>({
    resolver: zodResolver(registerClientSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      therapistId: "",
    },
  });

  // Auto-select if only one therapist available
  useEffect(() => {
    if (therapists.length === 1 && !form.getValues("therapistId")) {
      form.setValue("therapistId", therapists[0].id);
    }
  }, [therapists, form]);

  const onSubmit = async (data: RegisterClientInput) => {
    setError(null);
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register/client", data);
      await refetch();
      setLocation("/dashboard");
    } catch (err) {
      // Parse error message from the API response
      let errorMessage = "Registration failed. Please try again.";
      if (err instanceof Error) {
        const errText = err.message;
        // Try to extract JSON message from error like "400: {"message":"Email already registered"}"
        const jsonMatch = errText.match(/\{.*"message"\s*:\s*"([^"]+)".*\}/);
        if (jsonMatch && jsonMatch[1]) {
          const rawMessage = jsonMatch[1];
          // Make error messages more user-friendly
          if (rawMessage.toLowerCase().includes("email already registered")) {
            errorMessage = "This email is already registered. Please sign in instead, or use a different email address.";
          } else {
            errorMessage = rawMessage;
          }
        }
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

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
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <User className="h-6 w-6 text-secondary-foreground" />
            </div>
            <CardTitle
              className="text-2xl font-bold"
              data-testid="text-register-title"
            >
              Client Registration
            </CardTitle>
            <CardDescription data-testid="text-register-description">
              Begin your 16-week Integrity Protocol journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Week 1 Free Banner */}
            <div className="mb-4 rounded-lg border-2 border-green-600/30 dark:border-green-500/30 bg-green-600/10 dark:bg-green-500/10 p-4" data-testid="card-week1-free">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-green-600 dark:bg-green-600 text-white px-3 py-1 text-sm font-semibold" data-testid="badge-week1-free">
                  Week 1 FREE
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-week1-free-description">
                Start today with full access to Week 1 — no payment required. Experience the program before committing.
              </p>
            </div>

            <div className="mb-6 rounded-lg border bg-muted/50 p-4" data-testid="card-pricing-info">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium">Weeks 2-16</span>
                </div>
                <Badge variant="secondary">Pay as you go</Badge>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold">$14.99</span>
                <span className="text-muted-foreground">/week</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>16 weeks of structured content</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>CBT and ACT techniques</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Daily self-monitoring tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Mentor-guided progress</span>
                </li>
              </ul>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {error && (
                  <div
                    className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                    data-testid="text-register-error"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Your name"
                          autoComplete="name"
                          data-testid="input-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Create a password (min. 6 characters)"
                          autoComplete="new-password"
                          data-testid="input-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="therapistId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Select Your Mentor
                      </FormLabel>
                      {isLoadingTherapists ? (
                        <Skeleton className="h-10 w-full" />
                      ) : therapists.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                          You will be assigned to the default mentor.
                        </div>
                      ) : therapists.length === 1 ? (
                        <div className="text-sm p-3 border rounded-md bg-muted/50">
                          <span className="font-medium">{therapists[0].name}</span>
                          {therapists[0].licenseState && (
                            <span className="text-muted-foreground"> — Licensed in {therapists[0].licenseState}</span>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">
                            If your mentor referred you to this program, select them below. Otherwise, you may choose any available mentor.
                          </p>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-therapist">
                                <SelectValue placeholder="Choose a mentor..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {therapists.map((therapist) => (
                                <SelectItem key={therapist.id} value={therapist.id}>
                                  {therapist.name}
                                  {therapist.licenseState && ` (${therapist.licenseState})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isLoadingTherapists}
                  data-testid="button-sign-up"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Start Your Free Week"
                  )}
                </Button>
              </form>
            </Form>
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
            <div
              className="text-center text-sm text-muted-foreground"
            >
              Are you a mentor?{" "}
              <Link
                href="/register/therapist"
                className="font-medium text-primary underline underline-offset-4"
              >
                Register as Mentor
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

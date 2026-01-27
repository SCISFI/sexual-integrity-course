import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerClientSchema, type RegisterClientInput } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      const res = await apiRequest("POST", "/api/auth/register/client", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      await refetch();
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
              Sexual Integrity
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
              Begin your 16-week Sexual Integrity journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 rounded-lg border bg-muted/50 p-4" data-testid="card-pricing-info">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium">Weekly Access</span>
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
                  <span>Therapist-guided progress</span>
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
                        <Input
                          type="password"
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
                        Select Your Therapist
                      </FormLabel>
                      {isLoadingTherapists ? (
                        <Skeleton className="h-10 w-full" />
                      ) : therapists.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                          No therapists available at this time. Please contact support.
                        </div>
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-therapist">
                              <SelectValue placeholder="Select a therapist" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {therapists.map((therapist) => (
                              <SelectItem key={therapist.id} value={therapist.id}>
                                {therapist.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isLoadingTherapists || therapists.length === 0}
                  data-testid="button-sign-up"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Start Your Journey"
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
              Are you a therapist?{" "}
              <Link
                href="/register/therapist"
                className="font-medium text-primary underline underline-offset-4"
              >
                Register as Therapist
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerTherapistSchema, type RegisterTherapistInput } from "@shared/schema";
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
import { Shield, Loader2, AlertCircle, Stethoscope, Check, CreditCard, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

export default function RegisterTherapist() {
  const { refetch } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterTherapistInput>({
    resolver: zodResolver(registerTherapistSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      licenseState: "",
      licenseNumber: "",
      licenseAttestation: false as unknown as true,
      termsAccepted: false as unknown as true,
    },
  });

  const onSubmit = async (data: RegisterTherapistInput) => {
    setError(null);
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register/therapist", data);
      await refetch();
      setLocation("/therapist");
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
              <Stethoscope className="h-6 w-6 text-secondary-foreground" />
            </div>
            <CardTitle
              className="text-2xl font-bold"
              data-testid="text-register-title"
            >
              Mentor Registration
            </CardTitle>
            <CardDescription data-testid="text-register-description">
              Create your mentor account to manage clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg border-2 border-green-600/30 dark:border-green-500/30 bg-green-600/10 dark:bg-green-500/10 p-4" data-testid="card-trial-free">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-green-600 dark:bg-green-600 text-white px-3 py-1 text-sm font-semibold" data-testid="badge-first-month-free">
                  First Month FREE
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Start with a 30-day free trial. No charges until your trial ends.
              </p>
            </div>

            <div className="mb-6 rounded-lg border bg-muted/50 p-4" data-testid="card-pricing-info">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium">After Trial</span>
                </div>
                <Badge variant="secondary">Monthly</Badge>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold">$49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Unlimited client management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>View client progress and check-ins</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Provide feedback on client work</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
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
                          placeholder="Dr. Jane Smith"
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
                          placeholder="mentor@example.com"
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

                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    <span>Professional Licensing Information</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="licenseState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-license-state">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., LPC12345"
                              data-testid="input-license-number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="licenseAttestation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-license-attestation"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I attest that my professional license is in good standing and I agree to notify the program administrator immediately if my license status changes.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-terms-accepted"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I agree to the mentor terms and conditions, including the 50% revenue share agreement for client payments. I understand that I will receive 50% of client weekly fees ($7.50 per $14.99 week) for clients assigned to me.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-sign-up"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Mentor Account"
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
              Are you a client?{" "}
              <Link
                href="/register/client"
                className="font-medium text-primary underline underline-offset-4"
              >
                Register as Client
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

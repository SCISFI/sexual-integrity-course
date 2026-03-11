import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerAdolescentSchema, type RegisterAdolescentInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Loader2, AlertCircle, Check, Mail } from "lucide-react";
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

type AvailableTherapist = {
  id: string;
  name: string;
  licenseState: string | null;
  isAdmin: boolean;
};

export default function RegisterAdolescent() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: therapistsData, isLoading: isLoadingTherapists } = useQuery<{ therapists: AvailableTherapist[] }>({
    queryKey: ["/api/therapists/available"],
  });

  const therapists = therapistsData?.therapists || [];

  const form = useForm<RegisterAdolescentInput>({
    resolver: zodResolver(registerAdolescentSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      dateOfBirth: "",
      isHighSchool: false,
      therapistId: "",
      parentName: "",
      parentEmail: "",
    },
  });

  const isHighSchool = form.watch("isHighSchool");

  async function onSubmit(data: RegisterAdolescentInput) {
    setError(null);
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register/adolescent", data);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30">
              <Mail className="h-8 w-8 text-cyan-400" />
            </div>
            <CardTitle className="text-2xl text-white">Check the inbox</CardTitle>
            <CardDescription className="text-slate-300 mt-2">
              A consent request has been sent to your parent or guardian.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-4 text-sm text-cyan-300">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="space-y-1 text-cyan-200/80 text-xs">
                <li className="flex items-start gap-2"><Check className="h-3 w-3 mt-0.5 flex-shrink-0" />Your parent receives an email from us</li>
                <li className="flex items-start gap-2"><Check className="h-3 w-3 mt-0.5 flex-shrink-0" />They review and approve your enrollment</li>
                <li className="flex items-start gap-2"><Check className="h-3 w-3 mt-0.5 flex-shrink-0" />You receive an email that your account is active</li>
                <li className="flex items-start gap-2"><Check className="h-3 w-3 mt-0.5 flex-shrink-0" />You log in and start Week 1</li>
              </ul>
            </div>
            <p className="text-slate-400 text-sm text-center">
              The consent link expires in 30 days.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700" data-testid="button-go-to-login">
                Go to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">The Integrity Protocol</span>
          </div>
          <p className="text-slate-400 text-sm">Teen Program — Ages 13–17</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/80">
          <CardHeader>
            <CardTitle className="text-white">Teen Program Registration</CardTitle>
            <CardDescription className="text-slate-400">
              Your parent or guardian will receive a consent email before your account is activated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-red-900/30 border border-red-800 px-3 py-2 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Your Information</p>
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your full name" className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500" data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Your Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="your@email.com" className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Password</FormLabel>
                          <FormControl>
                            <PasswordInput {...field} placeholder="Create a password (min 8 characters)" className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500" data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Date of Birth</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" className="bg-slate-700/50 border-slate-600 text-white" data-testid="input-dob" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="isHighSchool"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-highschool"
                              className="border-slate-500"
                            />
                          </FormControl>
                          <FormLabel className="text-slate-300 font-normal cursor-pointer">
                            I am currently enrolled in high school
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Assigned Mentor</p>
                    <FormField
                      control={form.control}
                      name="therapistId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Select a Mentor</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white" data-testid="select-mentor">
                                <SelectValue placeholder={isLoadingTherapists ? "Loading mentors..." : "Choose your mentor"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-800 border-slate-600">
                              {therapists.map((t) => (
                                <SelectItem key={t.id} value={t.id} className="text-white focus:bg-slate-700">
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Parent / Guardian</p>
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="parentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Parent/Guardian Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Their full name" className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500" data-testid="input-parent-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="parentEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Parent/Guardian Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="parent@email.com" className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500" data-testid="input-parent-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white mt-2"
                  disabled={isLoading}
                  data-testid="button-register"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</>
                  ) : (
                    "Submit Registration"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 text-center">
            <p className="text-xs text-slate-500">
              This program is an educational and personal growth resource, not a substitute for professional mental health treatment.
            </p>
            <p className="text-sm text-slate-400">
              Already registered?{" "}
              <Link href="/login" className="text-cyan-400 hover:underline">Log in</Link>
            </p>
            <p className="text-sm text-slate-400">
              Adult registration?{" "}
              <Link href="/register/client" className="text-cyan-400 hover:underline">Adult program</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

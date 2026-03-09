import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Loader2, AlertCircle, CheckCircle2, XCircle, Lock, Eye, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

const approveSchema = z.object({
  name: z.string().min(1, "Your name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type ApproveInput = z.infer<typeof approveSchema>;

type TokenInfo = {
  status: "pending" | "approved" | "denied";
  alreadyApproved?: boolean;
  tokenId?: string;
  parentEmail?: string;
  parentName?: string;
  teenName?: string;
  teenEmail?: string;
};

export default function ParentConsent() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { refetch } = useAuth();
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);
  const [result, setResult] = useState<"approved" | "denied" | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: tokenInfo, isLoading, error: fetchError } = useQuery<TokenInfo>({
    queryKey: [`/api/parent-consent/${token}`],
    retry: false,
  });

  const form = useForm<ApproveInput>({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      name: tokenInfo?.parentName || "",
      email: tokenInfo?.parentEmail || "",
      password: "",
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (data: ApproveInput) => {
      const res = await apiRequest("POST", `/api/parent-consent/${token}/approve`, data);
      return res as { status: string; redirectTo?: string };
    },
    onSuccess: () => {
      setResult("approved");
      refetch();
      setTimeout(() => setLocation("/parent-dashboard"), 2000);
    },
    onError: (err: any) => {
      setServerError(err?.message || "Approval failed. Please try again.");
    },
  });

  const denyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/parent-consent/${token}/deny`, {});
    },
    onSuccess: () => {
      setResult("denied");
      setShowDenyConfirm(false);
    },
    onError: (err: any) => {
      setServerError(err?.message || "An error occurred.");
      setShowDenyConfirm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (fetchError || !tokenInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-white">Link Not Found</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              This consent link is invalid or has expired. Please ask your teen to contact their assigned mentor for assistance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (tokenInfo.alreadyApproved || tokenInfo.status === "approved") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-white">Already Approved</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              You have already approved {tokenInfo.teenName || "your teen"}'s enrollment. Their account is active.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (result === "approved") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-white">Enrollment Approved</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              {tokenInfo.teenName}'s account is now active. They'll receive a confirmation email. Redirecting you to your parent dashboard…
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (result === "denied") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-500/10 border border-slate-500/30">
              <XCircle className="h-8 w-8 text-slate-400" />
            </div>
            <CardTitle className="text-white">Enrollment Declined</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              You have declined {tokenInfo.teenName}'s enrollment. Their account will not be activated. The assigned mentor has been notified.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-start justify-center p-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-7 w-7 text-cyan-400" />
            <span className="text-xl font-bold text-white">The Integrity Protocol</span>
          </div>
          <p className="text-slate-400 text-sm">Parental Consent Review</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/80">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              {tokenInfo.teenName} has applied to join the Teen Program
            </CardTitle>
            <CardDescription className="text-slate-300 mt-1">
              Please review the information below before approving or declining.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {serverError && (
              <div className="flex items-center gap-2 rounded-md bg-red-900/30 border border-red-800 px-3 py-2 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="rounded-lg bg-slate-700/40 border border-slate-600 p-4 space-y-3">
              <h3 className="text-white font-medium text-sm">About This Program</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                The Integrity Protocol is a 16-week structured educational and personal growth program designed to help teens build strong values, integrity, and healthy habits.
              </p>
              <p className="text-amber-300 text-xs font-medium bg-amber-900/20 border border-amber-700/30 rounded px-2 py-1.5">
                This program is educational and personal-growth focused — it is not therapy or counseling.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-white font-medium text-sm">What you'll have access to:</h3>
              <div className="space-y-2">
                {[
                  { icon: Eye, label: "Progress view", desc: "Weeks completed, check-in frequency, last active date" },
                  { icon: Users, label: "Mentor communication", desc: "Direct message channel with the assigned mentor" },
                  { icon: Lock, label: "Content privacy", desc: "You will NOT see your teen's reflections or journal entries" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 rounded-lg bg-slate-700/30 border border-slate-600/50 px-3 py-2.5">
                    <Icon className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-slate-400 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!showApproveForm ? (
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={() => setShowApproveForm(true)}
                  data-testid="button-approve"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Enrollment
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => setShowDenyConfirm(true)}
                  data-testid="button-deny"
                >
                  Decline
                </Button>
              </div>
            ) : (
              <div className="space-y-4 border-t border-slate-700 pt-4">
                <div>
                  <h3 className="text-white font-medium mb-1">Create Your Parent Account</h3>
                  <p className="text-slate-400 text-xs">This account lets you monitor progress and message the mentor.</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit((d) => approveMutation.mutate(d))} className="space-y-3">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Your Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-slate-700/50 border-slate-600 text-white" data-testid="input-parent-name" />
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
                          <FormLabel className="text-slate-300">Your Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="bg-slate-700/50 border-slate-600 text-white" data-testid="input-parent-email" />
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
                          <FormLabel className="text-slate-300">Create a Password</FormLabel>
                          <FormControl>
                            <PasswordInput {...field} placeholder="Min. 8 characters" className="bg-slate-700/50 border-slate-600 text-white" data-testid="input-parent-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-3 pt-1">
                      <Button
                        type="submit"
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                        disabled={approveMutation.isPending}
                        data-testid="button-submit-approval"
                      >
                        {approveMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Approving…</>
                        ) : (
                          "Confirm Approval"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => setShowApproveForm(false)}
                      >
                        Back
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          The Integrity Protocol — an educational mentor program, not therapy or counseling.
        </p>
      </div>

      <Dialog open={showDenyConfirm} onOpenChange={setShowDenyConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Decline Enrollment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to decline {tokenInfo.teenName}'s enrollment? Their account will not be activated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => setShowDenyConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => denyMutation.mutate()}
              disabled={denyMutation.isPending}
              data-testid="button-confirm-deny"
            >
              {denyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

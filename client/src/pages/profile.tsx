import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
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
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Clock,
  BookOpen,
  Key,
  Loader2,
  LogOut,
} from "lucide-react";
import { NotificationSettings } from "@/components/NotificationSettings";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProfilePage() {
  const { user, isLoading, isAuthenticating, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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

  const cancelAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/account/cancel", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Cancelled",
        description:
          "Your account has been cancelled. You will retain access to any previously paid weeks. No refunds will be issued.",
      });
      setLocation("/login");
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (isLoading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 space-y-8">
        <div data-testid="text-profile-heading">
          <h1 className="text-2xl font-bold">Profile & Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account, notifications, and support resources.
          </p>
        </div>

        <Card data-testid="card-account-info">
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>
              Profile info for this member account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm py-1">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground min-w-[3.5rem]">Name:</span>
              <span className="font-medium" data-testid="text-account-name">
                {(user as any)?.name ?? "Not set"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm py-1">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground min-w-[3.5rem]">Email:</span>
              <span className="font-medium" data-testid="text-account-email">
                {(user as any)?.email ?? "Not set"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm py-1">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground min-w-[3.5rem]">Joined:</span>
              <span className="font-medium" data-testid="text-account-joined">
                {memberSince}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 border-t">
              <Link href="/change-password">
                <Button variant="outline" className="w-full sm:w-auto" data-testid="button-change-password">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-mentor-support">
          <CardHeader>
            <CardTitle>Mentor Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You have a dedicated mentor monitoring your progress throughout
              this program. They review your check-ins, reflections, and
              homework — and will provide personalized feedback to support your
              recovery.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Typical response time: Within 1–2 business days</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-support-resources">
          <CardHeader>
            <CardTitle>Support Resources</CardTitle>
            <CardDescription>
              A setback does NOT remove you from the program. Use these tools to
              process and move forward.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/user-manual">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                data-testid="button-user-manual"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                User Manual
              </Button>
            </Link>
          </CardContent>
        </Card>

        <NotificationSettings />

        <Card data-testid="card-cancel-account">
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Cancel Account
            </CardTitle>
            <CardDescription>
              Permanently cancel your account and subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you need to cancel your account, you will retain access to any weeks you have already paid for. No refunds will be issued for previously purchased weeks.
            </p>
            <Button
              variant="outline"
              className="w-full sm:w-auto text-destructive border-destructive/30"
              onClick={() => setShowCancelDialog(true)}
              data-testid="button-cancel-account"
            >
              Cancel Account
            </Button>
          </CardContent>
        </Card>
      </main>

      <AlertDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Your Account?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Are you sure you want to cancel your account?</p>
                <div className="p-3 bg-muted rounded-md mt-3">
                  <p className="font-medium text-foreground text-sm">
                    Important:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-1.5 list-disc list-inside space-y-1">
                    <li>
                      You will retain access to any weeks you have already
                      paid for
                    </li>
                    <li>
                      No refunds will be issued for previously purchased weeks
                    </li>
                    <li>
                      You will not be able to purchase new weeks after
                      cancellation
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-keep-account">
              Keep Account
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelAccountMutation.mutate()}
              className="bg-destructive text-destructive-foreground"
              disabled={cancelAccountMutation.isPending}
              data-testid="button-confirm-cancel-account"
            >
              {cancelAccountMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

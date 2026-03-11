import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import RegisterTherapist from "@/pages/register-therapist";
import RegisterClient from "@/pages/register-client";
import RegisterAdolescent from "@/pages/register-adolescent";
import ParentConsent from "@/pages/parent-consent";
import ParentDashboard from "@/pages/parent-dashboard";
import AdminPage from "@/pages/admin";
import AdminCohortPage from "@/pages/admin-cohort";
import CohortAnalyticsPage from "@/pages/cohort-analytics";
import Dashboard from "@/pages/dashboard";
import TherapistClient from "@/pages/therapist-client";
import TherapistHome from "@/pages/therapist-home";
import WeekPage from "@/pages/week";
import DailyCheckinPage from "@/pages/daily-checkin";
import RelapseAutopsyPage from "@/pages/relapse-autopsy";
import PricingPage from "@/pages/pricing";
import AdminClientPage from "@/pages/admin-client";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import ChangePassword from "@/pages/change-password";
import AnalyticsPage from "@/pages/analytics";
import UserManualPage from "@/pages/user-manual";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, isAuthenticating } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticating && !user) {
      navigate("/login");
    }
  }, [user, isLoading, isAuthenticating, navigate]);

  if (isLoading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!user) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes — no auth required */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/register/therapist" component={RegisterTherapist} />
      <Route path="/register/client" component={RegisterClient} />
      <Route path="/register/adolescent" component={RegisterAdolescent} />
      <Route path="/parent-consent/:token" component={ParentConsent} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/pricing" component={PricingPage} />

      {/* Protected routes — redirect to /login if not authenticated */}
      <Route path="/parent-dashboard">
        {() => <ProtectedRoute component={ParentDashboard} />}
      </Route>
      <Route path="/change-password">
        {() => <ProtectedRoute component={ChangePassword} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPage} />}
      </Route>
      <Route path="/admin/clients/:clientId">
        {() => <ProtectedRoute component={AdminClientPage} />}
      </Route>
      <Route path="/admin/cohorts/:id/analytics">
        {() => <ProtectedRoute component={CohortAnalyticsPage} />}
      </Route>
      <Route path="/admin/cohorts/:id">
        {() => <ProtectedRoute component={AdminCohortPage} />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/therapist">
        {() => <ProtectedRoute component={TherapistHome} />}
      </Route>
      <Route path="/therapist/clients/:id">
        {() => <ProtectedRoute component={TherapistClient} />}
      </Route>
      <Route path="/week/:weekNumber">
        {() => <ProtectedRoute component={WeekPage} />}
      </Route>
      <Route path="/daily-checkin">
        {() => <ProtectedRoute component={DailyCheckinPage} />}
      </Route>
      <Route path="/analytics/:clientId">
        {() => <ProtectedRoute component={AnalyticsPage} />}
      </Route>
      <Route path="/analytics">
        {() => <ProtectedRoute component={AnalyticsPage} />}
      </Route>
      <Route path="/user-manual">
        {() => <ProtectedRoute component={UserManualPage} />}
      </Route>
      <Route path="/relapse-autopsy">
        {() => <ProtectedRoute component={RelapseAutopsyPage} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

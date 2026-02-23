import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import RegisterTherapist from "@/pages/register-therapist";
import RegisterClient from "@/pages/register-client";
import AdminPage from "@/pages/admin";
import Dashboard from "@/pages/dashboard";
import TherapistClient from "@/pages/therapist-client";
import TherapistHome from "@/pages/therapist-home";
import WeekPage from "@/pages/week";
import DailyCheckinPage from "@/pages/daily-checkin";
import Checkin from "@/pages/checkin";
import Protected from "@/pages/protected";
import RelapseAutopsyPage from "@/pages/relapse-autopsy";
import PricingPage from "@/pages/pricing";
import AdminClientPage from "@/pages/admin-client";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import ChangePassword from "@/pages/change-password";
import AnalyticsPage from "@/pages/analytics";
import UserManualPage from "@/pages/user-manual";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/register/therapist" component={RegisterTherapist} />
      <Route path="/register/client" component={RegisterClient} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/change-password" component={ChangePassword} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/clients/:clientId" component={AdminClientPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/therapist" component={TherapistHome} />
      <Route path="/therapist-home" component={TherapistHome} />
      <Route path="/week/:weekNumber" component={WeekPage} />
      <Route path="/daily-checkin" component={DailyCheckinPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/analytics/:clientId" component={AnalyticsPage} />
      <Route path="/user-manual" component={UserManualPage} />
      <Route path="/therapist/clients/:id" component={TherapistClient} />
      <Route path="/checkin" component={Checkin} />
      <Route path="/protected" component={Protected} />
      <Route path="/relapse-autopsy" component={RelapseAutopsyPage} />
      <Route path="/pricing" component={PricingPage} />
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

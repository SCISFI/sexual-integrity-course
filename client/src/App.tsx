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
import Dashboard from "@/pages/dashboard";
import TherapistClient from "@/pages/therapist-client";
<Route path="/therapist-home" component={TherapistHome} />;

import TherapistHome from "@/pages/therapist-home";
import WeekPage from "@/pages/week";
import Checkin from "@/pages/checkin";
import Protected from "@/pages/protected";
import RelapseAutopsyPage from "@/pages/relapse-autopsy";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/therapist-home" component={TherapistHome} />
      <Route path="/week/:weekNumber" component={WeekPage} />
      <Route path="/therapist/clients/:id" component={TherapistClient} />
      <Route path="/checkin" component={Checkin} />
      <Route path="/protected" component={Protected} />
      <Route path="/relapse-autopsy" component={RelapseAutopsyPage} />
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

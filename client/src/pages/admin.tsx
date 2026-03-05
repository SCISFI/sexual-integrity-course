import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Shield, 
  Users, 
  Stethoscope, 
  Plus, 
  Edit, 
  Calendar,
  LogOut,
  Loader2,
  Check,
  X,
  Eye,
  Key,
  DollarSign,
  Trash2,
  AlertTriangle,
  UserCircle,
  ChevronDown,
  LayoutGrid,
  BarChart2,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import { Link } from "wouter";

interface Therapist {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionStatus: string | null;
  allFeesWaived: boolean | null;
  createdAt: string;
}

interface Client {
  id: string;
  email: string;
  name: string | null;
  role: string;
  startDate: string | null;
  subscriptionStatus: string | null;
  allFeesWaived: boolean | null;
  createdAt: string;
  therapists: { id: string; name: string | null; email: string }[];
  waivedWeeks: number[];
}

interface OverdueReview {
  therapistId: string;
  therapistName: string;
  clientId: string;
  clientName: string;
  weekNumber: number;
  completedAt: string;
  hoursPending: number;
}

interface CohortItem {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCreateTherapist, setShowCreateTherapist] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
  const [therapistEditForm, setTherapistEditForm] = useState({ name: "", email: "", newPassword: "" });

  const [newTherapist, setNewTherapist] = useState({ name: "", email: "", password: "" });
  const [newClient, setNewClient] = useState({ name: "", email: "", password: "", therapistId: "" });
  const [editForm, setEditForm] = useState({ startDate: "", allFeesWaived: false, therapistId: "" });
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deletingClient, setDeletingClient] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [deletingTherapist, setDeletingTherapist] = useState<{ id: string; name: string | null; email: string; clientCount: number } | null>(null);
  const [reassignToTherapistId, setReassignToTherapistId] = useState("");

  const [showCreateCohort, setShowCreateCohort] = useState(false);
  const [newCohort, setNewCohort] = useState({ name: "", description: "" });
  const [editingCohort, setEditingCohort] = useState<CohortItem | null>(null);
  const [editCohortForm, setEditCohortForm] = useState({ name: "", description: "" });
  const [deletingCohort, setDeletingCohort] = useState<CohortItem | null>(null);

  const { data: cohortsData, isLoading: loadingCohorts } = useQuery<{ cohorts: CohortItem[] }>({
    queryKey: ["/api/admin/cohorts"],
    enabled: !!(user && (user as any).role === "admin"),
  });
  const cohortsList = cohortsData?.cohorts || [];

  const createCohortMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      apiRequest("POST", "/api/admin/cohorts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      setShowCreateCohort(false);
      setNewCohort({ name: "", description: "" });
      toast({ title: "Cohort created" });
    },
    onError: () => toast({ title: "Failed to create cohort", variant: "destructive" }),
  });

  const updateCohortMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string } }) =>
      apiRequest("PATCH", `/api/admin/cohorts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      setEditingCohort(null);
      toast({ title: "Cohort updated" });
    },
    onError: () => toast({ title: "Failed to update cohort", variant: "destructive" }),
  });

  const deleteCohortMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/cohorts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      setDeletingCohort(null);
      toast({ title: "Cohort deleted" });
    },
    onError: () => toast({ title: "Failed to delete cohort", variant: "destructive" }),
  });

  const { data: therapistsData, isLoading: loadingTherapists } = useQuery({
    queryKey: ["/api/admin/therapists"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ["/api/admin/clients"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  const { data: revenueData, isLoading: loadingRevenue } = useQuery<{ revenue: { therapistId: string; therapistName: string | null; therapistEmail: string; totalAmount: number; paymentCount: number }[] }>({
    queryKey: ["/api/admin/revenue"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  const { data: overdueReviewsData, isLoading: loadingOverdueReviews } = useQuery<{ overdueReviews: OverdueReview[] }>({
    queryKey: ["/api/admin/overdue-reviews"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  const overdueReviews = overdueReviewsData?.overdueReviews || [];

  const createTherapistMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/admin/therapists", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create therapist");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/therapists"] });
      setShowCreateTherapist(false);
      setNewTherapist({ name: "", email: "", password: "" });
      toast({ title: "Mentor created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; therapistId?: string }) => {
      const res = await apiRequest("POST", "/api/admin/clients", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create client");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      setShowCreateClient(false);
      setNewClient({ name: "", email: "", password: "", therapistId: "" });
      toast({ title: "Client created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/clients/${clientId}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update client");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      setEditingClient(null);
      toast({ title: "Client updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignTherapistMutation = useMutation({
    mutationFn: async ({ therapistId, clientId }: { therapistId: string; clientId: string }) => {
      const res = await apiRequest("POST", "/api/admin/assignments", { therapistId, clientId });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to assign therapist");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      toast({ title: "Mentor assigned successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/admin/reset-password/${userId}`, { newPassword });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to reset password");
      }
      return res.json();
    },
    onSuccess: () => {
      setResetPasswordUser(null);
      setNewPassword("");
      toast({ title: "Password reset successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/clients/${clientId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete client");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      setDeletingClient(null);
      toast({ title: "Client deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTherapistMutation = useMutation({
    mutationFn: async ({ therapistId, allFeesWaived }: { therapistId: string; allFeesWaived: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/therapists/${therapistId}`, { allFeesWaived });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update therapist");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/therapists"] });
      toast({ title: "Mentor updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const editTherapistMutation = useMutation({
    mutationFn: async ({ therapistId, data }: { therapistId: string; data: { name?: string; email?: string; newPassword?: string } }) => {
      const res = await apiRequest("PATCH", `/api/admin/therapists/${therapistId}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update mentor");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/therapists"] });
      setEditingTherapist(null);
      setTherapistEditForm({ name: "", email: "", newPassword: "" });
      toast({ title: "Mentor updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTherapistMutation = useMutation({
    mutationFn: async ({ therapistId, reassignToTherapistId }: { therapistId: string; reassignToTherapistId?: string }) => {
      const res = await apiRequest("DELETE", `/api/admin/therapists/${therapistId}`, { reassignToTherapistId });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete therapist");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/therapists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      setDeletingTherapist(null);
      setReassignToTherapistId("");
      toast({ 
        title: "Mentor deleted", 
        description: data.reassignedClients > 0 
          ? `${data.reassignedClients} clients were reassigned.` 
          : "No clients needed reassignment." 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const therapists: Therapist[] = (therapistsData as any)?.therapists || [];
  const allClients: Client[] = (clientsData as any)?.clients || [];
  
  const clients = clientSearchQuery.trim()
    ? allClients.filter(c => 
        (c.name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
         c.email.toLowerCase().includes(clientSearchQuery.toLowerCase()))
      )
    : allClients;

  if (user && (user as any).role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-profile-menu">
                  <UserCircle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{(user as any)?.name || "Admin"}</p>
                    <p className="text-xs text-muted-foreground">{(user as any)?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/change-password")} data-testid="menu-change-password">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Tabs defaultValue="clients" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
              <TabsTrigger value="clients" data-testid="tab-clients">
                <Users className="mr-1.5 h-4 w-4" />
                <span>Clients</span>
              </TabsTrigger>
              <TabsTrigger value="therapists" data-testid="tab-therapists">
                <Stethoscope className="mr-1.5 h-4 w-4" />
                <span>Mentors</span>
              </TabsTrigger>
              <TabsTrigger value="revenue" data-testid="tab-revenue">
                <DollarSign className="mr-1.5 h-4 w-4" />
                <span>Revenue</span>
              </TabsTrigger>
              <TabsTrigger value="overdue-reviews" data-testid="tab-overdue-reviews" className="relative">
                <AlertTriangle className="mr-1.5 h-4 w-4" />
                <span>Overdue</span>
                {overdueReviews.length > 0 && (
                  <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5" data-testid="badge-overdue-reviews-count">
                    {overdueReviews.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="cohorts" data-testid="tab-cohorts">
                <LayoutGrid className="mr-1.5 h-4 w-4" />
                <span>Cohorts</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="clients" className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold" data-testid="text-clients-heading">Clients</h2>
              <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" data-testid="button-create-client">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Client</DialogTitle>
                    <DialogDescription>Add a new client to the program</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-name">Name</Label>
                      <Input
                        id="client-name"
                        value={newClient.name}
                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                        placeholder="Client name"
                        data-testid="input-client-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-email">Email</Label>
                      <Input
                        id="client-email"
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        placeholder="client@example.com"
                        data-testid="input-client-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-password">Password</Label>
                      <PasswordInput
                        id="client-password"
                        value={newClient.password}
                        onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                        placeholder="Initial password"
                        data-testid="input-client-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-therapist">Assign Mentor (optional)</Label>
                      <Select
                        value={newClient.therapistId || "none"}
                        onValueChange={(value) => setNewClient({ ...newClient, therapistId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger id="client-therapist" data-testid="select-therapist">
                          <SelectValue placeholder="No mentor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No mentor</SelectItem>
                          {therapists.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name || t.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createClientMutation.mutate(newClient)}
                      disabled={createClientMutation.isPending}
                      className="w-full sm:w-auto"
                      data-testid="button-submit-client"
                    >
                      {createClientMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Create Client
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Input
                placeholder="Search clients by name or email..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="sm:max-w-xs"
                data-testid="input-client-search"
              />
              {allClients.filter(c => c.therapists.length === 0).length > 0 && (
                <Badge variant="destructive" data-testid="badge-unassigned-count">
                  {allClients.filter(c => c.therapists.length === 0).length} unassigned
                </Badge>
              )}
            </div>

            {loadingClients ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : clients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No clients yet. Create your first client above.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="hidden md:block">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Mentor(s)</TableHead>
                          <TableHead>Fees Waived</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => (
                          <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                            <TableCell className="font-medium">{client.name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{client.email}</TableCell>
                            <TableCell>{client.startDate || "Not set"}</TableCell>
                            <TableCell>
                              {client.therapists.length > 0
                                ? client.therapists.map((t) => t.name || t.email).join(", ")
                                : <span className="text-muted-foreground">None</span>}
                            </TableCell>
                            <TableCell>
                              {client.allFeesWaived ? (
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Link href={`/admin/clients/${client.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    data-testid={`button-view-client-${client.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingClient(client);
                                    setEditForm({
                                      startDate: client.startDate || "",
                                      allFeesWaived: client.allFeesWaived || false,
                                      therapistId: client.therapists.length > 0 ? client.therapists[0].id : "",
                                    });
                                  }}
                                  data-testid={`button-edit-client-${client.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setResetPasswordUser({ id: client.id, name: client.name, email: client.email })}
                                  data-testid={`button-reset-password-client-${client.id}`}
                                  title="Reset Password"
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingClient({ id: client.id, name: client.name, email: client.email })}
                                  data-testid={`button-delete-client-${client.id}`}
                                  title="Delete Client"
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="space-y-3 md:hidden">
                  {clients.map((client) => (
                    <Card key={client.id} data-testid={`card-client-${client.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{client.name || "—"}</p>
                            <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Link href={`/admin/clients/${client.id}`}>
                              <Button variant="ghost" size="icon" data-testid={`button-view-client-mobile-${client.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingClient(client);
                                setEditForm({
                                  startDate: client.startDate || "",
                                  allFeesWaived: client.allFeesWaived || false,
                                  therapistId: client.therapists.length > 0 ? client.therapists[0].id : "",
                                });
                              }}
                              data-testid={`button-edit-client-mobile-${client.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                          {client.startDate && (
                            <span className="text-muted-foreground">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {client.startDate}
                            </span>
                          )}
                          {client.therapists.length > 0 ? (
                            <Badge variant="outline" className="text-xs">
                              {client.therapists.map((t) => t.name || t.email).join(", ")}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">No mentor</Badge>
                          )}
                          {client.allFeesWaived && (
                            <Badge variant="secondary" className="text-xs">Fees waived</Badge>
                          )}
                        </div>
                        <div className="mt-3 flex gap-2 border-t pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResetPasswordUser({ id: client.id, name: client.name, email: client.email })}
                            data-testid={`button-reset-password-client-mobile-${client.id}`}
                          >
                            <Key className="h-3.5 w-3.5 mr-1.5" />
                            Reset Password
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingClient({ id: client.id, name: client.name, email: client.email })}
                            className="text-destructive ml-auto"
                            data-testid={`button-delete-client-mobile-${client.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="therapists" className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold" data-testid="text-mentors-heading">Mentors</h2>
              <Dialog open={showCreateTherapist} onOpenChange={setShowCreateTherapist}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" data-testid="button-create-therapist">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Mentor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Mentor</DialogTitle>
                    <DialogDescription>Add a new mentor to the platform</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="therapist-name">Name</Label>
                      <Input
                        id="therapist-name"
                        value={newTherapist.name}
                        onChange={(e) => setNewTherapist({ ...newTherapist, name: e.target.value })}
                        placeholder="Dr. Jane Smith"
                        data-testid="input-therapist-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="therapist-email">Email</Label>
                      <Input
                        id="therapist-email"
                        type="email"
                        value={newTherapist.email}
                        onChange={(e) => setNewTherapist({ ...newTherapist, email: e.target.value })}
                        placeholder="mentor@example.com"
                        data-testid="input-therapist-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="therapist-password">Password</Label>
                      <PasswordInput
                        id="therapist-password"
                        value={newTherapist.password}
                        onChange={(e) => setNewTherapist({ ...newTherapist, password: e.target.value })}
                        placeholder="Initial password"
                        data-testid="input-therapist-password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createTherapistMutation.mutate(newTherapist)}
                      disabled={createTherapistMutation.isPending}
                      className="w-full sm:w-auto"
                      data-testid="button-submit-therapist"
                    >
                      {createTherapistMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Create Mentor
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loadingTherapists ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : therapists.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No mentors yet. Create your first mentor above.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="hidden md:block">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Subscription Waived</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {therapists.map((therapist) => (
                          <TableRow key={therapist.id} data-testid={`row-therapist-${therapist.id}`}>
                            <TableCell className="font-medium">{therapist.name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{therapist.email}</TableCell>
                            <TableCell>{therapist.subscriptionStatus || "active"}</TableCell>
                            <TableCell>
                              <Switch
                                checked={therapist.allFeesWaived || false}
                                onCheckedChange={(checked) => {
                                  updateTherapistMutation.mutate({
                                    therapistId: therapist.id,
                                    allFeesWaived: checked,
                                  });
                                }}
                                disabled={updateTherapistMutation.isPending}
                                data-testid={`switch-therapist-waiver-${therapist.id}`}
                              />
                            </TableCell>
                            <TableCell className="text-muted-foreground">{new Date(therapist.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingTherapist(therapist);
                                    setTherapistEditForm({ name: therapist.name || "", email: therapist.email, newPassword: "" });
                                  }}
                                  data-testid={`button-edit-therapist-${therapist.id}`}
                                  title="Edit Mentor"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setResetPasswordUser({ id: therapist.id, name: therapist.name, email: therapist.email })}
                                  data-testid={`button-reset-password-therapist-${therapist.id}`}
                                  title="Reset Password"
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const clientCount = allClients.filter(c => 
                                      c.therapists?.some(t => t.id === therapist.id)
                                    ).length;
                                    setDeletingTherapist({ 
                                      id: therapist.id, 
                                      name: therapist.name, 
                                      email: therapist.email,
                                      clientCount
                                    });
                                  }}
                                  data-testid={`button-delete-therapist-${therapist.id}`}
                                  title="Delete Mentor"
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="space-y-3 md:hidden">
                  {therapists.map((therapist) => (
                    <Card key={therapist.id} data-testid={`card-therapist-${therapist.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{therapist.name || "—"}</p>
                            <p className="text-sm text-muted-foreground truncate">{therapist.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {therapist.subscriptionStatus || "active"}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`mobile-waiver-${therapist.id}`} className="text-sm text-muted-foreground">Fees waived</Label>
                            <Switch
                              id={`mobile-waiver-${therapist.id}`}
                              checked={therapist.allFeesWaived || false}
                              onCheckedChange={(checked) => {
                                updateTherapistMutation.mutate({
                                  therapistId: therapist.id,
                                  allFeesWaived: checked,
                                });
                              }}
                              disabled={updateTherapistMutation.isPending}
                              data-testid={`switch-therapist-waiver-mobile-${therapist.id}`}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(therapist.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2 border-t pt-3 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTherapist(therapist);
                              setTherapistEditForm({ name: therapist.name || "", email: therapist.email, newPassword: "" });
                            }}
                            data-testid={`button-edit-therapist-mobile-${therapist.id}`}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResetPasswordUser({ id: therapist.id, name: therapist.name, email: therapist.email })}
                            data-testid={`button-reset-password-therapist-mobile-${therapist.id}`}
                          >
                            <Key className="h-3.5 w-3.5 mr-1.5" />
                            Reset Password
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const clientCount = allClients.filter(c => 
                                c.therapists?.some(t => t.id === therapist.id)
                              ).length;
                              setDeletingTherapist({ 
                                id: therapist.id, 
                                name: therapist.name, 
                                email: therapist.email,
                                clientCount
                              });
                            }}
                            className="text-destructive ml-auto"
                            data-testid={`button-delete-therapist-mobile-${therapist.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-5">
            <h2 className="text-xl font-semibold" data-testid="text-revenue-heading">Revenue by Mentor</h2>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mentor Revenue Share (50%)</CardTitle>
                <CardDescription>
                  Track revenue generated by each mentor — mentors earn 50% of client payments
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingRevenue ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !revenueData?.revenue || revenueData.revenue.length === 0 ? (
                  <div className="px-6 pb-6 text-center text-muted-foreground">
                    No revenue data yet. Revenue will appear here once clients make payments.
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mentor</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Payments</TableHead>
                            <TableHead className="text-right">Total Revenue</TableHead>
                            <TableHead className="text-right">Mentor Share (50%)</TableHead>
                            <TableHead className="text-right">Your Share (50%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {revenueData.revenue.map((row) => (
                            <TableRow key={row.therapistId} data-testid={`row-revenue-${row.therapistId}`}>
                              <TableCell className="font-medium">{row.therapistName || "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{row.therapistEmail}</TableCell>
                              <TableCell className="text-right">{row.paymentCount}</TableCell>
                              <TableCell className="text-right">
                                ${(row.totalAmount / 100).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                                ${(row.totalAmount / 100 * 0.5).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${(row.totalAmount / 100 * 0.5).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell className="text-right">
                              {revenueData.revenue.reduce((sum, r) => sum + r.paymentCount, 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${(revenueData.revenue.reduce((sum, r) => sum + r.totalAmount, 0) / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-green-600 dark:text-green-400">
                              ${(revenueData.revenue.reduce((sum, r) => sum + r.totalAmount, 0) / 100 * 0.5).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${(revenueData.revenue.reduce((sum, r) => sum + r.totalAmount, 0) / 100 * 0.5).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="space-y-3 p-4 md:hidden">
                      {revenueData.revenue.map((row) => (
                        <div key={row.therapistId} className="rounded-lg border p-4" data-testid={`card-revenue-${row.therapistId}`}>
                          <p className="font-medium">{row.therapistName || "—"}</p>
                          <p className="text-sm text-muted-foreground">{row.therapistEmail}</p>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Payments</p>
                              <p className="font-medium">{row.paymentCount}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-medium">${(row.totalAmount / 100).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Mentor Share</p>
                              <p className="font-medium text-green-600 dark:text-green-400">${(row.totalAmount / 100 * 0.5).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Your Share</p>
                              <p className="font-medium">${(row.totalAmount / 100 * 0.5).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue-reviews" className="space-y-5">
            <h2 className="text-xl font-semibold" data-testid="text-overdue-heading">Overdue Reviews</h2>

            {loadingOverdueReviews ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : overdueReviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground" data-testid="text-no-overdue-reviews">
                  <AlertTriangle className="mx-auto mb-3 h-8 w-8 opacity-40" />
                  <p className="font-medium">No overdue reviews</p>
                  <p className="text-sm mt-1">All mentors are up to date with their client reviews.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="hidden md:block">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mentor</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Week #</TableHead>
                          <TableHead>Completed Date</TableHead>
                          <TableHead>Hours Pending</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overdueReviews.map((review) => (
                          <TableRow key={`${review.clientId}-${review.weekNumber}`} data-testid={`row-overdue-${review.clientId}-${review.weekNumber}`}>
                            <TableCell className="font-medium">{review.therapistName || "—"}</TableCell>
                            <TableCell>{review.clientName || "—"}</TableCell>
                            <TableCell>Week {review.weekNumber}</TableCell>
                            <TableCell className="text-muted-foreground">{new Date(review.completedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <span className={review.hoursPending > 72 ? "font-medium text-destructive" : ""}>
                                {Math.round(review.hoursPending)} hours
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="space-y-3 md:hidden">
                  {overdueReviews.map((review) => (
                    <Card key={`${review.clientId}-${review.weekNumber}`} data-testid={`card-overdue-${review.clientId}-${review.weekNumber}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{review.therapistName || "—"}</p>
                            <p className="text-sm text-muted-foreground">{review.clientName || "—"}</p>
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            Week {review.weekNumber}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {new Date(review.completedAt).toLocaleDateString()}
                          </span>
                          <span className={review.hoursPending > 72 ? "font-medium text-destructive" : "text-muted-foreground"}>
                            {Math.round(review.hoursPending)} hours pending
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Cohorts Tab */}
          <TabsContent value="cohorts" className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold" data-testid="text-cohorts-heading">Cohorts</h2>
              <Dialog open={showCreateCohort} onOpenChange={setShowCreateCohort}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" data-testid="button-create-cohort">
                    <Plus className="mr-2 h-4 w-4" />
                    New Cohort
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Cohort</DialogTitle>
                    <DialogDescription>Group clients together for analytics and management.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input
                        placeholder="e.g. Spring 2026 Cohort"
                        value={newCohort.name}
                        onChange={e => setNewCohort(p => ({ ...p, name: e.target.value }))}
                        data-testid="input-cohort-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        placeholder="Brief description"
                        value={newCohort.description}
                        onChange={e => setNewCohort(p => ({ ...p, description: e.target.value }))}
                        data-testid="input-cohort-description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateCohort(false)}>Cancel</Button>
                    <Button
                      onClick={() => createCohortMutation.mutate(newCohort)}
                      disabled={!newCohort.name.trim() || createCohortMutation.isPending}
                      data-testid="button-submit-create-cohort"
                    >
                      {createCohortMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loadingCohorts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : cohortsList.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <LayoutGrid className="mx-auto mb-3 h-8 w-8 opacity-40" />
                  <p>No cohorts yet. Create one to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Members</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cohortsList.map(cohort => (
                      <TableRow key={cohort.id} data-testid={`row-cohort-${cohort.id}`}>
                        <TableCell className="font-medium">{cohort.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{cohort.description || "—"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" data-testid={`badge-cohort-members-${cohort.id}`}>{cohort.memberCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/admin/cohorts/${cohort.id}`)}
                              data-testid={`button-manage-cohort-${cohort.id}`}
                            >
                              <Users className="mr-1.5 h-3.5 w-3.5" />
                              Manage
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/admin/cohorts/${cohort.id}/analytics`)}
                              data-testid={`button-analytics-cohort-${cohort.id}`}
                            >
                              <BarChart2 className="mr-1.5 h-3.5 w-3.5" />
                              Analytics
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setEditingCohort(cohort); setEditCohortForm({ name: cohort.name, description: cohort.description || "" }); }}
                              data-testid={`button-edit-cohort-${cohort.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingCohort(cohort)}
                              data-testid={`button-delete-cohort-${cohort.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Cohort Dialog */}
        <Dialog open={!!editingCohort} onOpenChange={open => !open && setEditingCohort(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Cohort</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={editCohortForm.name}
                  onChange={e => setEditCohortForm(p => ({ ...p, name: e.target.value }))}
                  data-testid="input-edit-cohort-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={editCohortForm.description}
                  onChange={e => setEditCohortForm(p => ({ ...p, description: e.target.value }))}
                  data-testid="input-edit-cohort-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCohort(null)}>Cancel</Button>
              <Button
                onClick={() => editingCohort && updateCohortMutation.mutate({ id: editingCohort.id, data: editCohortForm })}
                disabled={!editCohortForm.name.trim() || updateCohortMutation.isPending}
                data-testid="button-submit-edit-cohort"
              >
                {updateCohortMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Cohort Confirm */}
        <AlertDialog open={!!deletingCohort} onOpenChange={open => !open && setDeletingCohort(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{deletingCohort?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>This removes the cohort and all its memberships. Clients will not be deleted.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deletingCohort && deleteCohortMutation.mutate(deletingCohort.id)}
                data-testid="button-confirm-delete-cohort"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>Update client settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  data-testid="input-edit-start-date"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-fees-waived">Waive All Fees</Label>
                <Switch
                  id="edit-fees-waived"
                  checked={editForm.allFeesWaived}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, allFeesWaived: checked })}
                  data-testid="switch-fees-waived"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-therapist">Assigned Mentor</Label>
                <Select
                  value={editForm.therapistId || "none"}
                  onValueChange={(value) => setEditForm({ ...editForm, therapistId: value === "none" ? "" : value })}
                >
                  <SelectTrigger id="edit-therapist" data-testid="select-edit-therapist">
                    <SelectValue placeholder="No mentor assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No mentor assigned</SelectItem>
                    {therapists.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name || t.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingClient && editingClient.therapists.length === 0 && (
                  <p className="text-sm text-destructive">This client has no mentor assigned</p>
                )}
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setEditingClient(null)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingClient) {
                    updateClientMutation.mutate({
                      clientId: editingClient.id,
                      data: editForm,
                    });
                  }
                }}
                disabled={updateClientMutation.isPending}
                className="w-full sm:w-auto"
                data-testid="button-save-client"
              >
                {updateClientMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!resetPasswordUser} onOpenChange={(open) => { if (!open) { setResetPasswordUser(null); setNewPassword(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for {resetPasswordUser?.name || resetPasswordUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  data-testid="input-new-password"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                The user will receive an email notification that their password has been changed.
              </p>
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => { setResetPasswordUser(null); setNewPassword(""); }} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (resetPasswordUser && newPassword.length >= 6) {
                    resetPasswordMutation.mutate({
                      userId: resetPasswordUser.id,
                      newPassword,
                    });
                  }
                }}
                disabled={resetPasswordMutation.isPending || newPassword.length < 6}
                className="w-full sm:w-auto"
                data-testid="button-confirm-reset-password"
              >
                {resetPasswordMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingClient} onOpenChange={(open) => { if (!open) setDeletingClient(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the account for <strong>{deletingClient?.name || deletingClient?.email}</strong>?
                This action cannot be undone. All of the client's data will be permanently removed, including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Check-in history</li>
                  <li>Weekly reflections</li>
                  <li>Homework completions</li>
                  <li>Payment records</li>
                  <li>Mentor assignments</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-client">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingClient) {
                    deleteClientMutation.mutate(deletingClient.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground"
                data-testid="button-confirm-delete-client"
              >
                {deleteClientMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete Client
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deletingTherapist} onOpenChange={(open) => { if (!open) { setDeletingTherapist(null); setReassignToTherapistId(""); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Mentor Account</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  Are you sure you want to delete the account for <strong>{deletingTherapist?.name || deletingTherapist?.email}</strong>?
                  
                  {deletingTherapist && deletingTherapist.clientCount > 0 && (
                    <div className="mt-4 p-3 border rounded-md">
                      <p className="font-medium">
                        This mentor has {deletingTherapist.clientCount} assigned client(s).
                      </p>
                      <p className="text-sm mt-2 text-muted-foreground">
                        Select a mentor to reassign these clients to:
                      </p>
                      <Select
                        value={reassignToTherapistId || "none"}
                        onValueChange={(value) => setReassignToTherapistId(value === "none" ? "" : value)}
                      >
                        <SelectTrigger className="mt-2" data-testid="select-reassign-therapist">
                          <SelectValue placeholder="-- Select mentor --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Select mentor --</SelectItem>
                          {therapists
                            .filter(t => t.id !== deletingTherapist.id)
                            .map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name || t.email}</SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-therapist">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingTherapist) {
                    deleteTherapistMutation.mutate({ 
                      therapistId: deletingTherapist.id, 
                      reassignToTherapistId: deletingTherapist.clientCount > 0 ? reassignToTherapistId : undefined 
                    });
                  }
                }}
                className="bg-destructive text-destructive-foreground"
                disabled={!!(deletingTherapist && deletingTherapist.clientCount > 0 && !reassignToTherapistId)}
                data-testid="button-confirm-delete-therapist"
              >
                {deleteTherapistMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete Mentor
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!editingTherapist} onOpenChange={(open) => { if (!open) { setEditingTherapist(null); setTherapistEditForm({ name: "", email: "", newPassword: "" }); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Mentor</DialogTitle>
              <DialogDescription>
                Update name, email, or set a new password for {editingTherapist?.name || editingTherapist?.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-therapist-name">Name</Label>
                <Input
                  id="edit-therapist-name"
                  value={therapistEditForm.name}
                  onChange={(e) => setTherapistEditForm({ ...therapistEditForm, name: e.target.value })}
                  placeholder="Full name"
                  data-testid="input-edit-therapist-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-therapist-email">Email</Label>
                <Input
                  id="edit-therapist-email"
                  type="email"
                  value={therapistEditForm.email}
                  onChange={(e) => setTherapistEditForm({ ...therapistEditForm, email: e.target.value })}
                  placeholder="email@example.com"
                  data-testid="input-edit-therapist-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-therapist-password">New Password <span className="text-muted-foreground text-xs">(optional — leave blank to keep current)</span></Label>
                <PasswordInput
                  id="edit-therapist-password"
                  value={therapistEditForm.newPassword}
                  onChange={(e) => setTherapistEditForm({ ...therapistEditForm, newPassword: e.target.value })}
                  placeholder="Min 8 characters"
                  data-testid="input-edit-therapist-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setEditingTherapist(null); setTherapistEditForm({ name: "", email: "", newPassword: "" }); }}
                data-testid="button-cancel-edit-therapist"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editingTherapist) return;
                  const data: Record<string, string> = {};
                  if (therapistEditForm.name.trim()) data.name = therapistEditForm.name.trim();
                  if (therapistEditForm.email.trim()) data.email = therapistEditForm.email.trim();
                  if (therapistEditForm.newPassword.trim()) data.newPassword = therapistEditForm.newPassword.trim();
                  editTherapistMutation.mutate({ therapistId: editingTherapist.id, data });
                }}
                disabled={editTherapistMutation.isPending}
                data-testid="button-submit-edit-therapist"
              >
                {editTherapistMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

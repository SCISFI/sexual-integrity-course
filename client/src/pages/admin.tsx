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
  AlertTriangle
} from "lucide-react";
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

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCreateTherapist, setShowCreateTherapist] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Form states
  const [newTherapist, setNewTherapist] = useState({ name: "", email: "", password: "" });
  const [newClient, setNewClient] = useState({ name: "", email: "", password: "", therapistId: "" });
  const [editForm, setEditForm] = useState({ startDate: "", allFeesWaived: false, therapistId: "" });
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deletingClient, setDeletingClient] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [deletingTherapist, setDeletingTherapist] = useState<{ id: string; name: string | null; email: string; clientCount: number } | null>(null);
  const [reassignToTherapistId, setReassignToTherapistId] = useState("");

  // Check if user is admin
  if (user && (user as any).role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  // Fetch therapists
  const { data: therapistsData, isLoading: loadingTherapists } = useQuery({
    queryKey: ["/api/admin/therapists"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  // Fetch clients
  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ["/api/admin/clients"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  // Fetch revenue data
  const { data: revenueData, isLoading: loadingRevenue } = useQuery<{ revenue: { therapistId: string; therapistName: string | null; therapistEmail: string; totalAmount: number; paymentCount: number }[] }>({
    queryKey: ["/api/admin/revenue"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  // Fetch overdue reviews
  const { data: overdueReviewsData, isLoading: loadingOverdueReviews } = useQuery<{ overdueReviews: OverdueReview[] }>({
    queryKey: ["/api/admin/overdue-reviews"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  const overdueReviews = overdueReviewsData?.overdueReviews || [];

  // Create therapist mutation
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
      toast({ title: "Therapist created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create client mutation
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

  // Update client mutation
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

  // Assign therapist mutation
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
      toast({ title: "Therapist assigned successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Reset password mutation
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

  // Delete client mutation
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

  // Update therapist fee waiver mutation
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
      toast({ title: "Therapist updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete therapist mutation
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
        title: "Therapist deleted", 
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
  
  // Filter clients based on search query
  const clients = clientSearchQuery.trim()
    ? allClients.filter(c => 
        (c.name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
         c.email.toLowerCase().includes(clientSearchQuery.toLowerCase()))
      )
    : allClients;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/change-password">
              <Button variant="ghost" size="icon" title="Change Password" data-testid="button-change-password">
                <Key className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients" data-testid="tab-clients">
              <Users className="mr-2 h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="therapists" data-testid="tab-therapists">
              <Stethoscope className="mr-2 h-4 w-4" />
              Therapists
            </TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-revenue">
              <DollarSign className="mr-2 h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="overdue-reviews" data-testid="tab-overdue-reviews" className="relative">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Overdue Reviews
              {overdueReviews.length > 0 && (
                <Badge variant="destructive" className="ml-2" data-testid="badge-overdue-reviews-count">
                  {overdueReviews.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Clients</h2>
                <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-client">
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
                      <Label htmlFor="client-therapist">Assign Therapist (optional)</Label>
                      <Select
                        value={newClient.therapistId || "none"}
                        onValueChange={(value) => setNewClient({ ...newClient, therapistId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger id="client-therapist" data-testid="select-therapist">
                          <SelectValue placeholder="No therapist" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No therapist</SelectItem>
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
              
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search clients by name or email..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="max-w-xs"
                  data-testid="input-client-search"
                />
                {allClients.filter(c => c.therapists.length === 0).length > 0 && (
                  <Badge variant="destructive" data-testid="badge-unassigned-count">
                    {allClients.filter(c => c.therapists.length === 0).length} unassigned
                  </Badge>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {loadingClients ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : clients.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No clients yet. Create your first client above.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Therapist(s)</TableHead>
                        <TableHead>Fees Waived</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                          <TableCell className="font-medium">{client.name || "—"}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.startDate || "Not set"}</TableCell>
                          <TableCell>
                            {client.therapists.length > 0
                              ? client.therapists.map((t) => t.name || t.email).join(", ")
                              : "None"}
                          </TableCell>
                          <TableCell>
                            {client.allFeesWaived ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Link href={`/admin/clients/${client.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-view-client-${client.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
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
                                size="sm"
                                onClick={() => setResetPasswordUser({ id: client.id, name: client.name, email: client.email })}
                                data-testid={`button-reset-password-client-${client.id}`}
                                title="Reset Password"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingClient({ id: client.id, name: client.name, email: client.email })}
                                data-testid={`button-delete-client-${client.id}`}
                                title="Delete Client"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="therapists" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Therapists</h2>
              <Dialog open={showCreateTherapist} onOpenChange={setShowCreateTherapist}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-therapist">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Therapist
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Therapist</DialogTitle>
                    <DialogDescription>Add a new therapist to the platform</DialogDescription>
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
                        placeholder="therapist@example.com"
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
                      data-testid="button-submit-therapist"
                    >
                      {createTherapistMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Create Therapist
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                {loadingTherapists ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : therapists.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No therapists yet. Create your first therapist above.
                  </div>
                ) : (
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
                          <TableCell>{therapist.email}</TableCell>
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
                          <TableCell>{new Date(therapist.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="flex gap-1">
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
                              title="Delete Therapist"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Revenue by Therapist</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Therapist Revenue Share (50%)
                </CardTitle>
                <CardDescription>
                  Track revenue generated by each therapist — therapists earn 50% of client payments
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingRevenue ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : !revenueData?.revenue || revenueData.revenue.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No revenue data yet. Revenue will appear here once clients make payments.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Therapist</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Payments</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Therapist Share (50%)</TableHead>
                        <TableHead className="text-right">Your Share (50%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueData.revenue.map((row) => (
                        <TableRow key={row.therapistId} data-testid={`row-revenue-${row.therapistId}`}>
                          <TableCell className="font-medium">{row.therapistName || "—"}</TableCell>
                          <TableCell>{row.therapistEmail}</TableCell>
                          <TableCell className="text-right">{row.paymentCount}</TableCell>
                          <TableCell className="text-right">
                            ${(row.totalAmount / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600 dark:text-green-500">
                            ${(row.totalAmount / 100 * 0.5).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${(row.totalAmount / 100 * 0.5).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">
                          {revenueData.revenue.reduce((sum, r) => sum + r.paymentCount, 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(revenueData.revenue.reduce((sum, r) => sum + r.totalAmount, 0) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 dark:text-green-500">
                          ${(revenueData.revenue.reduce((sum, r) => sum + r.totalAmount, 0) / 100 * 0.5).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(revenueData.revenue.reduce((sum, r) => sum + r.totalAmount, 0) / 100 * 0.5).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue-reviews" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Overdue Reviews</h2>
            </div>

            <Card>
              <CardContent className="p-0">
                {loadingOverdueReviews ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : overdueReviews.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground" data-testid="text-no-overdue-reviews">
                    <AlertTriangle className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p>No overdue reviews</p>
                    <p className="text-sm">All therapists are up to date with their client reviews.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Therapist</TableHead>
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
                          <TableCell>{new Date(review.completedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={review.hoursPending > 72 ? "font-semibold text-red-600 dark:text-red-500" : ""}>
                              {Math.round(review.hoursPending)} hours
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Client Dialog */}
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
                <Label htmlFor="edit-therapist">Assigned Therapist</Label>
                <Select
                  value={editForm.therapistId || "none"}
                  onValueChange={(value) => setEditForm({ ...editForm, therapistId: value === "none" ? "" : value })}
                >
                  <SelectTrigger id="edit-therapist" data-testid="select-edit-therapist">
                    <SelectValue placeholder="No therapist assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No therapist assigned</SelectItem>
                    {therapists.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name || t.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingClient && editingClient.therapists.length === 0 && (
                  <p className="text-sm text-destructive">This client has no therapist assigned</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingClient(null)}>
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

        {/* Reset Password Dialog */}
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
            <DialogFooter>
              <Button variant="outline" onClick={() => { setResetPasswordUser(null); setNewPassword(""); }}>
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

        {/* Delete Client Confirmation Dialog */}
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
                  <li>Therapist assignments</li>
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

        {/* Delete Therapist Confirmation Dialog */}
        <AlertDialog open={!!deletingTherapist} onOpenChange={(open) => { if (!open) { setDeletingTherapist(null); setReassignToTherapistId(""); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Therapist Account</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  Are you sure you want to delete the account for <strong>{deletingTherapist?.name || deletingTherapist?.email}</strong>?
                  
                  {deletingTherapist && deletingTherapist.clientCount > 0 && (
                    <div className="mt-4 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        This therapist has {deletingTherapist.clientCount} assigned client(s).
                      </p>
                      <p className="text-sm mt-2 text-yellow-700 dark:text-yellow-300">
                        Select a therapist to reassign these clients to:
                      </p>
                      <Select
                        value={reassignToTherapistId || "none"}
                        onValueChange={(value) => setReassignToTherapistId(value === "none" ? "" : value)}
                      >
                        <SelectTrigger className="mt-2" data-testid="select-reassign-therapist">
                          <SelectValue placeholder="-- Select therapist --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Select therapist --</SelectItem>
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
                Delete Therapist
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

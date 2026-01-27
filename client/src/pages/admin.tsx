import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Key
} from "lucide-react";
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

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCreateTherapist, setShowCreateTherapist] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form states
  const [newTherapist, setNewTherapist] = useState({ name: "", email: "", password: "" });
  const [newClient, setNewClient] = useState({ name: "", email: "", password: "", therapistId: "" });
  const [editForm, setEditForm] = useState({ startDate: "", allFeesWaived: false });
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

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

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const therapists: Therapist[] = (therapistsData as any)?.therapists || [];
  const clients: Client[] = (clientsData as any)?.clients || [];

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
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
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
                      <Input
                        id="client-password"
                        type="password"
                        value={newClient.password}
                        onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                        placeholder="Initial password"
                        data-testid="input-client-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-therapist">Assign Therapist (optional)</Label>
                      <select
                        id="client-therapist"
                        className="w-full rounded-md border p-2"
                        value={newClient.therapistId}
                        onChange={(e) => setNewClient({ ...newClient, therapistId: e.target.value })}
                        data-testid="select-therapist"
                      >
                        <option value="">No therapist</option>
                        {therapists.map((t) => (
                          <option key={t.id} value={t.id}>{t.name || t.email}</option>
                        ))}
                      </select>
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
                      <Input
                        id="therapist-password"
                        type="password"
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
                          <TableCell>{new Date(therapist.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setResetPasswordUser({ id: therapist.id, name: therapist.name, email: therapist.email })}
                              data-testid={`button-reset-password-therapist-${therapist.id}`}
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4" />
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
                <Input
                  id="new-password"
                  type="password"
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
      </main>
    </div>
  );
}

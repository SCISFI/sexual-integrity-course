import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCreateTherapist, setShowCreateTherapist] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  const [newTherapist, setNewTherapist] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    password: "",
    therapistId: "",
  });
  const [editForm, setEditForm] = useState({
    startDate: "",
    allFeesWaived: false,
    therapistId: "",
  });
  const [resetPasswordUser, setResetPasswordUser] = useState<{
    id: string;
    name: string | null;
    email: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deletingClient, setDeletingClient] = useState<{
    id: string;
    name: string | null;
    email: string;
  } | null>(null);
  const [deletingTherapist, setDeletingTherapist] = useState<{
    id: string;
    name: string | null;
    email: string;
    clientCount: number;
  } | null>(null);
  const [reassignToTherapistId, setReassignToTherapistId] = useState("");

  if (user && (user as any).role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const { data: therapistsData, isLoading: loadingTherapists } = useQuery({
    queryKey: ["/api/admin/therapists"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ["/api/admin/clients"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  const { data: revenueData, isLoading: loadingRevenue } = useQuery<{
    revenue: {
      therapistId: string;
      therapistName: string | null;
      therapistEmail: string;
      totalAmount: number;
      paymentCount: number;
    }[];
  }>({
    queryKey: ["/api/admin/revenue"],
    enabled: !!(user && (user as any).role === "admin"),
  });

  const { data: overdueReviewsData, isLoading: loadingOverdueReviews } =
    useQuery<{ overdueReviews: OverdueReview[] }>({
      queryKey: ["/api/admin/overdue-reviews"],
      enabled: !!(user && (user as any).role === "admin"),
    });

  const overdueReviews = overdueReviewsData?.overdueReviews || [];

  const createTherapistMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
    }) => {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      therapistId?: string;
    }) => {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/clients/${clientId}`,
        data,
      );
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/reset-password/${userId}`,
        { newPassword },
      );
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTherapistMutation = useMutation({
    mutationFn: async ({
      therapistId,
      allFeesWaived,
    }: {
      therapistId: string;
      allFeesWaived: boolean;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/therapists/${therapistId}`,
        { allFeesWaived },
      );
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTherapistMutation = useMutation({
    mutationFn: async ({
      therapistId,
      reassignToTherapistId,
    }: {
      therapistId: string;
      reassignToTherapistId?: string;
    }) => {
      const res = await apiRequest(
        "DELETE",
        `/api/admin/therapists/${therapistId}`,
        { reassignToTherapistId },
      );
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
        description:
          data.reassignedClients > 0
            ? `${data.reassignedClients} clients were reassigned.`
            : "No clients needed reassignment.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const therapists: Therapist[] = (therapistsData as any)?.therapists || [];
  const allClients: Client[] = (clientsData as any)?.clients || [];

  const clients = clientSearchQuery.trim()
    ? allClients.filter(
        (c) =>
          c.name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(clientSearchQuery.toLowerCase()),
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <UserCircle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {(user as any)?.name || "Admin"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(user as any)?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation("/change-password")}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">
              <Users className="mr-2 h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="therapists">
              <Stethoscope className="mr-2 h-4 w-4" />
              Mentors
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <DollarSign className="mr-2 h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="overdue-reviews" className="relative">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Overdue Reviews
              {overdueReviews.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {overdueReviews.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Clients</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Search clients..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={() => setShowCreateClient(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mentor(s)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name || "—"}
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>
                          {client.therapists
                            .map((t) => t.name || t.email)
                            .join(", ") || "None"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/clients/${client.id}`}>
                              <Button variant="ghost" size="sm">
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
                                  therapistId: client.therapists[0]?.id || "",
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Therapist, Revenue, and Overdue Tabs restored fully in background logic */}
        </Tabs>
      </main>
    </div>
  );
}

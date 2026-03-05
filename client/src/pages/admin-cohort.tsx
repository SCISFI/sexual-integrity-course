import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft, Users, Loader2, Trash2, Plus, BarChart2,
  UserCircle, ChevronDown, LogOut, Shield, Edit, Search,
} from "lucide-react";
import { Link } from "wouter";

interface CohortMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  startDate: string | null;
  addedAt: string | null;
}

interface CohortDetail {
  id: string;
  name: string;
  description: string | null;
}

interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function AdminCohortPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showEditCohort, setShowEditCohort] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [showDeleteCohort, setShowDeleteCohort] = useState(false);
  const [removingMember, setRemovingMember] = useState<CohortMember | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const { data: cohortData, isLoading: loadingCohort } = useQuery<{ cohort: CohortDetail }>({
    queryKey: ["/api/admin/cohorts", id],
    queryFn: () => fetch(`/api/admin/cohorts/${id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const { data: membersData, isLoading: loadingMembers } = useQuery<{ members: CohortMember[] }>({
    queryKey: ["/api/admin/cohorts", id, "members"],
    queryFn: () => fetch(`/api/admin/cohorts/${id}/members`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const { data: allClientsData } = useQuery<{ clients: UserSearchResult[] }>({
    queryKey: ["/api/admin/clients"],
    enabled: showAddMember,
  });

  const cohort = cohortData?.cohort;
  const members = membersData?.members || [];
  const memberIds = new Set(members.map(m => m.id));

  const filteredClients = (allClientsData?.clients || []).filter(c => {
    if (memberIds.has(c.id)) return false;
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const updateCohortMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      apiRequest("PATCH", `/api/admin/cohorts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      setShowEditCohort(false);
      toast({ title: "Cohort updated" });
    },
    onError: () => toast({ title: "Failed to update cohort", variant: "destructive" }),
  });

  const deleteCohortMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/admin/cohorts/${id}`),
    onSuccess: () => {
      toast({ title: "Cohort deleted" });
      setLocation("/admin");
    },
    onError: () => toast({ title: "Failed to delete cohort", variant: "destructive" }),
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/admin/cohorts/${id}/members`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts", id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      toast({ title: "Member added" });
    },
    onError: () => toast({ title: "Failed to add member", variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/admin/cohorts/${id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts", id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      setRemovingMember(null);
      toast({ title: "Member removed" });
    },
    onError: () => toast({ title: "Failed to remove member", variant: "destructive" }),
  });

  if (loadingCohort) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Cohort not found.</p>
          <Button variant="outline" onClick={() => setLocation("/admin")}>Back to Admin</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")} data-testid="button-back-admin">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Admin
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold hidden sm:block">{cohort.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="button-profile-dropdown">
                    <UserCircle className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:block">{user?.name || user?.email}</span>
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Cohort Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-cohort-name">{cohort.name}</h1>
                {cohort.description && (
                  <p className="mt-1 text-muted-foreground" data-testid="text-cohort-description">{cohort.description}</p>
                )}
                <Badge variant="secondary" className="mt-2" data-testid="badge-member-count">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/admin/cohorts/${id}/analytics`)}
                  data-testid="button-view-analytics"
                >
                  <BarChart2 className="mr-1.5 h-4 w-4" />
                  Analytics
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditForm({ name: cohort.name, description: cohort.description || "" }); setShowEditCohort(true); }}
                  data-testid="button-edit-cohort"
                >
                  <Edit className="mr-1.5 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive border-destructive/30"
                  onClick={() => setShowDeleteCohort(true)}
                  data-testid="button-delete-cohort"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <Button size="sm" onClick={() => setShowAddMember(true)} data-testid="button-add-member">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-2 h-7 w-7 opacity-40" />
                <p>No members yet. Add clients to this cohort.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(member => (
                      <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                        <TableCell className="font-medium">{member.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{member.email}</TableCell>
                        <TableCell className="text-sm">
                          {member.startDate ? new Date(member.startDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.addedAt ? new Date(member.addedAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRemovingMember(member)}
                            data-testid={`button-remove-member-${member.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Cohort Dialog */}
      <Dialog open={showEditCohort} onOpenChange={setShowEditCohort}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cohort</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                data-testid="input-edit-cohort-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
                data-testid="input-edit-cohort-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCohort(false)}>Cancel</Button>
            <Button
              onClick={() => updateCohortMutation.mutate(editForm)}
              disabled={!editForm.name.trim() || updateCohortMutation.isPending}
              data-testid="button-save-cohort"
            >
              {updateCohortMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Cohort Confirm */}
      <AlertDialog open={showDeleteCohort} onOpenChange={setShowDeleteCohort}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{cohort.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the cohort and all memberships. Clients will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCohortMutation.mutate()}
              data-testid="button-confirm-delete-cohort"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirm */}
      <AlertDialog open={!!removingMember} onOpenChange={open => !open && setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removingMember?.name || removingMember?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be removed from this cohort. Their account and progress will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removingMember && removeMemberMutation.mutate(removingMember.id)}
              data-testid="button-confirm-remove-member"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Search for clients to add to this cohort.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or email"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                data-testid="input-member-search"
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
              {filteredClients.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {memberSearch ? "No matching clients found." : "All clients are already members."}
                </p>
              ) : filteredClients.slice(0, 20).map(client => (
                <div key={client.id} className="flex items-center justify-between px-3 py-2.5" data-testid={`row-client-search-${client.id}`}>
                  <div>
                    <p className="text-sm font-medium">{client.name || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addMemberMutation.mutate(client.id)}
                    disabled={addMemberMutation.isPending}
                    data-testid={`button-add-member-${client.id}`}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddMember(false); setMemberSearch(""); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

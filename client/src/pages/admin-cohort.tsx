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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft, Users, Loader2, Trash2, Plus, BarChart2,
  UserCircle, ChevronDown, LogOut, Shield, Edit, Search,
  Mail, Sparkles, Send, X, CheckCircle2, Clock, ExternalLink,
} from "lucide-react";
import { Link } from "wouter";

interface CohortMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  startDate: string | null;
  addedAt: string | null;
  completedWeeks: number[];
  lastCheckinDate: string | null;
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
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Broadcast message state
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastStep, setBroadcastStep] = useState<"topic" | "draft">("topic");
  const [broadcastTopic, setBroadcastTopic] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastDraft, setBroadcastDraft] = useState("");
  const [broadcastGenerating, setBroadcastGenerating] = useState(false);
  const [broadcastSending, setBroadcastSending] = useState(false);

  const openBroadcast = () => {
    setBroadcastStep("topic");
    setBroadcastTopic("");
    setBroadcastSubject("");
    setBroadcastDraft("");
    setShowBroadcast(true);
  };

  const generateBroadcastDraft = async () => {
    if (!broadcastTopic.trim()) return;
    setBroadcastGenerating(true);
    try {
      const res = await apiRequest("POST", `/api/admin/cohorts/${id}/generate-message`, { topic: broadcastTopic });
      const data = await res.json();
      setBroadcastSubject(data.subject || "");
      setBroadcastDraft(data.draftText || "");
      setBroadcastStep("draft");
    } catch {
      toast({ title: "Failed to generate draft", variant: "destructive" });
    } finally {
      setBroadcastGenerating(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastDraft.trim()) return;
    setBroadcastSending(true);
    try {
      const res = await apiRequest("POST", `/api/admin/cohorts/${id}/broadcast`, {
        subject: broadcastSubject,
        content: broadcastDraft,
      });
      const data = await res.json();
      setShowBroadcast(false);
      toast({ title: `Sent to ${data.sent} member${data.sent !== 1 ? "s" : ""}${data.failed > 0 ? ` (${data.failed} failed)` : ""}` });
    } catch {
      toast({ title: "Failed to send messages", variant: "destructive" });
    } finally {
      setBroadcastSending(false);
    }
  };

  const isAdmin = (user as any)?.role === "admin";
  const backPath = isAdmin ? "/admin" : "/therapist";
  const backLabel = isAdmin ? "Admin" : "Dashboard";
  const clientsApiKey = isAdmin ? "/api/admin/clients" : "/api/therapist/clients";

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
    queryKey: [clientsApiKey],
    enabled: showAddMember,
  });

  const cohort = cohortData?.cohort;
  const members = membersData?.members || [];
  const memberIds = new Set(members.map(m => m.id));

  const filteredClients = ((allClientsData as any)?.clients || (allClientsData as any)?.data || []).filter((c: UserSearchResult) => {
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
      setLocation(backPath);
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
          <Button variant="outline" onClick={() => setLocation(backPath)}>Back to {backLabel}</Button>
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
              <Button variant="ghost" size="sm" onClick={() => setLocation(backPath)} data-testid="button-back-admin">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                {backLabel}
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
                  onClick={openBroadcast}
                  disabled={members.filter(m => m.role === "client").length === 0}
                  data-testid="button-message-group"
                >
                  <Mail className="mr-1.5 h-4 w-4" />
                  Message Group
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
          <CardContent className="space-y-4">
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
              <>
                {/* Member card grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map(member => {
                    const isClient = member.role === "client";
                    const isSelected = selectedMemberId === member.id;
                    const weeksCompleted = member.completedWeeks?.length ?? 0;
                    const currentWeek = Math.min(16, weeksCompleted + 1);
                    const progressPct = Math.round((weeksCompleted / 16) * 100);

                    let statusLabel = "Not Started";
                    let statusClass = "bg-muted text-muted-foreground";
                    if (!isClient) {
                      statusLabel = "Mentor";
                      statusClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
                    } else if (!member.startDate) {
                      statusLabel = "Not Started";
                      statusClass = "bg-muted text-muted-foreground";
                    } else if (member.lastCheckinDate) {
                      const daysSince = Math.floor((Date.now() - new Date(member.lastCheckinDate).getTime()) / 86400000);
                      if (daysSince <= 7) {
                        statusLabel = "Active";
                        statusClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
                      } else if (daysSince <= 21) {
                        statusLabel = "Inactive";
                        statusClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
                      } else {
                        statusLabel = "Disengaged";
                        statusClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                      }
                    } else if (member.startDate) {
                      statusLabel = "In Progress";
                      statusClass = "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
                    }

                    return (
                      <div
                        key={member.id}
                        onClick={() => isClient && setSelectedMemberId(isSelected ? null : member.id)}
                        className={`rounded-lg border p-4 transition-all ${
                          isClient ? "cursor-pointer" : "opacity-70"
                        } ${
                          isSelected
                            ? "ring-2 ring-primary border-primary"
                            : isClient
                              ? "hover:ring-1 hover:ring-border"
                              : ""
                        }`}
                        data-testid={`card-member-${member.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{member.name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {isClient && member.startDate ? (
                          <>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                              <span>Week {currentWeek} / 16</span>
                              <span>{weeksCompleted} completed</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            {member.lastCheckinDate && (
                              <p className="text-[10px] text-muted-foreground mt-2">
                                Last check-in: {(() => {
                                  const days = Math.floor((Date.now() - new Date(member.lastCheckinDate).getTime()) / 86400000);
                                  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
                                })()}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {isClient ? "Not yet started" : "Group facilitator"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected member detail panel */}
                {selectedMemberId && (() => {
                  const member = members.find(m => m.id === selectedMemberId);
                  if (!member) return null;
                  const weeksCompleted = member.completedWeeks ?? [];
                  const currentWeek = Math.min(16, weeksCompleted.length + 1);

                  const getMemberWeekStatus = (weekNum: number) => {
                    if (weeksCompleted.includes(weekNum)) return "completed";
                    if (member.startDate) {
                      const daysSinceStart = Math.floor((Date.now() - new Date(member.startDate).getTime()) / 86400000);
                      if (daysSinceStart >= (weekNum - 1) * 7) return "available";
                    }
                    return "locked";
                  };

                  return (
                    <Card className="border-primary/30" data-testid={`member-detail-panel-${selectedMemberId}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{member.name || member.email}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{member.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedMemberId(null)}
                            data-testid="button-close-member-detail"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {/* Stats row */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Weeks Completed</p>
                            <p className="font-semibold">{weeksCompleted.length} / 16</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Current Week</p>
                            <p className="font-semibold">Week {currentWeek}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Start Date</p>
                            <p className="font-semibold">
                              {member.startDate ? new Date(member.startDate).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Last Check-in</p>
                            <p className="font-semibold">
                              {member.lastCheckinDate
                                ? (() => {
                                    const days = Math.floor((Date.now() - new Date(member.lastCheckinDate).getTime()) / 86400000);
                                    return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
                                  })()
                                : "None yet"}
                            </p>
                          </div>
                        </div>

                        {/* 16-week progress grid */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Program Progress
                          </p>
                          <div className="grid grid-cols-8 gap-1.5">
                            {Array.from({ length: 16 }, (_, i) => i + 1).map(weekNum => {
                              const status = getMemberWeekStatus(weekNum);
                              return (
                                <div
                                  key={weekNum}
                                  className={`flex flex-col items-center justify-center rounded border p-1.5 ${
                                    status === "completed"
                                      ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30"
                                      : status === "available"
                                        ? "border-border"
                                        : "border-muted opacity-40"
                                  }`}
                                  data-testid={`member-week-${weekNum}`}
                                >
                                  <span className="text-[9px] text-muted-foreground leading-none">Wk</span>
                                  <span className="text-[11px] font-bold leading-none mt-0.5">{weekNum}</span>
                                  {status === "completed" ? (
                                    <CheckCircle2 className="h-2.5 w-2.5 text-green-600 dark:text-green-400 mt-0.5" />
                                  ) : status === "available" ? (
                                    <Clock className="h-2.5 w-2.5 text-muted-foreground mt-0.5" />
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pt-1 border-t">
                          <Button
                            size="sm"
                            onClick={() => setLocation(`/therapist/clients/${member.id}`)}
                            data-testid={`button-view-profile-${member.id}`}
                          >
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            View Full Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/therapist/clients/${member.id}?tab=guidance`)}
                            data-testid={`button-message-member-${member.id}`}
                          >
                            <Mail className="mr-1.5 h-3.5 w-3.5" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive border-destructive/30 ml-auto"
                            onClick={() => setRemovingMember(member)}
                            data-testid={`button-remove-member-${member.id}`}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Remove from Cohort
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </>
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
      {/* Broadcast Message Dialog */}
      <Dialog open={showBroadcast} onOpenChange={open => { if (!broadcastSending && !broadcastGenerating) setShowBroadcast(open); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Message Group — {cohort.name}
            </DialogTitle>
            <DialogDescription>
              {broadcastStep === "topic"
                ? "Describe what you want to say. AI will write a draft for you to edit before sending."
                : `Review and edit the draft. It will be sent individually to ${members.filter(m => m.role === "client").length} member${members.filter(m => m.role === "client").length !== 1 ? "s" : ""}.`}
            </DialogDescription>
          </DialogHeader>

          {broadcastStep === "topic" ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Your topic or statement</Label>
                <Textarea
                  placeholder="e.g. Encourage the group after the first two weeks — they've been showing up consistently and I want them to keep going..."
                  value={broadcastTopic}
                  onChange={e => setBroadcastTopic(e.target.value)}
                  rows={4}
                  className="resize-none"
                  data-testid="textarea-broadcast-topic"
                />
                <p className="text-xs text-muted-foreground">Describe the message in your own words. AI will turn it into a polished draft.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  value={broadcastSubject}
                  onChange={e => setBroadcastSubject(e.target.value)}
                  data-testid="input-broadcast-subject"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea
                  value={broadcastDraft}
                  onChange={e => setBroadcastDraft(e.target.value)}
                  rows={9}
                  className="resize-none text-sm leading-relaxed"
                  data-testid="textarea-broadcast-draft"
                />
              </div>
              <button
                onClick={() => setBroadcastStep("topic")}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                data-testid="button-regenerate-draft"
              >
                ← Back to topic
              </button>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBroadcast(false)} disabled={broadcastSending || broadcastGenerating}>
              Cancel
            </Button>
            {broadcastStep === "topic" ? (
              <Button
                onClick={generateBroadcastDraft}
                disabled={!broadcastTopic.trim() || broadcastGenerating}
                data-testid="button-generate-draft"
              >
                {broadcastGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Generate Draft</>
                )}
              </Button>
            ) : (
              <Button
                onClick={sendBroadcast}
                disabled={!broadcastSubject.trim() || !broadcastDraft.trim() || broadcastSending}
                data-testid="button-send-broadcast"
              >
                {broadcastSending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" />Send to {members.filter(m => m.role === "client").length} Members</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

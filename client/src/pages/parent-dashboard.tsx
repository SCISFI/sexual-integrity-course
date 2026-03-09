import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Shield, LogOut, Loader2, MessageCircle, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Calendar, Zap, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ChildProgress = {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  weeksCompleted: number;
  lastActive: string | null;
  checkinStreak: number;
};

type ParentMessage = {
  id: string;
  content: string;
  sentBy: "parent" | "mentor";
  createdAt: string;
  readAt: string | null;
};

function MessageThread({ childId, childName }: { childId: string; childName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<ParentMessage[]>({
    queryKey: ["/api/parent/messages", childId],
    queryFn: () => apiRequest("GET", `/api/parent/messages/${childId}`) as any,
    enabled: isOpen,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/parent/messages/${childId}`, { content });
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["/api/parent/messages", childId] });
      toast({ title: "Message sent", description: "Your mentor will receive your message." });
    },
    onError: () => {
      toast({ title: "Failed to send", variant: "destructive" });
    },
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
          data-testid={`button-message-mentor-${childId}`}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Message Mentor
          {isOpen ? <ChevronUp className="h-3 w-3 ml-2" /> : <ChevronDown className="h-3 w-3 ml-2" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-3">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Messages about {childName}</p>

          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : messages.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-3">No messages yet. Send your mentor a message below.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg px-3 py-2.5 text-sm ${
                    msg.sentBy === "parent"
                      ? "bg-cyan-600/20 border border-cyan-700/30 ml-6"
                      : "bg-slate-700/50 border border-slate-600 mr-6"
                  }`}
                  data-testid={`message-${msg.id}`}
                >
                  <p className={`text-xs font-medium mb-1 ${msg.sentBy === "parent" ? "text-cyan-400" : "text-slate-400"}`}>
                    {msg.sentBy === "parent" ? "You" : "Mentor"}
                  </p>
                  <p className="text-slate-200 leading-relaxed">{msg.content}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(msg.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Separator className="bg-slate-700" />

          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message to the mentor…"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px] resize-none"
              data-testid={`input-message-${childId}`}
            />
            <Button
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={!draft.trim() || sendMutation.isPending}
              onClick={() => sendMutation.mutate(draft.trim())}
              data-testid={`button-send-message-${childId}`}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <Send className="h-3 w-3 mr-2" />
              )}
              Send
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RevokeConsentButton({ childId, childName }: { childId: string; childName: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const revokeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/parent/revoke/${childId}`, {});
    },
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/parent/children"] });
      toast({ title: "Consent revoked", description: `${childName}'s account has been suspended.` });
    },
    onError: () => {
      toast({ title: "Failed to revoke consent", variant: "destructive" });
    },
  });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs"
        onClick={() => setOpen(true)}
        data-testid={`button-revoke-${childId}`}
      >
        <AlertTriangle className="h-3 w-3 mr-1.5" />
        Revoke Consent
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Revoke Consent for {childName}?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will suspend {childName}'s account immediately. They will not be able to access the program until consent is restored. This action is reversible — contact your mentor to restore access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => revokeMutation.mutate()}
              disabled={revokeMutation.isPending}
              data-testid="button-confirm-revoke"
            >
              {revokeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Revoke Consent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: children = [], isLoading } = useQuery<ChildProgress[]>({
    queryKey: ["/api/parent/children"],
    queryFn: () => apiRequest("GET", "/api/parent/children") as any,
  });

  function handleLogout() {
    logout();
    setLocation("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-400" />
            <div>
              <span className="text-white font-semibold text-sm">The Integrity Protocol</span>
              <p className="text-slate-500 text-xs">Parent Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm hidden sm:block">{(user as any)?.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Parent Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor your teen's progress and communicate with their mentor.
          </p>
        </div>

        <div className="rounded-lg bg-amber-900/20 border border-amber-700/30 px-4 py-3 text-sm text-amber-300">
          This program is educational and personal growth focused — not therapy or counseling. You can see your teen's progress, but not their personal reflections or journal entries.
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : children.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">No linked teen accounts found.</p>
              <p className="text-slate-500 text-sm mt-1">If you just approved enrollment, please refresh the page.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {children.map((child) => (
              <Card key={child.id} className="border-slate-700 bg-slate-800/60" data-testid={`card-child-${child.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        {child.name}
                        {child.subscriptionStatus === "suspended" && (
                          <Badge className="bg-red-900/50 text-red-300 border-red-700 text-xs">Suspended</Badge>
                        )}
                        {child.subscriptionStatus === "active" && (
                          <Badge className="bg-green-900/50 text-green-300 border-green-700 text-xs">Active</Badge>
                        )}
                        {child.subscriptionStatus === "pending_consent" && (
                          <Badge className="bg-amber-900/50 text-amber-300 border-amber-700 text-xs">Pending</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-slate-500 text-xs mt-0.5">{child.email}</CardDescription>
                    </div>
                    <RevokeConsentButton childId={child.id} childName={child.name || "Teen"} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-slate-700/40 border border-slate-600/50 p-3 text-center">
                      <CheckCircle2 className="h-5 w-5 text-cyan-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{child.weeksCompleted}</p>
                      <p className="text-slate-500 text-xs">of 16 weeks</p>
                    </div>
                    <div className="rounded-lg bg-slate-700/40 border border-slate-600/50 p-3 text-center">
                      <Zap className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{child.checkinStreak}</p>
                      <p className="text-slate-500 text-xs">day streak</p>
                    </div>
                    <div className="rounded-lg bg-slate-700/40 border border-slate-600/50 p-3 text-center">
                      <Calendar className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                      <p className="text-sm font-medium text-white">
                        {child.lastActive
                          ? new Date(child.lastActive).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                          : "No activity"}
                      </p>
                      <p className="text-slate-500 text-xs">last active</p>
                    </div>
                  </div>

                  <MessageThread childId={child.id} childName={child.name || "Teen"} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

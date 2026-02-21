import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Eye, UserCircle, Shield, LogOut } from "lucide-react";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  if (user && (user as any).role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["/api/admin/clients"],
    enabled: !!user,
  });

  const allClients = (clientsData as any)?.clients || [];
  const clients = allClients.filter((c: any) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => logout()}>Logout</Button>
        </div>

        <Card>
          <CardHeader>
            <Input 
              placeholder="Search clients..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="max-w-sm"
            />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="animate-spin" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client: any) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name || "—"}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/clients/${client.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
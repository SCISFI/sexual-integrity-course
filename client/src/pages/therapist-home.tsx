import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BrandHeader } from "@/components/brand-header";
import { Badge } from "@/components/ui/badge";

type ClientStatus = "Active" | "Needs Attention" | "Paused";

type TherapistClient = {
  id: string;
  fullName: string;
  role: "Primary" | "Secondary";
  currentWeek: number;
  status: ClientStatus;
  lastActivity: string;
};

const MOCK_CLIENTS: TherapistClient[] = [
  {
    id: "1",
    fullName: "John David Smith",
    role: "Primary",
    currentWeek: 4,
    status: "Needs Attention",
    lastActivity: "7 days ago",
  },
  {
    id: "2",
    fullName: "John Daniel Miller",
    role: "Secondary",
    currentWeek: 2,
    status: "Active",
    lastActivity: "2 days ago",
  },
  {
    id: "3",
    fullName: "Michael Andrew Brown",
    role: "Primary",
    currentWeek: 6,
    status: "Paused",
    lastActivity: "3 weeks ago",
  },
];

export default function TherapistHome() {
  const [, setLocation] = useLocation();

  const sortedClients = [...MOCK_CLIENTS].sort((a, b) => {
    const priority = (status: ClientStatus) =>
      status === "Needs Attention" ? 0 : status === "Active" ? 1 : 2;
    return priority(a.status) - priority(b.status);
  });

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Therapist Home</h1>
          <p className="text-muted-foreground">
            Assigned clients and clinical oversight
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your Assigned Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Client Name</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Current Week</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b hover:bg-muted cursor-pointer"
                      onClick={() =>
                        setLocation(`/therapist/clients/${client.id}`)
                      }
                    >
                      <td className="p-3 font-medium">{client.fullName}</td>
                      <td className="p-3">{client.role}</td>
                      <td className="p-3">Week {client.currentWeek}</td>

                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            client.status === "Needs Attention"
                              ? "border-amber-300 text-amber-700 bg-amber-50"
                              : client.status === "Active"
                                ? "border-green-300 text-green-700 bg-green-50"
                                : "border-muted text-muted-foreground bg-muted/40"
                          }
                        >
                          {client.status}
                        </Badge>
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {client.lastActivity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

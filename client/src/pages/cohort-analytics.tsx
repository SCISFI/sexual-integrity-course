import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
} from "recharts";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft, Shield, UserCircle, ChevronDown, LogOut,
  Loader2, Users, Activity, TrendingUp, AlertTriangle, CheckSquare,
} from "lucide-react";

interface DailyPoint {
  date: string;
  checkins: number;
  completions: number;
  activeUsers: number;
  relapses: number;
}

interface CohortAnalytics {
  totalMembers: number;
  activeMembers: number;
  checkinRate: number;
  totalWeekCompletions: number;
  avgCompletionsPerMember: number;
  relapseCount: number;
  dailySeries: DailyPoint[];
}

interface CompareCohort {
  cohortId: string;
  cohortName: string;
  dailySeries: { date: string; checkins: number; completions: number; activeUsers: number }[];
}

interface CohortItem {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

const COMPARE_COLORS = ["#3b82f6", "#10b981", "#f59e0b"] as const;

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color || ""}`} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="rounded-full bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CohortAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = (user as any)?.role === "admin";
  const backLabel = isAdmin ? "Admin" : "Dashboard";

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);

  const { data: cohortData } = useQuery<{ cohort: { id: string; name: string; description: string | null } }>({
    queryKey: ["/api/admin/cohorts", id],
    queryFn: () => fetch(`/api/admin/cohorts/${id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery<CohortAnalytics>({
    queryKey: ["/api/admin/analytics/cohorts", id, startDate, endDate],
    queryFn: () =>
      fetch(`/api/admin/analytics/cohorts/${id}?start=${startDate}&end=${endDate}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const { data: allCohortsData } = useQuery<{ cohorts: CohortItem[] }>({
    queryKey: ["/api/admin/cohorts"],
  });

  const otherCohorts = (allCohortsData?.cohorts || []).filter(c => c.id !== id);

  const compareQuery = selectedCompareIds.length > 0
    ? `/api/admin/analytics/compare?cohortIds=${[id, ...selectedCompareIds].join(",")}&start=${startDate}&end=${endDate}`
    : null;

  const { data: compareData, isLoading: loadingCompare } = useQuery<{ cohorts: CompareCohort[] }>({
    queryKey: ["/api/admin/analytics/compare", id, ...selectedCompareIds, startDate, endDate],
    queryFn: () => fetch(compareQuery!, { credentials: "include" }).then(r => r.json()),
    enabled: !!compareQuery,
  });

  const cohort = cohortData?.cohort;
  const analytics = analyticsData;

  const toggleCompare = (cohortId: string) => {
    setSelectedCompareIds(prev =>
      prev.includes(cohortId)
        ? prev.filter(x => x !== cohortId)
        : prev.length < 2 ? [...prev, cohortId] : prev
    );
  };

  const chartConfig = {
    checkins: { label: "Check-ins", color: "#3b82f6" },
    completions: { label: "Week Completions", color: "#10b981" },
    activeUsers: { label: "Active Users", color: "#8b5cf6" },
    relapses: { label: "Relapse Reports", color: "#ef4444" },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/cohorts/${id}`)} data-testid="button-back-cohort">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                {cohort?.name || "Cohort"}
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold hidden sm:block">Analytics</span>
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
        {/* Page Title + Date Range */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-analytics-title">
              {cohort?.name || "Cohort"} Analytics
            </h1>
            {cohort?.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{cohort.description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-8 w-36 text-sm"
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-8 w-36 text-sm"
                data-testid="input-end-date"
              />
            </div>
          </div>
        </div>

        {loadingAnalytics ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard icon={Users} label="Total Members" value={analytics.totalMembers} />
              <StatCard icon={Activity} label="Active Members" value={analytics.activeMembers} sub="checked in during range" />
              <StatCard
                icon={TrendingUp}
                label="Check-in Rate"
                value={`${analytics.checkinRate}%`}
                color={analytics.checkinRate >= 70 ? "text-emerald-600" : analytics.checkinRate >= 40 ? "text-amber-600" : "text-red-600"}
              />
              <StatCard icon={CheckSquare} label="Week Completions" value={analytics.totalWeekCompletions} />
              <StatCard
                icon={CheckSquare}
                label="Avg per Member"
                value={analytics.avgCompletionsPerMember}
                sub="week completions"
              />
              <StatCard
                icon={AlertTriangle}
                label="Relapse Reports"
                value={analytics.relapseCount}
                color={analytics.relapseCount > 0 ? "text-red-600" : ""}
              />
            </div>

            {/* Daily Trend Chart */}
            {analytics.dailySeries.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daily Activity Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <LineChart data={analytics.dailySeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="checkins" name="Check-ins" stroke={chartConfig.checkins.color} dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke={chartConfig.activeUsers.color} dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="completions" name="Week Completions" stroke={chartConfig.completions.color} dot={false} strokeWidth={2} />
                      {analytics.dailySeries.some(d => d.relapses > 0) && (
                        <Line type="monotone" dataKey="relapses" name="Relapse Reports" stroke={chartConfig.relapses.color} dot={false} strokeWidth={2} />
                      )}
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Activity className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p>No activity recorded in this date range.</p>
                </CardContent>
              </Card>
            )}

            {/* Compare Cohorts */}
            {otherCohorts.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-base">Compare Cohorts</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-compare-dropdown">
                          {selectedCompareIds.length === 0
                            ? "Select cohorts to compare"
                            : `${selectedCompareIds.length} cohort${selectedCompareIds.length > 1 ? "s" : ""} selected`}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Select up to 2 more</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {otherCohorts.map(c => (
                          <DropdownMenuCheckboxItem
                            key={c.id}
                            checked={selectedCompareIds.includes(c.id)}
                            onCheckedChange={() => toggleCompare(c.id)}
                            disabled={!selectedCompareIds.includes(c.id) && selectedCompareIds.length >= 2}
                            data-testid={`checkbox-compare-${c.id}`}
                          >
                            {c.name}
                            <span className="ml-auto text-xs text-muted-foreground">{c.memberCount}</span>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                {selectedCompareIds.length > 0 && (
                  <CardContent>
                    {loadingCompare ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : compareData && compareData.cohorts.length > 0 ? (
                      <div className="space-y-6">
                        {/* Active Users Comparison */}
                        <div>
                          <p className="text-sm font-medium mb-2 text-muted-foreground">Active Users per Day</p>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                tick={{ fontSize: 11 }}
                                interval="preserveStartEnd"
                                allowDuplicatedCategory={false}
                              />
                              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                              <ChartTooltip formatter={(val: number, name: string) => [val, name]} />
                              <Legend />
                              {compareData.cohorts.map((c, i) => (
                                <Line
                                  key={c.cohortId}
                                  data={c.dailySeries}
                                  type="monotone"
                                  dataKey="activeUsers"
                                  name={c.cohortName}
                                  stroke={COMPARE_COLORS[i % 3]}
                                  dot={false}
                                  strokeWidth={2}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Check-ins Comparison */}
                        <div>
                          <p className="text-sm font-medium mb-2 text-muted-foreground">Daily Check-ins</p>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                tick={{ fontSize: 11 }}
                                interval="preserveStartEnd"
                                allowDuplicatedCategory={false}
                              />
                              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                              <ChartTooltip formatter={(val: number, name: string) => [val, name]} />
                              <Legend />
                              {compareData.cohorts.map((c, i) => (
                                <Line
                                  key={c.cohortId}
                                  data={c.dailySeries}
                                  type="monotone"
                                  dataKey="checkins"
                                  name={c.cohortName}
                                  stroke={COMPARE_COLORS[i % 3]}
                                  dot={false}
                                  strokeWidth={2}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <p className="py-6 text-center text-sm text-muted-foreground">No data to compare.</p>
                    )}
                  </CardContent>
                )}
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Failed to load analytics data.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

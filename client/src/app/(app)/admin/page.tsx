"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Users,
  Swords,
  UserCheck,
  UserX,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  Ban,
  Activity,
  Terminal,
  Trophy,
  Cpu,
  Coins,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Clock,
  X,
  Server,
  Code,
  ArrowRight,
  TrendingUp,
  Database,
  BarChart4,
  ChevronDown
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Card, CardHeader, Button, Badge, Spinner, Avatar } from "@/components/ui";

type AdminTab = "dashboard" | "reports" | "users" | "rooms";

interface NavTab {
  id: AdminTab;
  label: string;
  desc: string;
  icon: any;
  count?: number;
}

export default function AdminPanelPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  
  // Users management pagination/search/filter state
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [bannedOnly, setBannedOnly] = useState(false);
  
  // Reports state
  const [reportsPage, setReportsPage] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState<"ALL" | "PENDING" | "RESOLVED" | "DISMISSED">("ALL");

  // AI Moderator Agent trigger state
  const [runningModerator, setRunningModerator] = useState(false);
  const [moderatorLogs, setModeratorLogs] = useState<any[] | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const runModerator = async () => {
    setRunningModerator(true);
    setModeratorLogs(null);
    try {
      const res = await api<{ auditLogs: any[] }>("/admin/moderator/run", {
        method: "POST"
      });
      setModeratorLogs(res.auditLogs || []);
      setShowLogsModal(true);
      reportsQuery.refetch();
      statsQuery.refetch();
    } catch (err) {
      alert("Failed to run AI Moderator Agent: " + (err as Error).message);
    } finally {
      setRunningModerator(false);
    }
  };

  // Rooms pagination state
  const [roomsPage, setRoomsPage] = useState(1);

  // Authenticate user's role on mount
  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    const isAuthorized = ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || "");
    if (!isAuthorized) {
      router.replace("/battle");
    }
  }, [user, router]);

  // Telemetry statistics query
  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api<any>("/admin/stats"),
    enabled: !!user && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || ""),
    refetchInterval: 10_000, // auto refresh telemetry stats every 10s
  });

  // Users list query
  const usersQuery = useQuery({
    queryKey: ["admin", "users", usersPage, usersSearch, bannedOnly],
    queryFn: () => api<any>(`/admin/users?page=${usersPage}&limit=10&search=${usersSearch}&bannedOnly=${bannedOnly}`),
    enabled: !!user && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || ""),
  });

  // Reports list query
  const reportsQuery = useQuery({
    queryKey: ["admin", "reports", reportsPage],
    queryFn: () => api<any>(`/admin/reports?page=${reportsPage}&limit=10`),
    enabled: !!user && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || ""),
  });

  // Rooms list query
  const roomsQuery = useQuery({
    queryKey: ["admin", "rooms", roomsPage],
    queryFn: () => api<any>(`/admin/rooms?page=${roomsPage}&limit=10`),
    enabled: !!user && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || ""),
  });

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: { role },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const toggleBanMutation = useMutation({
    mutationFn: (userId: string) =>
      api(`/admin/users/${userId}/ban`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });

  const updateReportStatusMutation = useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: string }) =>
      api(`/admin/reports/${reportId}/status`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const cancelRoomMutation = useMutation({
    mutationFn: (roomId: string) =>
      api(`/admin/rooms/${roomId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  if (!user || !["ADMIN", "MODERATOR", "OWNER"].includes(user.role || "")) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const stats = statsQuery.data || {};
  const tokens = stats.tokens || { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 };
  const perf = stats.performance || { apiLatency: "...", dbQueryTime: "...", judgeQueueLoad: "...", cpuLoad: "...", memoryUsage: "..." };
  
  const usersData = usersQuery.data || { users: [], pagination: { pages: 1 } };
  const reportsData = reportsQuery.data || { reports: [], pagination: { pages: 1 } };
  const roomsData = roomsQuery.data || { rooms: [], pagination: { pages: 1 } };

  // Local filtering for reports to ease navigation
  const filteredReports = reportsData.reports.filter((item: any) => {
    if (reportStatusFilter === "ALL") return true;
    return item.status === reportStatusFilter;
  });

  // Helper parser for visual bars in Telemetry
  const parseMetricPercentage = (str: string): number => {
    if (!str || str === "...") return 0;
    const match = str.match(/(\d+(\.\d+)?)/);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const lower = str.toLowerCase();
    if (lower.includes("ms")) {
      // Scales 0-300ms as 0-100% progress
      return Math.min(100, Math.round((val / 300) * 100));
    }
    if (lower.includes("mb")) {
      // Scales 0-1024MB (1GB) as 0-100% progress
      return Math.min(100, Math.round((val / 1024) * 100));
    }
    if (lower.endsWith("s") && !lower.endsWith("ms")) {
      // Scales 0-5s as 0-100% progress
      return Math.min(100, Math.round((val / 5) * 100));
    }
    return Math.min(100, Math.round(val));
  };

  const getMetricColor = (valStr: string): string => {
    if (!valStr || valStr === "...") return "bg-border";
    const percentage = parseMetricPercentage(valStr);
    if (percentage > 75) return "bg-danger";
    if (percentage > 40) return "bg-warning";
    return "bg-win";
  };

  // Nav tabs definition with description and icons
  const NAVIGATION_TABS: NavTab[] = [
    { id: "dashboard", label: "Dashboard", desc: "Overview & metrics", icon: Activity },
    { id: "reports", label: "Moderation", desc: "Flagged content", icon: AlertCircle, count: stats.openReports },
    { id: "users", label: "User Database", desc: "Access & permissions", icon: Users },
    { id: "rooms", label: "Battle Rooms", desc: "Active matchmaking", icon: Swords },
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* Top Banner Control Center */}
      <div className="mb-8 rounded-2xl bg-surface border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <div className="p-1 rounded-lg bg-primary/10 border border-primary/20">
                <Shield className="size-5" />
              </div>
              <span className="text-xs uppercase tracking-wider font-mono font-bold">Admin Console</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text">
              Platform Overview
            </h1>
            <p className="text-sm text-text-muted">
              Configure system parameters, monitor real-time AI usage, review flagged content, and manage users.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {stats.openReports > 0 && (
              <Badge className="bg-danger/10 border border-danger/25 text-danger font-mono px-3 py-1 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
                </span>
                {stats.openReports} Pending Actions
              </Badge>
            )}
            <Badge className="bg-surface-2 border border-border text-text font-mono capitalize px-3 py-1 text-sm">
              Role: <span className="font-bold text-primary">{user.role?.toLowerCase()}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Professional Navigation Column */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="sticky top-20">
            <Card className="p-2 border border-border bg-surface flex flex-col gap-1">
              <p className="px-4 py-2 text-[11px] font-bold text-text-faint uppercase tracking-wider font-mono">Navigation</p>
              {NAVIGATION_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-left transition-all duration-200 group border text-sm cursor-pointer",
                      active
                        ? "bg-primary-subtle border-primary/20 text-primary font-semibold"
                        : "bg-transparent border-transparent text-text-muted hover:text-text hover:bg-surface-2"
                    )}
                  >
                    <Icon className={cn(
                      "size-5 shrink-0 transition-transform group-hover:scale-105",
                      active ? "text-primary" : "text-text-faint group-hover:text-text"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate leading-none">{tab.label}</p>
                      <p className="text-[11px] text-text-faint mt-1 leading-none font-normal">{tab.desc}</p>
                    </div>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white px-1.5">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </Card>
            
            {/* System Quick Diagnostics Card */}
            <Card className="mt-4 p-4 border border-border bg-surface/50 text-xs text-text-muted space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-semibold text-text flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-win inline-block animate-pulse" />
                  API Status
                </span>
                <span className="text-[10px] font-mono text-win font-bold">OPERATIONAL</span>
              </div>
              <p className="leading-relaxed">Telemetry metrics are collected asynchronously every 10 seconds. AI token usage displays aggregate totals across Grok queries.</p>
            </Card>
          </div>
        </aside>

        {/* Right Side: Tab Contents Area */}
        <div className="lg:col-span-3 min-w-0">
          
          {/* TAB: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Telemetry Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary bg-primary/10 border-primary/20", desc: "Registered accounts" },
                  { label: "Active Rooms", value: stats.activeRooms, icon: Activity, color: "text-win bg-win-subtle border-win/25", desc: "Lobbies live now", animate: true },
                  { label: "Total Matches", value: stats.totalMatches, icon: Swords, color: "text-info bg-mode-dsa-subtle border-info/20", desc: "Battles completed" },
                  { label: "Banned Users", value: stats.bannedUsers, icon: Ban, color: "text-danger bg-loss-subtle border-danger/20", desc: "Restricted accounts" }
                ].map((item, idx) => (
                  <Card key={idx} className="hover:-translate-y-0.5 transition-all duration-200">
                    <div className="p-5 flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl border shrink-0", item.color)}>
                        <item.icon className={cn("size-6", item.animate && "animate-pulse")} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-text-faint uppercase font-mono tracking-wider">{item.label}</p>
                        <h3 className="text-2xl font-extrabold text-text tracking-tight mt-0.5">
                          {statsQuery.isLoading ? <span className="inline-block w-8 h-6 bg-surface-3 animate-pulse rounded" /> : item.value}
                        </h3>
                        <p className="text-xs text-text-faint mt-0.5 truncate">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Advanced Diagnostics (Telemetry Details) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Site Performance Metrics */}
                <Card className="xl:col-span-2">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <BarChart4 className="size-4.5 text-primary" /> System Telemetry Metrics
                    </h3>
                    <p className="text-xs text-text-faint mt-0.5">Asynchronous API response durations and server workload gauges.</p>
                  </div>
                  <div className="p-6 space-y-5">
                    {[
                      { label: "API Gateway Latency", value: perf.apiLatency, icon: Activity },
                      { label: "Database Query Load", value: perf.dbQueryTime, icon: Database },
                      { label: "CPU Server Utilization", value: perf.cpuLoad, icon: Cpu },
                      { label: "System Memory Allocated", value: perf.memoryUsage, icon: Shield },
                      { label: "Judge0 Code Runner Queue", value: perf.judgeQueueLoad, icon: Clock }
                    ].map((item, idx) => {
                      const percentage = parseMetricPercentage(item.value);
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text font-medium flex items-center gap-2">
                              <item.icon className="size-3.5 text-text-faint" />
                              {item.label}
                            </span>
                            <span className="font-mono font-bold text-text">{item.value}</span>
                          </div>
                          <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden border border-border">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", getMetricColor(item.value))}
                              style={{ width: `${statsQuery.isLoading ? 0 : percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* AI Token Budget & Costs */}
                <Card className="xl:col-span-1">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <Coins className="size-4.5 text-warning" /> LLM Token Audit
                    </h3>
                    <p className="text-xs text-text-faint mt-0.5">Real-time aggregate consumption of xAI Grok evaluation resources.</p>
                  </div>
                  <div className="p-6 flex flex-col justify-between h-[calc(100%-65px)]">
                    <div className="space-y-5">
                      <div className="bg-surface-2 border border-border rounded-xl p-4 text-center">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-text-faint font-mono block">Estimated LLM Cost</span>
                        <span className="text-3xl font-extrabold text-text tracking-tight font-mono mt-1 block">
                          ${typeof tokens.cost === "number" ? tokens.cost.toFixed(4) : "0.0000"}
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-text-muted">
                            <span>Prompt (Input)</span>
                            <span className="font-mono font-semibold text-text">{tokens.promptTokens.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(tokens.promptTokens / (tokens.totalTokens || 1)) * 100}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-text-muted">
                            <span>Completion (Output)</span>
                            <span className="font-mono font-semibold text-text">{tokens.completionTokens.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                            <div className="h-full bg-warning" style={{ width: `${(tokens.completionTokens / (tokens.totalTokens || 1)) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 mt-6 flex justify-between text-xs font-mono font-bold">
                      <span className="text-text-muted">Total Evaluated Tokens:</span>
                      <span className="text-primary">{tokens.totalTokens.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>

              </div>

              {/* Question distribution statistics & topics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Questions by Category */}
                <Card>
                  <div className="p-6 border-b border-border">
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <Code className="size-4.5 text-info" /> Questions by Mode
                    </h3>
                    <p className="text-xs text-text-faint mt-0.5">Platform database items broken down by game type.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { type: "DSA", count: stats.questionStats?.DSA ?? 0, color: "bg-mode-dsa", label: "Data Structures & Algos" },
                      { type: "FRONTEND", count: stats.questionStats?.FRONTEND ?? 0, color: "bg-mode-frontend", label: "Frontend Sandbox" },
                      { type: "BACKEND", count: stats.questionStats?.BACKEND ?? 0, color: "bg-mode-backend", label: "Backend API Architectures" },
                      { type: "PROMPT_WAR", count: stats.questionStats?.PROMPT_WAR ?? 0, color: "bg-mode-promptwar", label: "Prompt War Arena" }
                    ].map((item, idx) => {
                      const dsaC = stats.questionStats?.DSA ?? 0;
                      const frontC = stats.questionStats?.FRONTEND ?? 0;
                      const backC = stats.questionStats?.BACKEND ?? 0;
                      const promptC = stats.questionStats?.PROMPT_WAR ?? 0;
                      const totalQ = dsaC + frontC + backC + promptC || 1;
                      const pct = Math.round((item.count / totalQ) * 100);

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-text-muted font-medium">{item.label}</span>
                            <span className="font-mono font-bold text-text">{item.count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", item.color)} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Popular Topics scroll panel */}
                <Card>
                  <div className="p-6 border-b border-border">
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <TrendingUp className="size-4.5 text-win" /> Popular Categories
                    </h3>
                    <p className="text-xs text-text-faint mt-0.5">Top custom labels assigned to programming challenges.</p>
                  </div>
                  <div className="p-6">
                    {statsQuery.isLoading ? (
                      <div className="flex justify-center items-center py-6">
                        <Spinner />
                      </div>
                    ) : !stats.topicStats || stats.topicStats.length === 0 ? (
                      <div className="text-center py-8 text-xs text-text-faint font-mono">
                        No topic labels mapped.
                      </div>
                    ) : (
                      <div className="max-h-[195px] overflow-y-auto pr-2 space-y-2 select-text">
                        {stats.topicStats.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0 font-mono">
                            <span className="px-2 py-1 rounded bg-surface-2 border border-border text-text-muted">
                              {item.topic}
                            </span>
                            <span className="font-bold text-primary bg-primary-subtle border border-primary/20 px-2.5 py-0.5 rounded-full text-[10px]">
                              {item.count} {item.count === 1 ? "challenge" : "challenges"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

              </div>

            </div>
          )}

          {/* TAB: MODERATION REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              
              {/* AI Agent Console box */}
              <Card className="border border-primary/25 overflow-hidden">
                <div className="bg-primary-subtle p-6 border-b border-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                      <Cpu className="size-5" />
                      <h3 className="font-bold text-text leading-none">AI Autopilot Moderator</h3>
                    </div>
                    <p className="text-xs text-text-muted">
                      Autonomously audit flagged coding challenges. Inspects test cases, description correctness, and applies fixes.
                    </p>
                  </div>
                  <Button
                    onClick={runModerator}
                    loading={runningModerator}
                    variant="primary"
                    size="sm"
                    className="shrink-0 gap-1.5 shadow-md bg-primary hover:bg-primary-hover font-bold text-xs"
                  >
                    <Cpu className="size-3.5" />
                    <span>Run Diagnostic Agent</span>
                  </Button>
                </div>
              </Card>

              {/* Reports Table & Controls */}
              <Card>
                <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <AlertCircle className="size-4.5 text-danger" /> Flagged Queue
                    </h3>
                    <p className="text-xs text-text-faint mt-0.5">Review items flagged by system validations or platform players.</p>
                  </div>

                  {/* Filter pill row */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-surface-2 p-1 border border-border rounded-lg text-xs">
                    {(["ALL", "PENDING", "RESOLVED", "DISMISSED"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setReportStatusFilter(st)}
                        className={cn(
                          "px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer capitalize",
                          reportStatusFilter === st
                            ? "bg-surface border border-border text-primary shadow-sm"
                            : "text-text-muted hover:text-text"
                        )}
                      >
                        {st.toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {reportsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Spinner />
                    </div>
                  ) : filteredReports.length === 0 ? (
                    <div className="text-center py-16 text-text-muted text-sm font-medium">
                      No matching moderation flags in this view.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-border/60">
                      <thead className="bg-surface-2/30 text-left text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                        <tr>
                          <th className="px-6 py-4">Reported Item</th>
                          <th className="px-6 py-4">Filer</th>
                          <th className="px-6 py-4">Reason</th>
                          <th className="px-6 py-4">Details</th>
                          <th className="px-6 py-4">Created</th>
                          <th className="px-6 py-4">State</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-sm">
                        {filteredReports.map((item: any) => {
                          const reporter = item.reporter || { username: "System" };
                          const isQuestion = item.targetType === "QUESTION";
                          const reportedQ = item.reportedQuestion || { title: "Deleted Challenge", difficulty: "Casual" };
                          const reportedU = item.reportedUser || { username: "Deleted Player", isBanned: false, role: "USER" };

                          return (
                            <tr key={item._id} className="hover:bg-surface-2/20 transition-colors">
                              <td className="px-6 py-4">
                                {isQuestion ? (
                                  <div className="space-y-1">
                                    <span className="font-semibold text-text block leading-tight">{reportedQ.title}</span>
                                    <Badge className="bg-surface-3 text-[10px] text-text-muted px-1.5 py-0.5 border border-border">
                                      Challenge · {reportedQ.difficulty}
                                    </Badge>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="font-semibold text-text block leading-tight">{reportedU.username}</span>
                                    <Badge className="bg-primary-subtle text-[10px] text-primary px-1.5 py-0.5 border border-primary/10">
                                      Player · {reportedU.role || "USER"}
                                    </Badge>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-text-muted font-mono text-xs">{reporter.username}</td>
                              <td className="px-6 py-4">
                                <Badge className={cn(
                                  "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border font-mono",
                                  item.reason === "CHEATING" && "border-danger/30 bg-loss-subtle text-danger",
                                  item.reason === "SPAMMING" && "border-warning/30 bg-draw-subtle text-warning",
                                  item.reason === "OFFENSIVE_CHAT" && "border-warning/30 bg-draw-subtle text-warning",
                                  item.reason === "ABANDONING" && "border-indigo-500/25 bg-indigo-500/10 text-indigo-500",
                                  ["WRONG_DESCRIPTION", "WRONG_STARTER_CODE", "WRONG_TEST_CASES"].includes(item.reason) && "border-info/30 bg-mode-dsa-subtle text-info",
                                  item.reason === "OTHER" && "border-border bg-surface-2 text-text-muted"
                                )}>
                                  {item.reason?.replace(/_/g, " ")}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-text-muted max-w-xs truncate text-xs" title={item.details}>
                                {item.details}
                              </td>
                              <td className="px-6 py-4 text-[10px] text-text-faint font-mono leading-tight">
                                {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={cn(
                                  "text-[9px] font-bold uppercase tracking-wider font-mono",
                                  item.status === "PENDING" && "bg-danger/10 text-danger border border-danger/20",
                                  item.status === "RESOLVED" && "bg-win-subtle text-win border border-win/20",
                                  item.status === "DISMISSED" && "bg-surface-3 text-text-muted border border-border"
                                )}>
                                  {item.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                                {item.status === "PENDING" && (
                                  <>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => updateReportStatusMutation.mutate({ reportId: item._id, status: "DISMISSED" })}
                                      className="h-7 text-xs font-semibold px-2.5"
                                    >
                                      Dismiss
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => updateReportStatusMutation.mutate({ reportId: item._id, status: "RESOLVED" })}
                                      className="h-7 text-xs font-bold bg-win hover:bg-emerald-600 text-white border-none px-2.5"
                                    >
                                      Resolve
                                    </Button>
                                  </>
                                )}
                                {!isQuestion && reportedU._id && (
                                  <Button
                                    variant={reportedU.isBanned ? "outline" : "danger"}
                                    size="sm"
                                    disabled={reportedU.role === "OWNER" || reportedU.role === "ADMIN"}
                                    onClick={() => toggleBanMutation.mutate(reportedU._id)}
                                    className="h-7 text-xs font-bold gap-1 ml-1.5"
                                  >
                                    <Ban className="size-3" /> {reportedU.isBanned ? "Unban" : "Ban"}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {reportsData.pagination.pages > 1 && (
                  <div className="p-4 border-t border-border flex items-center justify-between font-mono text-xs">
                    <span className="text-text-muted">
                      Page {reportsPage} of {reportsData.pagination.pages}
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={reportsPage === 1}
                        onClick={() => setReportsPage((p) => p - 1)}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={reportsPage === reportsData.pagination.pages}
                        onClick={() => setReportsPage((p) => p + 1)}
                        className="h-8 px-2"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB: USERS LIST */}
          {activeTab === "users" && (
            <Card>
              <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-text flex items-center gap-2">
                    <Users className="size-4.5 text-primary" /> User Database
                  </h3>
                  <p className="text-xs text-text-faint mt-0.5">Manage user authorization groups, bans, and access tiers.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 flex-1 max-w-xl justify-end">
                  {/* Status Pills */}
                  <div className="flex bg-surface-2 p-1 border border-border rounded-lg text-xs">
                    <button
                      onClick={() => {
                        setBannedOnly(false);
                        setUsersPage(1);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer",
                        !bannedOnly ? "bg-surface border border-border text-primary shadow-sm" : "text-text-muted hover:text-text"
                      )}
                    >
                      All Accounts
                    </button>
                    <button
                      onClick={() => {
                        setBannedOnly(true);
                        setUsersPage(1);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer",
                        bannedOnly ? "bg-surface border border-border text-primary shadow-sm" : "text-text-muted hover:text-text"
                      )}
                    >
                      Banned Only
                    </button>
                  </div>

                  {/* Search box */}
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-faint" />
                    <input
                      type="text"
                      placeholder="Search accounts..."
                      value={usersSearch}
                      onChange={(e) => {
                        setUsersSearch(e.target.value);
                        setUsersPage(1);
                      }}
                      className="h-10 pl-9 pr-8 w-full rounded-lg border border-border bg-surface text-xs text-text placeholder:text-text-faint focus:border-primary focus:outline-none transition-colors"
                    />
                    {usersSearch && (
                      <button
                        onClick={() => {
                          setUsersSearch("");
                          setUsersPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faint hover:text-text"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Users list table */}
              <div className="overflow-x-auto">
                {usersQuery.isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Spinner />
                  </div>
                ) : usersData.users.length === 0 ? (
                  <div className="text-center py-16 text-text-muted text-sm font-medium">
                    No matching users found in database.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-border/60">
                    <thead className="bg-surface-2/30 text-left text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role Tier</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Registered Date</th>
                        <th className="px-6 py-4 text-right">Moderator Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-sm">
                      {usersData.users.map((item: any) => {
                        const isSelf = item._id === user._id;

                        return (
                          <tr key={item._id} className="hover:bg-surface-2/20 transition-colors">
                            <td className="px-6 py-4 font-semibold text-text flex items-center gap-3">
                              <Avatar src={item.avatar?.profileImageURL} name={item.username} size={28} />
                              <span className="truncate">{item.username}</span>
                            </td>
                            <td className="px-6 py-4 text-text-muted font-mono text-xs">{item.email}</td>
                            <td className="px-6 py-4">
                              <div className="relative inline-block">
                                <select
                                  disabled={isSelf || item.role === "OWNER"}
                                  value={item.role}
                                  onChange={(e) =>
                                    updateRoleMutation.mutate({
                                      userId: item._id,
                                      role: e.target.value,
                                    })
                                  }
                                  className="bg-surface border border-border text-xs rounded px-3 py-1.5 focus:border-primary focus:outline-none disabled:opacity-60 text-text font-semibold hover:bg-surface-2 transition-colors cursor-pointer appearance-none pr-8"
                                >
                                  <option value="USER">USER</option>
                                  <option value="MODERATOR">MODERATOR</option>
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="OWNER">OWNER</option>
                                </select>
                                <ChevronDown className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-faint" />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {item.isBanned ? (
                                <Badge className="bg-danger/10 border border-danger/25 text-danger text-[10px] font-semibold gap-1 py-0.5 font-mono uppercase">
                                  <Lock className="size-3" /> Banned
                                </Badge>
                              ) : (
                                <Badge className="bg-win-subtle border border-win/20 text-win text-[10px] font-semibold gap-1 py-0.5 font-mono uppercase">
                                  <Unlock className="size-3" /> Active
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-text-faint font-mono">
                              {new Date(item.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant={item.isBanned ? "secondary" : "danger"}
                                size="sm"
                                disabled={isSelf || item.role === "OWNER" || item.role === "ADMIN"}
                                onClick={() => toggleBanMutation.mutate(item._id)}
                                className="h-8 text-xs font-bold gap-1 px-3"
                              >
                                <Ban className="size-3" /> {item.isBanned ? "Unban Account" : "Ban Account"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {usersData.pagination.pages > 1 && (
                <div className="p-4 border-t border-border flex items-center justify-between font-mono text-xs">
                  <span className="text-text-muted">
                    Page {usersPage} of {usersData.pagination.pages}
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={usersPage === 1}
                      onClick={() => setUsersPage((p) => p - 1)}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={usersPage === usersData.pagination.pages}
                      onClick={() => setUsersPage((p) => p + 1)}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* TAB: BATTLE ROOMS */}
          {activeTab === "rooms" && (
            <Card>
              <div className="p-6 border-b border-border">
                <h3 className="text-base font-bold text-text flex items-center gap-2">
                  <Swords className="size-4.5 text-primary" /> Active Battle Rooms
                </h3>
                <p className="text-xs text-text-faint mt-0.5">Monitor and terminate active multiplayer or custom lobbies.</p>
              </div>

              <div className="overflow-x-auto">
                {roomsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Spinner />
                  </div>
                ) : roomsData.rooms.length === 0 ? (
                  <div className="text-center py-16 text-text-muted text-sm font-medium">
                    No active battle rooms in database.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-border/60">
                    <thead className="bg-surface-2/30 text-left text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                      <tr>
                        <th className="px-6 py-4">Room Code</th>
                        <th className="px-6 py-4">Host Owner</th>
                        <th className="px-6 py-4">Difficulty</th>
                        <th className="px-6 py-4">Arena Mode</th>
                        <th className="px-6 py-4">Lobby State</th>
                        <th className="px-6 py-4 text-right">Emergency Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-sm">
                      {roomsData.rooms.map((room: any) => (
                        <tr key={room._id} className="hover:bg-surface-2/20 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-primary select-text">{room.roomCode}</td>
                          <td className="px-6 py-4 text-text-muted font-semibold">{room.host?.username || "System Match"}</td>
                          <td className="px-6 py-4">
                            <Badge className="bg-surface-2 text-text-muted border border-border text-xs">
                              {room.difficulty || "Casual"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {room.isRanked ? (
                              <Badge className="bg-primary-subtle border border-primary/20 text-primary text-xs font-semibold py-0.5">
                                Ranked Competitive
                              </Badge>
                            ) : (
                              <Badge className="bg-surface-3 border border-border text-text-muted text-xs py-0.5">
                                Friendly Practice
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 flex items-center">
                            <span className={cn(
                              "inline-block size-2 rounded-full mr-2",
                              room.status === "STARTED" ? "bg-win animate-pulse" :
                              room.status === "FINISHED" ? "bg-text-faint" : "bg-primary animate-pulse"
                            )} />
                            <span className="font-bold text-xs text-text uppercase font-mono">{room.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {room.status !== "FINISHED" && room.status !== "CANCELLED" ? (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Terminate match room ${room.roomCode}?`)) {
                                    cancelRoomMutation.mutate(room._id);
                                  }
                                }}
                                className="h-8 text-xs font-bold gap-1 px-3"
                              >
                                <Trash2 className="size-3" /> Abort Match
                              </Button>
                            ) : (
                              <span className="text-xs text-text-faint font-semibold uppercase font-mono">Archived</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {roomsData.pagination.pages > 1 && (
                <div className="p-4 border-t border-border flex items-center justify-between font-mono text-xs">
                  <span className="text-text-muted">
                    Page {roomsPage} of {roomsData.pagination.pages}
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={roomsPage === 1}
                      onClick={() => setRoomsPage((p) => p - 1)}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={roomsPage === roomsData.pagination.pages}
                      onClick={() => setRoomsPage((p) => p + 1)}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

        </div>

      </div>

      {/* AI Moderator Audit Log Stream Modal Drawer */}
      {showLogsModal && moderatorLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border shadow-2xl rounded-2xl max-w-3xl w-full overflow-hidden flex flex-col relative select-text animate-scaleUp max-h-[85vh]">
            
            {/* Close Cross */}
            <button
              onClick={() => setShowLogsModal(false)}
              className="absolute top-4 right-4 text-text-faint hover:text-text p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-surface-2"
            >
              <X className="size-4" />
            </button>

            {/* Header Dialog */}
            <div className="p-6 border-b border-border bg-surface-2/30 flex items-center gap-3.5">
              <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl shrink-0">
                <Terminal className="size-5.5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-md font-bold tracking-tight text-text">
                  AI Autopilot Audit Feed
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Real-time compilation logs of evaluated question fields and execution outputs.
                </p>
              </div>
            </div>

            {/* Content stream log lines */}
            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs leading-relaxed max-h-[50vh]">
              {moderatorLogs.length === 0 ? (
                <div className="text-center py-16 text-text-muted font-sans">
                  All systems clean. No pending question reports were found to process.
                </div>
              ) : (
                moderatorLogs.map((log: any, idx: number) => (
                  <div
                    key={log.reportId || idx}
                    className={cn(
                      "p-4 rounded-xl border space-y-3 font-sans",
                      log.status === "RESOLVED"
                        ? "bg-win-subtle border-win/25 text-win"
                        : log.status === "DISMISSED"
                        ? "bg-surface-2 border-border text-text-muted"
                        : "bg-loss-subtle border-danger/25 text-danger"
                    )}
                  >
                    <div className="flex items-center justify-between border-b border-current/10 pb-2">
                      <span className="font-bold uppercase tracking-wider text-[10px] font-mono">
                        Audit Feed #{idx + 1} &bull; {log.status}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-current bg-surface/40 font-mono">
                        Confidence: {Math.round(log.confidence * 100)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-text-faint uppercase font-mono text-[9px] block">Target Challenge</span>
                        <span className="font-bold text-text">{log.questionTitle}</span>
                      </div>
                      <div>
                        <span className="text-text-faint uppercase font-mono text-[9px] block">Reported Reason</span>
                        <span className="font-bold text-text">{log.reason?.replace(/_/g, " ")}: "{log.details}"</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-text-faint uppercase font-mono text-[9px] block">AI Auditor Reasoning Analysis</span>
                      <p className="text-xs leading-relaxed text-text bg-surface/60 p-3 rounded-lg border border-border select-text">
                        {log.analysis}
                      </p>
                    </div>

                    {log.status === "RESOLVED" && log.fixedFields?.length > 0 && (
                      <div className="flex items-center gap-1.5 text-win text-xs font-semibold font-mono">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span>Fixed fields: <strong>{log.fixedFields.join(", ")}</strong>. Online version updated.</span>
                      </div>
                    )}

                    {log.status === "FAILED" && log.error && (
                      <div className="text-danger text-xs font-semibold font-mono">
                        Error log: {log.error}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-border bg-surface-2/30 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowLogsModal(false)}
                className="text-xs h-8 font-bold px-4"
              >
                Close Audit Feed
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

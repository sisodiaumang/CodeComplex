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

type AdminTab = "dashboard" | "reports" | "users" | "rooms" | "llm";

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
      setInspectReport(null);
      setInspectQuestionDetails(null);
    },
  });

  // Inspecting report state
  const [inspectReport, setInspectReport] = useState<any | null>(null);
  const [inspectQuestionDetails, setInspectQuestionDetails] = useState<any | null>(null);
  const [loadingQuestionDetails, setLoadingQuestionDetails] = useState<boolean>(false);
  const [inspectViewTab, setInspectViewTab] = useState<"statement" | "code">("statement");
  const [inspectLayout, setInspectLayout] = useState<"side-by-side" | "tabbed" | "stacked">("tabbed");
  const [activeCompareVersion, setActiveCompareVersion] = useState<"before" | "after">("after");

  const openInspectModal = async (report: any) => {
    setInspectReport(report);
    setInspectQuestionDetails(null);
    setInspectViewTab("statement");

    const qId = report.reportedQuestion?._id || report.reportedQuestion;
    if (qId) {
      if (report.questionSnapshotBefore && report.questionSnapshotAfter) {
        setInspectQuestionDetails({
          before: report.questionSnapshotBefore,
          after: report.questionSnapshotAfter,
        });
      } else {
        setLoadingQuestionDetails(true);
        try {
          const res = await api<any>(`/admin/questions/${qId}`);
          setInspectQuestionDetails({
            current: res
          });
        } catch (err) {
          console.error("Failed to load question details:", err);
        } finally {
          setLoadingQuestionDetails(false);
        }
      }
    }
  };

  const renderVersionBlock = (version: "before" | "after", title: string, themeClasses: string) => {
    if (!inspectQuestionDetails) return null;
    const data = version === "before" ? inspectQuestionDetails.before : inspectQuestionDetails.after;
    if (!data) return null;
    const isDanger = version === "before";
    return (
      <div className={cn("border rounded-xl p-4 flex flex-col space-y-3", themeClasses)}>
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <span className="text-xs font-bold flex items-center gap-1.5">
            {isDanger ? <AlertTriangle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
            {title}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto max-h-[45vh] space-y-3 text-xs">
          {inspectViewTab === "statement" ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-text">{data.title}</h3>
              {data.statement?.markdown ? (
                <div className="space-y-2 select-text">
                  <SimpleMarkdown content={data.statement.markdown} />
                  {data.statement.inputFormat && (
                    <div className="mt-3">
                      <h4 className="text-[10px] font-bold text-text-faint uppercase font-mono">Input Format</h4>
                      <p className="text-text-muted mt-0.5">{data.statement.inputFormat}</p>
                    </div>
                  )}
                  {data.statement.outputFormat && (
                    <div className="mt-2">
                      <h4 className="text-[10px] font-bold text-text-faint uppercase font-mono">Output Format</h4>
                      <p className="text-text-muted mt-0.5">{data.statement.outputFormat}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-text-faint">No markdown description.</div>
              )}
            </div>
          ) : (
            <CodeTemplatesView templates={data.templates} />
          )}
        </div>
      </div>
    );
  };

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

  // LLM Model Config states
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editLimitVal, setEditLimitVal] = useState<string>("");
  const [editPriorityVal, setEditPriorityVal] = useState<string>("");

  const updateModelConfigMutation = useMutation({
    mutationFn: ({ modelId, spendLimit, priority, isActive }: { modelId: string; spendLimit?: number; priority?: number; isActive?: boolean }) =>
      api(`/admin/llm-models/${modelId}`, {
        method: "PATCH",
        body: { spendLimit, priority, isActive },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setEditingModelId(null);
    },
  });

  const resetModelSpentMutation = useMutation({
    mutationFn: () =>
      api(`/admin/llm-models/reset`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  // API Key Pool States
  const [showAddKeyForm, setShowAddKeyForm] = useState(false);
  const [newKeyVal, setNewKeyVal] = useState("");
  const [newKeyLabel, setNewKeyLabel] = useState("");

  // API Key Pool Mutations
  const createApiKeyMutation = useMutation({
    mutationFn: ({ key, label }: { key: string; label?: string }) =>
      api(`/admin/api-keys`, {
        method: "POST",
        body: { key, label },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setNewKeyVal("");
      setNewKeyLabel("");
      setShowAddKeyForm(false);
    },
    onError: (err: any) => {
      alert("Failed to add API key: " + err.message);
    }
  });

  const toggleApiKeyMutation = useMutation({
    mutationFn: ({ keyId, isActive }: { keyId: string; isActive: boolean }) =>
      api(`/admin/api-keys/${keyId}`, {
        method: "PATCH",
        body: { isActive },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (err: any) => {
      alert("Failed to update API key status: " + err.message);
    }
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: (keyId: string) =>
      api(`/admin/api-keys/${keyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (err: any) => {
      alert("Failed to delete API key: " + err.message);
    }
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
  const perf = stats.performance || {
    apiLatency: "...",
    dbQueryTime: "...",
    judgeQueueLoad: "...",
    cpuLoad: "...",
    memoryUsage: "...",
    systemCpuLoad: "... / ... / ...",
    systemTotalMem: "...GB",
    systemFreeMem: "...GB",
    systemMemUsed: "...GB",
    cpuCores: "...",
    systemUptime: "..."
  };
  const apiKeysList = stats.apiKeys || [];
  const modelConfigsList = stats.modelConfigs || [];
  
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
    { id: "llm", label: "LLM Manager", desc: "API Keys & Fallbacks", icon: Cpu },
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
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
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

                {/* VM Host Resources */}
                <Card className="xl:col-span-1">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <Server className="size-4.5 text-primary" /> VM Host Resources
                    </h3>
                    <p className="text-xs text-text-faint mt-0.5">Real-time load and system memory metrics from the virtual machine host.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted font-medium flex items-center gap-2">
                          <Cpu className="size-3.5 text-text-faint" /> CPU Cores
                        </span>
                        <span className="font-mono font-bold text-text">{perf.cpuCores || "..."}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted font-medium flex items-center gap-2">
                          <Activity className="size-3.5 text-text-faint" /> Load Avg (1m/5m/15m)
                        </span>
                        <span className="font-mono font-bold text-text">{perf.systemCpuLoad || "..."}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted font-medium flex items-center gap-2">
                          <Shield className="size-3.5 text-text-faint" /> RAM Used / Total
                        </span>
                        <span className="font-mono font-bold text-text">
                          {perf.systemMemUsed || "..."} / {perf.systemTotalMem || "..."}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden border border-border">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{
                            width: `${
                              statsQuery.isLoading
                                ? 0
                                : Math.round(
                                    (parseFloat(perf.systemMemUsed || "0") /
                                      parseFloat(perf.systemTotalMem || "1")) *
                                      100
                                  ) || 0
                            }%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-border">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted font-medium flex items-center gap-2">
                          <Clock className="size-3.5 text-text-faint" /> Host Uptime
                        </span>
                        <span className="font-mono font-bold text-text">{perf.systemUptime || "..."}</span>
                      </div>
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
                      { type: "BUG_FIX", count: stats.questionStats?.BUG_FIX ?? 0, color: "bg-mode-bugfix", label: "Bug Fix Debugging" },
                      { type: "FRONTEND", count: stats.questionStats?.FRONTEND ?? 0, color: "bg-mode-frontend", label: "Frontend Sandbox" },
                      { type: "BACKEND", count: stats.questionStats?.BACKEND ?? 0, color: "bg-mode-backend", label: "Backend API Architectures" },
                      { type: "PROMPT_WAR", count: stats.questionStats?.PROMPT_WAR ?? 0, color: "bg-mode-promptwar", label: "Prompt War Arena" }
                    ].map((item, idx) => {
                      const dsaC = stats.questionStats?.DSA ?? 0;
                      const bugC = stats.questionStats?.BUG_FIX ?? 0;
                      const frontC = stats.questionStats?.FRONTEND ?? 0;
                      const backC = stats.questionStats?.BACKEND ?? 0;
                      const promptC = stats.questionStats?.PROMPT_WAR ?? 0;
                      const totalQ = dsaC + bugC + frontC + backC + promptC || 1;
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
                          const isSite = item.targetType === "SITE";
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
                                ) : isSite ? (
                                  <div className="space-y-1">
                                    <span className="font-semibold text-text block leading-tight">General Website Feedback</span>
                                    <Badge className="bg-surface-2 text-[10px] text-info px-1.5 py-0.5 border border-info/20">
                                      Site · SYSTEM
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
                                  !["CHEATING", "SPAMMING", "OFFENSIVE_CHAT", "ABANDONING", "OTHER"].includes(item.reason) && "border-info/30 bg-mode-dsa-subtle text-info",
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
                              <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                                {isQuestion && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openInspectModal(item)}
                                    className="h-7 text-xs font-semibold px-2.5 text-primary hover:bg-primary-subtle border border-primary/20"
                                  >
                                    {item.status === "RESOLVED" && item.questionSnapshotBefore ? "Verify Changes" : "Inspect"}
                                  </Button>
                                )}
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

          {/* TAB: LLM MANAGER */}
          {activeTab === "llm" && (
            <div className="space-y-6 animate-fadeIn">
              {/* API Keys Card */}
              <Card>
                <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <Lock className="size-4.5 text-warning" /> Groq Cloud API Keys Pool
                    </h3>
                    <p className="text-xs text-text-faint mt-0.5">
                      Secure pool of API keys. Automatically rotates and switches keys on rate limits or failures.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAddKeyForm((prev) => !prev)}
                    variant="primary"
                    size="sm"
                    className="h-9 px-4 font-bold text-xs gap-1.5 shadow-md bg-primary hover:bg-primary-hover cursor-pointer"
                  >
                    <Sparkles className="size-3.5" />
                    {showAddKeyForm ? "Close Form" : "Add API Key"}
                  </Button>
                </div>
                
                {showAddKeyForm && (
                  <div className="p-6 bg-surface-2/45 border-b border-border space-y-4 animate-fadeIn select-text">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-mono">New Encrypted API Key</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase font-mono">API Key (gsk_...)</label>
                        <input
                          type="password"
                          value={newKeyVal}
                          onChange={(e) => setNewKeyVal(e.target.value)}
                          placeholder="Paste your Groq API Key here"
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary placeholder:text-text-faint"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase font-mono">Custom Label (Optional)</label>
                        <input
                          type="text"
                          value={newKeyLabel}
                          onChange={(e) => setNewKeyLabel(e.target.value)}
                          placeholder="e.g. Back-up Key 2"
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary placeholder:text-text-faint"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end font-sans">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setNewKeyVal("");
                          setNewKeyLabel("");
                          setShowAddKeyForm(false);
                        }}
                        className="h-9 px-4"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (!newKeyVal.trim()) {
                            alert("API Key is required");
                            return;
                          }
                          createApiKeyMutation.mutate({
                            key: newKeyVal,
                            label: newKeyLabel || undefined
                          });
                        }}
                        loading={createApiKeyMutation.isPending}
                        className="h-9 px-4"
                      >
                        Save Key Securely
                      </Button>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {apiKeysList.length === 0 ? (
                    <div className="text-center py-6 text-sm text-text-muted font-medium">
                      No API keys loaded. Use the button above to add your first key securely.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {apiKeysList.map((key: any) => (
                        <div key={key._id} className="flex items-center justify-between p-4 bg-surface-2 border border-border rounded-xl">
                          <div className="space-y-1 min-w-0 flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-primary truncate">{key.label}</span>
                              {key.isEnv ? (
                                <Badge className="bg-surface-3 border border-border text-text-faint text-[9px] font-bold uppercase tracking-wider py-0 px-1 font-mono">
                                  system env
                                </Badge>
                              ) : (
                                <Badge className="bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider py-0 px-1 font-mono">
                                  db encrypted
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs font-mono font-semibold text-text-muted block truncate">{key.masked}</span>
                            <div className="flex items-center gap-2.5 mt-2 text-[10px] font-mono text-text-faint">
                              <span>Spent: <strong className="text-text-muted">${(key.totalCost || 0).toFixed(4)}</strong></span>
                              <span>•</span>
                              <span>Requests: <strong className="text-text-muted">{key.requestCount || 0}</strong></span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {key.isEnv ? (
                              <Badge className="bg-win-subtle text-win border border-win/20 text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono">
                                ACTIVE
                              </Badge>
                            ) : (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    toggleApiKeyMutation.mutate({
                                      keyId: key._id,
                                      isActive: !key.isActive
                                    });
                                  }}
                                  loading={toggleApiKeyMutation.isPending}
                                  className={cn(
                                    "h-8 px-2.5 text-[11px] font-bold cursor-pointer font-mono uppercase tracking-wider",
                                    key.isActive ? "text-danger bg-danger/10 border-danger/20 hover:bg-danger/25" : "text-win bg-win-subtle border-win/20 hover:bg-win/20"
                                  )}
                                >
                                  {key.isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to remove ${key.label} from the pool?`)) {
                                      deleteApiKeyMutation.mutate(key._id);
                                    }
                                  }}
                                  loading={deleteApiKeyMutation.isPending}
                                  className="h-8 w-8 p-0 cursor-pointer"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Model Fallbacks & Budgets */}
              <Card>
                <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <Cpu className="size-4.5 text-primary" /> Groq Model Fallbacks & Limits
                    </h3>
                    <p className="text-xs text-text-faint mt-0.5">
                      Configure budgets, priorities, and fallbacks. Models switch automatically when limits are hit.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (confirm("Reset current spend statistics for all models? This will restore traffic to primary models.")) {
                        resetModelSpentMutation.mutate();
                      }
                    }}
                    loading={resetModelSpentMutation.isPending}
                    variant="secondary"
                    size="sm"
                    className="h-9 px-4 font-bold text-xs gap-1.5 text-primary bg-primary/10 border-primary/20 hover:bg-primary-subtle"
                  >
                    <Activity className="size-3.5" />
                    Reset All Spending
                  </Button>
                </div>

                <div className="overflow-x-auto font-mono text-xs">
                  {modelConfigsList.length === 0 ? (
                    <div className="text-center py-16 text-sm text-text-muted font-medium font-sans">
                      No models configured. Restart the backend to seed the database.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-border/60">
                      <thead className="bg-surface-2/30 text-left text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                        <tr>
                          <th className="px-6 py-4">Model Details</th>
                          <th className="px-6 py-4">Status & Health</th>
                          <th className="px-6 py-4">Priority Rank</th>
                          <th className="px-6 py-4">Budget Limits & Spent</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-xs">
                        {modelConfigsList.map((model: any) => {
                          const isEditing = editingModelId === model.modelId;
                          const isOverLimit = model.limitSpent >= model.spendLimit;
                          const pct = Math.min(100, Math.round((model.limitSpent / (model.spendLimit || 1)) * 100));

                          return (
                            <tr key={model.modelId} className="hover:bg-surface-2/20 transition-colors">
                              <td className="px-6 py-4 font-sans">
                                <span className="font-bold text-text block select-text">{model.displayName}</span>
                                <span className="text-[11px] font-mono text-text-faint block mt-0.5 select-text">{model.modelId}</span>
                                <span className="text-[10px] text-text-muted font-mono block mt-1">
                                  In: ${model.inputPricePer1M}/1M | Out: ${model.outputPricePer1M}/1M
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1.5">
                                  {!model.isActive ? (
                                    <Badge className="bg-surface-3 border border-border text-text-muted text-[10px] font-bold uppercase tracking-wider">
                                      Disabled
                                    </Badge>
                                  ) : isOverLimit ? (
                                    <Badge className="bg-danger/10 border border-danger/20 text-danger text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                      Limit Exceeded
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-win-subtle border border-win/20 text-win text-[10px] font-bold uppercase tracking-wider">
                                      Active
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-text-faint block font-mono">
                                    Reset: {new Date(model.lastResetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editPriorityVal}
                                    onChange={(e) => setEditPriorityVal(e.target.value)}
                                    className="w-16 h-8 px-2 bg-surface border border-border rounded text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                                    min="1"
                                    max="100"
                                  />
                                ) : (
                                  <div className="flex items-center gap-1.5 font-sans">
                                    <span className="font-mono font-bold text-text text-sm">#{model.priority}</span>
                                    {model.priority === 1 && (
                                      <Badge className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-2 max-w-[200px]">
                                  <div className="flex justify-between items-center text-xs font-mono">
                                    <span className="text-text-muted font-bold">${model.limitSpent.toFixed(4)}</span>
                                    <span className="text-text-faint">/</span>
                                    {isEditing ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-text-faint">$</span>
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={editLimitVal}
                                          onChange={(e) => setEditLimitVal(e.target.value)}
                                          className="w-20 h-8 px-2 bg-surface border border-border rounded text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                                          min="0"
                                        />
                                      </div>
                                    ) : (
                                      <span className="text-text-faint font-bold">${model.spendLimit.toFixed(2)}</span>
                                    )}
                                  </div>
                                  <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden border border-border">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        isOverLimit ? "bg-danger" : pct > 75 ? "bg-warning" : "bg-win"
                                      )}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 font-sans">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                          updateModelConfigMutation.mutate({
                                            modelId: model.modelId,
                                            spendLimit: parseFloat(editLimitVal),
                                            priority: parseInt(editPriorityVal),
                                          });
                                        }}
                                        loading={updateModelConfigMutation.isPending}
                                        className="h-8 px-3 text-xs font-bold"
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setEditingModelId(null)}
                                        className="h-8 px-3 text-xs font-bold"
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                          setEditingModelId(model.modelId);
                                          setEditLimitVal(model.spendLimit.toString());
                                          setEditPriorityVal(model.priority.toString());
                                        }}
                                        className="h-8 px-3 text-xs font-bold text-text-muted hover:text-text"
                                      >
                                        Configure
                                      </Button>
                                      <Button
                                        variant={model.isActive ? "danger" : "primary"}
                                        size="sm"
                                        onClick={() => {
                                          updateModelConfigMutation.mutate({
                                            modelId: model.modelId,
                                            isActive: !model.isActive,
                                          });
                                        }}
                                        className="h-8 px-3 text-xs font-bold"
                                      >
                                        {model.isActive ? "Deactivate" : "Activate"}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </div>
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

      {/* Inspect Report Modal (Before & After changes) */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface border border-border shadow-2xl rounded-2xl max-w-5xl w-full overflow-hidden flex flex-col relative select-text animate-scaleUp max-h-[90vh]">
            
            {/* Close button */}
            <button
              onClick={() => {
                setInspectReport(null);
                setInspectQuestionDetails(null);
              }}
              className="absolute top-4 right-4 text-text-faint hover:text-text p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-surface-2"
            >
              <X className="size-4" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-border bg-surface-2/30 flex items-center gap-3.5">
              <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl shrink-0">
                <Code className="size-5.5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-md font-bold tracking-tight text-text">
                  {inspectReport.status === "RESOLVED" && inspectQuestionDetails?.before
                    ? "Verify Moderation Changes (Before & After)"
                    : "Inspect Question & Report Details"}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Verify the reported problem or review the automated corrections applied to this challenge.
                </p>
              </div>
            </div>

            {/* Main content body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* User Report Details Card */}
              <div className="bg-surface-2/50 border border-border rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-faint">Filer:</span>
                    <span className="text-xs font-mono font-bold text-text">{inspectReport.reporter?.username || "System"}</span>
                    <span className="text-text-faint text-xs">&bull;</span>
                    <span className="text-xs text-text-faint">Reason:</span>
                    <Badge className="bg-danger/10 border border-danger/20 text-danger text-[9px] font-mono px-2 py-0.5 rounded">
                      {inspectReport.reason?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-faint font-mono">Status:</span>
                    <Badge className={cn(
                      "text-[9px] font-bold font-mono",
                      inspectReport.status === "PENDING" && "bg-danger/10 text-danger border border-danger/20",
                      inspectReport.status === "RESOLVED" && "bg-win-subtle text-win border border-win/20",
                      inspectReport.status === "DISMISSED" && "bg-surface-3 text-text-muted border border-border"
                    )}>
                      {inspectReport.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-faint block">Report Description</span>
                  <p className="text-xs text-text bg-surface border border-border p-2.5 rounded-lg font-mono whitespace-pre-wrap select-text">
                    {inspectReport.details}
                  </p>
                </div>
              </div>

              {/* Loader */}
              {loadingQuestionDetails && (
                <div className="flex items-center justify-center py-20">
                  <Spinner />
                </div>
              )}

              {/* Loaded Content */}
              {!loadingQuestionDetails && inspectQuestionDetails && (
                <div className="space-y-4">
                  {/* Layout and Tabs selector */}
                  <div className="flex flex-wrap items-center justify-between border-b border-border/80 pb-2 gap-4">
                    {/* View Toggles (Statement / Code) */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setInspectViewTab("statement")}
                        className={cn(
                          "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
                          inspectViewTab === "statement"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-muted hover:text-text"
                        )}
                      >
                        Question Description
                      </button>
                      <button
                        onClick={() => setInspectViewTab("code")}
                        className={cn(
                          "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
                          inspectViewTab === "code"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-muted hover:text-text"
                        )}
                      >
                        Starter Code / Templates
                      </button>
                    </div>

                    {/* Comparison Layout Selector (only show if before & after exist) */}
                    {inspectQuestionDetails.before && inspectQuestionDetails.after && (
                      <div className="flex items-center gap-4">
                        {/* Comparison Version Toggle if Tabbed Layout is chosen */}
                        {inspectLayout === "tabbed" && (
                          <div className="flex bg-surface-3 p-0.5 border border-border rounded-lg text-xs">
                            <button
                              onClick={() => setActiveCompareVersion("before")}
                              className={cn(
                                "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer text-[10px]",
                                activeCompareVersion === "before"
                                  ? "bg-danger text-white shadow-sm"
                                  : "text-text-muted hover:text-text"
                              )}
                            >
                              Before (Original)
                            </button>
                            <button
                              onClick={() => setActiveCompareVersion("after")}
                              className={cn(
                                "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer text-[10px]",
                                activeCompareVersion === "after"
                                  ? "bg-win text-white shadow-sm"
                                  : "text-text-muted hover:text-text"
                              )}
                            >
                              After (Corrected)
                            </button>
                          </div>
                        )}

                        <div className="flex bg-surface-2 p-0.5 border border-border rounded-lg text-xs font-mono text-[10px]">
                          {(["tabbed", "stacked", "side-by-side"] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setInspectLayout(mode)}
                              className={cn(
                                "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer capitalize",
                                inspectLayout === mode
                                  ? "bg-surface border border-border text-primary shadow-sm"
                                  : "text-text-muted hover:text-text"
                              )}
                            >
                              {mode === "side-by-side" ? "Split" : mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Comparisons/Details panels */}
                  {inspectQuestionDetails.before && inspectQuestionDetails.after ? (
                    inspectLayout === "side-by-side" ? (
                      /* Side by Side View */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        {renderVersionBlock("before", "Original Version (Before Fix)", "text-danger border-border/80 bg-[#130f14]/20")}
                        {renderVersionBlock("after", "Corrected Version (After Fix)", "text-win border-win/30 bg-win-subtle/5")}
                      </div>
                    ) : inspectLayout === "stacked" ? (
                      /* Stacked View */
                      <div className="space-y-6">
                        {renderVersionBlock("before", "Original Version (Before Fix)", "text-danger border-border/80 bg-[#130f14]/20")}
                        {renderVersionBlock("after", "Corrected Version (After Fix)", "text-win border-win/30 bg-win-subtle/5")}
                      </div>
                    ) : (
                      /* Tabbed View */
                      <div>
                        {activeCompareVersion === "before" ? (
                          renderVersionBlock("before", "Original Version (Before Fix)", "text-danger border-border/80 bg-[#130f14]/20")
                        ) : (
                          renderVersionBlock("after", "Corrected Version (After Fix)", "text-win border-win/30 bg-win-subtle/5")
                        )}
                      </div>
                    )
                  ) : (
                    /* Single Current Question View (for pending or others) */
                    <div className="border border-border rounded-xl p-5 bg-surface-2/20 flex flex-col space-y-4">
                      <div className="border-b border-border/60 pb-3">
                        <h3 className="text-base font-bold text-text">
                          {inspectQuestionDetails.current?.title || "Untitled Challenge"}
                        </h3>
                      </div>

                      <div className="overflow-y-auto max-h-[45vh] space-y-3 text-xs select-text">
                        {inspectViewTab === "statement" ? (
                          <div className="space-y-3">
                            {inspectQuestionDetails.current?.statement?.markdown ? (
                              <div className="space-y-2">
                                <SimpleMarkdown content={inspectQuestionDetails.current.statement.markdown} />
                                {inspectQuestionDetails.current.statement.inputFormat && (
                                  <div className="mt-3">
                                    <h4 className="text-[10px] font-bold text-text-faint uppercase font-mono">Input Format</h4>
                                    <p className="text-text-muted mt-0.5">{inspectQuestionDetails.current.statement.inputFormat}</p>
                                  </div>
                                )}
                                {inspectQuestionDetails.current.statement.outputFormat && (
                                  <div className="mt-2">
                                    <h4 className="text-[10px] font-bold text-text-faint uppercase font-mono">Output Format</h4>
                                    <p className="text-text-muted mt-0.5">{inspectQuestionDetails.current.statement.outputFormat}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-text-faint">No description statement found.</div>
                            )}
                          </div>
                        ) : (
                          <CodeTemplatesView templates={inspectQuestionDetails.current?.templates} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
             <div className="p-4 border-t border-border bg-surface-2/30 flex justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                {inspectQuestionDetails && (
                  inspectQuestionDetails.before && inspectQuestionDetails.after ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const qId = inspectReport.reportedQuestion?._id || inspectReport.reportedQuestion;
                          window.open(`/admin/review-editor/${qId}?reportId=${inspectReport._id}&version=before`, "_blank");
                        }}
                        className="text-xs h-8 font-bold gap-1.5 text-danger border-danger/30 hover:bg-danger/10 hover:border-danger"
                      >
                        <Code className="size-3.5" /> Open Original Editor
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const qId = inspectReport.reportedQuestion?._id || inspectReport.reportedQuestion;
                          window.open(`/admin/review-editor/${qId}?reportId=${inspectReport._id}&version=after`, "_blank");
                        }}
                        className="text-xs h-8 font-bold gap-1.5 text-win border-win/30 hover:bg-win/10 hover:border-win"
                      >
                        <Code className="size-3.5" /> Open Corrected Editor
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const qId = inspectReport.reportedQuestion?._id || inspectReport.reportedQuestion;
                        window.open(`/admin/review-editor/${qId}${inspectReport.status === "RESOLVED" ? `?reportId=${inspectReport._id}` : ""}`, "_blank");
                      }}
                      className="text-xs h-8 font-bold gap-1.5 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary"
                    >
                      <Code className="size-3.5" /> Open Review Sandbox
                    </Button>
                  )
                )}
                {inspectReport.status === "PENDING" && (
                  <span className="text-[11px] text-text-faint flex items-center gap-1.5 font-medium ml-2">
                    <Clock className="size-3.5 text-danger" /> Pending review decision
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {inspectReport.status === "PENDING" && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateReportStatusMutation.mutate({ reportId: inspectReport._id, status: "DISMISSED" })}
                      className="text-xs h-8 font-bold px-4"
                    >
                      Dismiss Report
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => updateReportStatusMutation.mutate({ reportId: inspectReport._id, status: "RESOLVED" })}
                      className="text-xs h-8 font-bold px-4 bg-win hover:bg-emerald-600 text-white border-none"
                    >
                      Resolve Question
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setInspectReport(null);
                    setInspectQuestionDetails(null);
                  }}
                  className="text-xs h-8 font-bold px-4"
                >
                  Close
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  if (!text) return [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const splitParts = text.split(regex);
  
  return splitParts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-extrabold text-text">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={idx} className="bg-surface-3 border border-border/80 text-[10px] px-1.5 py-0.5 rounded font-mono text-amber-500">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.replace(/\\n/g, "\n").split("\n");
  
  let inCodeBlock = false;
  let codeLines: string[] = [];
  const renderedElements: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Code block detection
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        renderedElements.push(
          <pre key={`code-${i}`} className="bg-[#090a0f] border border-border/40 rounded-lg p-3 my-3 font-mono text-[11px] text-[#4af626] overflow-x-auto select-all leading-normal">
            {codeLines.join("\n")}
          </pre>
        );
        codeLines = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    
    const trimmed = line.trim();
    
    // Headings
    if (trimmed.startsWith("###")) {
      renderedElements.push(
        <h4 key={i} className="text-xs font-bold text-text uppercase tracking-wider font-mono mt-4 mb-1.5 flex items-center gap-1.5">
          {trimmed.replace(/^###\s*/, "")}
        </h4>
      );
    } else if (trimmed.startsWith("##")) {
      renderedElements.push(
        <h3 key={i} className="text-sm font-black text-text uppercase tracking-wide border-b border-border/30 pb-1 mt-6 mb-2.5">
          {trimmed.replace(/^##\s*/, "")}
        </h3>
      );
    } else if (trimmed.startsWith("#")) {
      renderedElements.push(
        <h2 key={i} className="text-base font-extrabold text-text uppercase tracking-wide mt-6 mb-3">
          {trimmed.replace(/^#\s*/, "")}
        </h2>
      );
    } 
    // Bullet lists
    else if (/^([*+-]\s+|[*+-]$)/.test(trimmed)) {
      const text = trimmed.replace(/^[*+-]\s*/, "");
      renderedElements.push(
        <li key={i} className="list-disc ml-5 text-text-muted text-[13px] leading-relaxed my-0.5">
          {renderInlineFormatting(text)}
        </li>
      );
    } 
    // Empty lines
    else if (trimmed.length === 0) {
      renderedElements.push(<div key={i} className="h-1.5" />);
    } 
    // Regular paragraphs
    else {
      renderedElements.push(
        <p key={i} className="text-text-muted text-[13px] leading-relaxed my-0.5">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    }
  }
  
  return <div className="space-y-0.5">{renderedElements}</div>;
}

function CodeTemplatesView({ templates }: { templates: any }) {
  if (!templates) return <div className="text-text-faint text-xs">No template code available.</div>;

  if (typeof templates === "string") {
    return (
      <pre className="bg-[#090a0f] border border-border/40 rounded-lg p-4 font-mono text-[11px] text-[#4af626] whitespace-pre-wrap break-all select-all leading-normal max-h-[400px]">
        {templates}
      </pre>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(templates).map(([lang, code]: [string, any]) => {
        if (!code || typeof code !== "string") return null;
        return (
          <div key={lang} className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-faint font-mono bg-surface-3 border border-border px-2 py-0.5 rounded">
              {lang}
            </span>
            <pre className="bg-[#090a0f] border border-border/40 rounded-lg p-4 font-mono text-[11px] text-[#4af626] whitespace-pre-wrap break-all select-all leading-normal max-h-[250px]">
              {code}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

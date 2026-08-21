"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuit,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Filter
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, Button, Badge, Alert } from "@/components/ui";

interface RevisionItem {
  _id: string;
  questionSlug: string;
  battleType: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topics: string[];
  category: string;
  lastSolvedAt: string;
  solveCount: number;
  nextRevisionDue: string;
  masteryScore: number;
  daysSinceSolved: number;
  dueInDays: number;
}

interface CategorySummary {
  category: string;
  total: number;
  mastered: number;
  retentionRate: number;
  avgMasteryScore: number;
}

interface RevisionDashboardData {
  summary: {
    totalTracked: number;
    dueTodayCount: number;
    reviewSoonCount: number;
    masteredCount: number;
    overallRetentionRate: number;
  };
  dueToday: RevisionItem[];
  reviewSoon: RevisionItem[];
  mastered: RevisionItem[];
  categorySummary: CategorySummary[];
}

const DIFF_COLORS: Record<string, string> = {
  EASY: "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15",
  MEDIUM: "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15",
  HARD: "text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/15",
};

export default function RevisionDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"DUE" | "SOON" | "MASTERED" | "ALL">("DUE");
  const [search, setSearch] = useState("");

  const dashboardQuery = useQuery({
    queryKey: ["revision", "dashboard"],
    queryFn: async () => {
      const res = await api<{ success: boolean; data: RevisionDashboardData }>("/revision");
      return (res as any).data ?? res;
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => api("/revision/sync", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revision", "dashboard"] });
    },
  });

  const data = dashboardQuery.data;
  const isLoading = dashboardQuery.isLoading;

  const dueList = data?.dueToday || [];
  const soonList = data?.reviewSoon || [];
  const masteredList = data?.mastered || [];

  let displayedList: RevisionItem[] = [];
  if (activeTab === "DUE") displayedList = dueList;
  else if (activeTab === "SOON") displayedList = soonList;
  else if (activeTab === "MASTERED") displayedList = masteredList;
  else displayedList = [...dueList, ...soonList, ...masteredList];

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    displayedList = displayedList.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.topics.some((t) => t.toLowerCase().includes(q))
    );
  }

  function handleReviseNow(item: RevisionItem) {
    // Navigate directly to battle room creation / start with question selected
    router.push(`/battle`);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <BrainCircuit className="size-5" />
            </div>
            <h1 className="text-2xl font-bold text-text">Spaced Repetition & Revision</h1>
          </div>
          <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
            Adaptive memory retention tracker. Revisit questions before you forget them based on problem difficulty and your topic mastery.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="gap-2 shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className={cn("size-3.5", syncMutation.isPending && "animate-spin")} />
          {syncMutation.isPending ? "Syncing..." : "Sync History"}
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-red-500/20 bg-red-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">Due Today</span>
            <AlertTriangle className="size-5 text-red-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-500">{data?.summary.dueTodayCount ?? 0}</span>
            <span className="text-xs text-text-faint">questions overdue</span>
          </div>
        </Card>

        <Card className="p-5 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">Review Soon</span>
            <Clock className="size-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-500">{data?.summary.reviewSoonCount ?? 0}</span>
            <span className="text-xs text-text-faint">due in 48 hours</span>
          </div>
        </Card>

        <Card className="p-5 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">Mastered</span>
            <CheckCircle2 className="size-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-500">{data?.summary.masteredCount ?? 0}</span>
            <span className="text-xs text-text-faint">retained long term</span>
          </div>
        </Card>

        <Card className="p-5 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">Memory Confidence</span>
            <Zap className="size-5 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary">{data?.summary.overallRetentionRate ?? 100}%</span>
            <span className="text-xs text-text-faint">retention score</span>
          </div>
        </Card>
      </div>

      {/* Category Mastery Progress */}
      {data?.categorySummary && data.categorySummary.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider font-mono">Topic Retention Scores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.categorySummary.map((cat: CategorySummary) => (
              <div key={cat.category} className="space-y-2 rounded-lg border border-border/60 bg-surface-2/40 p-3.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="font-semibold text-text">{cat.category}</span>
                  <span className="text-text-muted font-mono">{cat.retentionRate}% Retained</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      cat.retentionRate >= 80
                        ? "bg-emerald-500"
                        : cat.retentionRate >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    )}
                    style={{ width: `${cat.retentionRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-text-faint">
                  <span>{cat.mastered} of {cat.total} mastered</span>
                  <span>Avg Score: {cat.avgMasteryScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Question Table / Tabs Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-2/60 p-1">
            {[
              { key: "DUE", label: `Due Today (${dueList.length})` },
              { key: "SOON", label: `Review Soon (${soonList.length})` },
              { key: "MASTERED", label: `Mastered (${masteredList.length})` },
              { key: "ALL", label: `All Tracked (${(data?.summary.totalTracked ?? 0)})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === tab.key
                    ? "bg-primary text-white shadow-xs"
                    : "text-text-muted hover:text-text hover:bg-surface-3/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
            <input
              type="text"
              placeholder="Search by title or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface py-1.5 pl-9 pr-3 text-xs text-text placeholder:text-text-faint focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Question Cards List */}
        <Card className="p-0 overflow-hidden divide-y divide-border/40">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-faint">Loading revision schedule...</div>
          ) : displayedList.length > 0 ? (
            displayedList.map((item) => {
              const isOverdue = item.dueInDays <= 0;
              const isSoon = item.dueInDays > 0 && item.dueInDays <= 2;

              return (
                <div
                  key={item._id || item.questionSlug}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-surface-2/30 transition-colors"
                >
                  <div className="flex flex-col min-w-0 gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-text">{item.title}</span>
                      <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold border", DIFF_COLORS[item.difficulty])}>
                        {item.difficulty}
                      </span>
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-500">
                          <AlertTriangle className="size-3" />
                          Due Today
                        </span>
                      ) : isSoon ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-500">
                          <Clock className="size-3" />
                          Due in {item.dueInDays}d
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                          <CheckCircle2 className="size-3" />
                          Mastered
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-faint flex-wrap">
                      <span>Category: <strong className="text-text-muted">{item.category}</strong></span>
                      <span>• Solved: <strong className="text-text-muted">{item.daysSinceSolved === 0 ? "Today" : `${item.daysSinceSolved} days ago`}</strong></span>
                      <span>• Solved <strong className="text-text-muted">{item.solveCount}x</strong></span>
                      <span>• Mastery Score: <strong className="text-primary">{item.masteryScore}%</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <Link
                      href={`/battle`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-xs"
                    >
                      <Play className="size-3.5 fill-current" />
                      Revise Now
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-text-faint space-y-2">
              <BrainCircuit className="size-8 mx-auto text-text-faint opacity-40" />
              <p>No questions found in this category.</p>
              {data?.summary.totalTracked === 0 && (
                <p className="text-[11px] text-text-muted">
                  Solve practice questions or battles to automatically track your retention schedule!
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

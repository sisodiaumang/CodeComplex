"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Play,
  Sparkles,
  Search,
  Target
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, Button } from "@/components/ui";

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
  EASY: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
  MEDIUM: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  HARD: "text-red-500 border-red-500/30 bg-red-500/10",
};

export default function RevisionDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"DUE" | "SOON" | "MASTERED" | "ALL">("DUE");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
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

  if (selectedCategory !== "ALL") {
    displayedList = displayedList.filter((item) => item.category === selectedCategory);
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    displayedList = displayedList.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.topics.some((t) => t.toLowerCase().includes(q))
    );
  }

  const dueCount = data?.summary.dueTodayCount ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <RotateCcw className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Revision Tracker</h1>
            <p className="text-xs text-text-muted mt-0.5">
              Spaced repetition memory schedule based on problem difficulty & topic mastery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="gap-2 text-xs"
          >
            <RotateCcw className={cn("size-3.5", syncMutation.isPending && "animate-spin")} />
            {syncMutation.isPending ? "Syncing..." : "Sync History"}
          </Button>

          {dueList.length > 0 && (
            <Link
              href="/battle"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-all"
            >
              <Play className="size-3.5 fill-current" />
              Revise Top Problem
            </Link>
          )}
        </div>
      </div>

      {/* Subtle Insight Banner if questions due */}
      {dueCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-text">
            <Sparkles className="size-4 text-primary shrink-0" />
            <span>
              <strong>{dueCount} question{dueCount > 1 ? "s" : ""} due today</strong> for spaced repetition. Practicing today maintains algorithm retention.
            </span>
          </div>
          <Link href="/battle" className="text-xs font-bold text-primary hover:underline shrink-0">
            Start Practice &rarr;
          </Link>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-red-500/20 bg-surface/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">Due Today</span>
            <AlertTriangle className="size-4 text-red-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-500">{data?.summary.dueTodayCount ?? 0}</span>
            <span className="text-xs text-text-faint">overdue</span>
          </div>
        </Card>

        <Card className="p-5 border-amber-500/20 bg-surface/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">Review Soon</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-500">{data?.summary.reviewSoonCount ?? 0}</span>
            <span className="text-xs text-text-faint">in 48 hours</span>
          </div>
        </Card>

        <Card className="p-5 border-emerald-500/20 bg-surface/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">Mastered</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-500">{data?.summary.masteredCount ?? 0}</span>
            <span className="text-xs text-text-faint">long term</span>
          </div>
        </Card>

        <Card className="p-5 border-primary/20 bg-surface/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">Retention</span>
            <Zap className="size-4 text-primary" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary">{data?.summary.overallRetentionRate ?? 100}%</span>
            <span className="text-xs text-text-faint">confidence score</span>
          </div>
        </Card>
      </div>

      {/* Category Progress Summary */}
      {data?.categorySummary && data.categorySummary.length > 0 && (
        <Card className="p-5 space-y-3.5 border-border/50 bg-surface/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
              <Target className="size-4 text-primary" /> Topic Retention Matrix
            </h2>
            <span className="text-[11px] text-text-faint">Click topic to filter</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.categorySummary.map((cat: CategorySummary) => {
              const isSelected = selectedCategory === cat.category;
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "ALL" : cat.category)}
                  className={cn(
                    "space-y-2 rounded-xl border p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border/50 bg-surface-2/30 hover:border-border hover:bg-surface-2/60"
                  )}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text truncate">{cat.category}</span>
                    <span className="font-mono text-[11px] font-bold text-primary">{cat.retentionRate}%</span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
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
                    <span>{cat.mastered} / {cat.total} mastered</span>
                    <span>Avg: {cat.avgMasteryScore}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-surface-2/50 p-1">
            {[
              { key: "DUE", label: `Due Today (${dueList.length})` },
              { key: "SOON", label: `Review Soon (${soonList.length})` },
              { key: "MASTERED", label: `Mastered (${masteredList.length})` },
              { key: "ALL", label: `All (${(data?.summary.totalTracked ?? 0)})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === tab.key
                    ? "bg-primary text-white shadow-xs"
                    : "text-text-muted hover:text-text hover:bg-surface-3/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedCategory !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className="rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
              >
                Filter: {selectedCategory} ✕
              </button>
            )}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface py-1.5 pl-9 pr-3 text-xs text-text placeholder:text-text-faint focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Question Item Cards List */}
        <div className="space-y-2.5">
          {isLoading ? (
            <Card className="py-14 text-center text-xs text-text-faint">Loading memory schedule...</Card>
          ) : displayedList.length > 0 ? (
            displayedList.map((item) => {
              const isOverdue = item.dueInDays <= 0;
              const isSoon = item.dueInDays > 0 && item.dueInDays <= 2;

              return (
                <Card
                  key={item._id || item.questionSlug}
                  className="p-4 transition-all border-border/50 bg-surface/50 hover:bg-surface"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col min-w-0 gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-text">{item.title}</span>
                        <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold border", DIFF_COLORS[item.difficulty])}>
                          {item.difficulty}
                        </span>

                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                            <AlertTriangle className="size-3" />
                            Due Today
                          </span>
                        ) : isSoon ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                            <Clock className="size-3" />
                            In {item.dueInDays}d
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                            <CheckCircle2 className="size-3" />
                            Mastered
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-faint flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3 text-text-faint" />
                          Last solved: <strong className="text-text-muted">{item.daysSinceSolved === 0 ? "Today" : `${item.daysSinceSolved}d ago`}</strong>
                        </span>
                        <span>• Category: <strong className="text-text-muted">{item.category}</strong></span>
                        <span>• Solved: <strong className="text-text-muted">{item.solveCount}x</strong></span>
                        <span>• Retention Score: <strong className="text-primary">{item.masteryScore}%</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Link
                        href={`/battle`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-all"
                      >
                        <Play className="size-3.5 fill-current" />
                        Revise Now
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="py-12 text-center text-xs text-text-faint space-y-2">
              <RotateCcw className="size-8 mx-auto text-text-faint opacity-40" />
              <p className="font-semibold text-text">No questions found in this filter.</p>
              <p className="text-[11px] text-text-muted">
                Solve practice problems or battles to populate your spaced repetition memory schedule!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

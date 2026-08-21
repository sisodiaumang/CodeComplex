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
  ArrowRight,
  TrendingUp,
  Target,
  ShieldAlert,
  Bot
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, Button, Badge } from "@/components/ui";

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

  // Generate dynamic AI Insight
  const dueCount = data?.summary.dueTodayCount ?? 0;
  const lowestCat = data?.categorySummary ? [...data.categorySummary].sort((a, b) => a.retentionRate - b.retentionRate)[0] : null;

  let aiInsightText = "All memory intervals optimized. Keep practicing to maintain long-term algorithm mastery!";
  if (dueCount > 0) {
    aiInsightText = `AI Memory Coach: You have ${dueCount} high-priority problem${dueCount > 1 ? "s" : ""} due today. Re-solving them now will prevent neural memory decay and boost retention by +15%.`;
  } else if (lowestCat) {
    aiInsightText = `AI Insight: Your lowest retention area is ${lowestCat.category} (${lowestCat.retentionRate}% retained). Recommended focus for your next practice session.`;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,107,0,0.15)]">
              <BrainCircuit className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-text">Revision & Memory Coach</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  <Sparkles className="size-3" /> AI Spaced Repetition
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Adaptive memory retention system powered by Ebbinghaus forgetting curve & user skill multipliers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-all"
            >
              <Play className="size-3.5 fill-current" />
              Revise Top Problem
            </Link>
          )}
        </div>
      </div>

      {/* AI Memory Coach Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-surface/60 to-surface border-l-4 border-l-primary p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/40 mt-0.5 sm:mt-0">
              <Bot className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">AI Retention Coach</span>
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-xs text-text leading-relaxed">{aiInsightText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-red-500/30 bg-gradient-to-br from-red-500/10 via-surface/40 to-surface relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">Due Today</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/15 text-red-500">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-500">{data?.summary.dueTodayCount ?? 0}</span>
            <span className="text-xs text-text-faint font-medium">questions overdue</span>
          </div>
        </Card>

        <Card className="p-5 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-surface/40 to-surface relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">Review Soon</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-500">{data?.summary.reviewSoonCount ?? 0}</span>
            <span className="text-xs text-text-faint font-medium">due in 48 hours</span>
          </div>
        </Card>

        <Card className="p-5 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-surface/40 to-surface relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">Mastered</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-500">{data?.summary.masteredCount ?? 0}</span>
            <span className="text-xs text-text-faint font-medium">retained long term</span>
          </div>
        </Card>

        <Card className="p-5 border-primary/30 bg-gradient-to-br from-primary/15 via-surface/40 to-surface relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">Memory Confidence</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Zap className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary">{data?.summary.overallRetentionRate ?? 100}%</span>
            <span className="text-xs text-text-faint font-medium">overall retention</span>
          </div>
        </Card>
      </div>

      {/* Category Mastery Progress Grid */}
      {data?.categorySummary && data.categorySummary.length > 0 && (
        <Card className="p-6 space-y-4 border-border/60 bg-surface/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
              <Target className="size-4 text-primary" /> Topic Retention Matrix
            </h2>
            <span className="text-[11px] text-text-faint">Adaptive confidence per domain</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.categorySummary.map((cat: CategorySummary) => {
              const isSelected = selectedCategory === cat.category;
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "ALL" : cat.category)}
                  className={cn(
                    "space-y-2.5 rounded-xl border p-4 text-left transition-all hover:scale-[1.01]",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/60 bg-surface-2/40 hover:border-border hover:bg-surface-2/70"
                  )}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text truncate">{cat.category}</span>
                    <span className="font-mono text-[11px] font-bold text-primary">{cat.retentionRate}%</span>
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
                    <span>Score: {cat.avgMasteryScore}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-surface-2/60 p-1.5">
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
                  "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
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
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
              <input
                type="text"
                placeholder="Search title, topic, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs text-text placeholder:text-text-faint focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Question Item Cards List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="py-16 text-center text-xs text-text-faint">Loading memory schedule...</Card>
          ) : displayedList.length > 0 ? (
            displayedList.map((item) => {
              const isOverdue = item.dueInDays <= 0;
              const isSoon = item.dueInDays > 0 && item.dueInDays <= 2;

              let aiRecommendation = "Re-implement solution & review time complexity";
              if (item.difficulty === "HARD") aiRecommendation = "Focus: Edge cases & state transitions";
              else if (item.difficulty === "EASY") aiRecommendation = "Focus: Speed & clean code syntax";

              return (
                <Card
                  key={item._id || item.questionSlug}
                  className={cn(
                    "p-4 transition-all hover:scale-[1.005] duration-200 border-l-4",
                    isOverdue
                      ? "border-l-red-500 border-red-500/20 bg-red-500/5"
                      : isSoon
                      ? "border-l-amber-500 border-amber-500/20 bg-amber-500/5"
                      : "border-l-emerald-500 border-emerald-500/20 bg-surface/50"
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-col min-w-0 gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-base text-text">{item.title}</span>
                        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold border", DIFF_COLORS[item.difficulty])}>
                          {item.difficulty}
                        </span>

                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold text-red-500">
                            <AlertTriangle className="size-3" />
                            Overdue
                          </span>
                        ) : isSoon ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-500">
                            <Clock className="size-3" />
                            Due in {item.dueInDays}d
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                            <CheckCircle2 className="size-3" />
                            Mastered
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5 text-text-faint" />
                          Last solved: <strong className="text-text">{item.daysSinceSolved === 0 ? "Today" : `${item.daysSinceSolved}d ago`}</strong>
                        </span>
                        <span>• Solved <strong className="text-text">{item.solveCount}x</strong></span>
                        <span>• Retention Score: <strong className="text-primary">{item.masteryScore}%</strong></span>
                        <span>• Category: <strong className="text-text">{item.category}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-text-faint bg-surface-2/60 rounded-md px-2.5 py-1 w-fit border border-border/40">
                        <Sparkles className="size-3 text-primary shrink-0" />
                        <span>{aiRecommendation}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                      <Link
                        href={`/battle`}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
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
            <Card className="py-16 text-center text-xs text-text-faint space-y-3">
              <BrainCircuit className="size-10 mx-auto text-primary opacity-50 animate-pulse" />
              <p className="text-sm font-semibold text-text">No questions found matching filter.</p>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                As you solve practice questions or battles, the AI Spaced Repetition engine will automatically calculate retention intervals and remind you when it's time to revise.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

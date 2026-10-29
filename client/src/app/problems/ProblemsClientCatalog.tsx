"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Clock,
  ChevronRight,
  Zap,
  Code2,
  Bug,
  Layout,
  Server,
  Sparkles,
  CheckCircle2,
  Star,
  Bookmark,
  Plus,
  Trash2,
  ListPlus,
  FolderHeart,
  X,
  Check,
  Award,
} from "lucide-react";
import { Spinner, Button } from "@/components/ui";
import { PublicNavbar } from "@/components/PublicNavbar";
import { API_URL, api, errorMessage } from "@/lib/api";
import { useAuth } from "@/stores/auth-store";
import type { UserProblemStatus, UserProblemList } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ProblemMode = "ALL" | "DSA" | "BUG_FIX" | "FRONTEND" | "BACKEND" | "PROMPT_WAR";

export interface ProblemItem {
  _id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  subCategory?: string;
  mode: ProblemMode;
  metadata?: {
    estimatedTime?: number;
    points?: number;
    topics?: string[];
    tags?: string[];
  };
  topics?: string[];
  tags?: string[];
}

const MODES: Array<{ key: ProblemMode; label: string; icon: any; color: string; subtle: string }> = [
  { key: "ALL", label: "All Modes", icon: Zap, color: "text-primary", subtle: "bg-primary/10 border-primary/20" },
  { key: "DSA", label: "DSA", icon: Code2, color: "text-blue-500", subtle: "bg-blue-500/10 border-blue-500/20" },
  { key: "BUG_FIX", label: "Bug Fix", icon: Bug, color: "text-red-500", subtle: "bg-red-500/10 border-red-500/20" },
  { key: "FRONTEND", label: "Frontend", icon: Layout, color: "text-cyan-500", subtle: "bg-cyan-500/10 border-cyan-500/20" },
  { key: "BACKEND", label: "Backend", icon: Server, color: "text-emerald-500", subtle: "bg-emerald-500/10 border-emerald-500/20" },
  { key: "PROMPT_WAR", label: "Prompt War", icon: Sparkles, color: "text-purple-500", subtle: "bg-purple-500/10 border-purple-500/20" },
];

export function ProblemsClientCatalog({
  initialProblems = [],
}: {
  initialProblems?: ProblemItem[];
}) {
  const queryClient = useQueryClient();
  const { user, status } = useAuth();
  const isAuthenticated = status === "authed" && !!user;

  const [problems, setProblems] = useState<ProblemItem[]>(initialProblems);
  const [loading, setLoading] = useState(initialProblems.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMode, setSelectedMode] = useState<ProblemMode>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // "ALL" | "SOLVED" | "UNSOLVED" | "FAVORITES" | `list:${id}`
  const [displayCount, setDisplayCount] = useState(60);

  // Modals state
  const [showManageListsModal, setShowManageListsModal] = useState(false);
  const [targetQuestionForList, setTargetQuestionForList] = useState<ProblemItem | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [createListError, setCreateListError] = useState<string | null>(null);

  // Fetch Questions Catalog
  useEffect(() => {
    if (initialProblems && initialProblems.length > 0) {
      setProblems(initialProblems);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/questions?all=true`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch questions");
        return res.json();
      })
      .then((data) => {
        if (data?.data?.questions) {
          setProblems(data.data.questions);
        }
      })
      .catch((err) => {
        console.error("Error loading questions catalog:", err);
      })
      .finally(() => setLoading(false));
  }, [initialProblems]);

  // Fetch User Problem Status (Solved questions + Problem Lists)
  const { data: userStatusRes, refetch: refetchUserStatus } = useQuery({
    queryKey: ["userProblemStatus"],
    queryFn: () => api<UserProblemStatus>("/problem-lists/user-status"),
    enabled: isAuthenticated,
    staleTime: 10_000,
  });

  const userStatus: UserProblemStatus | null = (userStatusRes as any)?.data ?? (userStatusRes as any) ?? null;

  const solvedSet = useMemo(() => new Set<string>(userStatus?.solvedSlugs || []), [userStatus]);
  const userLists: UserProblemList[] = useMemo(() => userStatus?.lists || [], [userStatus]);
  const defaultFavorites = useMemo(() => userLists.find((l) => l.isDefault), [userLists]);
  const favoritesSet = useMemo(() => new Set<string>(defaultFavorites?.slugs || []), [defaultFavorites]);

  // Quick Toggle Favorite Mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (prob: ProblemItem) =>
      api("/problem-lists/favorite/toggle", {
        method: "POST",
        body: {
          questionSlug: prob.slug,
          title: prob.title,
          difficulty: prob.difficulty,
          mode: prob.mode,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProblemStatus"] });
    },
  });

  // Toggle in Custom List Mutation
  const toggleInListMutation = useMutation({
    mutationFn: ({ listId, prob }: { listId: string; prob: ProblemItem }) =>
      api(`/problem-lists/${listId}/toggle`, {
        method: "POST",
        body: {
          questionSlug: prob.slug,
          title: prob.title,
          difficulty: prob.difficulty,
          mode: prob.mode,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProblemStatus"] });
    },
  });

  // Create List Mutation
  const createListMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api("/problem-lists", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      setNewListName("");
      setNewListDesc("");
      setCreateListError(null);
      queryClient.invalidateQueries({ queryKey: ["userProblemStatus"] });
    },
    onError: (err) => {
      setCreateListError(errorMessage(err));
    },
  });

  // Delete List Mutation
  const deleteListMutation = useMutation({
    mutationFn: (listId: string) =>
      api(`/problem-lists/${listId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      if (statusFilter.startsWith("list:")) setStatusFilter("ALL");
      queryClient.invalidateQueries({ queryKey: ["userProblemStatus"] });
    },
  });

  // Compute counts per mode
  const modeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: problems.length };
    for (const p of problems) {
      counts[p.mode] = (counts[p.mode] || 0) + 1;
    }
    return counts;
  }, [problems]);

  // Filtered problems computation
  const filteredProblems = useMemo(() => {
    // Determine active list slugs if filtering by list
    let activeListSlugSet: Set<string> | null = null;
    if (statusFilter.startsWith("list:")) {
      const listId = statusFilter.replace("list:", "");
      const found = userLists.find((l) => l._id === listId);
      if (found) {
        activeListSlugSet = new Set(found.slugs || []);
      }
    }

    return problems.filter((p) => {
      // Mode filter
      if (selectedMode !== "ALL" && p.mode !== selectedMode) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== "ALL" && p.difficulty !== selectedDifficulty) {
        return false;
      }
      // Status & List filter
      if (statusFilter === "SOLVED" && !solvedSet.has(p.slug)) {
        return false;
      }
      if (statusFilter === "UNSOLVED" && solvedSet.has(p.slug)) {
        return false;
      }
      if (statusFilter === "FAVORITES" && !favoritesSet.has(p.slug)) {
        return false;
      }
      if (activeListSlugSet && !activeListSlugSet.has(p.slug)) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(term);
        const matchSlug = (p.slug || "").toLowerCase().includes(term);
        const matchCat = (p.category || "").toLowerCase().includes(term);
        const matchTopics = (p.topics || p.metadata?.topics || []).some((t) =>
          t.toLowerCase().includes(term)
        );
        const matchTags = (p.tags || p.metadata?.tags || []).some((t) =>
          t.toLowerCase().includes(term)
        );
        if (!matchTitle && !matchSlug && !matchCat && !matchTopics && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [problems, selectedMode, selectedDifficulty, statusFilter, searchTerm, solvedSet, favoritesSet, userLists]);

  const difficultyColors = {
    Easy: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Medium: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    Hard: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  const modeBadgeStyles = {
    DSA: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    BUG_FIX: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
    FRONTEND: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    BACKEND: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    PROMPT_WAR: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    ALL: "",
  };

  const visibleList = filteredProblems.slice(0, displayCount);

  // Active filter label
  const activeStatusLabel = useMemo(() => {
    if (statusFilter === "ALL") return "All Questions";
    if (statusFilter === "SOLVED") return `Solved (${solvedSet.size})`;
    if (statusFilter === "UNSOLVED") return "Unsolved";
    if (statusFilter === "FAVORITES") return `Favorites (${favoritesSet.size})`;
    if (statusFilter.startsWith("list:")) {
      const listId = statusFilter.replace("list:", "");
      const found = userLists.find((l) => l._id === listId);
      return found ? found.name : "Custom List";
    }
    return "Filtered";
  }, [statusFilter, solvedSet.size, favoritesSet.size, userLists]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* ── Unified CodeComplex Navigation Bar ──────────────────────────────────────── */}
      <PublicNavbar />

      {/* ── Hero / Intro ─────────────────────────────────── */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-subtle border border-primary/30 text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
              <Zap className="size-3.5" /> 4,000+ Multi-Discipline Challenges
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
              Solo Practice & Challenge Library
            </h1>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Practice across all five CodeComplex disciplines: DSA algorithms, broken codebase bug fixing, frontend layouts, backend APIs, and prompt engineering. Zero signup required to read, code, and test.
            </p>
          </div>

          {/* User Progress Stats Card (if authenticated) */}
          {isAuthenticated && (
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs shrink-0 min-w-[280px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">
                  Your Problem Progress
                </span>
                <span className="text-xs font-mono font-bold text-primary">
                  {solvedSet.size} / {problems.length || 4085}
                </span>
              </div>
              <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((solvedSet.size / (problems.length || 1)) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-text-muted pt-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter("SOLVED")}
                  className="hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="size-3 text-emerald-500" /> {solvedSet.size} Solved
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("FAVORITES")}
                  className="hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Star className="size-3 text-amber-500 fill-amber-500" /> {favoritesSet.size} Favs
                </button>
                <button
                  type="button"
                  onClick={() => setShowManageListsModal(true)}
                  className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Bookmark className="size-3 text-primary" /> {userLists.length} Lists
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Mode Switcher Tabs ───────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const active = selectedMode === mode.key;
            const count = modeCounts[mode.key] ?? 0;

            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => setSelectedMode(mode.key)}
                className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? `${mode.subtle} border-primary shadow-xs ring-1 ring-primary/40`
                    : "border-border bg-surface hover:bg-surface-2 hover:border-border/80"
                }`}
              >
                <div className={`p-2 rounded-lg bg-surface-2 ${mode.color} shrink-0`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-mono text-text-muted truncate">
                    {count.toLocaleString()}
                  </div>
                  <div className={`text-xs font-semibold truncate ${active ? "text-text" : "text-text-muted"}`}>
                    {mode.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Filters, Search Bar & Status / Lists Row ─────────────────────────── */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-faint" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search challenges by title, keyword, or topic..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border shrink-0">
              {["ALL", "Easy", "Medium", "Hard"].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    selectedDifficulty === diff
                      ? "bg-primary text-white font-semibold shadow-xs"
                      : "text-text-muted hover:text-text hover:bg-surface-2"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Status & Custom Lists Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* All */}
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border",
                  statusFilter === "ALL"
                    ? "bg-sidebar-active text-white font-bold border-sidebar-active shadow-xs"
                    : "border-border bg-surface text-text-muted hover:text-text hover:bg-surface-2"
                )}
              >
                All
              </button>

              {/* Solved Filter */}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("SOLVED")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border",
                    statusFilter === "SOLVED"
                      ? "bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs"
                      : "border-border bg-surface text-text-muted hover:text-emerald-500 hover:bg-surface-2"
                  )}
                >
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span>Solved ({solvedSet.size})</span>
                </button>
              )}

              {/* Unsolved Filter */}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("UNSOLVED")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border",
                    statusFilter === "UNSOLVED"
                      ? "bg-sidebar-active text-white font-bold border-sidebar-active shadow-xs"
                      : "border-border bg-surface text-text-muted hover:text-text hover:bg-surface-2"
                  )}
                >
                  Unsolved
                </button>
              )}

              {/* Favorites Filter */}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("FAVORITES")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border",
                    statusFilter === "FAVORITES"
                      ? "bg-amber-600 text-white font-bold border-amber-600 shadow-xs"
                      : "border-border bg-surface text-text-muted hover:text-amber-400 hover:bg-surface-2"
                  )}
                >
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>Favorites ({favoritesSet.size})</span>
                </button>
              )}

              {/* Custom Lists Dropdown / Quick Filter */}
              {isAuthenticated && userLists.filter((l) => !l.isDefault).length > 0 && (
                <div className="relative inline-flex items-center">
                  <select
                    value={statusFilter.startsWith("list:") ? statusFilter : ""}
                    onChange={(e) => {
                      if (e.target.value) setStatusFilter(e.target.value);
                    }}
                    className="h-8 px-2.5 rounded-lg bg-surface border border-border text-xs font-mono text-text-muted hover:text-text focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="" disabled>
                      📁 Custom Lists ({userLists.filter((l) => !l.isDefault).length})
                    </option>
                    {userLists
                      .filter((l) => !l.isDefault)
                      .map((list) => (
                        <option key={list._id} value={`list:${list._id}`}>
                          {list.name} ({list.count})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* My Lists Management Button */}
            {isAuthenticated ? (
              <Button
                type="button"
                onClick={() => setShowManageListsModal(true)}
                variant="outline"
                className="gap-1.5 text-xs font-mono h-8.5 rounded-xl cursor-pointer hover:border-primary"
              >
                <Bookmark className="size-3.5 text-primary" />
                <span>My Lists ({userLists.length})</span>
              </Button>
            ) : (
              <Link
                href="/login?redirect=/problems"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-mono text-text-muted hover:text-primary transition-colors"
              >
                <Bookmark className="size-3.5" /> Log in to save lists & track solved
              </Link>
            )}
          </div>
        </div>

        {/* ── Problem List ─────────────────────────────────── */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Spinner className="size-8 text-primary" />
            <p className="text-xs font-mono text-text-faint">Loading challenge library...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-2xl border border-border bg-surface">
            <p className="text-sm text-text-muted">No challenges match your current search and filter settings.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedDifficulty("ALL");
                setSelectedMode("ALL");
                setStatusFilter("ALL");
              }}
              className="text-xs font-mono text-primary hover:underline cursor-pointer font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-text-faint px-1">
              <span>
                Showing {Math.min(displayCount, filteredProblems.length)} of {filteredProblems.length} challenges
                {statusFilter !== "ALL" && ` • ${activeStatusLabel}`}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border shadow-xs">
              {visibleList.map((prob, idx) => {
                const isSolved = solvedSet.has(prob.slug);
                const isFavorite = favoritesSet.has(prob.slug);

                return (
                  <div
                    key={prob._id || prob.slug || idx}
                    className="flex items-center justify-between p-4 sm:px-6 hover:bg-surface-2 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-4 flex-1">
                      {/* Solved Status Checkmark or Index */}
                      <div className="w-8 shrink-0 flex items-center justify-center">
                        {isSolved ? (
                          <div
                            title="Solved by you"
                            className="size-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-2xs"
                          >
                            <Check className="size-3 stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-text-faint text-right">
                            {idx + 1}.
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Link
                            href={`/problems/${prob.slug || prob._id}`}
                            className="text-sm font-semibold text-text group-hover:text-primary transition-colors truncate"
                          >
                            {prob.title}
                          </Link>

                          {isSolved && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                              SOLVED
                            </span>
                          )}

                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase ${modeBadgeStyles[prob.mode] || "text-text-muted bg-surface-2 border-border"}`}>
                            {prob.mode.replace("_", " ")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
                          <span>{prob.category}</span>
                          {prob.metadata?.estimatedTime && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-2.5" /> {prob.metadata.estimatedTime}m
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Action Buttons: Favorite & Add to List (Fixed width column so they never shift) */}
                      {isAuthenticated ? (
                        <div className="w-16 shrink-0 flex items-center justify-center gap-1">
                          {/* Favorite Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavoriteMutation.mutate(prob);
                            }}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              isFavorite
                                ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                : "text-text-faint hover:text-amber-400 hover:bg-surface"
                            )}
                            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Star className={cn("size-4", isFavorite && "fill-amber-400")} />
                          </button>

                          {/* Add to List Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setTargetQuestionForList(prob);
                            }}
                            className="p-1.5 rounded-lg text-text-faint hover:text-primary hover:bg-surface transition-colors cursor-pointer"
                            title="Add to custom list..."
                          >
                            <ListPlus className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 shrink-0" />
                      )}

                      {/* Difficulty Badge (Fixed width so it never shifts the buttons) */}
                      <div className="w-20 shrink-0 flex items-center justify-center">
                        <span
                          className={cn(
                            "w-full text-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase",
                            difficultyColors[prob.difficulty] || "text-text-muted bg-surface-2 border-border"
                          )}
                        >
                          {prob.difficulty}
                        </span>
                      </div>

                      {/* Enter Arrow (Fixed width) */}
                      <div className="w-6 shrink-0 hidden sm:flex items-center justify-center">
                        <Link
                          href={`/problems/${prob.slug || prob._id}`}
                          className="p-1 rounded-full text-text-faint group-hover:text-text group-hover:translate-x-0.5 transition-all"
                          aria-label={`Open problem ${prob.title}`}
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {displayCount < filteredProblems.length && (
              <div className="pt-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDisplayCount((c) => c + 60)}
                  className="px-6 py-2 text-xs font-mono cursor-pointer"
                >
                  Load More Challenges ({filteredProblems.length - displayCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modal: Manage My Problem Lists ────────────────────────────── */}
      {showManageListsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Bookmark className="size-5 text-primary" />
                <h2 className="text-base font-bold text-text">My Problem Lists</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowManageListsModal(false)}
                className="rounded-lg p-1 text-text-faint hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Create New List Input */}
            <div className="space-y-2 p-3.5 rounded-xl border border-border bg-surface-2/60">
              <label className="text-xs font-bold text-text uppercase tracking-wider font-mono">
                Create New List
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Blind 75, System Design, Graph Algorithms..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-surface text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-primary"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newListName.trim()) {
                      createListMutation.mutate({ name: newListName.trim(), description: newListDesc.trim() });
                    }
                  }}
                  disabled={!newListName.trim() || createListMutation.isPending}
                  className="h-9 px-3.5 text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary-hover text-white"
                >
                  <Plus className="size-3.5" /> Create
                </Button>
              </div>
              {createListError && (
                <p className="text-[11px] text-danger font-mono">{createListError}</p>
              )}
            </div>

            {/* List of User's Lists */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {userLists.map((list) => {
                const isActiveFilter = statusFilter === (list.isDefault ? "FAVORITES" : `list:${list._id}`);

                return (
                  <div
                    key={list._id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {list.isDefault ? (
                        <div className="size-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                          <Star className="size-4 fill-amber-500" />
                        </div>
                      ) : (
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FolderHeart className="size-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text truncate">{list.name}</span>
                          {list.isDefault && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-text-muted">
                          {list.count} {list.count === 1 ? "problem" : "problems"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter(list.isDefault ? "FAVORITES" : `list:${list._id}`);
                          setShowManageListsModal(false);
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer",
                          isActiveFilter
                            ? "bg-primary text-white font-bold"
                            : "bg-surface-2 text-text-muted hover:text-text"
                        )}
                      >
                        {isActiveFilter ? "Viewing" : "View"}
                      </button>

                      {!list.isDefault && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete list "${list.name}"?`)) {
                              deleteListMutation.mutate(list._id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-text-faint hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                          title="Delete list"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add / Remove Question from Lists ────────────────────────────── */}
      {targetQuestionForList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="min-w-0 pr-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-text-faint">
                  Save to List
                </div>
                <h2 className="text-sm font-bold text-text truncate">
                  {targetQuestionForList.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTargetQuestionForList(null)}
                className="rounded-lg p-1 text-text-faint hover:text-text hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Lists selection */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {userLists.map((list) => {
                const inList = (list.slugs || []).includes(targetQuestionForList.slug);

                return (
                  <button
                    key={list._id}
                    type="button"
                    onClick={() => {
                      toggleInListMutation.mutate({
                        listId: list._id,
                        prob: targetQuestionForList,
                      });
                    }}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-xl border transition-all cursor-pointer text-left",
                      inList
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border bg-surface hover:bg-surface-2 text-text"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {list.isDefault ? (
                        <Star className={cn("size-4", inList ? "fill-amber-400 text-amber-400" : "text-text-faint")} />
                      ) : (
                        <FolderHeart className={cn("size-4", inList ? "text-primary" : "text-text-faint")} />
                      )}
                      <div>
                        <div className="text-xs font-bold">{list.name}</div>
                        <div className="text-[10px] font-mono text-text-muted">
                          {list.count} {list.count === 1 ? "problem" : "problems"}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "size-5 rounded-md border flex items-center justify-center transition-colors",
                        inList
                          ? "bg-primary border-primary text-white"
                          : "border-border bg-surface"
                      )}
                    >
                      {inList && <Check className="size-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Create List Form */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New list name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="flex-1 h-8.5 px-3 rounded-lg border border-border bg-surface text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-primary"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newListName.trim()) {
                      createListMutation.mutate({ name: newListName.trim() });
                    }
                  }}
                  disabled={!newListName.trim() || createListMutation.isPending}
                  className="h-8.5 px-3 text-xs font-bold cursor-pointer bg-primary hover:bg-primary-hover text-white shrink-0"
                >
                  <Plus className="size-3" /> Add List
                </Button>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <Button
                type="button"
                onClick={() => setTargetQuestionForList(null)}
                variant="outline"
                className="text-xs font-mono h-8.5 px-4 cursor-pointer"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Swords,
  Clock,
  ChevronRight,
  Filter,
  Zap,
  Code2,
  Bug,
  Layout,
  Server,
  Sparkles,
} from "lucide-react";
import { Spinner } from "@/components/ui";
import { PublicNavbar } from "@/components/PublicNavbar";
import { API_URL } from "@/lib/api";

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
  const [problems, setProblems] = useState<ProblemItem[]>(initialProblems);
  const [loading, setLoading] = useState(initialProblems.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMode, setSelectedMode] = useState<ProblemMode>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [displayCount, setDisplayCount] = useState(60);

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

  // Compute counts per mode
  const modeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: problems.length };
    for (const p of problems) {
      counts[p.mode] = (counts[p.mode] || 0) + 1;
    }
    return counts;
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // Mode filter
      if (selectedMode !== "ALL" && p.mode !== selectedMode) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== "ALL" && p.difficulty !== selectedDifficulty) {
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
  }, [problems, selectedMode, selectedDifficulty, searchTerm]);

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

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* ── Unified CodeComplex Navigation Bar ──────────────────────────────────────── */}
      <PublicNavbar />

      {/* ── Hero / Intro ─────────────────────────────────── */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-subtle border border-primary/30 text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            <Zap className="size-3.5" /> 4,000+ Multi-Discipline Challenges
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
            Solo Practice & Challenge Library
          </h1>
          <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
            Practice across all five CodeComplex disciplines: DSA algorithms, broken codebase bug fixing, frontend layouts, backend APIs, and prompt engineering. Zero signup required to read, code, and test. Sign in to submit for official Elo rating.
          </p>
        </div>

        {/* ── Mode Switcher Tabs ───────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const count = modeCounts[mode.key] ?? 0;
            const isSelected = selectedMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => {
                  setSelectedMode(mode.key);
                  setDisplayCount(60);
                }}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary-subtle border-primary shadow-xs"
                    : "bg-surface border-border hover:border-border-strong hover:bg-surface-2"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Icon className={`size-4 ${mode.color}`} />
                  <span className="text-[10px] font-mono text-text-faint">
                    {count.toLocaleString()}
                  </span>
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isSelected ? "text-primary" : "text-text"}`}>
                    {mode.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Filters & Search Bar ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
              }}
              className="text-xs font-mono text-primary hover:underline cursor-pointer font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-text-faint px-1">
              <span>Showing {Math.min(displayCount, filteredProblems.length)} of {filteredProblems.length} challenges</span>
            </div>

            <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border shadow-xs">
              {visibleList.map((prob, idx) => (
                <Link
                  key={prob._id || prob.slug || idx}
                  href={`/problems/${prob.slug || prob._id}`}
                  className="flex items-center justify-between p-4 sm:px-6 hover:bg-surface-2 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <span className="text-xs font-mono text-text-faint w-8 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-sm font-semibold text-text group-hover:text-primary transition-colors truncate">
                          {prob.title}
                        </h2>
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
                    <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border uppercase ${difficultyColors[prob.difficulty] || "text-text-muted bg-surface-2 border-border"}`}>
                      {prob.difficulty}
                    </span>
                    <span className="p-1 rounded-full text-text-faint group-hover:text-text group-hover:translate-x-0.5 transition-all hidden sm:inline-flex">
                      <ChevronRight className="size-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {displayCount < filteredProblems.length && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setDisplayCount((c) => c + 60)}
                  className="px-6 py-2.5 rounded-full border border-border bg-surface hover:bg-surface-2 text-xs font-mono text-text transition-colors cursor-pointer shadow-xs"
                >
                  Load Next 60 Challenges ({filteredProblems.length - displayCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface py-8 text-center text-xs text-text-muted mt-12">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} CodeComplex. Multi-discipline competitive programming platform.</span>
          <span>4,000+ Challenges Across 5 Modes · Built by Umang Sisodia</span>
        </div>
      </footer>
    </div>
  );
}

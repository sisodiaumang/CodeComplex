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
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Spinner } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/stores/auth-store";

export type ProblemMode = "ALL" | "DSA" | "BUG_FIX" | "FRONTEND" | "BACKEND" | "PROMPT_WAR";

interface ProblemItem {
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

const MODES: Array<{ key: ProblemMode; label: string; icon: any; color: string; bg: string; border: string }> = [
  { key: "ALL", label: "All Modes", icon: Zap, color: "text-white", bg: "bg-white/10", border: "border-white/20" },
  { key: "DSA", label: "DSA", icon: Code2, color: "text-[#4D8DFF]", bg: "bg-[#4D8DFF]/10", border: "border-[#4D8DFF]/20" },
  { key: "BUG_FIX", label: "Bug Fix", icon: Bug, color: "text-[#FF5A52]", bg: "bg-[#FF5A52]/10", border: "border-[#FF5A52]/20" },
  { key: "FRONTEND", label: "Frontend", icon: Layout, color: "text-[#2FCBDB]", bg: "bg-[#2FCBDB]/10", border: "border-[#2FCBDB]/20" },
  { key: "BACKEND", label: "Backend", icon: Server, color: "text-[#35C46A]", bg: "bg-[#35C46A]/10", border: "border-[#35C46A]/20" },
  { key: "PROMPT_WAR", label: "Prompt War", icon: Sparkles, color: "text-[#B57BF5]", bg: "bg-[#B57BF5]/10", border: "border-[#B57BF5]/20" },
];

export default function ProblemsCatalogPage() {
  const { status } = useAuth();
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMode, setSelectedMode] = useState<ProblemMode>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [displayCount, setDisplayCount] = useState(60);

  useEffect(() => {
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
  }, []);

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
    Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    Hard: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  const modeBadgeStyles = {
    DSA: "text-[#4D8DFF] bg-[#4D8DFF]/10 border-[#4D8DFF]/20",
    BUG_FIX: "text-[#FF5A52] bg-[#FF5A52]/10 border-[#FF5A52]/20",
    FRONTEND: "text-[#2FCBDB] bg-[#2FCBDB]/10 border-[#2FCBDB]/20",
    BACKEND: "text-[#35C46A] bg-[#35C46A]/10 border-[#35C46A]/20",
    PROMPT_WAR: "text-[#B57BF5] bg-[#B57BF5]/10 border-[#B57BF5]/20",
    ALL: "",
  };

  const visibleList = filteredProblems.slice(0, displayCount);

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#EFEDE8] flex flex-col font-sans selection:bg-[#FF7A1A] selection:text-[#0B0B0C]">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0B0B0C]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-base tracking-tight text-white hover:opacity-90 transition-opacity">
            <LogoMark size={24} />
            <span>Code<span className="text-[#FF7A1A]">Complex</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle className="text-white/70 hover:text-white" />
            {status === "authed" ? (
              <Link
                href="/battle"
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-[#FF7A1A]/40 bg-[#FF7A1A]/10 text-xs font-mono text-[#FF7A1A] hover:bg-[#FF7A1A]/20 transition-colors"
              >
                <Swords className="size-3" /> Enter 1v1 Arena
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-medium text-white/70 hover:text-white transition-colors hidden sm:inline-block"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#FF7A1A] text-black font-semibold text-xs transition-opacity hover:opacity-90"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero / Intro ─────────────────────────────────── */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-wider text-[#FF7A1A]">
            <Zap className="size-3.5" /> 4,000+ Multi-Discipline Challenges
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Solo Practice & Challenge Library
          </h1>
          <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
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
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white/[0.08] border-[#FF7A1A] shadow-lg shadow-[#FF7A1A]/5"
                    : "bg-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Icon className={`size-4 ${mode.color}`} />
                  <span className="text-[10px] font-mono text-white/40">
                    {count.toLocaleString()}
                  </span>
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isSelected ? "text-white" : "text-white/80"}`}>
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
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search challenges by title, keyword, or topic..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF7A1A] transition-colors"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] shrink-0">
            {["ALL", "Easy", "Medium", "Hard"].map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  selectedDifficulty === diff
                    ? "bg-white/10 text-white font-semibold shadow-sm"
                    : "text-white/50 hover:text-white"
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
            <Spinner className="size-8" />
            <p className="text-xs font-mono text-white/40">Loading challenge library...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
            <p className="text-sm text-white/60">No challenges match your current search and filter settings.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedDifficulty("ALL");
                setSelectedMode("ALL");
              }}
              className="text-xs font-mono text-[#FF7A1A] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-white/40 px-1">
              <span>Showing {Math.min(displayCount, filteredProblems.length)} of {filteredProblems.length} challenges</span>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.06]">
              {visibleList.map((prob, idx) => (
                <Link
                  key={prob._id || prob.slug || idx}
                  href={`/problems/${prob.slug || prob._id}`}
                  className="flex items-center justify-between p-4 sm:px-6 hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <span className="text-xs font-mono text-white/30 w-8 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-sm font-semibold text-white group-hover:text-[#FF7A1A] transition-colors truncate">
                          {prob.title}
                        </h2>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase ${modeBadgeStyles[prob.mode] || "text-white/60 bg-white/5 border-white/10"}`}>
                          {prob.mode.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-white/40">
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
                    <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border uppercase ${difficultyColors[prob.difficulty] || "text-white/60 bg-white/5 border-white/10"}`}>
                      {prob.difficulty}
                    </span>
                    <span className="p-1 rounded-full text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all hidden sm:inline-flex">
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
                  className="px-6 py-2.5 rounded-full border border-white/20 hover:border-white/40 text-xs font-mono text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  Load Next 60 Challenges ({filteredProblems.length - displayCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#0E0E10] py-8 text-center text-xs text-white/40 mt-12">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} CodeComplex. Multi-discipline competitive programming platform.</span>
          <span>4,000+ Challenges Across 5 Modes · Built by Umang Sisodia</span>
        </div>
      </footer>
    </div>
  );
}

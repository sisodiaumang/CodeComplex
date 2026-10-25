"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Swords,
  Clock,
  Code2,
  ChevronRight,
  Filter,
  CheckCircle2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Spinner } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/stores/auth-store";

interface ProblemItem {
  _id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  subCategory?: string;
  mode?: string;
  metadata?: {
    estimatedTime?: number;
    points?: number;
    topics?: string[];
    tags?: string[];
  };
}

const CATEGORIES = [
  "ALL",
  "ARRAY",
  "STRING",
  "DP",
  "TREE",
  "GRAPH",
  "LINKED_LIST",
  "BINARY_SEARCH",
  "STACK",
  "HEAP",
  "GREEDY",
];

export default function ProblemsCatalogPage() {
  const { status, user } = useAuth();
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

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

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // Difficulty filter
      if (selectedDifficulty !== "ALL" && p.difficulty !== selectedDifficulty) {
        return false;
      }
      // Category filter
      if (selectedCategory !== "ALL") {
        const cat = p.category?.toUpperCase();
        const top = (p.metadata?.topics || []).map((t) => t.toUpperCase());
        if (cat !== selectedCategory && !top.includes(selectedCategory)) {
          return false;
        }
      }
      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(term);
        const matchSlug = (p.slug || "").toLowerCase().includes(term);
        const matchCat = (p.category || "").toLowerCase().includes(term);
        const matchTags = (p.metadata?.tags || []).some((t) =>
          t.toLowerCase().includes(term)
        );
        if (!matchTitle && !matchSlug && !matchCat && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [problems, selectedDifficulty, selectedCategory, searchTerm]);

  const difficultyColors = {
    Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    Hard: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

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
            <Zap className="size-3.5" /> 400+ Algorithmic Challenges
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            DSA Problem Catalog & Solo Training
          </h1>
          <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
            Click any problem to immediately start solo training with full code execution — zero signup required. When you&apos;re ready to verify against hidden stress test cases and earn global Elo rating points, sign in and challenge other engineers.
          </p>
        </div>

        {/* ── Filters & Search Bar ─────────────────────────── */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search problems by name, topic (e.g. 3 Sum, Binary Search, Trees)..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF7A1A] transition-colors"
              />
            </div>

            {/* Difficulty Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] shrink-0">
              {["ALL", "Easy", "Medium", "Hard"].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${selectedDifficulty === diff ? "bg-white/10 text-white font-semibold shadow-sm" : "text-white/50 hover:text-white"}`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[10px] font-mono uppercase text-white/40 shrink-0 flex items-center gap-1 mr-1">
              <Filter className="size-3" /> Topic:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono shrink-0 transition-colors ${selectedCategory === cat ? "bg-[#FF7A1A] text-black font-semibold" : "bg-white/[0.03] text-white/60 hover:text-white border border-white/[0.06]"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Problem List ─────────────────────────────────── */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Spinner className="size-8" />
            <p className="text-xs font-mono text-white/40">Loading challenge catalog...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
            <p className="text-sm text-white/60">No problems match your current search and filter settings.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedDifficulty("ALL");
                setSelectedCategory("ALL");
              }}
              className="text-xs font-mono text-[#FF7A1A] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.06]">
            {filteredProblems.map((prob, idx) => (
              <Link
                key={prob._id || prob.slug || idx}
                href={`/problems/${prob.slug || prob._id}`}
                className="flex items-center justify-between p-4 sm:px-6 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  <span className="text-xs font-mono text-white/30 w-7 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-sm font-semibold text-white group-hover:text-[#FF7A1A] transition-colors truncate">
                        {prob.title}
                      </h2>
                      {prob.mode === "bug_fix" && (
                        <span className="text-[9px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.2 rounded shrink-0">
                          Bug Fix
                        </span>
                      )}
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
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#0E0E10] py-8 text-center text-xs text-white/40 mt-12">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} CodeComplex. Real-time competitive programming.</span>
          <span>400+ Algorithmic Challenges · Built by Umang Sisodia</span>
        </div>
      </footer>
    </div>
  );
}

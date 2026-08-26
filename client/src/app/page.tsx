"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  ArrowRight, 
  Code, 
  Cpu, 
  Layout, 
  Server, 
  ShieldAlert, 
  Sparkles, 
  Play,
  CheckCircle2,
  Clock,
  Zap,
  Terminal,
  Trophy,
  Swords,
  Flame,
  Search,
  ChevronDown,
  ChevronRight,
  Radio,
  Lock,
  Boxes,
  Layers,
  Activity,
  Award,
  Key
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ELO_TIERS } from "@/lib/theme";
import { useAuth } from "@/stores/auth-store";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

type BattleModeKey = "DSA" | "BUG_FIX" | "BACKEND" | "FRONTEND" | "PROMPT_WAR";

interface ModeDemo {
  title: string;
  tagline: string;
  filename: string;
  lang: string;
  playerCode: string;
  opponentStatus: {
    name: string;
    rating: number;
    progress: string;
    passedCount: string;
    state: string;
  };
  testcases: { name: string; status: "passed" | "failed"; time: string }[];
}

const ARENA_DEMOS: Record<BattleModeKey, ModeDemo> = {
  DSA: {
    title: "Data Structures & Algorithms",
    tagline: "High-frequency algorithmic duels. Millisecond execution, strict memory limits.",
    filename: "median_stream.cpp",
    lang: "C++ 20 (Clang 16)",
    playerCode: `#include <queue>
#include <vector>
using namespace std;

class MedianFinder {
    priority_queue<int> max_heap; // Lower half
    priority_queue<int, vector<int>, greater<int>> min_heap; // Upper half
public:
    void addNum(int num) {
        max_heap.push(num);
        min_heap.push(max_heap.top());
        max_heap.pop();
        if (max_heap.size() < min_heap.size()) {
            max_heap.push(min_heap.top());
            min_heap.pop();
        }
    }
    double findMedian() {
        if (max_heap.size() > min_heap.size()) return max_heap.top();
        return (max_heap.top() + min_heap.top()) / 2.0;
    }
};`,
    opponentStatus: {
      name: "mikhail_99",
      rating: 1845,
      progress: "Line 19 • Vector reallocation",
      passedCount: "3/4 Passed",
      state: "Running Testcases...",
    },
    testcases: [
      { name: "Test 1: Random Stream [10^5 elements]", status: "passed", time: "18ms" },
      { name: "Test 2: Monotonic Decreasing Order", status: "passed", time: "12ms" },
      { name: "Test 3: Duplicates & Floating Prec.", status: "passed", time: "8ms" },
      { name: "Test 4: Strict Time Constraint 0.05s", status: "passed", time: "24ms" },
    ]
  },
  BUG_FIX: {
    title: "Bug Fix & Systems Debugging",
    tagline: "Live broken codebases. Race conditions, off-by-ones, and memory leaks.",
    filename: "mutex_pool.go",
    lang: "Go 1.22",
    playerCode: `package pool

import "sync"

type WorkerPool struct {
    mu       sync.RWMutex
    workers  map[string]*Worker
    closed   bool
}

// Fixed: Resolved data race when workers drain concurrently
func (p *WorkerPool) Dispatch(task Task) error {
    p.mu.RLock()
    if p.closed {
        p.mu.RUnlock()
        return ErrPoolClosed
    }
    worker := p.selectAvailableWorkerLocked()
    p.mu.RUnlock()
    
    return worker.Submit(task)
}`,
    opponentStatus: {
      name: "chen_wei",
      rating: 1910,
      progress: "Investigating goroutine leak",
      passedCount: "2/4 Passed",
      state: "Editing mutex locks",
    },
    testcases: [
      { name: "Race Detector: 1000 Concurrent Tasks", status: "passed", time: "42ms" },
      { name: "Deadlock Stress Matrix", status: "passed", time: "28ms" },
      { name: "Graceful Drain Under SIGTERM", status: "passed", time: "15ms" },
      { name: "Zero Goroutine Leak Check", status: "passed", time: "9ms" },
    ]
  },
  BACKEND: {
    title: "Backend API Engineering",
    tagline: "Build live HTTP & WebSocket endpoints. Verified with automated curl suites.",
    filename: "webhook_dispatcher.ts",
    lang: "TypeScript / Node.js",
    playerCode: `import { Router, Request, Response } from "express";
import crypto from "crypto";

export const webhookRouter = Router();

webhookRouter.post("/v1/events", async (req: Request, res: Response) => {
  const signature = req.headers["x-signature-sha256"] as string;
  const payload = JSON.stringify(req.body);
  
  const expected = crypto
    .createHmac("sha256", process.env.SIGNING_SECRET!)
    .update(payload)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  await queue.publish("webhook.process", req.body);
  return res.status(202).json({ status: "queued", eventId: req.body.id });
});`,
    opponentStatus: {
      name: "elena_v",
      rating: 1820,
      progress: "Timing attack security check",
      passedCount: "3/4 Passed",
      state: "Refactoring HMAC verification",
    },
    testcases: [
      { name: "POST /v1/events: 202 Accepted", status: "passed", time: "14ms" },
      { name: "Security: Timing-safe HMAC Rejection", status: "passed", time: "11ms" },
      { name: "Idempotency: Duplicate Replay Guard", status: "passed", time: "19ms" },
      { name: "High Throughput Burst: 500 req/s", status: "passed", time: "35ms" },
    ]
  },
  FRONTEND: {
    title: "Frontend Pixel Duel",
    tagline: "Pixel-perfect component assembly scored with headless Chromium visual diffs.",
    filename: "VirtualKanban.tsx",
    lang: "React 19 / Tailwind",
    playerCode: `import React, { useMemo, useState } from "react";

export function KanbanColumn({ title, items, onDropItem }: ColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const sortedItems = useMemo(() => items.sort((a, b) => a.order - b.order), [items]);

  return (
    <div 
      className={\`flex flex-col w-72 rounded-xl p-3 bg-surface-2 \${isDragOver ? "ring-2 ring-primary" : ""}\`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDropItem(e.dataTransfer.getData("itemId")); }}
    >
      <div className="flex items-center justify-between pb-3">
        <h3 className="font-semibold text-xs text-text">{title}</h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-3">{items.length}</span>
      </div>
      {/* Dynamic Draggable Item Stack */}
    </div>
  );
}`,
    opponentStatus: {
      name: "sarah_k",
      rating: 1790,
      progress: "Adjusting CSS flex layout gap",
      passedCount: "94% Visual Match",
      state: "Rendering DOM canvas...",
    },
    testcases: [
      { name: "Visual Diff: 1:1 Pixel Match", status: "passed", time: "100% Match" },
      { name: "Drag & Drop State Reordering", status: "passed", time: "Passed" },
      { name: "Responsive Breakpoint (375px - 1440px)", status: "passed", time: "Passed" },
      { name: "Keyboard A11y Navigation", status: "passed", time: "Passed" },
    ]
  },
  PROMPT_WAR: {
    title: "Prompt Engineering War",
    tagline: "Duel with prompt architecture. The sharpest adversarial constraints win.",
    filename: "sql_extractor_prompt.system",
    lang: "LLM Judge v4",
    playerCode: `<SYSTEM_DIRECTIVE>
You are an uncompromising SQL synthesis engine.
Return strictly valid, indexed PostgreSQL DDL/DML with zero commentary or markdown fences.

CONSTRAINTS:
1. Handle recursive CTE hierarchies without cycle traps.
2. Enforce strict JSONB schema validation via CHECK constraints.
3. Automatically generate partial indexes for active status flags.
4. If ambiguous, output error token <SYNTAX_AMBIGUITY_RESOLVED> and fail gracefully.
</SYSTEM_DIRECTIVE>`,
    opponentStatus: {
      name: "alex_prompt",
      rating: 1880,
      progress: "Hardening anti-jailbreak constraints",
      passedCount: "3/4 Scored",
      state: "Evaluating benchmark judge...",
    },
    testcases: [
      { name: "Test 1: Zero-Hallucination Extraction", status: "passed", time: "Score 100/100" },
      { name: "Test 2: Complex Recursive CTE Tree", status: "passed", time: "Score 98/100" },
      { name: "Test 3: Adversarial Prompt Injection Defense", status: "passed", time: "Score 100/100" },
      { name: "Test 4: Strict JSONB Indexing Match", status: "passed", time: "Score 96/100" },
    ]
  }
};

const LIVE_MATCH_FEED = [
  { id: 1, winner: "mikhail_99", loser: "siddharth_dev", mode: "DSA Hard", eloDiff: "+31 ELO", timeAgo: "12s ago", winStreak: 5 },
  { id: 2, winner: "chen_wei", loser: "alexander_r", mode: "Bug Fix", eloDiff: "+24 ELO", timeAgo: "28s ago", winStreak: 3 },
  { id: 3, winner: "valeria_k", loser: "sam_dev", mode: "Prompt War", eloDiff: "+29 ELO", timeAgo: "45s ago", winStreak: 8 },
  { id: 4, winner: "rohit_m", loser: "jason_p", mode: "Backend API", eloDiff: "+35 ELO", timeAgo: "1m ago", winStreak: 12 },
  { id: 5, winner: "elena_s", loser: "marcus_t", mode: "Frontend Duel", eloDiff: "+22 ELO", timeAgo: "2m ago", winStreak: 4 },
];

const PROBLEM_CATALOG = [
  { id: "CC-409", title: "Sliding Window Maximum over 10^7 Stream", mode: "DSA", diff: "Hard", winRate: "34%", avgTime: "12m 40s", tags: ["Monotonic Queue", "Streaming", "O(N)"] },
  { id: "CC-382", title: "Debug Concurrent Map Mutation Panic", mode: "BUG_FIX", diff: "Medium", winRate: "58%", avgTime: "06m 15s", tags: ["Go", "RWMutex", "Race Condition"] },
  { id: "CC-214", title: "Implement Distributed Token Bucket Rate Limiter", mode: "BACKEND", diff: "Hard", winRate: "41%", avgTime: "15m 20s", tags: ["Redis", "Express", "Concurrency"] },
  { id: "CC-189", title: "Recreate Dynamic Virtualized Tree Table", mode: "FRONTEND", diff: "Medium", winRate: "62%", avgTime: "11m 10s", tags: ["React", "DOM Virtualization", "A11y"] },
  { id: "CC-501", title: "Adversarial Schema Generator Defense", mode: "PROMPT_WAR", diff: "Hard", winRate: "29%", avgTime: "08m 45s", tags: ["LLM", "Prompt Security", "JSONB"] },
  { id: "CC-102", title: "Find Longest Substring Without Repeating Chars", mode: "DSA", diff: "Easy", winRate: "79%", avgTime: "04m 10s", tags: ["Hash Map", "Two Pointers"] },
];

const TOP_LEADERBOARD = [
  { rank: "01", name: "vladimir_k", elo: 2420, tier: "Grandmaster", winRate: "89.4%", streak: 18, country: "DE", primaryMode: "DSA" },
  { rank: "02", name: "sakura_dev", elo: 2385, tier: "Grandmaster", winRate: "86.1%", streak: 14, country: "JP", primaryMode: "Bug Fix" },
  { rank: "03", name: "neil_codes", elo: 2310, tier: "Grandmaster", winRate: "84.5%", streak: 11, country: "US", primaryMode: "Backend" },
  { rank: "04", name: "ananya_s", elo: 2260, tier: "Grandmaster", winRate: "82.8%", streak: 9, country: "IN", primaryMode: "Frontend" },
  { rank: "05", name: "lucas_b", elo: 2215, tier: "Grandmaster", winRate: "80.2%", streak: 7, country: "BR", primaryMode: "Prompt War" },
];

const FAQS = [
  {
    q: "How does real-time 1v1 matchmaking work?",
    a: "When you queue for Ranked Matchmaking, our matchmaking coordinator pairs you with an opponent within ±75 Elo points. Both players receive the exact same problem simultaneously, with socket-synced timers, identical sandbox environments, and live opponent progress telemetry."
  },
  {
    q: "How are submissions executed and verified safely?",
    a: "Every submission executes inside ephemeral, gVisor/Docker isolated sandbox micro-containers with strict CPU (1 vCPU) and memory limits (512MB). Network egress is blocked. Test suites execute in under 50ms with sub-millisecond precision."
  },
  {
    q: "How is Elo calculated across different battle modes?",
    a: "Each battle category (DSA, Bug Fix, Backend, Frontend, Prompt War) maintains its own independent Elo rating. We use an adaptive K-factor algorithm that factors in opponent rating differential, speed of completion, and submission testcase accuracy."
  },
  {
    q: "Can I host private matches or team scrims?",
    a: "Yes. You can create private custom lobbies with custom mode rules, time controls, and challenge difficulty, then share an instant invite link or 6-digit room code with your friends or teammates."
  },
  {
    q: "What anti-cheat measures are enforced?",
    a: "Our engine analyzes keystroke cadence dynamics, tab focus loss telemetry, copy-paste velocity, and code AST similarity matrices to guarantee fair competitive play."
  }
];

export default function LandingPage() {
  const { status } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{ users: number; battles: number; challenges: number } | null>(null);
  const [selectedMode, setSelectedMode] = useState<BattleModeKey>("DSA");
  const [catalogFilter, setCatalogFilter] = useState<string>("ALL");
  const [roomCode, setRoomCode] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (status === "authed") {
      router.replace("/battle");
      return;
    }

    api<{ users: number; battles: number; challenges: number }>("/user/public/stats")
      .then((res) => {
        if (res && typeof res === "object") {
          setStats(res);
        }
      })
      .catch(() => {});
  }, [status, router]);

  const handleSimulateRun = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  const currentDemo = ARENA_DEMOS[selectedMode];

  const filteredCatalog = catalogFilter === "ALL" 
    ? PROBLEM_CATALOG 
    : PROBLEM_CATALOG.filter(item => item.mode === catalogFilter);

  return (
    <div className="relative min-h-screen bg-bg text-text selection:bg-primary selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Background Developer Grid & Ambient Radial Accents */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-20" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl pointer-events-none -z-10 opacity-70" />

      {/* ─── Top Navbar (Retained cleanly) ─── */}
      <header className="border-b border-border/40 backdrop-blur-xl sticky top-0 z-50 bg-bg/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-3.5">
          <div className="flex items-center gap-3">
            <LogoMark size={28} />
            <span className="text-lg font-bold tracking-tight text-text">
              Code<span className="text-primary font-medium">Complex</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded bg-surface-3 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-text-muted ml-2">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Arena v2.4
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="border-r border-border/40 pr-2 sm:pr-3 py-1 text-text">
              <ThemeToggle />
            </div>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-text-muted hover:text-text hover:bg-surface-2 transition-colors text-xs font-semibold px-3 h-8">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="h-8 rounded px-4 text-xs font-semibold shadow-sm hover:shadow-primary/20">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Section 1: Hero & High-Intensity Arena Hook ─── */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-8 pt-12 pb-16">
        {/* Live Matchmaking Status Tag */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary">
            <Radio className="size-3.5 animate-pulse text-primary" />
            <span className="font-mono font-semibold tracking-wide">1,420+ LIVE DUELS TODAY</span>
            <span className="text-text-faint">•</span>
            <span className="text-text-muted text-[11px]">Ranked Season 4 Live</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs text-text-muted font-mono">
            <span className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-500" /> Avg Queue: <strong className="text-text">3.8s</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="size-3.5 text-primary" /> Sandbox Latency: <strong className="text-text">14ms</strong>
            </span>
          </div>
        </div>

        {/* Hero Title & Value Proposition */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center mb-12">
          <div className="space-y-5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-text leading-[1.08]">
              REAL-TIME <br />
              <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                HEAD-TO-HEAD
              </span> <br />
              CODE DUELS.
            </h1>
            <p className="text-sm sm:text-base text-text-muted max-w-xl leading-relaxed">
              Duel engineers in synchronized live battles. Solve competitive algorithms, squash critical codebase bugs, build live backend APIs, assemble frontend layouts, and prompt against adversarial judges.
            </p>

            {/* Quick Action Matrix */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/signup">
                <Button className="h-11 px-6 text-xs sm:text-sm font-bold gap-2 rounded shadow-md hover:shadow-primary/30">
                  <Swords className="size-4" /> Enter Ranked Queue
                </Button>
              </Link>

              <Link href="/leaderboard">
                <Button variant="secondary" className="h-11 px-5 text-xs sm:text-sm font-semibold gap-2 rounded">
                  <Trophy className="size-4 text-amber-500" /> Global Leaderboard
                </Button>
              </Link>
            </div>

            {/* Quick Join Match by Code */}
            <div className="pt-2 flex items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-text-faint" />
                <input 
                  type="text"
                  placeholder="Enter 6-digit Lobby Code (e.g. CC-7829)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full h-9 pl-9 pr-3 rounded border border-border bg-surface-2/60 text-xs font-mono text-text placeholder:text-text-faint focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <Link href={roomCode ? `/battle/${roomCode}` : "/signup"}>
                <Button variant="outline" className="h-9 px-3 text-xs font-mono font-medium rounded whitespace-nowrap">
                  Join Duel <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stat Highlights */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-xl border border-border/50 bg-surface/40 backdrop-blur-md space-y-1.5 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint font-semibold">Total Challenges</span>
                <Code className="size-4 text-primary" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-text">
                {stats?.challenges ? stats.challenges.toLocaleString() : "4,027+"}
              </div>
              <p className="text-[11px] text-text-muted">DSA, Bug Fix, Full-Stack & Prompts</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-border/50 bg-surface/40 backdrop-blur-md space-y-1.5 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint font-semibold">Sandboxed Runs</span>
                <Cpu className="size-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-500">
                1.8M+
              </div>
              <p className="text-[11px] text-text-muted">Sub-50ms Kernel Execution</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-border/50 bg-surface/40 backdrop-blur-md space-y-1.5 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint font-semibold">Active Ranks</span>
                <Award className="size-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-text">
                7 Tiers
              </div>
              <p className="text-[11px] text-text-muted">Bronze to Grandmaster Elo</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-border/50 bg-surface/40 backdrop-blur-md space-y-1.5 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint font-semibold">Engine Specs</span>
                <Activity className="size-4 text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-blue-500">
                &lt;10ms
              </div>
              <p className="text-[11px] text-text-muted">WebSocket Synchronized Timer</p>
            </div>
          </div>
        </div>

        {/* ─── Interactive 1v1 Battle Arena Simulator Widget ─── */}
        <div className="rounded-2xl border border-border/70 bg-surface/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Arena Mode Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-border/50 bg-surface-2/40 px-4 py-2.5 gap-2">
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {(["DSA", "BUG_FIX", "BACKEND", "FRONTEND", "PROMPT_WAR"] as BattleModeKey[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                    selectedMode === mode
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-muted hover:text-text hover:bg-surface-3"
                  )}
                >
                  {mode === "DSA" && <Code className="size-3.5" />}
                  {mode === "BUG_FIX" && <ShieldAlert className="size-3.5" />}
                  {mode === "BACKEND" && <Server className="size-3.5" />}
                  {mode === "FRONTEND" && <Layout className="size-3.5" />}
                  {mode === "PROMPT_WAR" && <Sparkles className="size-3.5" />}
                  {mode.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
              <span className="flex items-center gap-1 text-primary font-bold">
                <Clock className="size-3.5" /> 04:18 REMAINING
              </span>
              <span className="hidden sm:inline text-text-faint">•</span>
              <span className="hidden sm:inline text-emerald-500 font-semibold">+28 / -19 ELO STAKES</span>
            </div>
          </div>

          {/* Interactive Split-Screen 1v1 Arena */}
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] divide-y lg:divide-y-0 lg:divide-x divide-border/40">
            {/* Player 1 (You) Editor Panel */}
            <div className="p-4 sm:p-6 bg-bg/40 flex flex-col justify-between space-y-4">
              <div>
                {/* File tab & language badge */}
                <div className="flex items-center justify-between pb-3 border-b border-border/30 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-mono text-xs font-bold text-text">{currentDemo.filename}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-3 text-text-muted">
                      {currentDemo.lang}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-text-faint">
                    <span>You (Challenger)</span>
                    <span className="font-bold text-primary">1842 ELO</span>
                  </div>
                </div>

                {/* Code syntax display */}
                <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-text overflow-x-auto p-3 rounded-lg bg-surface/50 border border-border/30 max-h-[300px]">
                  <code>{currentDemo.playerCode}</code>
                </pre>
              </div>

              {/* Code execution bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                  <Terminal className="size-3.5 text-text-faint" />
                  <span>Sandbox: <strong>Docker Isolation (512MB)</strong></span>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSimulateRun}
                  loading={isSimulating}
                  className="h-8 px-4 text-xs font-mono font-bold rounded gap-1.5"
                >
                  <Play className="size-3 fill-current" /> Run Test Suite
                </Button>
              </div>
            </div>

            {/* Match Telemetry & Opponent Live Radar */}
            <div className="p-4 sm:p-6 bg-surface-2/20 flex flex-col justify-between space-y-6">
              {/* Opponent Live Status Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-mono font-bold text-text">Rival: @{currentDemo.opponentStatus.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold">
                      {currentDemo.opponentStatus.rating} ELO
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-faint uppercase">Live Telemetry</span>
                </div>

                <div className="p-3 rounded-lg bg-surface/40 border border-border/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-text-muted">Current Activity:</span>
                    <span className="text-amber-500 font-semibold">{currentDemo.opponentStatus.state}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-text-muted">Opponent Progress:</span>
                    <span className="text-text font-bold">{currentDemo.opponentStatus.passedCount}</span>
                  </div>
                  <div className="w-full bg-surface-3 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[75%] rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Your Active Test Suite Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-text-faint">
                    Automated Test Suite (4/4)
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                    100% Correct
                  </span>
                </div>

                <div className="space-y-1.5">
                  {currentDemo.testcases.map((tc, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-surface/60 border border-border/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        <span className="text-text-muted truncate max-w-[180px] sm:max-w-[240px]">{tc.name}</span>
                      </div>
                      <span className="text-emerald-500 font-semibold shrink-0">{tc.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status footer message */}
              <div className="p-2.5 rounded bg-primary/5 border border-primary/20 text-center">
                <p className="text-[11px] font-mono text-primary font-medium">
                  ⚡ First verified submission with 100% test pass takes the victory.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Live Match Feed Ticker ─── */}
      <section className="border-y border-border/30 bg-surface-2/40 py-3 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary uppercase tracking-wider shrink-0">
            <Flame className="size-4 text-primary animate-bounce" />
            <span>LIVE DUEL FEED:</span>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1 text-xs font-mono text-text-muted">
            {LIVE_MATCH_FEED.map((feed) => (
              <div key={feed.id} className="flex items-center gap-2 shrink-0 bg-surface/60 px-3 py-1 rounded border border-border/40">
                <span className="text-text font-semibold">@{feed.winner}</span>
                <span className="text-text-faint">beat</span>
                <span className="text-text-muted">@{feed.loser}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-3 text-text-faint">{feed.mode}</span>
                <span className="text-emerald-500 font-bold">{feed.eloDiff}</span>
                <span className="text-text-faint text-[10px]">{feed.timeAgo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 3: The 5 Competitive Battle Arenas ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 py-20 space-y-12">
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-0.5 text-[11px] font-mono text-text-muted">
            <Layers className="size-3 text-primary" /> 5 DISCIPLINE COMBAT
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-text">
            CHOOSE YOUR ARENA.
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Every category maintains an independent Elo rating. Prove your mastery across algorithms, debugging, full-stack systems, and adversarial prompts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Mode 1 */}
          <div className="p-6 rounded-xl border border-border/50 bg-surface/30 hover:border-primary/50 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <Code className="size-5" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-3 text-text-faint font-semibold">
                Ranked 1v1
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-text">01. DSA Sprint</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Algorithmic speed duels. Graph algorithms, Dynamic Programming, tree traversals, and mathematical optimizations. First to pass all edge testcases wins.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono text-text-faint">
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">C++ 20</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Python 3</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Java 21</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Go</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Rust</span>
            </div>
          </div>

          {/* Mode 2 */}
          <div className="p-6 rounded-xl border border-border/50 bg-surface/30 hover:border-primary/50 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <ShieldAlert className="size-5" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-3 text-text-faint font-semibold">
                Live Bug Hunt
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-text">02. Bug Fix Hunter</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Inherit broken production repositories. Track down subtle race conditions, off-by-one errors, memory leaks, and nil panics under pressure.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono text-text-faint">
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Concurrency</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Deadlocks</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">NullPointer</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Buffer Overflow</span>
            </div>
          </div>

          {/* Mode 3 */}
          <div className="p-6 rounded-xl border border-border/50 bg-surface/30 hover:border-primary/50 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Server className="size-5" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-3 text-text-faint font-semibold">
                Systems API
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-text">03. Backend Architect</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Build live HTTP/REST and WebSocket endpoints. Automated curl suites test status codes, authentication headers, database locks, and response schemas.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono text-text-faint">
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Node / Express</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">FastAPI</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">PostgreSQL</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Redis</span>
            </div>
          </div>

          {/* Mode 4 */}
          <div className="p-6 rounded-xl border border-border/50 bg-surface/30 hover:border-primary/50 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                <Layout className="size-5" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-3 text-text-faint font-semibold">
                Pixel Precision
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-text">04. Frontend Pixel Duel</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Recreate responsive UI components pixel-for-pixel. Headless Chromium takes DOM screenshots and computes visual diff matrices to score your build.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono text-text-faint">
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">React 19</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Tailwind CSS</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">A11y ARIA</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">DOM Trees</span>
            </div>
          </div>

          {/* Mode 5 */}
          <div className="p-6 rounded-xl border border-border/50 bg-surface/30 hover:border-primary/50 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <Sparkles className="size-5" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-3 text-text-faint font-semibold">
                Adversarial AI
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-text">05. Prompt War</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Duel with system prompt architectures. Direct LLMs to solve complex edge cases while defending against prompt injection and benchmark evaluation traps.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono text-text-faint">
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">System Directives</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Few-Shot Logic</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border/30">Adversarial Defense</span>
            </div>
          </div>

          {/* Custom Arena Card */}
          <div className="p-6 rounded-xl border border-dashed border-border/70 bg-surface-2/20 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="size-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Boxes className="size-5" />
              </div>
              <h3 className="text-base font-bold text-text">Private Custom Lobby</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Host custom 1v1 scrims or company technical screens. Select custom problem sets, enforce language bans, and configure sandbox timeouts.
              </p>
            </div>
            <Link href="/signup">
              <Button variant="outline" size="sm" className="w-full text-xs font-mono font-medium rounded">
                Host Private Lobby <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Section 4: Problem Matrix & Interactive Catalog (LeetCode / Codeforces Style) ─── */}
      <section className="border-t border-border/30 bg-surface-2/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-primary">
                <Search className="size-3.5" /> PROBLEM ARENA MATRIX
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text">
                CURATED CHALLENGE REPOSITORY
              </h2>
              <p className="text-xs text-text-muted">
                Explore real competitive challenges across algorithms, systems, debugging, and layouts.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {["ALL", "DSA", "BUG_FIX", "BACKEND", "FRONTEND", "PROMPT_WAR"].map((f) => (
                <button
                  key={f}
                  onClick={() => setCatalogFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-mono font-semibold transition-all whitespace-nowrap",
                    catalogFilter === f
                      ? "bg-text text-bg"
                      : "bg-surface/60 border border-border/40 text-text-muted hover:text-text hover:bg-surface-3"
                  )}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Problem Table */}
          <div className="rounded-xl border border-border/50 bg-surface/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/40 bg-surface-2/40 text-text-faint uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Code ID</th>
                    <th className="py-3 px-4">Challenge Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Avg Duration</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredCatalog.map((problem) => (
                    <tr key={problem.id} className="hover:bg-surface-2/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-text-muted">{problem.id}</td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-text">
                        <div className="flex items-center gap-2">
                          <span>{problem.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          {problem.tags.map((tag, i) => (
                            <span key={i} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-3 text-text-faint">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-3 text-text-muted">
                          {problem.mode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          problem.diff === "Easy" && "bg-emerald-500/10 text-emerald-500",
                          problem.diff === "Medium" && "bg-amber-500/10 text-amber-500",
                          problem.diff === "Hard" && "bg-rose-500/10 text-rose-500",
                        )}>
                          {problem.diff}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-muted">{problem.winRate}</td>
                      <td className="py-3.5 px-4 text-text-faint">{problem.avgTime}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href="/signup">
                          <Button size="sm" variant="outline" className="h-7 px-3 text-[11px] rounded font-mono">
                            Duel Now
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 5: The Ranked Elo Ladder & Tier Dynamics ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 py-20 space-y-12">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-primary">
              <Trophy className="size-3.5" /> COMPETITIVE PROGRESSION
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-text">
              THE ELO RANKING LADDER.
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Every round shifts your rating according to statistical win probability. Climb through 7 tiers with seasonal promotions, decay guards, and leaderboards.
            </p>

            <div className="p-4 rounded-xl border border-border/40 bg-surface/30 font-mono text-xs space-y-2 text-text-muted">
              <div className="text-text font-bold text-xs flex items-center justify-between">
                <span>Mathematical Elo Formulation</span>
                <span className="text-primary text-[10px]">Adaptive K-Factor (K=32)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-text-faint">
                $R&apos; = R + K \cdot (S - E)$ where $E = \frac&#123;1&#125;&#123;1 + 10^&#123;(R_&#123;opp&#125; - R) / 400&#125;&#125;$
              </p>
            </div>
          </div>

          {/* Tier Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
            {ELO_TIERS.map((tier) => (
              <div
                key={tier.label}
                className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-surface/40 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: tier.hex }} />
                  <span className="font-bold text-sm" style={{ color: tier.hex }}>
                    {tier.label}
                  </span>
                </div>
                <span className="text-text-faint font-semibold">
                  {tier.minRating}+ ELO
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 6: Global Top Grandmasters Leaderboard ─── */}
      <section className="border-t border-border/30 bg-surface-2/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-8">
          <div className="space-y-1.5 text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-primary">
              <Award className="size-3.5" /> GLOBAL HALL OF FAME
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text">
              TOP GRANDMASTERS
            </h2>
            <p className="text-xs text-text-muted">
              Live standings of top rated competitive engineers globally.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TOP_LEADERBOARD.map((user) => (
              <div key={user.rank} className="p-4 rounded-xl border border-border/40 bg-surface/50 space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs font-bold text-primary">#{user.rank}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">
                    {user.country}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-text font-mono truncate">@{user.name}</h4>
                  <p className="text-[11px] text-text-faint font-mono">{user.primaryMode} Specialist</p>
                </div>

                <div className="pt-2 border-t border-border/30 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-text-faint block">Rating</span>
                    <span className="font-bold text-text">{user.elo}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-text-faint block">Win Rate</span>
                    <span className="font-bold text-emerald-500">{user.winRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <Link href="/leaderboard">
              <Button variant="outline" size="sm" className="text-xs font-mono rounded">
                View Full Global 500 Leaderboard <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Section 7: Developer-First Engine Specs (Zero Compromise) ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 py-20 space-y-12">
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-0.5 text-[11px] font-mono text-text-muted">
            <Cpu className="size-3 text-primary" /> UNDER THE HOOD
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-text">
            ENGINEERED FOR RAW SPEED.
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Every layer from the WebSocket protocol to the compilation sandbox is tuned for sub-50ms execution.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 rounded-xl border border-border/40 bg-surface/30 space-y-3">
            <Lock className="size-5 text-primary" />
            <h3 className="text-sm font-bold text-text font-mono">Hermetic Sandbox</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Submissions execute in ephemeral Docker containers with gVisor kernel sandboxing and no network egress.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border/40 bg-surface/30 space-y-3">
            <Radio className="size-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-text font-mono">10ms State Sync</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Bi-directional WebSocket streams synchronize testcase runs, opponent progress, and keystroke cadence in real-time.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border/40 bg-surface/30 space-y-3">
            <Key className="size-5 text-amber-500" />
            <h3 className="text-sm font-bold text-text font-mono">Vim & Emacs Mode</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Full VS Code Monaco editor engine supporting customizable keybindings, ligature fonts, and snippet auto-expansion.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border/40 bg-surface/30 space-y-3">
            <ShieldAlert className="size-5 text-rose-500" />
            <h3 className="text-sm font-bold text-text font-mono">Anti-Cheat Engine</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Multi-dimensional telemetry checks AST tree structures, clipboard paste velocities, and tab blur events during duels.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Section 8: Developer FAQ ─── */}
      <section className="border-t border-border/30 bg-surface-2/20 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-8 space-y-8">
          <div className="space-y-1 text-center">
            <h2 className="text-2xl font-black tracking-tight text-text">FREQUENTLY ASKED QUESTIONS</h2>
            <p className="text-xs text-text-muted">Technical overview of matches, ratings, and sandboxing.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className="rounded-xl border border-border/40 bg-surface/50 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs text-text hover:text-primary transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={cn("size-4 text-text-faint transition-transform shrink-0", isOpen && "rotate-180 text-primary")} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-text-muted leading-relaxed border-t border-border/20 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Section 9: Call-To-Action Arena Banner ─── */}
      <section className="border-t border-border/30 bg-gradient-to-b from-bg to-surface-2/50 py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-8 space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-mono text-primary font-bold">
            <Swords className="size-3.5" /> READY FOR BATTLE
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-text">
            PROVE YOUR CODE UNDER PRESSURE.
          </h2>

          <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
            Join thousands of developers competing in daily 1v1 duels, climbing the Elo ranks, and mastering real engineering velocity.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button className="h-11 px-8 text-xs sm:text-sm font-bold rounded shadow-lg hover:shadow-primary/30">
                Create Free Account <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="h-11 px-6 text-xs sm:text-sm font-semibold rounded">
                Log in to Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/30 bg-bg py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark size={24} />
              <span className="text-sm font-bold tracking-tight text-text">
                Code<span className="text-primary">Complex</span>
              </span>
              <span className="text-xs text-text-faint font-mono">| Competitive Engineering Platform</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-500">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (99.98% Uptime)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/20 text-xs text-text-muted">
            <div className="flex flex-wrap gap-4 font-mono text-[11px]">
              <Link href="/about" className="hover:text-text transition-colors">About</Link>
              <Link href="/contact" className="hover:text-text transition-colors">Contact</Link>
              <Link href="/faq" className="hover:text-text transition-colors">FAQ</Link>
              <Link href="/terms" className="hover:text-text transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-text transition-colors">Privacy Policy</Link>
              <Link href="/guidelines" className="hover:text-text transition-colors">Guidelines</Link>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-text-faint">
              <a href="https://github.com/sisodiaumang/CodeComplex" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors">
                GitHub
              </a>
              <span>•</span>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors">
                LinkedIn
              </a>
            </div>
          </div>

          <div className="text-center sm:text-left text-[10px] font-mono text-text-faint">
            &copy; {new Date().getFullYear()} CodeComplex Arena. Built for competitive programmers and engineers.
          </div>
        </div>
      </footer>
    </div>
  );
}


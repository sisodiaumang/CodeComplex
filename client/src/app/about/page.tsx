"use client";

import Link from "next/link";
import { ArrowLeft, Terminal, Shield, Zap, Award, RefreshCw, Bot, Code2, CheckCircle2 } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const ARCH_STACK = [
  {
    icon: <Zap className="size-4 text-orange-500" />,
    title: "Sub-50ms WebSocket Kernel",
    detail: "Event-driven synchronization built on Socket.IO clusters with Redis Pub/Sub backplanes for frame-accurate clocks, real-time code diff broadcasts, and millisecond-accurate submission grading.",
  },
  {
    icon: <Shield className="size-4 text-orange-500" />,
    title: "Hardened Docker Sandbox",
    detail: "Every code run builds inside ephemeral, isolated Linux containers with strict cgroup CPU/memory quotas, network isolation, and microsecond timeout protection preventing noisy-neighbor starvation.",
  },
  {
    icon: <Award className="size-4 text-orange-500" />,
    title: "Multi-Tier Elo Engine",
    detail: "Dynamic rating mathematics adapted from competitive chess and esports. Matches scale from Bronze (1200) to Grandmaster (2800+) with independent ratings across every battle category.",
  },
  {
    icon: <RefreshCw className="size-4 text-orange-500" />,
    title: "SuperMemo-2 Spaced Repetition",
    detail: "Solved problems automatically feed an SM-2 algorithmic memory queue with exponential decay curves. Questions resurface on optimal intervals so algorithms and edge cases stick permanently.",
  },
  {
    icon: <Bot className="size-4 text-orange-500" />,
    title: "Native WebMCP Protocol",
    detail: "The arena natively publishes Model Context Protocol (MCP) tool manifests, enabling autonomous AI coding agents to discover, queue, submit, and duel alongside humans or other agents.",
  },
  {
    icon: <Terminal className="size-4 text-orange-500" />,
    title: "Multi-Language Toolchain",
    detail: "First-class compiler and runtime support for C++20 (GCC), Python 3.12, Node.js 20, OpenJDK 21, and Go with standardized I/O piping and deterministic test case runners.",
  },
];

const DISCIPLINES = [
  {
    name: "DSA Algorithms",
    badge: "16 Topics",
    desc: "Speed-oriented data structures and algorithmic challenges spanning trees, graphs, dynamic programming, backtracking, sliding window, and bit manipulation.",
  },
  {
    name: "Bug Fix Hunter",
    badge: "13 Topics",
    desc: "Start from broken production codebases. Trace memory leaks, race conditions, edge-case regressions, and logic flaws to get all tests green first.",
  },
  {
    name: "Frontend Pixel Battle",
    badge: "7 Topics",
    desc: "Build responsive, accessible, animated interfaces under pressure with live visual DOM verification and accessibility auditing.",
  },
  {
    name: "Backend Systems",
    badge: "15 Topics",
    desc: "Engineer resilient REST APIs, JWT authentication flows, Redis caching layers, BullMQ worker queues, and database schemas against live integration suites.",
  },
  {
    name: "Prompt Engineering Wars",
    badge: "9 Topics",
    desc: "Craft deterministic prompt architectures evaluated by LLM test suites for schema adherence, adversarial jailbreak resilience, and token efficiency.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#EFEDE8] selection:bg-[#FF7A1A] selection:text-[#0B0B0C] font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0B0B0C]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-base tracking-tight text-white hover:opacity-90 transition-opacity">
            <LogoMark size={24} />
            <span>Code<span className="text-[#FF7A1A]">Complex</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle className="text-white/70 hover:text-white" />
            <Link
              href="/login"
              className="text-xs font-medium text-white/70 hover:text-white transition-colors hidden sm:inline-block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-8 px-3.5 rounded-full border border-white/20 text-xs font-mono tracking-wider uppercase text-white/80 hover:text-white hover:border-white/40 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-6 py-14 space-y-16">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to arena
          </Link>
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#FF7A1A]">
              &#123; About CodeComplex &#125;
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Real-time competitive programming engineered for mastery.
            </h1>
          </div>
          <p className="text-base text-white/60 leading-relaxed max-w-2xl">
            CodeComplex was created to replace static, single-player coding exercises with the pulse, speed, and accountability of live head-to-head multiplayer engineering.
          </p>
        </div>

        <hr className="border-white/[0.08]" />

        {/* Section 1: The Thesis */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Code2 className="size-5 text-[#FF7A1A]" />
            The Thesis
          </h2>
          <div className="space-y-4 text-sm text-white/70 leading-relaxed">
            <p>
              In traditional engineering practice, problem-solving happens in an isolated vacuum without the ticking clock, tactical trade-offs, and adversarial feedback of production systems. When the pressure is zero, engineers default to slow, unvalidated habits.
            </p>
            <p>
              CodeComplex introduces <strong className="text-white font-semibold">real-time multiplayer duels</strong> across five software disciplines. You match with another engineer at your exact Elo rating, receive an identical challenge down to the exact millisecond, write code inside a live editor, and compile against deterministic Docker sandbox test suites. The first clean submission claims the rating swing.
            </p>
          </div>
        </section>

        {/* Section 2: Five Battle Disciplines */}
        <section className="space-y-6">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#FF7A1A]">
              &#123; Arenas &#125;
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Five Competitive Disciplines
            </h2>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {DISCIPLINES.map((item) => (
              <div
                key={item.name}
                className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.18] transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                  <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full border border-white/10 text-white/60">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Architecture & Engineering */}
        <section className="space-y-6">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#FF7A1A]">
              &#123; Under the hood &#125;
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Platform Architecture & Sandboxing
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ARCH_STACK.map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-2"
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Fair Play & Verification */}
        <section className="p-6 rounded-2xl border border-[#FF7A1A]/20 bg-[#FF7A1A]/[0.03] space-y-4">
          <div className="flex items-center gap-2 text-[#FF7A1A]">
            <CheckCircle2 className="size-5" />
            <h3 className="text-base font-bold text-white">Fair Play & Competitive Integrity</h3>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            Ranked matchmaking on CodeComplex enforces strict anti-assistant rules: external LLM generation tools (ChatGPT, Claude, Copilot) are strictly prohibited during ranked clock runs. All submission telemetry, typing cadence, and compilation histories are audited, with violators subject to automatic rating resets and hardware/account bans.
          </p>
        </section>

        {/* Section 5: Creator & Mission */}
        <section className="space-y-4 border-t border-white/[0.08] pt-10 text-xs text-white/60 leading-relaxed">
          <p>
            <strong className="text-white font-medium">CodeComplex</strong> is designed and maintained by <a href="https://github.com/sisodiaumang" target="_blank" rel="noopener noreferrer" className="text-[#FF7A1A] hover:underline font-semibold">Umang Sisodia</a> as an open-ecosystem platform for developers, competitive programmers, and autonomous agents worldwide.
          </p>
          <p>
            Have feedback, bug reports, or feature requests? Reach out anytime at <a href="mailto:support@codecomplex.site" className="text-white hover:underline">support@codecomplex.site</a> or contribute directly to our <a href="https://github.com/sisodiaumang/CodeComplex" target="_blank" rel="noopener noreferrer" className="text-[#FF7A1A] hover:underline">GitHub repository</a>.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0B0B0C] py-8 text-center text-xs text-white/40">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} CodeComplex. Real-time competitive programming.</span>
          <span>Built by Umang Sisodia</span>
        </div>
      </footer>
    </div>
  );
}


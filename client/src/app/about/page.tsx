"use client";

import Link from "next/link";
import { ArrowLeft, Terminal, Shield, Zap, Award, RefreshCw, Bot, Code2, CheckCircle2 } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useAuth } from "@/stores/auth-store";
import { Avatar } from "@/components/ui";

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
  const { user, status } = useAuth();
  const isAuthenticated = status === "authed" && !!user;
  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary selection:text-white font-sans antialiased flex flex-col">
      <PublicNavbar />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-14 space-y-16">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            href={isAuthenticated ? "/battle" : "/"}
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to arena
          </Link>
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-primary font-semibold">
              &#123; About CodeComplex &#125;
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-text leading-tight">
              Real-time competitive programming engineered for mastery.
            </h1>
          </div>
          <p className="text-base text-text-muted leading-relaxed max-w-2xl">
            CodeComplex was created to replace static, single-player coding exercises with the pulse, speed, and accountability of live head-to-head multiplayer engineering.
          </p>
        </div>

        <hr className="border-border" />

        {/* Section 1: The Thesis */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text flex items-center gap-2">
            <Code2 className="size-5 text-primary" />
            The Thesis
          </h2>
          <div className="space-y-4 text-sm text-text-muted leading-relaxed">
            <p>
              In traditional engineering practice, problem-solving happens in an isolated vacuum without the ticking clock, tactical trade-offs, and adversarial feedback of production systems. When the pressure is zero, engineers default to slow, unvalidated habits.
            </p>
            <p>
              CodeComplex introduces <strong className="text-text font-semibold">real-time multiplayer duels</strong> across five software disciplines. You match with another engineer at your exact Elo rating, receive an identical challenge down to the exact millisecond, write code inside a live editor, and compile against deterministic Docker sandbox test suites. The first clean submission claims the rating swing.
            </p>
          </div>
        </section>

        {/* Section 2: Five Battle Disciplines */}
        <section className="space-y-6">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-primary font-semibold">
              &#123; Arenas &#125;
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text mt-1">
              Five Competitive Disciplines
            </h2>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {DISCIPLINES.map((item) => (
              <div
                key={item.name}
                className="p-5 rounded-xl border border-border bg-surface hover:border-border-strong transition-all space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text text-sm">{item.name}</h3>
                  <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full border border-border bg-surface-2 text-text-muted">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Architecture & Engineering */}
        <section className="space-y-6">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-primary font-semibold">
              &#123; Under the hood &#125;
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text mt-1">
              Platform Architecture & Sandboxing
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ARCH_STACK.map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl border border-border bg-surface space-y-2 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <h3 className="font-semibold text-text text-sm">{item.title}</h3>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Fair Play & Verification */}
        <section className="p-6 rounded-2xl border border-primary/20 bg-primary-subtle space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="size-5" />
            <h3 className="text-base font-bold text-text">Fair Play & Competitive Integrity</h3>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Ranked matchmaking on CodeComplex enforces strict anti-assistant rules: external LLM generation tools (ChatGPT, Claude, Copilot) are strictly prohibited during ranked clock runs. All submission telemetry, typing cadence, and compilation histories are audited, with violators subject to automatic rating resets and hardware/account bans.
          </p>
        </section>

        {/* Section 5: Internship & Credential Verification */}
        <section className="p-6 rounded-2xl border border-border bg-surface space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-primary">
            <Award className="size-5" />
            <h3 className="text-base font-bold text-text">Internship & Credential Verification</h3>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            CodeComplex offers competitive software engineering internships spanning full-stack development, distributed backend systems, and containerized sandbox infrastructure. Anyone—including hiring managers and background investigators—can publicly verify internship credentials in real-time without signing up via our <Link href="/verify-certificate" className="text-primary underline font-medium hover:underline">Certificate Verification Registry</Link>.
          </p>
        </section>

        {/* Section 6: Creator & Mission */}
        <section className="space-y-4 border-t border-border pt-10 text-xs text-text-muted leading-relaxed">
          <p>
            <strong className="text-text font-medium">CodeComplex</strong> is designed and maintained by <a href="https://github.com/sisodiaumang" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Umang Sisodia</a> as an open-ecosystem platform for developers, competitive programmers, and autonomous agents worldwide.
          </p>
          <p>
            Have feedback, bug reports, or feature requests? Reach out anytime at <a href="mailto:support@codecomplex.site" className="text-text hover:underline">support@codecomplex.site</a> or contribute directly to our <a href="https://github.com/sisodiaumang/CodeComplex" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub repository</a>.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 text-center text-xs text-text-muted">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} CodeComplex. Real-time competitive programming.</span>
          <Link href="/verify-certificate" className="hover:text-text transition-colors">Verify Certificate</Link>
          <span>Built by Umang Sisodia</span>
        </div>
      </footer>
    </div>
  );
}


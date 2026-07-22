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
  CheckCircle2,
  Zap,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ELO_TIERS } from "@/lib/theme";
import { useAuth } from "@/stores/auth-store";
import { Button, Card } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

// Each battle mode carries its own accent color pulled from the design system's
// battle-category palette, so the grid reads as six distinct arenas rather than
// six repeats of the same icon-in-a-box template.
const MODES_LIST = [
  {
    key: "DSA",
    label: "DSA & Algorithms",
    command: "run dsa_algorithms",
    color: "#3B82F6",
    icon: Code,
    tagline: "High-speed algorithmic duels. First to pass every testcase takes the Elo.",
  },
  {
    key: "BUG_FIX",
    label: "Bug Fix Arena",
    command: "run bug_fix",
    color: "#EF4444",
    icon: ShieldAlert,
    tagline: "A broken codebase with hidden edge cases. Spot the flaw, repair it, win.",
  },
  {
    key: "PROMPT_WAR",
    label: "Prompt War",
    command: "run prompt_war",
    color: "#A855F7",
    icon: Sparkles,
    tagline: "Craft precision prompts under pressure. The sharper instruction wins the judge.",
  },
  {
    key: "BACKEND",
    label: "Backend API",
    command: "run backend_api",
    color: "#2DB55D",
    icon: Server,
    tagline: "Design and ship a working REST endpoint before your opponent does.",
  },
  {
    key: "FRONTEND",
    label: "Pixel Perfect",
    command: "run frontend_ui",
    color: "#06B6D4",
    icon: Layout,
    tagline: "Recreate a UI mockup head-to-head, scored by automated layout diffing.",
  },
  {
    key: "PROJECTS",
    label: "Full-Stack",
    command: "run full_stack",
    color: "#F59E0B",
    icon: Cpu,
    tagline: "Database schema to frontend component. Full builds, evaluated live.",
  },
];

// Converts a design-token hex value into a translucent rgba() for tinted
// backgrounds, so mode colors stay theme-accurate in both light and dark mode.
function tint(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function LandingPage() {
  const { status } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{ users: number; battles: number; challenges: number } | null>(null);

  useEffect(() => {
    if (status === "authed") {
      router.replace("/battle");
      return;
    }

    api("/user/public/stats")
      .then((res: any) => {
        if (res && typeof res === "object") {
          setStats(res);
        }
      })
      .catch(() => {
        // Fallback silently
      });
  }, [status, router]);

  return (
    <div className="relative min-h-screen bg-bg text-text antialiased">
      {/* Faint code-grid backdrop, consistent with the terminal motif rather than a generic radial glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={26} />
            <span className="font-mono text-base font-bold tracking-tight text-text">
              code<span className="text-primary">complex</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="mx-1 h-5 w-px bg-border/50" />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-text-muted hover:text-text hover:bg-transparent">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-md px-4 font-semibold">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — framed as a single terminal window; the whole page speaks this language */}
      <section className="mx-auto max-w-4xl px-6 pt-14 sm:pt-20">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-surface/50 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border/50 bg-surface-2/60 px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500/60" />
              <span className="size-2.5 rounded-full bg-amber-500/60" />
              <span className="size-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <span className="ml-2 font-mono text-[11px] text-text-faint">arena@codecomplex — matchmaking</span>
          </div>

          <div className="space-y-7 px-6 py-14 text-center sm:px-10 sm:py-20">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-text-muted">
              <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
              <span>$ matchmaking --status=live</span>
            </div>

            <h1 className="mx-auto max-w-2xl font-mono text-4xl font-bold uppercase leading-[1.15] tracking-tight sm:text-5xl">
              Real-time code duels.
              <br />
              <span className="text-primary">Ranked. Sandboxed. Live.</span>
            </h1>

            <p className="mx-auto max-w-lg text-sm leading-relaxed text-text-muted sm:text-base">
              Duel other developers head-to-head. Solve algorithms, patch broken
              builds, ship APIs, and climb an Elo ladder that remembers every win.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Link href="/signup">
                <Button className="h-10 gap-2 rounded-md px-6 text-sm font-semibold shadow-lg shadow-primary/20">
                  Start building <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="outline" className="h-10 rounded-md border-border/60 bg-surface/40 px-6 text-sm font-medium">
                  View leaderboard
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3 font-mono text-xs text-text-muted">
              <span>
                <strong className="text-text">{stats?.users ?? 9}</strong> devs_joined
              </span>
              <span className="text-border">│</span>
              <span>
                <strong className="text-primary">
                  {stats?.challenges !== undefined ? stats.challenges.toLocaleString() : "4,027"}
                </strong>{" "}
                challenges_ready
              </span>
              <span className="text-border">│</span>
              <span>free_&amp;_open_source</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live battle HUD — the signature element: a true head-to-head split with a glowing VS core */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="overflow-hidden rounded-xl border border-border/50 bg-surface/40 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-surface-2/40 px-5 py-3 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 font-bold text-text">
                <span className="size-2 rounded-full bg-emerald-500 motion-safe:animate-ping" />
                LIVE BATTLE #8492
              </span>
              <span className="text-text-faint">·</span>
              <span className="text-text-muted">
                mode: <strong style={{ color: "#3B82F6" }}>dsa_speedrun</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded border border-border/50 bg-surface px-2 py-0.5 font-bold text-text-muted">
                08:42 remaining
              </span>
              <span className="rounded border border-primary/25 bg-primary/10 px-2 py-0.5 font-bold text-primary">
                ± 32 elo
              </span>
            </div>
          </div>

          <div className="border-b border-border/30 bg-bg/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-amber-500">
                Medium
              </span>
              <h3 className="text-sm font-bold text-text">Subarray Sum Equals K</h3>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
              Given an array <code className="font-mono text-[11px] text-primary">nums</code> and integer{" "}
              <code className="font-mono text-[11px] text-primary">k</code>, return how many subarrays sum to{" "}
              <code className="font-mono text-[11px] text-primary">k</code>.
            </p>
          </div>

          <div className="relative grid divide-y divide-border/20 bg-bg/30 md:grid-cols-[1fr_auto_1fr] md:divide-y-0">
            {/* YOU */}
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-text">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  You
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-400">4 / 4 passed</span>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-border/30 bg-surface/40 p-3 font-mono text-[11px] leading-relaxed text-text-muted">
                <span className="text-purple-400">int</span> subarraySum(vector&lt;int&gt;&amp; nums, int k) {"{"}
                {"\n"}  unordered_map&lt;int,int&gt; mp = {"{"}{"{"}0,1{"}"}{"}"};{"\n"}  int sum=0, count=0;
                {"\n"}  for (int n : nums) {"{"} sum += n;
                {"\n"}    if (mp.count(sum-k)) count += mp[sum-k];
                {"\n"}    mp[sum]++; {"}"}
                {"\n"}  return count;
                {"\n"}
                {"}"}
              </pre>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full w-full rounded-full bg-emerald-500" />
              </div>
            </div>

            {/* VS core */}
            <div className="flex items-center justify-center py-2 md:py-0 md:px-6">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-bg font-mono text-xs font-bold text-primary"
                style={{ boxShadow: "0 0 26px -4px currentColor" }}
              >
                VS
              </span>
            </div>

            {/* RIVAL */}
            <div className="space-y-3 p-5 opacity-90">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-text-muted">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Rival_Dev99
                </span>
                <span className="font-mono text-[11px] font-bold text-text-faint">2 / 4 passed</span>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-border/30 bg-surface/30 p-3 font-mono text-[11px] leading-relaxed text-text-faint">
                <span className="text-purple-400/70">int</span> subarraySum(vector&lt;int&gt;&amp; nums, int k) {"{"}
                {"\n"}  int sum=0, count=0;
                {"\n"}  for (int i=0;i&lt;nums.size();i++) {"{"}
                {"\n"}    for (int j=i;j&lt;nums.size();j++) {"{"} ...
                {"\n"}    {"}"}
                {"\n"}  {"}"}
                {"\n"}  // still brute-forcing…
                {"\n"}
                {"}"}
              </pre>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full w-1/2 rounded-full bg-amber-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/30 bg-emerald-500/5 px-5 py-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400">
              <CheckCircle2 className="size-4" />
              your_submission: all testcases passed
            </div>
            <span className="font-mono text-[10px] text-text-muted">
              runtime <strong className="text-text">14ms</strong> · memory <strong className="text-text">16.2mb</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Battle modes — "select your class"; each card is tinted by its own category color */}
      <section className="border-y border-border/30 bg-surface-2/20 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10">
            <p className="font-mono text-xs text-primary">// battle_modes</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Select your class</h2>
            <p className="mt-1.5 text-sm text-text-muted">
              Six arenas, six independent Elo ratings. Pick where you fight.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODES_LIST.map((mode) => {
              const IconComp = mode.icon;
              return (
                <div
                  key={mode.key}
                  className="group rounded-xl border border-border/40 bg-surface/40 p-5 transition-colors"
                  style={{ borderLeftColor: mode.color, borderLeftWidth: 3 }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className="flex size-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: tint(mode.color, 0.12), color: mode.color }}
                    >
                      <IconComp className="size-4" />
                    </div>
                    <span className="font-mono text-[10px] text-text-faint">{mode.command}</span>
                  </div>
                  <h3 className="text-sm font-bold text-text">{mode.label}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{mode.tagline}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-10">
          <p className="font-mono text-xs text-primary">// engine</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Built for a fair fight</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "WebSocket matchmaking",
              text: "Zero-polling sync keeps timers, opponent progress, and live runs locked together in real time.",
            },
            {
              icon: ShieldCheck,
              title: "Docker sandboxes",
              text: "Every submission compiles inside an isolated container with strict CPU and memory limits.",
            },
            {
              icon: Trophy,
              title: "Fair Elo progression",
              text: "Rating adjustments weigh opponent rank and solve time, scaling from Bronze to Grandmaster.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title} className="space-y-3 rounded-xl border-border/40 bg-surface/30 p-6">
              <div className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-text">{title}</h3>
              <p className="text-xs leading-relaxed text-text-muted">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works — a real sequence, so numbering earns its place */}
      <section className="mx-auto max-w-5xl border-t border-border/30 px-6 py-20">
        <div className="mb-10">
          <p className="font-mono text-xs text-primary">// how_it_works</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Lobby to duel in under a minute</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { step: "step_01", title: "Open a room", text: "Create a match room, pick the mode, share the lobby code." },
            { step: "step_02", title: "Rally rivals", text: "Invite friends, or queue against online competitors near your rank." },
            { step: "step_03", title: "Duel & climb", text: "Write code, run testcases live, and move up the leaderboard." },
          ].map(({ step, title, text }) => (
            <Card key={step} className="space-y-2 rounded-xl border-border/30 bg-surface/20 p-5">
              <span className="font-mono text-xs font-bold text-primary">{step}</span>
              <h3 className="text-sm font-bold text-text">{title}</h3>
              <p className="text-xs leading-relaxed text-text-muted">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Ranked ladder — a real leaderboard list rather than floating pills */}
      <section className="border-t border-border/30 bg-surface-2/20 py-20">
        <div className="mx-auto max-w-2xl px-6">
          <div className="mb-8 text-center">
            <p className="font-mono text-xs text-primary">// ranked_ladder</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Climb the tiers</h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/40 bg-surface/40">
            {ELO_TIERS.map((tier, i) => (
              <div
                key={tier.label}
                className={cn(
                  "flex items-center justify-between px-5 py-3",
                  i !== ELO_TIERS.length - 1 && "border-b border-border/25"
                )}
                style={{ borderLeft: `3px solid ${tier.color}` }}
              >
                <span className="text-sm font-bold" style={{ color: tier.color }}>
                  {tier.label}
                </span>
                <span className="font-mono text-xs text-text-faint">{tier.minRating}+ rating</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO copy + FAQ */}
      <section className="border-t border-border/30 bg-bg py-20">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-[1fr_1.25fr]">
          <div className="space-y-6">
            <div>
              <p className="font-mono text-xs text-primary">// about</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">Competitive coding, simplified</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                CodeComplex is a real-time, peer-to-peer arena for competitive developers.
                Practice data structures, ship backend APIs, or build full layouts in live 1v1 duels.
              </p>
            </div>

            <div className="space-y-4 text-sm text-text-muted">
              <div>
                <strong className="mb-1 block text-text">Who is it for?</strong>
                <p className="leading-relaxed">
                  Engineers prepping for technical interviews, students learning CS fundamentals, and
                  competitive programmers sharpening their speed under pressure.
                </p>
              </div>
              <div>
                <strong className="mb-1 block text-text">Why not just LeetCode?</strong>
                <p className="leading-relaxed">
                  Static platforms don't have a clock or an opponent. Synchronized timers and live
                  sandboxed runs recreate the pressure of an actual technical screen.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-xs text-primary">// faq</p>
            {[
              {
                q: "How does 1v1 matchmaking work?",
                a: "Join the queue and the matchmaking engine pairs you with a competitor near your rating. Once matched, a lobby opens with a shared room code.",
              },
              {
                q: "What challenge types are supported?",
                a: "DSA algorithm puzzles, frontend layout builds, backend API integrations, and prompt-engineering duels.",
              },
              {
                q: "Are the compile runners safe?",
                a: "Every submission runs inside an isolated Docker sandbox with strict resource limits — no host access.",
              },
              {
                q: "Can I duel a friend directly?",
                a: "Yes — create a private room, pick the mode, and share the lobby code with anyone.",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-lg border border-border/30 bg-surface/20 p-4">
                <h3 className="text-sm font-bold text-text">{faq.q}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-border/30 bg-bg py-20 text-center">
        <h2 className="text-xl font-semibold tracking-tight">Ready to enter the arena?</h2>
        <div className="pt-5">
          <Link href="/signup">
            <Button className="h-10 rounded-md px-6 text-sm font-semibold">Create account</Button>
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-text-faint">
          {[
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
            { href: "/faq", label: "FAQ" },
            { href: "/terms", label: "Terms of Service" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/guidelines", label: "Community Guidelines" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-text hover:underline">
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/sisodiaumang/CodeComplex"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-text hover:underline"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-text hover:underline"
          >
            LinkedIn
          </a>
        </div>
        <p className="mt-6 font-mono text-[10px] text-text-faint">// codecomplex — competitive engineering platform</p>
      </footer>
    </div>
  );
}

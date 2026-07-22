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
  Flame,
  Terminal,
  Activity,
  Layers,
  ChevronRight
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ELO_TIERS } from "@/lib/theme";
import { useAuth } from "@/stores/auth-store";
import { Button, Card } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const MODES_LIST = [
  { key: "DSA", label: "DSA & Algorithms", badge: "Algorithms", icon: Code, tagline: "High-speed algorithmic duels. First to pass all testcases claims the Elo victory." },
  { key: "BUG_FIX", label: "Bug Fix Arena", badge: "Debugging", icon: ShieldAlert, tagline: "Broken codebases with hidden edge-case bugs. Spot the flaw, repair it, win." },
  { key: "PROMPT_WAR", label: "Prompt War", badge: "AI / LLM", icon: Sparkles, tagline: "Craft precision prompts under pressure. The sharper instruction wins the judge." },
  { key: "BACKEND", label: "Backend API", badge: "Architecture", icon: Server, tagline: "Design and deploy functioning REST endpoints against live validation runners." },
  { key: "FRONTEND", label: "Pixel Perfect", badge: "UI / CSS", icon: Layout, tagline: "Recreate complex UI mockups head-to-head with automated layout scoring." },
  { key: "PROJECTS", label: "Full-Stack", badge: "End-to-End", icon: Cpu, tagline: "Database schemas to frontend components. Full project builds evaluated live." }
];

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
    <div className="relative min-h-screen bg-bg text-text overflow-hidden antialiased">
      {/* Quiet Developer Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />
      
      {/* Ultra-subtle background radial glow */}
      <div className="absolute left-1/2 top-1/4 -z-10 size-[600px] -translate-x-1/2 rounded-full bg-primary/10 opacity-40 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="border-b border-border/20 backdrop-blur-md sticky top-0 z-50 bg-bg/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <LogoMark size={28} />
            <span className="text-lg font-bold tracking-tight text-text">
              Code<span className="text-primary font-medium">Complex</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="border-r border-border/30 pr-1 py-1 text-text">
              <ThemeToggle />
            </div>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-text-muted hover:text-text hover:bg-transparent transition-colors text-xs">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="h-8 rounded px-4 text-xs font-semibold">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-12 text-center space-y-6">
        {/* Real-time status tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-surface/60 px-3.5 py-1 text-[11px] font-medium text-text-muted tracking-wide">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-Time Code Matchmaking</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-3xl mx-auto leading-[1.1] text-text">
          Real-Time Code Duels.<br />
          <span className="bg-gradient-to-r from-primary via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Built for Competitive Engineers.
          </span>
        </h1>

        {/* Description */}
        <p className="max-w-xl mx-auto text-sm text-text-muted leading-relaxed">
          Duel other developers in head-to-head programming matches. Solve algorithmic challenges, build sandbox APIs, assemble frontend layouts, and climb the competitive Elo ladder.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/signup">
            <Button className="h-10 px-6 text-xs font-semibold gap-2 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              Start building <ArrowRight className="size-3.5" />
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" className="h-10 px-6 text-xs font-medium bg-surface/30 border-border/60 hover:bg-surface/60 rounded-lg">
              View Leaderboard
            </Button>
          </Link>
        </div>

        {/* Single Stat Highlight - Coding Challenges Only */}
        <div className="pt-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-border/40 bg-surface-2/40 px-4 py-1.5 text-xs backdrop-blur-md">
            <Flame className="size-4 text-amber-500 shrink-0" />
            <span className="text-text-muted">
              <strong className="text-text font-bold font-mono">
                {stats?.challenges !== undefined ? stats.challenges.toLocaleString() : "4,027"}
              </strong>{" "}
              Coding Challenges Ready to Battle
            </span>
          </div>
        </div>

        <p className="text-[10px] text-text-faint font-mono pt-1">
          100% Free & Open Source • Secure Sandboxed Run
        </p>
      </section>

      {/* Live Battle Arena HUD Showcase */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-xl border border-border/50 bg-surface/40 p-2 shadow-2xl backdrop-blur-md">
          {/* Top Bar HUD */}
          <div className="flex flex-wrap items-center justify-between border-b border-border/30 bg-surface-2/40 px-4 py-3 rounded-t-lg gap-2 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 font-bold text-text">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                LIVE BATTLE #8492
              </span>
              <span className="text-text-faint">•</span>
              <span className="text-text-muted">Mode: <strong className="text-primary">DSA Speedrun</strong></span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-surface border border-border/40 text-text-muted font-bold">
                ⏱ 08:42 REMAINING
              </span>
              <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold">
                ELO ± 32 Pts
              </span>
            </div>
          </div>

          {/* Match Split Screen */}
          <div className="grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border/20 bg-bg/40">
            {/* Left: Problem & Matchup */}
            <div className="md:col-span-5 p-5 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
                    Medium
                  </span>
                  <span className="text-xs text-text-faint font-mono">ID: #4092</span>
                </div>
                <h3 className="text-sm font-bold text-text">Subarray Sum Equals K</h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Given an array of integers <code className="text-primary font-mono text-[11px]">nums</code> and an integer <code className="text-primary font-mono text-[11px]">k</code>, return the total number of subarrays whose sum equals to <code className="text-primary font-mono text-[11px]">k</code>.
              </p>

              <div className="pt-2 border-t border-border/20 space-y-2">
                <span className="text-[10px] uppercase font-bold text-text-faint tracking-wider block">Live Competitors</span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded border border-border/30 bg-surface/30">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-text">You (Team A)</span>
                    </div>
                    <span className="font-mono text-primary font-bold">4/4 Passed</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border border-border/30 bg-surface/20 opacity-80">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span className="text-text-muted">Rival_Dev99 (Team B)</span>
                    </div>
                    <span className="font-mono text-text-faint">2/4 Passed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Code & Exec Engine */}
            <div className="md:col-span-7 p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2 font-mono text-xs leading-relaxed text-text-muted">
                <div className="flex items-center justify-between text-[10px] text-text-faint pb-1 border-b border-border/10">
                  <span>solution.cpp</span>
                  <span className="text-emerald-400 font-bold">Docker Sandbox ACTIVE</span>
                </div>
                <pre className="overflow-x-auto text-[11px]">
                  <div><span className="text-purple-400">#include</span> <span className="text-emerald-300">&lt;unordered_map&gt;</span></div>
                  <div><span className="text-purple-400">using namespace</span> std;</div>
                  <br />
                  <div><span className="text-blue-400">int</span> <span className="text-amber-300">subarraySum</span>(vector&lt;<span className="text-blue-400">int</span>&gt;&amp; nums, <span className="text-blue-400">int</span> k) &#123;</div>
                  <div>    unordered_map&lt;<span className="text-blue-400">int</span>, <span className="text-blue-400">int</span>&gt; mp = &#123;&#123;<span className="text-orange-400">0</span>, <span className="text-orange-400">1</span>&#125;&#125;;</div>
                  <div>    <span className="text-blue-400">int</span> sum = <span className="text-orange-400">0</span>, count = <span className="text-orange-400">0</span>;</div>
                  <div>    <span className="text-purple-400">for</span> (<span className="text-blue-400">int</span> n : nums) &#123;</div>
                  <div>        sum += n;</div>
                  <div>        <span className="text-purple-400">if</span> (mp.count(sum - k)) count += mp[sum - k];</div>
                  <div>        mp[sum]++;</div>
                  <div>    &#125;</div>
                  <div>    <span className="text-purple-400">return</span> count;</div>
                  <div>&#125;</div>
                </pre>
              </div>

              {/* Engine Result Bar */}
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <span>ALL TESTCASES PASSED (4/4)</span>
                </div>
                <span className="font-mono text-[10px] text-text-muted">
                  Runtime: <strong className="text-text">14ms</strong> | Memory: <strong className="text-text">16.2MB</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Battle Modes Overview */}
      <section className="border-y border-border/20 bg-surface-2/10 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-1 mb-12">
            <h2 className="text-xl font-bold tracking-tight">Diverse Battle Categories</h2>
            <p className="text-xs text-text-muted">
              Choose your competitive domain. Each mode tracks an independent Elo rating tier.
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODES_LIST.map((mode) => {
              const IconComp = mode.icon;
              return (
                <div
                  key={mode.key}
                  className="rounded-xl border border-border/30 bg-surface/30 p-5 transition-all duration-300 hover:border-primary/50 hover:bg-surface/50 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-9 rounded-lg bg-surface-2 flex items-center justify-center border border-border/40 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <IconComp className="size-4" />
                    </div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-surface border border-border/30 text-text-faint">
                      {mode.badge}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                    {mode.label}
                  </h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
                    {mode.tagline}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dynamic Bento Feature Highlights */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Engineered for Competitive Edge
          </h2>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Everything you need for zero-latency duels, secure executions, and fair Elo progression.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 space-y-3 bg-surface/20 border-border/30 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Zap className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-text">WebSocket Matchmaking</h3>
            <p className="text-xs leading-relaxed text-text-muted">
              Zero-polling event synchronization keeps timers, opponent progress, and live code executions locked in real time.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-surface/20 border-border/30 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-text">Docker Runtime Sandboxes</h3>
            <p className="text-xs leading-relaxed text-text-muted">
              Every submission compiles inside isolated containers with strict CPU/memory limits, ensuring 100% execution safety.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-surface/20 border-border/30 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Trophy className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-text">Fair Elo Tier Progression</h3>
            <p className="text-xs leading-relaxed text-text-muted">
              Custom mathematical rating adjustments award points based on opponent rank and solve time, scaling from Bronze to Legend.
            </p>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-16 border-t border-border/20">
        <div className="space-y-1 mb-12">
          <h2 className="text-xl font-bold tracking-tight">How it works</h2>
          <p className="text-xs text-text-muted">
            Go from lobby to duel in under a minute.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { num: "01", title: "Open a Room", text: "Create a match room, select the mode, and share the lobby code." },
            { num: "02", title: "Rally Rivals", text: "Invite friends or queue against active online competitors of similar ranks." },
            { num: "03", title: "Duel & Climb", text: "Write code, run automatic testcases, and climb the leaderboards." },
          ].map(({ num, title, text }) => (
            <Card key={num} className="p-5 space-y-2 bg-surface/20 border-border/20 rounded-xl">
              <span className="font-mono text-xs text-primary font-bold">{num}</span>
              <h3 className="text-xs font-bold text-text">{title}</h3>
              <p className="text-[11px] leading-relaxed text-text-muted">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Tier ladder */}
      <section className="border-t border-border/20 bg-surface-2/10 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-1 mb-12 text-center">
            <h2 className="text-xl font-bold tracking-tight">The Competitive Ladder</h2>
            <p className="text-xs text-text-muted">
              Climb the Elo rating ladder to unlock prestigious ranking tiers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto">
            {ELO_TIERS.map((tier) => (
              <div
                key={tier.label}
                className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-surface/40 px-3.5 py-2 shadow-sm"
              >
                <span className="text-xs font-bold" style={{ color: tier.color }}>
                  {tier.label}
                </span>
                <span className="font-mono text-[10px] text-text-faint">
                  {tier.minRating}+ Rating
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed SEO Overview & FAQ */}
      <section className="border-t border-border/20 py-20 bg-bg">
        <div className="mx-auto max-w-5xl px-6 grid gap-12 md:grid-cols-[1fr_1.25fr]">
          {/* SEO Copywriting Text */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Competitive Coding Simplified</h2>
              <p className="text-xs text-text-muted leading-relaxed">
                CodeComplex is the ultimate real-time peer-to-peer arena designed for competitive developers and software engineers. Practice data structures, solve algorithms, compile backend APIs, or build custom layout structures in live 1v1 duels.
              </p>
            </div>
            
            <div className="space-y-4 text-xs text-text-muted">
              <div>
                <strong className="text-text block mb-1">Who is CodeComplex for?</strong>
                <p className="leading-relaxed">
                  Engineers preparing for top tech interviews, students mastering computer science concepts, and algorithmic competitive programmers who want to sharpen their problem-solving speed under pressure.
                </p>
              </div>

              <div>
                <strong className="text-text block mb-1">Why use CodeComplex?</strong>
                <p className="leading-relaxed">
                  Unlike traditional static coding platforms, CodeComplex brings the thrill of head-to-head gamified matching. Socket-driven synchronized timers and live compiler checks simulate the high-intensity environments of technical screens.
                </p>
              </div>
            </div>
          </div>

          {/* Mini FAQ Accordion */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight mb-2">Frequently Asked Questions</h2>
            {[
              {
                q: "How does 1v1 matchmaking work?",
                a: "When you join the queue, our matchmaking engine pairs you with a competitor of similar rating points. Once matched, you enter the lobby where the room code is initialized."
              },
              {
                q: "What coding challenges are supported?",
                a: "We support multiple categories: Algorithmic puzzles (DSA), Frontend layout assembly (CSS/HTML), Backend API integrations (Node.js), and Prompt Engineering (Prompt War)."
              },
              {
                q: "Are the compilation runners safe?",
                a: "Yes. Every solution compiled runs inside isolated sandboxed runtimes (powered by Docker), preventing sandbox escapes and keeping execution resources safe."
              },
              {
                q: "Can I invite a friend to a duel?",
                a: "Yes! You can create a custom room, select the mode, and share the lobby code directly with any other user to duel in private matches."
              }
            ].map((faq, index) => (
              <div key={index} className="rounded-lg border border-border/20 bg-surface/10 p-4 space-y-2">
                <h3 className="text-xs font-bold text-text">{faq.q}</h3>
                <p className="text-[11px] leading-relaxed text-text-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-border/20 bg-bg py-20 text-center space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Ready to enter the arena?
        </h2>
        <div className="pt-2">
          <Link href="/signup">
            <Button className="h-9 px-6 text-xs font-medium rounded">
              Create account
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center flex-wrap gap-4 text-[10px] text-text-faint pt-4">
          <Link href="/about" className="hover:text-text hover:underline transition-colors">
            About
          </Link>
          <span>•</span>
          <Link href="/contact" className="hover:text-text hover:underline transition-colors">
            Contact
          </Link>
          <span>•</span>
          <Link href="/faq" className="hover:text-text hover:underline transition-colors">
            FAQ
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-text hover:underline transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-text hover:underline transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/guidelines" className="hover:text-text hover:underline transition-colors">
            Community Guidelines
          </Link>
          <span>•</span>
          <a href="https://github.com/sisodiaumang/CodeComplex" target="_blank" rel="noopener noreferrer" className="hover:text-text hover:underline transition-colors">
            GitHub
          </a>
          <span>•</span>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-text hover:underline transition-colors">
            LinkedIn
          </a>
        </div>
        <p className="font-mono text-[9px] text-text-faint pt-4">
          CodeComplex — competitive engineering platform
        </p>
      </footer>
    </div>
  );
}

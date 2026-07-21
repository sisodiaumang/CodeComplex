"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  ArrowRight, 
  Code, 
  Cpu, 
  Layout, 
  Server, 
  ShieldAlert, 
  Sparkles, 
  Play,
  CheckCircle2
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ELO_TIERS } from "@/lib/theme";
import { useAuth } from "@/stores/auth-store";
import { Button, Card } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const MODES_LIST = [
  { key: "DSA", label: "DSA", icon: Code, tagline: "Algorithms under the clock. First correct submission takes the round." },
  { key: "BUG_FIX", label: "Bug Fix", icon: ShieldAlert, tagline: "A broken codebase, a ticking timer. Find it, fix it, win." },
  { key: "PROMPT_WAR", label: "Prompt War", icon: Sparkles, tagline: "Duel with prompts. The sharper instruction wins the judge." },
  { key: "BACKEND", label: "Backend", icon: Server, tagline: "Design and ship a working API before your opponent does." },
  { key: "FRONTEND", label: "Frontend", icon: Layout, tagline: "Pixel-perfect builds, scored head-to-head." },
  { key: "PROJECTS", label: "Projects", icon: Cpu, tagline: "End to end. Database to UI. No hiding places." }
];

export default function LandingPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authed") router.replace("/battle");
  }, [status, router]);

  return (
    <div className="relative min-h-screen bg-bg text-text overflow-hidden antialiased">
      {/* Quiet Developer Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />
      
      {/* Ultra-subtle background radial glow */}
      <div className="absolute left-1/2 top-1/4 -z-10 size-[500px] -translate-x-1/2 rounded-full bg-primary/5 opacity-30 blur-3xl pointer-events-none" />

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
      <section className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-center space-y-6">
        {/* Subtle status tag */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/50 px-3 py-1 text-[10px] font-medium text-text-muted tracking-wide uppercase">
          <span className="size-1.5 rounded-full bg-primary" />
          Real-time coding battles
        </div>

        {/* Title */}
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl max-w-2xl mx-auto leading-[1.1] text-text">
          Competitive coding,<br />
          <span className="text-primary">simplified.</span>
        </h1>

        {/* Description */}
        <p className="max-w-lg mx-auto text-sm text-text-muted leading-relaxed">
          Duel other engineers in real-time programming matches. Solve algorithms, build APIs, debug code, and climb the competitive ladder.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/signup">
            <Button className="h-9 px-5 text-xs font-medium gap-1.5 rounded">
              Start building <ArrowRight className="size-3.5" />
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" className="h-9 px-5 text-xs font-medium bg-transparent border-border/60 hover:bg-surface/50 rounded">
              Leaderboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Mock IDE Code Editor Showcase (Clean & Quiet) */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="border border-border/40 bg-surface/40 rounded-lg shadow-sm max-w-4xl mx-auto overflow-hidden">
          {/* Editor Header */}
          <div className="flex items-center justify-between border-b border-border/20 bg-surface-2/30 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-border" />
              <span className="size-2 rounded-full bg-border" />
              <span className="size-2 rounded-full bg-border" />
              <span className="ml-3 font-mono text-[10px] text-text-faint">arena_solution.cpp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-faint">1v1 matchmaking</span>
            </div>
          </div>
          
          {/* Editor Grid */}
          <div className="grid md:grid-cols-[1.25fr_0.75fr] divide-y md:divide-y-0 md:divide-x divide-border/20">
            {/* Code Panel */}
            <div className="p-5 overflow-x-auto bg-bg/25">
              <pre className="text-xs font-mono leading-relaxed text-text-muted/90">
                <div><span className="text-text-faint">// CodeComplex Battle Solution</span></div>
                <div><span className="text-text-muted/60">#include</span> <span className="text-text-muted">&lt;iostream&gt;</span></div>
                <div><span className="text-text-muted/60">using namespace</span> <span className="text-text-muted">std</span>;</div>
                <br />
                <div><span className="text-text-muted">int</span> <span className="text-text">binarySearch</span>(<span className="text-text-muted">int</span> arr[], <span className="text-text-muted">int</span> l, <span className="text-text-muted">int</span> r, <span className="text-text-muted">int</span> x) &#123;</div>
                <div>    <span className="text-text-muted/60">while</span> (l &lt;= r) &#123;</div>
                <div>        <span className="text-text-muted">int</span> m = l + (r - l) / <span className="text-primary">2</span>;</div>
                <div>        <span className="text-text-muted/60">if</span> (arr[m] == x) <span className="text-text-muted/60">return</span> m;</div>
                <div>        <span className="text-text-muted/60">if</span> (arr[m] &lt; x) l = m + <span className="text-primary">1</span>;</div>
                <div>        <span className="text-text-muted/60">else</span> r = m - <span className="text-primary">1</span>;</div>
                <div>    &#125;</div>
                <div>    <span className="text-text-muted/60">return</span> -<span className="text-primary">1</span>;</div>
                <div>&#125;</div>
              </pre>
            </div>

            {/* Test Run & Status Panel */}
            <div className="p-5 flex flex-col justify-between bg-surface-2/10">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-text-faint uppercase tracking-wider block">Testcases</span>
                <div className="space-y-2">
                  {[
                    { test: "Testcase 1", status: "Passed", time: "12ms" },
                    { test: "Testcase 2", status: "Passed", time: "8ms" },
                    { test: "Testcase 3", status: "Passed", time: "15ms" },
                    { test: "Testcase 4", status: "Failed", time: "—" },
                  ].map((tc, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded border border-border/20 bg-surface/20">
                      <div className="flex items-center gap-2">
                        {tc.status === "Passed" ? (
                          <CheckCircle2 className="size-3.5 text-win/80" />
                        ) : (
                          <span className="size-3.5 rounded-full border border-red-500/50 flex items-center justify-center text-[8px] text-red-500/80">X</span>
                        )}
                        <span className="text-text-muted">{tc.test}</span>
                      </div>
                      <span className={cn("font-mono font-medium", tc.status === "Passed" ? "text-win/80" : "text-red-500/80")}>
                        {tc.status === "Passed" ? tc.time : "Failed"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between gap-3">
                <div className="text-[10px] text-text-faint font-semibold uppercase tracking-wider">
                  Status: <span className="text-primary">Coding</span>
                </div>
                <Button size="sm" className="h-7 text-[10px] px-3 bg-primary/95 hover:bg-primary rounded">
                  Run tests
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modes Overview */}
      <section className="border-y border-border/20 bg-surface-2/10 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-1 mb-12">
            <h2 className="text-xl font-bold tracking-tight">Battle Modes</h2>
            <p className="text-xs text-text-muted">
              Choose your category. Each mode maintains an independent Elo rating.
            </p>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODES_LIST.map((mode) => {
              const IconComp = mode.icon;
              return (
                <div
                  key={mode.key}
                  className="rounded-lg border border-border/30 bg-surface/30 p-5 transition-all duration-200 hover:border-border"
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="size-4 text-text-muted" />
                    <h3 className="text-xs font-bold text-text">
                      {mode.label}
                    </h3>
                  </div>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-text-muted">
                    {mode.tagline}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="space-y-1 mb-12">
          <h2 className="text-xl font-bold tracking-tight">How it works</h2>
          <p className="text-xs text-text-muted">
            Go from lobby to battle in under a minute.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { num: "01", title: "Open a Room", text: "Create a match room, select the mode, and share the lobby code." },
            { num: "02", title: "Rally Rivals", text: "Invite friends or queue against matching ranks (Team A vs Team B)." },
            { num: "03", title: "Duel & Climb", text: "Write code, run automatic testcases, and climb the leaderboards." },
          ].map(({ num, title, text }) => (
            <Card key={num} className="p-5 space-y-2 bg-surface/20 border-border/20 rounded-md">
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
          <div className="space-y-1 mb-12">
            <h2 className="text-xl font-bold tracking-tight">The Ladder</h2>
            <p className="text-xs text-text-muted">
              Climb the Elo ladder to unlock ranking tiers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
            {ELO_TIERS.map((tier) => (
              <div
                key={tier.label}
                className="flex items-center gap-2 rounded border border-border/40 bg-surface/30 px-3 py-1.5"
              >
                <span className="text-[11px] font-bold" style={{ color: tier.color }}>
                  {tier.label}
                </span>
                <span className="font-mono text-[10px] text-text-faint">
                  {tier.minRating}+
                </span>
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
        <div className="flex items-center justify-center gap-4 text-[10px] text-text-faint pt-4">
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
        </div>
        <p className="font-mono text-[9px] text-text-faint pt-4">
          CodeComplex — competitive engineering platform
        </p>
      </footer>
    </div>
  );
}

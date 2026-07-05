"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Swords, ArrowRight, Radio } from "lucide-react";
import { MODE_COLORS, ELO_TIERS, type BattleType } from "@/lib/theme";
import { useAuth } from "@/stores/auth-store";
import { Button } from "@/components/ui";

const MODES = Object.entries(MODE_COLORS) as [
  BattleType,
  (typeof MODE_COLORS)[BattleType],
][];

const MODE_TAGLINES: Record<BattleType, string> = {
  DSA: "Algorithms under the clock. First correct submission takes the round.",
  BUG_FIX: "A broken codebase, a ticking timer. Find it, fix it, win.",
  PROMPT_WAR: "Duel with prompts. The sharper instruction wins the judge.",
  BACKEND: "Design and ship a working API before your opponent does.",
  FRONTEND: "Pixel-perfect builds, scored head-to-head.",
  FULLSTACK: "End to end. Database to UI. No hiding places.",
};

export default function LandingPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authed") router.replace("/dashboard");
  }, [status, router]);

  return (
    <div className="min-h-screen bg-white text-text">
      {/* Top bar */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-fg">
            <Swords className="size-3.5" />
          </span>
          <span className="text-sm font-bold tracking-tight">
            dev<span className="text-primary">Arena</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-6 pb-16 pt-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-[11px] text-text-muted">
            <Radio className="size-2.5 text-primary" />
            real-time · ranked · 1v1 and teams
          </p>
          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Code is your weapon.
            <br />
            <span className="text-primary">This is the arena.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-text-muted">
            Challenge developers to live engineering duels — algorithms,
            bug hunts, APIs, UIs and prompt battles. Climb the Elo ladder from
            Bronze to Grandmaster.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Link href="/signup">
              <Button>
                Enter the arena
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline">View leaderboard</Button>
            </Link>
          </div>
        </div>

        {/* Room card mock */}
        <div className="relative">
          <div className="rounded-lg border border-border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="font-mono text-[11px] text-text-faint">
                battle room
              </span>
              <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-xs font-bold tracking-[0.2em] text-primary">
                XK4-92F
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5">
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-text-faint">
                  Team A
                </p>
                {["nova_dev", "kernelpanic"].map((n) => (
                  <p key={n} className="font-mono text-xs text-text">{n}</p>
                ))}
              </div>
              <span className="text-lg font-bold text-text-faint">vs</span>
              <div className="space-y-1.5 text-right">
                <p className="text-[10px] uppercase tracking-wider text-text-faint">
                  Team B
                </p>
                {["asyncqueen", "null_ptr"].map((n) => (
                  <p key={n} className="font-mono text-xs text-text">{n}</p>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                style={{
                  color: MODE_COLORS.DSA.accent,
                  backgroundColor: MODE_COLORS.DSA.subtle,
                }}
              >
                DSA · Medium
              </span>
              <span className="font-mono text-[11px] text-win">● waiting</span>
            </div>
          </div>
          <div
            aria-hidden
            className="absolute -inset-x-8 -bottom-8 -z-10 h-32 rounded-full bg-primary/10 blur-3xl"
          />
        </div>
      </section>

      {/* Modes */}
      <section className="border-t border-border bg-bg">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-lg font-bold tracking-tight">Six ways to fight</h2>
          <p className="mt-1 text-xs text-text-muted">
            Every mode has its own Elo rating. Master one, or master them all.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map(([key, mode]) => (
              <div
                key={key}
                className="relative overflow-hidden rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-0.5"
                  style={{ backgroundColor: mode.accent }}
                />
                <h3
                  className="text-xs font-semibold"
                  style={{ color: mode.accent }}
                >
                  {mode.label}
                </h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted">
                  {MODE_TAGLINES[key]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-lg font-bold tracking-tight">From lobby to leaderboard</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { step: "create", title: "Open a room", text: "Pick a battle mode and get a shareable room code." },
            { step: "share", title: "Rally your rivals", text: "Friends join with the code and split into Team A and Team B." },
            { step: "battle", title: "Ship to win", text: "Solve live. Submissions are auto-judged and ratings update instantly." },
          ].map(({ step, title, text }) => (
            <div key={step} className="rounded-lg border border-border bg-surface p-4">
              <p className="font-mono text-[11px] text-primary">$ {step}</p>
              <h3 className="mt-1.5 text-sm font-semibold text-text">{title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tier ladder */}
      <section className="border-t border-border bg-bg">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-lg font-bold tracking-tight">The ladder</h2>
          <p className="mt-1 text-xs text-text-muted">
            Everyone starts at 1200. Where you go from there is up to you.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {ELO_TIERS.map((tier) => (
              <div
                key={tier.label}
                className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5"
              >
                <span className="text-xs font-semibold" style={{ color: tier.color }}>
                  {tier.label}
                </span>
                <span className="font-mono text-[11px] text-text-faint">
                  {tier.minRating}+
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-14 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Ready to queue up?
        </h2>
        <Link href="/signup">
          <Button>
            Create your account
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
        <p className="font-mono text-[11px] text-text-faint">
          devArena — competitive engineering platform
        </p>
      </footer>
    </div>
  );
}

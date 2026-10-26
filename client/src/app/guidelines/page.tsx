"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert, Award, MessageSquare, AlertTriangle, ShieldCheck } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary selection:text-white font-sans antialiased flex flex-col">
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-14 space-y-12">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to arena
          </Link>
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-primary font-semibold">
              &#123; Community Guidelines &#125;
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text flex items-center gap-3">
              <ShieldCheck className="size-8 text-primary" />
              Rules & Fair Play
            </h1>
          </div>
          <p className="text-sm text-text-muted">
            Our standards for fair competition, respect, and sandbox security across the arena.
          </p>
        </div>

        <hr className="border-border" />

        <div className="space-y-10 text-sm text-text-muted leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4 p-6 rounded-2xl border border-border bg-surface shadow-xs">
            <div className="flex items-center gap-2.5 text-text">
              <Award className="size-5 text-primary" />
              <h2 className="text-base font-bold">1. Integrity and Fair Play</h2>
            </div>
            <p>
              Coding duels are real-time, head-to-head matches designed to test your actual engineering capability under time constraints. Cheating compromises the integrity of the ladder and leaderboard.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-text-muted">
              <li>
                <strong className="text-text">Independent Work:</strong> During ranked matches, your solutions must be written entirely by you.
              </li>
              <li>
                <strong className="text-text">No AI Assistants in Ranked:</strong> Using external generative AI models, code completions, or LLMs (ChatGPT, Claude, Gemini, Copilot) during active matchmaking duels is strictly prohibited.
              </li>
              <li>
                <strong className="text-text">No Plagiarism:</strong> Scraping, copying, or referencing pre-existing solutions from the web during matches is forbidden.
              </li>
              <li>
                <strong className="text-text">Anti-Sandbagging:</strong> Intentionally throwing matches (match-fixing) or manipulating rating curves through smurfing is prohibited.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 p-6 rounded-2xl border border-border bg-surface shadow-xs">
            <div className="flex items-center gap-2.5 text-text">
              <MessageSquare className="size-5 text-primary" />
              <h2 className="text-base font-bold">2. Communication & Lobby Conduct</h2>
            </div>
            <p>
              Competitive matches are intense, but communication must remain professional and respectful at all times.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-text-muted">
              <li>
                <strong className="text-text">Zero Tolerance for Toxicity:</strong> Hate speech, discrimination, harassment, or abusive language in match lobby chats results in immediate mute/ban actions.
              </li>
              <li>
                <strong className="text-text">No Spamming:</strong> Repetitive messages, spam links, or unsolicited advertising are forbidden.
              </li>
              <li>
                <strong className="text-text">Protect Privacy:</strong> Do not share personal details, contact coordinates, or private information of any user.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4 p-6 rounded-2xl border border-border bg-surface shadow-xs">
            <div className="flex items-center gap-2.5 text-text">
              <AlertTriangle className="size-5 text-primary" />
              <h2 className="text-base font-bold">3. Sandbox Security & Responsible Disclosure</h2>
            </div>
            <p>
              If you discover a vulnerability or security flaw in compilation sandboxes or matchmaking logic:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-text-muted">
              <li>
                <strong className="text-text">Responsible Disclosure:</strong> Do not exploit flaws or distribute exploits. Report them immediately to <a href="mailto:support@codecomplex.site" className="text-primary hover:underline">support@codecomplex.site</a>.
              </li>
              <li>
                <strong className="text-text">No Sandbox Escapes:</strong> Any attempt to escape Docker containers, attack host servers, starve compute quotas, or compromise compiler runners results in immediate permanent IP/account termination.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 p-6 rounded-2xl border border-primary/20 bg-primary-subtle">
            <div className="flex items-center gap-2.5 text-text">
              <ShieldAlert className="size-5 text-primary" />
              <h2 className="text-base font-bold">4. Enforcement & Penalties</h2>
            </div>
            <p className="text-xs text-text-muted">
              Violations are enforced progressively based on severity:
            </p>
            <ul className="space-y-2 text-xs text-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-text">Warning & Mute:</strong> For first-time minor chat infractions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-text">Matchmaking Suspension:</strong> For repeated queue dodging or toxicity.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-text">Elo Reset & Permanent Ban:</strong> For AI-assistance in ranked, sandbagging, or sandbox tampering.</span>
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 text-center text-xs text-text-muted">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} CodeComplex. Real-time competitive programming.</span>
          <span>Built by Umang Sisodia</span>
        </div>
      </footer>
    </div>
  );
}

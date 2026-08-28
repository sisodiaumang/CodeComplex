"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert, Award, MessageSquare, AlertTriangle, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function CommunityGuidelinesPage() {
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

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 py-14 space-y-12">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to arena
          </Link>
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#FF7A1A]">
              &#123; Community Guidelines &#125;
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="size-8 text-[#FF7A1A]" />
              Rules & Fair Play
            </h1>
          </div>
          <p className="text-sm text-white/60">
            Our standards for fair competition, respect, and sandbox security across the arena.
          </p>
        </div>

        <hr className="border-white/[0.08]" />

        <div className="space-y-10 text-sm text-white/70 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2.5 text-white">
              <Award className="size-5 text-[#FF7A1A]" />
              <h2 className="text-base font-bold">1. Integrity and Fair Play</h2>
            </div>
            <p>
              Coding duels are real-time, head-to-head matches designed to test your actual engineering capability under time constraints. Cheating compromises the integrity of the ladder and leaderboard.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-white/65">
              <li>
                <strong className="text-white">Independent Work:</strong> During ranked matches, your solutions must be written entirely by you.
              </li>
              <li>
                <strong className="text-white">No AI Assistants in Ranked:</strong> Using external generative AI models, code completions, or LLMs (ChatGPT, Claude, Gemini, Copilot) during active matchmaking duels is strictly prohibited.
              </li>
              <li>
                <strong className="text-white">No Plagiarism:</strong> Scraping, copying, or referencing pre-existing solutions from the web during matches is forbidden.
              </li>
              <li>
                <strong className="text-white">Anti-Sandbagging:</strong> Intentionally throwing matches (match-fixing) or manipulating rating curves through smurfing is prohibited.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2.5 text-white">
              <MessageSquare className="size-5 text-[#FF7A1A]" />
              <h2 className="text-base font-bold">2. Communication & Lobby Conduct</h2>
            </div>
            <p>
              Competitive matches are intense, but communication must remain professional and respectful at all times.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-white/65">
              <li>
                <strong className="text-white">Zero Tolerance for Toxicity:</strong> Hate speech, discrimination, harassment, or abusive language in match lobby chats results in immediate mute/ban actions.
              </li>
              <li>
                <strong className="text-white">No Spamming:</strong> Repetitive messages, spam links, or unsolicited advertising are forbidden.
              </li>
              <li>
                <strong className="text-white">Protect Privacy:</strong> Do not share personal details, contact coordinates, or private information of any user.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2.5 text-white">
              <AlertTriangle className="size-5 text-[#FF7A1A]" />
              <h2 className="text-base font-bold">3. Sandbox Security & Responsible Disclosure</h2>
            </div>
            <p>
              If you discover a vulnerability or security flaw in compilation sandboxes or matchmaking logic:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-white/65">
              <li>
                <strong className="text-white">Responsible Disclosure:</strong> Do not exploit flaws or distribute exploits. Report them immediately to <a href="mailto:support@codecomplex.site" className="text-[#FF7A1A] hover:underline">support@codecomplex.site</a>.
              </li>
              <li>
                <strong className="text-white">No Sandbox Escapes:</strong> Any attempt to escape Docker containers, attack host servers, starve compute quotas, or compromise compiler runners results in immediate permanent IP/account termination.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 p-6 rounded-2xl border border-[#FF7A1A]/20 bg-[#FF7A1A]/[0.03]">
            <div className="flex items-center gap-2.5 text-white">
              <ShieldAlert className="size-5 text-[#FF7A1A]" />
              <h2 className="text-base font-bold">4. Enforcement & Penalties</h2>
            </div>
            <p className="text-xs text-white/70">
              Violations are enforced progressively based on severity:
            </p>
            <ul className="space-y-2 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-[#FF7A1A] font-bold">•</span>
                <span><strong className="text-white">Warning & Mute:</strong> For first-time minor chat infractions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF7A1A] font-bold">•</span>
                <span><strong className="text-white">Matchmaking Suspension:</strong> For repeated queue dodging or toxicity.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF7A1A] font-bold">•</span>
                <span><strong className="text-white">Elo Reset & Permanent Ban:</strong> For AI-assistance in ranked, sandbagging, or sandbox tampering.</span>
              </li>
            </ul>
          </section>
        </div>
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


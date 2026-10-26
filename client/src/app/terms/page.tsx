"use client";

import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";

export default function TermsAndConditionsPage() {
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
              &#123; Legal Terms &#125;
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text flex items-center gap-3">
              <Scale className="size-8 text-primary" />
              Terms & Conditions
            </h1>
          </div>
          <p className="text-xs font-mono text-text-muted">
            Last Updated: August 2026
          </p>
        </div>

        <hr className="border-border" />

        <div className="space-y-8 text-sm text-text-muted leading-relaxed">
          <section className="space-y-3 p-6 rounded-2xl border border-border bg-surface shadow-xs">
            <h2 className="text-base font-bold text-text">1. Agreement to Terms & Eligibility</h2>
            <p>
              By accessing or creating an account on CodeComplex (codecomplex.site), you agree to be bound by these Terms & Conditions and our Community Guidelines. You must be at least 13 years of age to register.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl border border-border bg-surface shadow-xs">
            <h2 className="text-base font-bold text-text">2. Competitive Fair Play & Anti-Cheating</h2>
            <p>
              To maintain the integrity of our global Elo leaderboards:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-text-muted">
              <li>You must author all submitted solutions without external generative AI tooling or code scrapers during ranked duels.</li>
              <li>Exploiting sandbox compilation engines, attempting network escapes, or flooding backend WebSocket clusters is strictly forbidden and results in permanent hardware bans.</li>
              <li>Smurfing, intentional sandbagging, or match-fixing triggers immediate rating resets.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl border border-border bg-surface shadow-xs">
            <h2 className="text-base font-bold text-text">3. Intellectual Property & Code Submissions</h2>
            <p>
              You retain copyright ownership over source code you author. By submitting code into matchmaking rooms, you grant CodeComplex a non-exclusive, worldwide license to compile, analyze, execute against test suites, and display benchmarking results.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl border border-border bg-surface shadow-xs">
            <h2 className="text-base font-bold text-text">4. Disclaimers & Service Availability</h2>
            <p>
              CodeComplex is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. Elo ratings and leaderboard positions are calculated algorithmically for competitive and educational purposes. We reserve the right to deploy updates, recalibrate rating curves, or conduct scheduled maintenance.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl border border-border bg-surface shadow-xs">
            <h2 className="text-base font-bold text-text">5. Governing Law & Contact</h2>
            <p>
              These Terms are governed by applicable laws. For legal inquiries or questions, contact us at: <a href="mailto:support@codecomplex.site" className="text-primary hover:underline font-semibold">support@codecomplex.site</a>.
            </p>
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

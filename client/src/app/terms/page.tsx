"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui";

export default function TermsAndConditionsPage() {
  return (
    <div className="relative min-h-screen bg-bg text-text antialiased">
      {/* Developer Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="border-b border-border/20 backdrop-blur-md sticky top-0 z-50 bg-bg/75">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark size={28} />
            <span className="text-lg font-bold tracking-tight text-text">
              Code<span className="text-primary font-medium">Complex</span>
            </span>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="h-8 rounded px-4 text-xs font-semibold">
              Sign up
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 py-16 space-y-12">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-text">
            Terms & Conditions
          </h1>
          <p className="text-xs text-text-muted">
            Last Updated: July 21, 2026
          </p>
        </div>

        <hr className="border-border/20" />

        <div className="prose prose-invert max-w-none space-y-8 text-sm text-text-muted leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">1. Agreement to Terms</h2>
            <p>
              By creating an account, registering, or using CodeComplex ("Platform") at codecomplex.work.gd, you agree to be bound by these Terms & Conditions. If you do not agree to all of these terms, you are prohibited from using the Platform and must cease usage immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">2. Account Responsibility</h2>
            <p>
              To participate in coding battles, matchmaking, and rating changes, you must create a verified account.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must provide accurate, current, and complete details during sign-up.</li>
              <li>You are solely responsible for maintaining the confidentiality of your account credentials (passwords, tokens).</li>
              <li>You agree to notify us immediately of any unauthorized access or breach of security.</li>
              <li>We reserve the right to suspend or terminate accounts that provide false details or violate our community guidelines.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">3. Code of Conduct and Fair Play</h2>
            <p>
              CodeComplex is built on healthy, real-time competition. To preserve the integrity of the Platform:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">Anti-Cheating:</strong> You must write and submit your own solutions. Using external help, bots, pre-written templates (not provided by the challenge), or scraping solutions from others during live battles is strictly prohibited.
              </li>
              <li>
                <strong className="text-text">No Exploits:</strong> Attempting to escape the execution sandbox, crash the runner, write malicious files, execute arbitrary system commands, or execute denial of service (DoS) attacks on the compilation engines will result in an immediate and permanent account ban.
              </li>
              <li>
                <strong className="text-text">Respectful Behavior:</strong> Harassment, abusive language, or unsportsmanlike behavior towards opponents in lobby text chats is not tolerated.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">4. Code Submissions and Licensing</h2>
            <p>
              You retain ownership of any code you write and submit on the Platform. However, by compiling or submitting code, you grant CodeComplex a worldwide, royalty-free, non-exclusive license to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Compile, build, execute, run test cases, and analyze the submitted code on our servers.</li>
              <li>Grade, verify correctness, measure execution performance, and display the solution scores on active match cards and leaderboards.</li>
              <li>Display submission source code to you and your active opponent when debugging or viewing history.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">5. Limitation of Liability</h2>
            <p>
              CodeComplex and its services are provided on an "as-is" and "as-available" basis without warranties of any kind. We do not guarantee that compilation sandboxes, socket connections, or matchmaking queues will be uninterrupted, error-free, or secure from latency spikes. Under no circumstances will we be liable for lost Elo rating points, matching bans, or server downtimes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">6. Term Modifications</h2>
            <p>
              We reserve the right to revise or update these Terms at any time. When we make updates, we will update the "Last Updated" date at the top of this page. Your continued use of the Platform after changes are published constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">7. Inquiries</h2>
            <p>
              If you have any questions, disputes, or feedback regarding these Terms & Conditions, please reach out to us at:
              <br />
              Email: <span className="text-primary hover:underline">support@codecomplex.work.gd</span>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 bg-bg py-12 text-center text-[11px] text-text-faint">
        <p>© 2026 CodeComplex. All rights reserved.</p>
      </footer>
    </div>
  );
}

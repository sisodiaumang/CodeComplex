"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function TermsAndConditionsPage() {
  return (
    <div className="relative min-h-screen bg-bg text-text antialiased">
      {/* Developer Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="border-b border-border/20 backdrop-blur-md sticky top-0 z-50 bg-bg/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark size={28} />
            <span className="text-lg font-bold tracking-tight text-text">
              Code<span className="text-primary font-medium">Complex</span>
            </span>
          </Link>
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
            <h2 className="text-lg font-semibold text-text">1. Agreement to Terms & Eligibility</h2>
            <p>
              By creating an account, registering, or using CodeComplex ("Platform") at codecomplex.work.gd, you agree to be bound by these Terms & Conditions. If you do not agree to all of these terms, you are prohibited from using the Platform and must cease usage immediately.
            </p>
            <p>
              <strong className="text-text">Eligibility:</strong> You must be at least 13 years old (or the minimum age required in your jurisdiction) to use CodeComplex. By using the Platform, you represent and warrant that you meet this requirement.
            </p>
            <p>
              <strong className="text-text">Privacy Policy:</strong> Your use of the Platform is also governed by our <Link href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>, which details how we collect, use, and safeguard your personal data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">2. Account Responsibility & Termination</h2>
            <p>
              To participate in coding battles, matchmaking, and rating changes, you must create a verified account.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must provide accurate, current, and complete details during sign-up.</li>
              <li>You are solely responsible for maintaining the confidentiality of your account credentials (passwords, tokens).</li>
              <li>You agree to notify us immediately of any unauthorized access or breach of security.</li>
              <li>We reserve the right to suspend, restrict, or permanently terminate accounts that violate these Terms, compromise platform security, or undermine fair competition. We may terminate or suspend accounts without prior notice if we reasonably believe they threaten the integrity, security, or fairness of the Platform.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">3. Intellectual Property</h2>
            <p>
              The CodeComplex platform, design layout, branding, logos, interface, source code, challenges, test cases, database schemas, and original content are owned by CodeComplex and are protected by copyright, trademark, and other intellectual property laws. They may not be copied, redistributed, reverse-engineered, or reproduced without our explicit prior written permission. You may not attempt to access non-public APIs, administrative interfaces, or other restricted areas of the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">4. Code of Conduct and Fair Play</h2>
            <p>
              CodeComplex is built on healthy, real-time competition. To preserve the integrity of the Platform:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">Anti-Cheating:</strong> You must write and submit your own solutions. Using external help, AI assistants or large language models (including but not limited to ChatGPT, Claude, Gemini, GitHub Copilot, or similar tools), pre-written templates (not provided by the challenge), or scraping solutions from others during live battles is strictly prohibited.
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
            <h2 className="text-lg font-semibold text-text">5. Code Submissions and Licensing</h2>
            <p>
              You retain ownership of any code you write and submit on the Platform. However, by compiling or submitting code, you grant CodeComplex a worldwide, royalty-free, non-exclusive license to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Compile, build, execute, run test cases, and analyze the submitted code on our servers.</li>
              <li>Grade, verify correctness, measure execution performance, and display the solution scores on active match cards and leaderboards.</li>
              <li>Display submission source code to you and your active opponent when debugging or viewing history, and maintain backups necessary for platform operation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">6. Service Availability & Disclaimers</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">Rating Disclaimer:</strong> Elo ratings, rankings, and leaderboards are provided for entertainment and educational purposes. We reserve the right to recalculate, reset, or modify ratings at any time to preserve competitive integrity.
              </li>
              <li>
                <strong className="text-text">Service Availability:</strong> We do not guarantee uninterrupted availability of the Platform and may temporarily suspend the services for maintenance, updates, security patches, or server migrations.
              </li>
              <li>
                <strong className="text-text">Third-Party Services:</strong> The Platform relies on third-party integrations (such as MongoDB Atlas, Judge0 sandbox APIs, Cloudinary, and Resend). We are not liable for outages, delays, or failures caused by these third-party providers.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, CodeComplex and its services are provided on an "as-is" and "as-available" basis without warranties of any kind. We do not guarantee that compilation sandboxes, socket connections, or matchmaking queues will be uninterrupted, error-free, or secure from latency spikes. Under no circumstances will we be liable for lost Elo rating points, matching bans, or server downtimes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">8. Force Majeure</h2>
            <p>
              We shall not be liable for delays or failures caused by events beyond our reasonable control, including internet outages, natural disasters, power failures, cyberattacks, or governmental actions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">9. Governing Law</h2>
            <p>
              These Terms & Conditions shall be governed by, and construed in accordance with, the laws of India, without regard to its conflict of law provisions. Any legal disputes or claims arising out of the use of the Platform must be resolved in courts located in India.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">10. Inquiries & Contact</h2>
            <p>
              If you have any questions, disputes, or feedback regarding these Terms & Conditions, please reach out to us at:
              <br />
              Email: <span className="text-primary hover:underline">support@codecomplex.work.gd</span> or <span className="text-primary hover:underline">sisodiaumang6@gmail.com</span>
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

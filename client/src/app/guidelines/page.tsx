"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert, Award, MessageSquare, AlertTriangle } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function CommunityGuidelinesPage() {
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
            Community Guidelines
          </h1>
          <p className="text-xs text-text-muted">
            Last Updated: July 21, 2026
          </p>
        </div>

        <hr className="border-border/20" />

        <div className="prose prose-invert max-w-none space-y-10 text-sm text-text-muted leading-relaxed">
          <p className="text-base text-text">
            Welcome to CodeComplex! Our goal is to build the ultimate fair, challenging, and respectful arena for developers to showcase their engineering skills. By entering the platform, you agree to uphold these guidelines to ensure a high-quality experience for everyone.
          </p>

          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Award className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-text margin-none">1. Integrity and Fair Play</h2>
            </div>
            <p>
              Coding duels are real-time, head-to-head matches designed to test your actual capability. Cheating compromises the integrity of the ladder and leaderboard.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">Independent Work:</strong> During ranked matches, your solutions must be written entirely by you.
              </li>
              <li>
                <strong className="text-text">No AI Code Assistants:</strong> Using external generative AI models, code completions, or large language models (including but not limited to ChatGPT, Claude, Gemini, GitHub Copilot, or similar tools) during active matchmaking duels is strictly prohibited.
              </li>
              <li>
                <strong className="text-text">No Plagiarism:</strong> Copying, scraping, or referencing pre-existing solutions from the web or other users is not allowed.
              </li>
              <li>
                <strong className="text-text">Anti-Sandbagging:</strong> Intentionally losing matches (match-fixing) or creating alternate accounts to manipulate your matchmaking rating (smurfing/sandbagging) is prohibited.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-text margin-none">2. Communication & Chat Conduct</h2>
            </div>
            <p>
              Competitive matches can be intense, but communication must remain respectful at all times.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">No Toxicity:</strong> Avoid insult, hate speech, discrimination, harassment, or abusive language in match lobby chats.
              </li>
              <li>
                <strong className="text-text">No Spamming:</strong> Sending repetitive messages, links, advertising, or self-promotional spam in match chats is prohibited.
              </li>
              <li>
                <strong className="text-text">Protect Privacy:</strong> Do not share personal details, contact coordinates, or private information (doxxing) of other users.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-text margin-none">3. Usernames, Avatars, and Profiles</h2>
            </div>
            <p>
              Your public handle and avatar represent you in the Arena and are visible on leaderboards.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">Appropriate Content:</strong> Profiles, user handles, and custom avatar uploads must not contain offensive, explicit, graphic, or copyrighted material.
              </li>
              <li>
                <strong className="text-text">No Impersonation:</strong> Do not set handles to impersonate other competitors, platform administrators, or notable industry figures.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-text margin-none">4. Security & Exploit Reporting</h2>
            </div>
            <p>
              If you discover a vulnerability or security flaw in the compilation sandboxes or matchmaking logic:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">Responsible Disclosure:</strong> Do not exploit the flaw or share it with others. Report it immediately to the administration at <span className="text-primary hover:underline">support@codecomplex.site</span>.
              </li>
              <li>
                <strong className="text-text">No Sandbox Escapes:</strong> Any attempt to attack the host systems, read restricted files, execute raw shell commands, or crash compilers is an immediate ground for permanent account termination.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text">7. Enforcement & Penalties</h2>
            <p className="text-xs text-text-faint leading-relaxed">
              Violating the Community Guidelines may result in progressive enforcement actions depending on the severity and frequency of the violation:
            </p>
            <ul className="space-y-2 text-xs text-text-faint">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <strong className="text-text">Warning:</strong> First-time minor infractions (e.g. mild chat toxicity).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <strong className="text-text">Matchmaking Bans:</strong> Cheating or exploiting will result in temporary or permanent bans from active matchmaking queues.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <strong className="text-text">Elo Reset & Account Termination:</strong> Sandbagging or rating manipulation leads to Elo reset. Severe/repeat offenses lead to permanent account suspension.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text">8. Contact Us</h2>
            <p className="text-xs text-text-faint leading-relaxed">
              If you have questions about these Community Guidelines or wish to appeal an enforcement decision:
            </p>
            <div className="text-xs font-mono space-y-1 text-text-faint">
              Email: <span className="text-primary hover:underline">support@codecomplex.site</span> or <span className="text-primary hover:underline">sisodiaumang6@gmail.com</span>
            </div>
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

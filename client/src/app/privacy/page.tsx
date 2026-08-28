"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function PrivacyPolicyPage() {
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
              &#123; Legal & Compliance &#125;
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <Shield className="size-8 text-[#FF7A1A]" />
              Privacy Policy
            </h1>
          </div>
          <p className="text-xs font-mono text-white/50">
            Last Updated: August 2026
          </p>
        </div>

        <hr className="border-white/[0.08]" />

        <div className="space-y-8 text-sm text-white/70 leading-relaxed">
          <section className="space-y-3 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <h2 className="text-base font-bold text-white">1. Introduction</h2>
            <p>
              Welcome to CodeComplex (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your privacy and engineering data. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our real-time competitive programming platform at codecomplex.site.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <h2 className="text-base font-bold text-white">2. Information We Collect</h2>
            <p>
              To provide low-latency matchmaking, sandboxed code execution, and persistent leaderboards, we collect:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-white/65">
              <li>
                <strong className="text-white">Account Information:</strong> Name, username, email address, and encrypted password credentials upon registration.
              </li>
              <li>
                <strong className="text-white">OAuth Identifiers:</strong> Public avatars and verified emails when authenticating with GitHub or Google OAuth.
              </li>
              <li>
                <strong className="text-white">Code & Submissions:</strong> Source code, compilation telemetry, runtime execution stats, and pass/fail metrics used for Elo computation.
              </li>
              <li>
                <strong className="text-white">Telemetry & Security Logs:</strong> IP address, device fingerprints, WebSocket heartbeat timestamps, and audit trails to prevent smurfing and cheat bot automation.
              </li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <h2 className="text-base font-bold text-white">3. Sandboxing & Security Safeguards</h2>
            <p>
              Security is foundational to our platform:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-white/65">
              <li>All code execution is isolated inside ephemeral, unprivileged Docker containers with strictly enforced CPU, memory, and runtime bounds.</li>
              <li>Network traffic is protected end-to-end via TLS 1.3 encryption and secure WebSocket protocols (WSS).</li>
              <li>Passwords are hashed using salted cryptographic algorithms.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <h2 className="text-base font-bold text-white">4. User Rights & Data Deletion</h2>
            <p>
              You maintain full sovereignty over your account data. You can export your match history or permanently delete your account directly through your account settings. Upon deletion, personal identifiers and credentials are permanently purged from active databases.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <h2 className="text-base font-bold text-white">5. Contact & Inquiries</h2>
            <p>
              For questions regarding privacy, GDPR data requests, or security audits, contact us at: <a href="mailto:support@codecomplex.site" className="text-[#FF7A1A] hover:underline font-semibold">support@codecomplex.site</a>.
            </p>
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


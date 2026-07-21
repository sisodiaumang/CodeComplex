"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xs text-text-muted">
            Last Updated: July 21, 2026
          </p>
        </div>

        <hr className="border-border/20" />

        <div className="prose prose-invert max-w-none space-y-8 text-sm text-text-muted leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">1. Introduction</h2>
            <p>
              Welcome to CodeComplex ("we", "our", or "us"). We are committed to protecting your privacy and security. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our competitive engineering platform, hosted at codecomplex.work.gd.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">2. Information We Collect</h2>
            <p>
              To provide you with a high-quality competitive matchmaking and coding environment, we collect the following types of information:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">Account Information:</strong> When you register, we collect your full name, email address, username, and secure password hashes.
              </li>
              <li>
                <strong className="text-text">Third-Party OAuth Profiles:</strong> If you sign up using Google or GitHub, we receive basic profile information (such as your public profile picture, name, username, and email) to link and authenticate your account.
              </li>
              <li>
                <strong className="text-text">Code Submissions:</strong> We collect and run code submissions you compile or submit during battles to grade your solution, calculate pass rates, and award ratings/points.
              </li>
              <li>
                <strong className="text-text">Match Statistics:</strong> We track your history, rankings, ratings, and performance in matches to maintain the global leaderboard.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">3. How We Use Your Information</h2>
            <p>
              We process your data for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To manage your account and authenticate your logins.</li>
              <li>To facilitate matchmaking, execute real-time coding challenges, and update active battles.</li>
              <li>To run sandbox test cases on your code submissions using Docker and local runtime compilation.</li>
              <li>To calculate and render your Elo rankings, trophies, and leaderboard standings.</li>
              <li>To send you important system notifications, updates, or account recovery tools.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">4. Security and Data Protection</h2>
            <p>
              Your security is our absolute priority. We implement robust technical measures to safeguard your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>We hash passwords using bcrypt (with adaptive salt rounds) to prevent credentials leakage.</li>
              <li>All client-to-server communications are encrypted using Transport Layer Security (TLS/HTTPS).</li>
              <li>Compiling and executing code is done within isolated sandbox directories or secure execution environments.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">5. Third-Party Services</h2>
            <p>
              We integrate with specific third-party APIs to manage assets and execute code:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">OAuth Providers:</strong> Google and GitHub are used solely for fast, passwordless authentication.
              </li>
              <li>
                <strong className="text-text">Cloudinary:</strong> We use Cloudinary to store and serve your public avatar images securely.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">6. Data Retention and Deletion</h2>
            <p>
              We retain account data for as long as your account remains active. You can delete your profile, including all battle history and avatars, at any time directly through your account settings panel. Deletion is immediate and irreversible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">7. Contact Us</h2>
            <p>
              If you have any questions, concerns, or feedback regarding this Privacy Policy or your data, please contact us at:
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

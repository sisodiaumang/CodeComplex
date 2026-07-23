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
              Welcome to CodeComplex ("we", "our", or "us"). We are committed to protecting your privacy and security. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our competitive engineering platform, hosted at codecomplex.site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">2. Information We Collect</h2>
            <p>
              To provide you with a high-quality competitive matchmaking and coding environment, we collect the following categories of information:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">Information You Provide:</strong> When you register or update your account, we collect your full name, email address, username, profile description, and secure password hashes.
              </li>
              <li>
                <strong className="text-text">Third-Party OAuth Profiles:</strong> If you register or authenticate using Google or GitHub, we receive basic profile information (such as your public profile picture, name, username, and email) to link and authenticate your account.
              </li>
              <li>
                <strong className="text-text">Code Submissions:</strong> We collect and run code submissions you compile or submit during battles to grade your solution, calculate pass rates, and award ratings/points.
              </li>
              <li>
                <strong className="text-text">Automatically Collected Information:</strong> When you interact with the Platform, our servers automatically log standard network details. This includes your IP address, browser type, operating system, device information, access timestamps, and telemetry regarding socket connections and page views.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">3. Cookies and Authentication Tokens</h2>
            <p>
              We use authentication tokens (including JSON Web Tokens) and cookies where necessary to authenticate users, maintain secure sessions, and prevent unauthorized access:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">Session Management:</strong> Authentication tokens are stored to keep you logged in across browser sessions.
              </li>
              <li>
                <strong className="text-text">Preferences:</strong> Local browser storage is used to remember preferences, such as your Light/Dark mode configuration.
              </li>
            </ul>
            <p>
              You can configure your browser to reject cookies or clear local storage, but doing so will prevent you from logging in or using the matchmaking features of the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">4. How We Use and Share Your Information</h2>
            <p>
              We process your personal information to run the matchmaking, compiling, and leaderboard systems. We share data only with trusted service providers necessary for operating our platform:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text">OAuth Providers:</strong> Google and GitHub are used to verify identity and enable passwordless login.
              </li>
              <li>
                <strong className="text-text">Asset Hosting:</strong> We use Cloudinary to store and serve your public avatar images securely.
              </li>
              <li>
                <strong className="text-text">Infrastructure:</strong> We utilize cloud database services (such as MongoDB Atlas) and cloud hosting platforms to host and process data.
              </li>
              <li>
                <strong className="text-text">Communication:</strong> We use email delivery services (such as Resend) to send account verification codes, system updates, and user communications.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">5. Security and Data Protection</h2>
            <p>
              We implement reasonable technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Passwords are securely hashed using industry-standard cryptographic techniques to protect against credential compromises.</li>
              <li>All client-to-server communications are encrypted using Transport Layer Security (TLS/HTTPS) and secure WebSockets.</li>
              <li>User code execution is isolated within secure Docker container sandboxes to prevent interference with other users or system files.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">6. Data Retention and Deletion</h2>
            <p>
              We retain account and submission data for as long as your account remains active.
            </p>
            <p>
              <strong className="text-text">Account Deletion:</strong> You can delete your profile, including all battle history and avatars, at any time directly through your account settings panel. Upon account deletion, we remove your personal data from active systems. Some information, such as system event logs or code execution records, may remain in encrypted backups for a limited period before being automatically and permanently deleted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">7. User Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to access, correct, export, or request the erasure of your personal data. You can exercise these rights or request deletion directly through your settings page or by contacting us using the email addresses listed below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">8. International Data Transfers</h2>
            <p>
              Because our server infrastructure, databases, and third-party API providers are hosted globally, your personal data may be transferred to and processed in countries where our infrastructure or third-party service providers operate. By using the Platform, you consent to these cross-border data transfers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">9. Policy Modifications</h2>
            <p>
              We reserve the right to revise or update this Privacy Policy at any time. When updates are published, we will modify the "Last Updated" date at the top of this page. For significant changes, we will notify you through in-app alerts, email, or prominent notices on the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">10. Contact Us</h2>
            <p>
              If you have any questions, concerns, or feedback regarding this Privacy Policy or your data, please contact the platform owner:
              <br />
              Email: <span className="text-primary hover:underline">support@codecomplex.site</span> or <span className="text-primary hover:underline">sisodiaumang6@gmail.com</span>
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

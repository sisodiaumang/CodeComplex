"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, AlertTriangle, ShieldCheck, Check } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button, Card } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

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
      <main className="mx-auto max-w-5xl px-6 py-16 space-y-12">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-text">
            Contact Support
          </h1>
          <p className="text-xs text-text-muted">
            Have questions, feedback, or need help? Reach out to us.
          </p>
        </div>

        <hr className="border-border/20" />

        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
          {/* Contact Form */}
          <div className="space-y-6">
            <Card className="p-6 bg-surface/20 border-border/20 rounded-md">
              <h2 className="text-base font-semibold text-text mb-4">Send a Message</h2>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
                  <div className="size-10 rounded-full bg-win/10 flex items-center justify-center text-win">
                    <Check className="size-5" />
                  </div>
                  <h3 className="text-sm font-bold text-text">Message Sent!</h3>
                  <p className="text-xs text-text-muted max-w-xs">
                    Thank you for reaching out. We will get back to you at the email provided as soon as possible.
                  </p>
                  <Button size="sm" variant="outline" className="h-8 text-xs mt-2" onClick={() => setSubmitted(false)}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Name</label>
                      <input
                        id="name"
                        type="text"
                        required
                        className="w-full h-9 px-3 rounded border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary/80 transition-colors"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Email</label>
                      <input
                        id="email"
                        type="email"
                        required
                        className="w-full h-9 px-3 rounded border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary/80 transition-colors"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Subject</label>
                    <input
                      id="subject"
                      type="text"
                      required
                      className="w-full h-9 px-3 rounded border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary/80 transition-colors"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="Account issue, bug report, feedback..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Message</label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      className="w-full px-3 py-2 rounded border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary/80 transition-colors resize-none"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Type your message here..."
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-9 px-5 text-xs font-semibold">
                    Submit Message
                  </Button>
                </form>
              )}
            </Card>
          </div>

          {/* Quick Contact Cards */}
          <div className="space-y-4">
            <Card className="p-5 space-y-3 bg-surface/20 border-border/20 rounded-md">
              <div className="flex items-center gap-2.5 text-primary">
                <Mail className="size-4" />
                <h3 className="text-xs font-bold text-text">Direct Contact</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-text-muted">
                For account recovery, billing questions, or business inquiries, email us directly:
              </p>
              <div className="text-xs font-mono space-y-1">
                <a href="mailto:support@codecomplex.site" className="block text-primary hover:underline">
                  support@codecomplex.site
                </a>
              </div>
            </Card>

            <Card className="p-5 space-y-3 bg-surface/20 border-border/20 rounded-md">
              <div className="flex items-center gap-2.5 text-primary">
                <AlertTriangle className="size-4" />
                <h3 className="text-xs font-bold text-text">Report Cheating & Abuse</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-text-muted">
                If you encounter cheats, script exploits, or abusive behavior in chat, please consult our{" "}
                <Link href="/guidelines" className="text-primary hover:underline">
                  Community Guidelines
                </Link>{" "}
                or submit details directly to our support inbox.
              </p>
            </Card>

            <Card className="p-5 space-y-3 bg-surface/20 border-border/20 rounded-md">
              <div className="flex items-center gap-2.5 text-primary">
                <ShieldCheck className="size-4" />
                <h3 className="text-xs font-bold text-text">Security Reporting</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-text-muted">
                If you discover a vulnerability in our Docker sandbox system or API endpoints, please disclose it responsibly via email.
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 bg-bg py-12 text-center text-[11px] text-text-faint">
        <p>© 2026 CodeComplex. All rights reserved.</p>
      </footer>
    </div>
  );
}

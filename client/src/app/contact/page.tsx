"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, AlertTriangle, ShieldCheck, Check, Send } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary selection:text-white font-sans antialiased flex flex-col">
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-14 space-y-12">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to arena
          </Link>
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-primary font-semibold">
              &#123; Contact & Support &#125;
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text flex items-center gap-3">
              <Mail className="size-8 text-primary" />
              Get in Touch
            </h1>
          </div>
          <p className="text-sm text-text-muted">
            Have questions, feedback, security disclosures, or need matchmaking support?
          </p>
        </div>

        <hr className="border-border" />

        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          {/* Contact Form */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs">
            <h2 className="text-base font-bold text-text mb-4">Send a Message</h2>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
                <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Check className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-text">Message Dispatched!</h3>
                <p className="text-xs text-text-muted max-w-xs">
                  Thank you for reaching out. We will review your inquiry and follow up shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-3 px-4 py-1.5 rounded-full border border-border bg-surface-2 text-xs font-mono text-text hover:bg-surface-3 transition-colors cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-[10px] font-mono tracking-wider uppercase text-text-muted">Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface-2 text-text text-xs focus:outline-none focus:border-primary transition-colors"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-[10px] font-mono tracking-wider uppercase text-text-muted">Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface-2 text-text text-xs focus:outline-none focus:border-primary transition-colors"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-[10px] font-mono tracking-wider uppercase text-text-muted">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface-2 text-text text-xs focus:outline-none focus:border-primary transition-colors"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Matchmaking appeal / general question"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-[10px] font-mono tracking-wider uppercase text-text-muted">Message</label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    className="w-full p-3.5 rounded-xl border border-border bg-surface-2 text-text text-xs focus:outline-none focus:border-primary transition-colors resize-none"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Details about your inquiry..."
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="size-3.5" />
                  Submit Message
                </button>
              </form>
            )}
          </div>

          {/* Direct channels */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-border bg-surface space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-primary">
                <Mail className="size-4" />
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Direct Support</h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                For account verification, appeal requests, or general inquiries:
              </p>
              <a href="mailto:support@codecomplex.site" className="block text-xs font-mono text-primary hover:underline">
                support@codecomplex.site
              </a>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-surface space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-primary">
                <AlertTriangle className="size-4" />
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Report Violations</h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Report cheating, bot assistance, or toxic lobby behavior per our{" "}
                <Link href="/guidelines" className="text-primary hover:underline font-semibold">
                  Community Guidelines
                </Link>.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-surface space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="size-4" />
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Security Reporting</h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Responsible disclosure for Docker sandbox boundaries or API vulnerabilities.
              </p>
            </div>
          </div>
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

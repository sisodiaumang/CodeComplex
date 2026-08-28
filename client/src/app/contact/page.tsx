"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, AlertTriangle, ShieldCheck, Check, Send } from "lucide-react";
import { LogoMark } from "@/components/logo";
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
      <main className="mx-auto max-w-4xl px-6 py-14 space-y-12">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to arena
          </Link>
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#FF7A1A]">
              &#123; Contact & Support &#125;
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <Mail className="size-8 text-[#FF7A1A]" />
              Get in Touch
            </h1>
          </div>
          <p className="text-sm text-white/60">
            Have questions, feedback, security disclosures, or need matchmaking support?
          </p>
        </div>

        <hr className="border-white/[0.08]" />

        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          {/* Contact Form */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <h2 className="text-base font-bold text-white mb-4">Send a Message</h2>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
                <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Check className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Message Dispatched!</h3>
                <p className="text-xs text-white/60 max-w-xs">
                  Thank you for reaching out. We will review your inquiry and follow up shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-3 px-4 py-1.5 rounded-full border border-white/20 text-xs font-mono text-white/80 hover:text-white transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-[10px] font-mono tracking-wider uppercase text-white/60">Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      className="w-full h-10 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-xs focus:outline-none focus:border-[#FF7A1A] transition-colors"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-[10px] font-mono tracking-wider uppercase text-white/60">Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full h-10 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-xs focus:outline-none focus:border-[#FF7A1A] transition-colors"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-[10px] font-mono tracking-wider uppercase text-white/60">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-xs focus:outline-none focus:border-[#FF7A1A] transition-colors"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Bug report, feedback, match issue..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-[10px] font-mono tracking-wider uppercase text-white/60">Message</label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    className="w-full p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-xs focus:outline-none focus:border-[#FF7A1A] transition-colors resize-none"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Provide details or match codes..."
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#FF7A1A] text-[#0B0B0C] text-xs font-bold hover:bg-[#FF9040] transition-colors cursor-pointer"
                >
                  <Send className="size-3.5" />
                  Submit Message
                </button>
              </form>
            )}
          </div>

          {/* Direct channels */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-2">
              <div className="flex items-center gap-2 text-[#FF7A1A]">
                <Mail className="size-4" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Direct Support</h3>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                For account verification, appeal requests, or general inquiries:
              </p>
              <a href="mailto:support@codecomplex.site" className="block text-xs font-mono text-[#FF7A1A] hover:underline">
                support@codecomplex.site
              </a>
            </div>

            <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-2">
              <div className="flex items-center gap-2 text-[#FF7A1A]">
                <AlertTriangle className="size-4" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Report Violations</h3>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Report cheating, bot assistance, or toxic lobby behavior per our{" "}
                <Link href="/guidelines" className="text-[#FF7A1A] hover:underline font-semibold">
                  Community Guidelines
                </Link>.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-2">
              <div className="flex items-center gap-2 text-[#FF7A1A]">
                <ShieldCheck className="size-4" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Security Reporting</h3>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Responsible disclosure for Docker sandbox boundaries or API vulnerabilities.
              </p>
            </div>
          </div>
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


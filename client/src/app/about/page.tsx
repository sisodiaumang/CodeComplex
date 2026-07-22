"use client";

import Link from "next/link";
import { ArrowLeft, Code2, ShieldCheck, Trophy, Sparkles, Cpu, Layers } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button, Card } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AboutPage() {
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
            About CodeComplex
          </h1>
          <p className="text-xs text-text-muted">
            The real-time arena for competitive engineers.
          </p>
        </div>

        <hr className="border-border/20" />

        <div className="space-y-8 text-sm text-text-muted leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text">Our Mission</h2>
            <p>
              CodeComplex was founded to bridge the gap between static coding platforms and the high-intensity realities of real-time developer workflows. We believe that coding is not just about solving algorithms in isolation—it is about speed, precision under pressure, clean design, and continuous adaptation. 
            </p>
            <p>
              Whether you are a student preparing for technical interviews, a competitive programmer climbing the global Elo ladder, or a veteran engineer looking to stay sharp, CodeComplex provides a fast, gamified, and sandbox-secured environment to showcase your skills.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text">Core Platform Pillars</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-5 space-y-2 bg-surface/20 border-border/20 rounded-md">
                <div className="flex items-center gap-2 text-primary">
                  <Code2 className="size-4" />
                  <h3 className="text-xs font-bold text-text">Real-Time Duels</h3>
                </div>
                <p className="text-[11px] leading-relaxed text-text-muted">
                  Match against similarly-ranked opponents in 1v1 duels. Solve challenges, run tests, and complete tasks live as a ticking clock pushes you to your limits.
                </p>
              </Card>

              <Card className="p-5 space-y-2 bg-surface/20 border-border/20 rounded-md">
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="size-4" />
                  <h3 className="text-xs font-bold text-text">Competitive Elo Ladder</h3>
                </div>
                <p className="text-[11px] leading-relaxed text-text-muted">
                  Climb from Bronze to Legend. Our platform utilizes custom rating adjustments based on opponent strength and match duration, ensuring fair scaling.
                </p>
              </Card>

              <Card className="p-5 space-y-2 bg-surface/20 border-border/20 rounded-md">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="size-4" />
                  <h3 className="text-xs font-bold text-text">Isolated Sandboxing</h3>
                </div>
                <p className="text-[11px] leading-relaxed text-text-muted">
                  Every compilation and test execution runs inside isolated runtime environments (powered by Docker), keeping test cases secure, fast, and protected.
                </p>
              </Card>

              <Card className="p-5 space-y-2 bg-surface/20 border-border/20 rounded-md">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="size-4" />
                  <h3 className="text-xs font-bold text-text">Multifaceted Modes</h3>
                </div>
                <p className="text-[11px] leading-relaxed text-text-muted">
                  Compete in diverse challenges: Data Structures & Algorithms (DSA), Prompt Engineering (Prompt War), Frontend Layout duels, and Backend API builds.
                </p>
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text">Under the Hood</h2>
            <p>
              CodeComplex is built on modern, lightweight, and scalable technology to minimize latency during live matchmaking sessions:
            </p>
            <ul className="space-y-3 pl-1">
              <li className="flex gap-3">
                <Cpu className="size-5 text-text-muted shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text block text-xs">Event-Driven Architecture</strong>
                  <span className="text-[11px] text-text-muted leading-relaxed">Socket.IO handles immediate state changes, synchronized timers, and active code executions between dueling clients and backend servers.</span>
                </div>
              </li>
              <li className="flex gap-3">
                <Layers className="size-5 text-text-muted shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text block text-xs">Sandbox Run Engines</strong>
                  <span className="text-[11px] text-text-muted leading-relaxed">We orchestrate isolated code runners (using Docker/Judge0 engines) to execute user solutions against strict tests, measuring execution memory and CPU speed securely.</span>
                </div>
              </li>
            </ul>
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

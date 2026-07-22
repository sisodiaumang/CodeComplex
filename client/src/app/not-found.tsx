"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoFull } from "@/components/logo";
import KeyboardMascotAnimation from "@/components/KeyboardMascotAnimation";
import { Button } from "@/components/ui";
import { ArrowLeft, Home, Swords, Terminal, ShieldAlert } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-surface-1 text-text flex flex-col justify-between selection:bg-primary/20 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-1000" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="transition-transform hover:scale-105">
          <LogoFull size={32} />
        </Link>
        <span className="text-xs font-mono text-text-faint px-3 py-1.5 bg-surface-2/80 border border-border/60 rounded-full backdrop-blur-sm">
          STATUS: 404_NOT_FOUND
        </span>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-3xl mx-auto px-6 py-12 flex flex-col items-center text-center space-y-8 my-auto relative z-10">
        
        {/* Mascot Thinking Animation */}
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-blue-500/20 to-primary/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-all duration-500" />
          <div className="relative p-2 bg-surface-2/80 border border-border/80 rounded-3xl backdrop-blur-md shadow-2xl">
            <KeyboardMascotAnimation
              active={false}
              opponentName="DevBot V1"
              onlyMascot={false}
              pet={{ type: "cat", color: "#FF6B00" }}
            />
          </div>
        </div>

        {/* Hero Title & Error Message */}
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-danger/10 border border-danger/20 text-danger text-xs font-mono font-semibold tracking-wide">
            <ShieldAlert className="size-3.5" />
            <span>ERR_ADDRESS_UNREACHABLE</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-text tracking-tight">
            404: Arena Not Found
          </h1>

          <p className="text-sm md:text-base text-text-faint leading-relaxed">
            The target memory address or battle room you requested was deregistered, garbage collected, or never existed in the CodeComplex index.
          </p>
        </div>

        {/* Code Output Snippet Box */}
        <div className="w-full max-w-md bg-surface-2/90 border border-border/80 rounded-2xl p-4 text-left font-mono text-xs shadow-xl backdrop-blur-md relative group overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3 text-[11px] text-text-faint">
            <span className="flex items-center gap-1.5 font-semibold text-text">
              <Terminal className="size-3.5 text-primary" /> runtime_tracer.log
            </span>
            <span className="text-[10px] text-danger font-bold">SEGMENTATION_FAULT</span>
          </div>
          <div className="space-y-1 text-text-faint font-mono leading-relaxed">
            <p><span className="text-primary">const</span> targetRoute = <span className="text-emerald-400">&quot;/requested-route&quot;</span>;</p>
            <p><span className="text-blue-400">if</span> (!arena.exists(targetRoute)) &#123;</p>
            <p className="pl-4 text-danger"><span className="text-primary">throw new</span> PageNotFoundError(&quot;Memory offset 0x404 unmapped&quot;);</p>
            <p>&#125;</p>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => router.push("/")}
            className="gap-2 shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Home className="size-4" />
            Return Home
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/battle")}
            className="gap-2 border-border/80 hover:border-primary/50"
          >
            <Swords className="size-4 text-primary" />
            Enter Battle Arena
          </Button>

          <Button
            size="lg"
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 text-text-faint hover:text-text"
          >
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-text-faint font-mono">
        © {new Date().getFullYear()} CodeComplex • Real-time Competitive Engineering Arena
      </footer>
    </div>
  );
}

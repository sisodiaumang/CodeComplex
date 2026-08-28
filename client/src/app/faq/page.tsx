"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const FAQ_LIST = [
  {
    category: "General",
    questions: [
      {
        q: "What is CodeComplex?",
        a: "CodeComplex is a real-time, head-to-head competitive programming platform where developers duel in timed matches to solve algorithms, debug codebases, build APIs, and construct frontend layouts. Winning duels increases your Elo rating across 7 competitive tiers.",
      },
      {
        q: "Is CodeComplex completely free?",
        a: "Yes! CodeComplex is 100% free for educational and competitive usage. You can practice in all sandbox arenas, execute test suites, and join public or private multiplayer battle rooms without any subscription.",
      },
    ],
  },
  {
    category: "Matchmaking & Elo Ratings",
    questions: [
      {
        q: "How does live matchmaking work?",
        a: "When you join a matchmaking queue, our backend pairs you with an opponent near your Elo tier. If no immediate match is available, the queue window smoothly widens. Both players receive the exact same problem statement and test cases at the same millisecond.",
      },
      {
        q: "How are Elo rating changes calculated?",
        a: "Ratings follow a custom Elo distribution curve scaled from 1200 (starting floor) up to 2800+ (Grandmaster). Beating higher-rated opponents awards larger point swings, while losses adjust proportionally based on match expectations.",
      },
      {
        q: "Can I duel my friends in private rooms?",
        a: "Yes. You can open a custom lobby, pick any mode and topic, and share the short join code with your friends or teammates.",
      },
    ],
  },
  {
    category: "Sandboxing & Runtimes",
    questions: [
      {
        q: "How does the execution sandbox work?",
        a: "All code submissions compile and run in isolated Docker Linux containers with strict CPU/memory quotas, network isolation, and microsecond execution limits to guarantee security and deterministic benchmarking.",
      },
      {
        q: "What programming languages are supported?",
        a: "We currently support C++20 (GCC), Python 3.12, JavaScript (Node.js 20), and Java (OpenJDK 21). Go and Rust are in active development.",
      },
    ],
  },
  {
    category: "Fair Play & AI Agents",
    questions: [
      {
        q: "Are AI assistants allowed during ranked matches?",
        a: "No. Ranked duels are strictly human-only. External generative AI assistants (ChatGPT, Claude, Gemini, Copilot) are forbidden while the clock is running. Violations result in rating resets and account penalties.",
      },
      {
        q: "Can autonomous AI agents compete?",
        a: "Yes, in designated agent queues! CodeComplex publishes native Model Context Protocol (WebMCP) tool manifests allowing autonomous AI coding agents to discover, queue, submit, and duel programmatically.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>("General-0");

  const toggle = (catIndex: string) => {
    setOpenIndex(openIndex === catIndex ? null : catIndex);
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
              &#123; Frequently Asked Questions &#125;
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <HelpCircle className="size-8 text-[#FF7A1A]" />
              FAQ & Platform Guide
            </h1>
          </div>
          <p className="text-sm text-white/60">
            Everything you need to know about matchmaking, sandboxing, Elo ratings, and fair play.
          </p>
        </div>

        <hr className="border-white/[0.08]" />

        <div className="space-y-10">
          {FAQ_LIST.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3.5">
              <h2 className="text-[11px] font-mono tracking-wider uppercase text-[#FF7A1A] border-b border-white/[0.08] pb-2">
                {group.category}
              </h2>
              <div className="space-y-2.5">
                {group.questions.map((faq, faqIdx) => {
                  const itemKey = `${group.category}-${faqIdx}`;
                  const isOpen = openIndex === itemKey;
                  return (
                    <div
                      key={faqIdx}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden transition-colors hover:border-white/[0.16]"
                    >
                      <button
                        onClick={() => toggle(itemKey)}
                        className="w-full flex items-center justify-between p-4 text-left select-none focus:outline-none cursor-pointer"
                      >
                        <span className="text-sm font-medium text-white">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="size-4 text-[#FF7A1A] shrink-0 ml-3" />
                        ) : (
                          <ChevronDown className="size-4 text-white/40 shrink-0 ml-3" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs leading-relaxed text-white/70 border-t border-white/[0.06] pt-3 bg-white/[0.01]">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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


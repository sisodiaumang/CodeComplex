"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

const FAQ_LIST = [
  {
    category: "General",
    questions: [
      {
        q: "What is CodeComplex?",
        a: "CodeComplex is a real-time, head-to-head competitive coding platform where developers compete in duels to solve algorithms, compile backend APIs, or layout frontend pages under time constraints. Winning duels helps you climb rankings on our global Elo leaderboard."
      },
      {
        q: "Is the platform free to use?",
        a: "Yes! CodeComplex is 100% free for educational and competitive usage. You can practice in various sandbox arenas, run test cases, and join active rooms without any subscription."
      }
    ]
  },
  {
    category: "Matchmaking & Ratings",
    questions: [
      {
        q: "How does matchmaking work?",
        a: "When you join a matchmaking queue, our backend matches you against active players with similar rating points. If no matching rating is found quickly, the queue scope expands to pair you with available competitors."
      },
      {
        q: "How are rating changes calculated?",
        a: "CodeComplex uses a custom Elo rating system. The amount of points won or lost depends on the rating difference between you and your opponent. Winning against a higher-ranked player awards more points, while losing to a lower-ranked player deducts more."
      },
      {
        q: "Can I play against my friends?",
        a: "Absolutely! You can open a custom lobby room, select your preferred battle mode, and share the lobby join code directly with your friends."
      }
    ]
  },
  {
    category: "Security & Compilation Sandbox",
    questions: [
      {
        q: "What runtime sandboxes do you use?",
        a: "To ensure safety and execution parity, all submitted solutions are built and executed inside isolated Docker container sandboxes. This prevents malicious scripts, limits resource utilization, and prevents sandbox escapes."
      },
      {
        q: "What languages are currently supported?",
        a: "We currently support C++, Python, JavaScript (Node.js), and Java. Additional language runtimes are scheduled to be added over time."
      }
    ]
  },
  {
    category: "Rules & Fair Play",
    questions: [
      {
        q: "Is it allowed to use AI assistants during ranked matches?",
        a: "No. In accordance with our Community Guidelines, the usage of AI coding models (ChatGPT, Claude, Gemini, GitHub Copilot, etc.) during active matchmaking duels is strictly prohibited. Violating this will lead to a rating reset or account ban."
      },
      {
        q: "How do I report a player for toxicity or cheating?",
        a: "You can submit reports directly to support@codecomplex.work.gd with match codes, screenshots, and logs. We review reports manually and take progressive enforcement steps."
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>("General-0");

  const toggle = (catIndex: string) => {
    setOpenIndex(openIndex === catIndex ? null : catIndex);
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
      <main className="mx-auto max-w-3xl px-6 py-16 space-y-12">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-text">
            Frequently Asked Questions
          </h1>
          <p className="text-xs text-text-muted">
            Find quick answers to common questions about CodeComplex.
          </p>
        </div>

        <hr className="border-border/20" />

        <div className="space-y-8">
          {FAQ_LIST.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/10 pb-1.5">{group.category}</h2>
              <div className="space-y-2.5">
                {group.questions.map((faq, faqIdx) => {
                  const itemKey = `${group.category}-${faqIdx}`;
                  const isOpen = openIndex === itemKey;
                  return (
                    <div
                      key={faqIdx}
                      className="rounded border border-border/20 bg-surface/10 overflow-hidden"
                    >
                      <button
                        onClick={() => toggle(itemKey)}
                        className="w-full flex items-center justify-between p-4 text-left select-none focus:outline-none hover:bg-surface/30 transition-colors"
                      >
                        <span className="text-xs font-bold text-text">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="size-3.5 text-text-muted" />
                        ) : (
                          <ChevronDown className="size-3.5 text-text-muted" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs leading-relaxed text-text-muted border-t border-border/10 pt-3 bg-surface/5">
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
      <footer className="border-t border-border/20 bg-bg py-12 text-center text-[11px] text-text-faint">
        <p>© 2026 CodeComplex. All rights reserved.</p>
      </footer>
    </div>
  );
}

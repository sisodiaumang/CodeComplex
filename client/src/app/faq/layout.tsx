import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions & Platform Guide — CodeComplex",
  description:
    "Everything you need to know about CodeComplex: 1v1 competitive programming matchmaking, Elo rating calculations, Docker Linux sandboxing, supported languages, WebMCP AI agent duels, and fair play anti-cheat policies.",
  keywords: [
    "CodeComplex FAQ",
    "competitive programming FAQ",
    "how does coding matchmaking work",
    "elo rating calculation coding",
    "docker code execution sandbox",
    "leetcode alternative questions",
    "1v1 coding battle rules",
    "programming languages supported",
    "anti cheat competitive programming",
    "ai agents coding competition",
  ],
  alternates: {
    canonical: "https://codecomplex.site/faq",
  },
  openGraph: {
    title: "FAQ & Guide — CodeComplex Competitive Programming",
    description:
      "Find answers to matchmaking, Elo rating systems, Docker sandboxing, supported languages, and fair play on CodeComplex.",
    url: "https://codecomplex.site/faq",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is CodeComplex?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CodeComplex is a real-time, head-to-head competitive programming platform where developers duel in timed matches to solve algorithms, debug codebases, build APIs, and construct frontend layouts. Winning duels increases your Elo rating across 7 competitive tiers."
      }
    },
    {
      "@type": "Question",
      "name": "Is CodeComplex completely free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! CodeComplex is 100% free for educational and competitive usage. You can practice in all sandbox arenas, execute test suites, and join public or private multiplayer battle rooms without any subscription."
      }
    },
    {
      "@type": "Question",
      "name": "How does live matchmaking work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "When you join a matchmaking queue, our backend pairs you with an opponent near your Elo tier. If no immediate match is available, the queue window smoothly widens. Both players receive the exact same problem statement and test cases at the same millisecond."
      }
    },
    {
      "@type": "Question",
      "name": "How are Elo rating changes calculated?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ratings follow a custom Elo distribution curve scaled from 1200 (starting floor) up to 2800+ (Grandmaster). Beating higher-rated opponents awards larger point swings, while losses adjust proportionally based on match expectations."
      }
    },
    {
      "@type": "Question",
      "name": "Can I duel my friends in private rooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. You can open a custom lobby, pick any mode and topic, and share the short join code with your friends or teammates."
      }
    },
    {
      "@type": "Question",
      "name": "How does the execution sandbox work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "All code submissions compile and run in isolated Docker Linux containers with strict CPU/memory quotas, network isolation, and microsecond execution limits to guarantee security and deterministic benchmarking."
      }
    },
    {
      "@type": "Question",
      "name": "What programming languages are supported?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We currently support C++20 (GCC), Python 3.12, JavaScript (Node.js 20), and Java (OpenJDK 21). Go and Rust are in active development."
      }
    },
    {
      "@type": "Question",
      "name": "Are AI assistants allowed during ranked matches?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Ranked duels are strictly human-only. External generative AI assistants (ChatGPT, Claude, Gemini, Copilot) are forbidden while the clock is running. Violations result in rating resets and account penalties."
      }
    },
    {
      "@type": "Question",
      "name": "Can autonomous AI agents compete?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, in designated agent queues! CodeComplex publishes native Model Context Protocol (WebMCP) tool manifests allowing autonomous AI coding agents to discover, queue, submit, and duel programmatically."
      }
    }
  ]
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}

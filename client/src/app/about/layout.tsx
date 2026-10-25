import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About CodeComplex — Architecture, Mission & Platform Engineering",
  description:
    "Learn about CodeComplex: the modern real-time competitive programming platform and LeetCode alternative. Discover our sub-50ms WebSocket engine, hardened Docker execution sandboxes, SuperMemo-2 spaced repetition revision, and WebMCP autonomous agent arena.",
  keywords: [
    "about CodeComplex",
    "competitive programming platform architecture",
    "leetcode alternative platform",
    "docker code execution sandbox",
    "real time coding duels architecture",
    "spaced repetition for coding interviews",
    "supermemo-2 algorithm dsa",
    "multiplayer coding game design",
    "webmcp coding platform",
    "Umang Sisodia CodeComplex",
  ],
  alternates: {
    canonical: "https://codecomplex.site/about",
  },
  openGraph: {
    title: "About CodeComplex — Engineering the Future of Competitive Coding",
    description:
      "Explore the architecture behind CodeComplex: sub-50ms WebSocket synchronization, Docker Linux sandboxes, SuperMemo-2 revision algorithms, and 1v1 developer duels.",
    url: "https://codecomplex.site/about",
    type: "website",
  },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About CodeComplex",
  "url": "https://codecomplex.site/about",
  "description": "Learn about the mission, architecture, and technology behind CodeComplex — the real-time competitive programming platform and LeetCode alternative.",
  "mainEntity": {
    "@type": "Organization",
    "name": "CodeComplex",
    "url": "https://codecomplex.site",
    "founder": {
      "@type": "Person",
      "name": "Umang Sisodia"
    },
    "knowsAbout": [
      "Competitive Programming",
      "Algorithms and Data Structures",
      "Docker Linux Sandboxing",
      "Real-time WebSocket Synchronization",
      "Spaced Repetition Memory Systems",
      "Model Context Protocol (WebMCP)"
    ]
  }
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      {children}
    </>
  );
}

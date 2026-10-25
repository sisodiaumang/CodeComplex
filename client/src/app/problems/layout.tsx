import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse 4,000+ Challenges Across All Coding Disciplines — CodeComplex",
  description:
    "Explore 4,000+ coding challenges across all 5 CodeComplex modes: DSA algorithms, production bug fixing, responsive frontend layouts, backend REST APIs, and AI Prompt Wars. Test in free solo sandboxes with instant execution or duel 1v1.",
  keywords: [
    "coding challenge catalog",
    "dsa practice problems",
    "bug fixing challenge online",
    "frontend coding challenges",
    "backend api challenges",
    "prompt war ai prompt engineering",
    "leetcode alternative",
    "coding interview practice",
    "multiplayer coding game",
    "docker sandbox code execution",
  ],
  alternates: {
    canonical: "https://codecomplex.site/problems",
  },
  openGraph: {
    title: "4,000+ Multi-Discipline Coding Challenges — CodeComplex",
    description:
      "Practice 4,000+ challenges across DSA, Bug Fix, Frontend, Backend, and Prompt Wars with instant Docker sandboxing and ranked 1v1 duels.",
    url: "https://codecomplex.site/problems",
    type: "website",
  },
};

export default function ProblemsCatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

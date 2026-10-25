import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse 400+ DSA Coding Challenges & Interview Problems — CodeComplex",
  description:
    "Explore 400+ data structures and algorithms practice problems across Arrays, Dynamic Programming, Trees, Graphs, Strings, Heaps, and Backtracking. Test your code in free instant sandboxes or duel 1v1.",
  keywords: [
    "dsa practice problems",
    "leetcode questions list",
    "coding challenge catalog",
    "algorithms list",
    "data structures practice",
    "two sum",
    "3 sum",
    "array problems",
    "dynamic programming problems",
    "tree problems",
    "graph algorithms",
    "technical interview questions",
  ],
  alternates: {
    canonical: "https://codecomplex.site/problems",
  },
  openGraph: {
    title: "400+ Algorithmic Coding Problems — CodeComplex",
    description:
      "Search and solve 400+ data structure and algorithm challenges with instant Docker sandbox execution and 1v1 multiplayer duels.",
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

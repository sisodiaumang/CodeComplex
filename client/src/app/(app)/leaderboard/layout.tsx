import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Competitive Programming Leaderboard & Elo Rankings",
  description:
    "Explore the global CodeComplex competitive programming leaderboard. Track top software engineers, Grandmaster tier rankings, win rates, and Elo ratings across DSA, Bug Fix, Frontend, Backend, and Prompt Wars.",
  keywords: [
    "competitive programming leaderboard",
    "global coding rankings",
    "developer elo ladder",
    "top competitive programmers",
    "coding grandmasters",
    "best software engineers leaderboard",
  ],
  alternates: {
    canonical: "https://codecomplex.site/leaderboard",
  },
  openGraph: {
    title: "Global Leaderboard & Elo Rankings — CodeComplex",
    description:
      "Track the world's top competitive programmers across 7 skill tiers from Bronze to Grandmaster on CodeComplex.",
    url: "https://codecomplex.site/leaderboard",
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

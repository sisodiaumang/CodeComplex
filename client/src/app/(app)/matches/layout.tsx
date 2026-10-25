import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitive Match History & Rating Deltas",
  description:
    "Review your complete competitive programming match history, opponent ratings, time-to-solve benchmarks, test suite pass rates, and Elo rating changes on CodeComplex.",
  keywords: [
    "match history competitive programming",
    "coding duel stats",
    "elo rating history developer",
    "speed coding benchmark",
  ],
  alternates: {
    canonical: "https://codecomplex.site/matches",
  },
  openGraph: {
    title: "Match History & Duel Analytics — CodeComplex",
    description:
      "Inspect past duels, review code submissions, and track your performance metrics on CodeComplex.",
    url: "https://codecomplex.site/matches",
  },
};

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

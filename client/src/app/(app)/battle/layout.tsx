import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "1v1 Coding Battle Arena & Live Matchmaking",
  description:
    "Join live 1v1 and squad competitive programming duels. Choose from 5 battle modes: DSA Algorithms, Bug Fix Hunter, Frontend Pixel Match, Backend API Systems, and AI Prompt Wars with instant Docker compilation.",
  keywords: [
    "1v1 coding battle",
    "multiplayer coding game",
    "leetcode 1v1",
    "multiplayer leetcode",
    "live code duel",
    "real time coding battle",
    "speed coding contest",
    "bug fixing challenge online",
    "dsa practice match",
    "online coding arena",
  ],
  alternates: {
    canonical: "https://codecomplex.site/battle",
  },
  openGraph: {
    title: "1v1 Coding Battle Arena — CodeComplex",
    description:
      "Duel developers in real-time 1v1 competitive programming matches across DSA, debugging, backend APIs, and frontend layouts.",
    url: "https://codecomplex.site/battle",
  },
};

export default function BattleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

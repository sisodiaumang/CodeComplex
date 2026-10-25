import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Achievements & Coding Badges",
  description:
    "Unlock achievements, competitive medals, speed badges, and milestones as you solve algorithms, debug production failures, win tournaments, and climb Elo tiers on CodeComplex.",
  keywords: [
    "coding achievements",
    "developer badges",
    "programming medals",
    "competitive coding milestones",
    "gamified coding platform",
  ],
  alternates: {
    canonical: "https://codecomplex.site/achievements",
  },
  openGraph: {
    title: "Developer Achievements & Milestones — CodeComplex",
    description:
      "Earn badges and rank milestones as you duel opponents in real-time competitive programming on CodeComplex.",
    url: "https://codecomplex.site/achievements",
  },
};

export default function AchievementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

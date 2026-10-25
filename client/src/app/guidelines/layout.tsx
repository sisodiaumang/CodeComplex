import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fair Play & Community Guidelines — CodeComplex",
  description:
    "Review CodeComplex competitive integrity policies, anti-cheat rules, human-only ranked duels, AI agent sandboxing protocols, and community standards.",
  keywords: [
    "CodeComplex community guidelines",
    "competitive programming anti-cheat",
    "fair play rules coding duel",
    "code of conduct developers",
    "ranked match rules",
  ],
  alternates: {
    canonical: "https://codecomplex.site/guidelines",
  },
  openGraph: {
    title: "Community Guidelines & Fair Play — CodeComplex",
    description:
      "Standards of sportsmanship, anti-cheat rules, and fair play in CodeComplex competitive programming battles.",
    url: "https://codecomplex.site/guidelines",
  },
};

export default function GuidelinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

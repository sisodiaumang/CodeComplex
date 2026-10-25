import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spaced Repetition Revision — SuperMemo-2 DSA Practice",
  description:
    "Master data structures and algorithms permanently with spaced repetition. The CodeComplex revision queue automatically schedules solved interview questions using SuperMemo-2 decay curves so concepts never fade.",
  keywords: [
    "spaced repetition coding",
    "spaced repetition dsa",
    "supermemo coding interviews",
    "algorithm memory retention",
    "leetcode spaced repetition alternative",
    "revision queue software engineer",
  ],
  alternates: {
    canonical: "https://codecomplex.site/revision",
  },
  openGraph: {
    title: "Spaced Repetition Algorithm Revision — CodeComplex",
    description:
      "Retain algorithms and edge cases permanently with SuperMemo-2 spaced repetition memory scheduling on CodeComplex.",
    url: "https://codecomplex.site/revision",
  },
};

export default function RevisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in — CodeComplex",
  description:
    "Log in to your CodeComplex account. Access real-time 1v1 competitive programming duels, track your Elo rating, review past matches, and practice spaced repetition algorithms.",
  alternates: {
    canonical: "https://codecomplex.site/login",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

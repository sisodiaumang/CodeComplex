import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — CodeComplex",
  description:
    "Terms of service and usage conditions for the CodeComplex competitive programming platform, sandbox execution engine, and multiplayer arenas.",
  alternates: {
    canonical: "https://codecomplex.site/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

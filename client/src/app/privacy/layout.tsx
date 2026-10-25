import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — CodeComplex",
  description:
    "Learn how CodeComplex protects developer data, code submissions, telemetry, and account credentials with end-to-end security and transparent privacy policies.",
  alternates: {
    canonical: "https://codecomplex.site/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

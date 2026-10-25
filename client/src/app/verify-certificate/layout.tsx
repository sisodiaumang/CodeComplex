import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Internship Certificate & Engineering Credentials — CodeComplex",
  description:
    "Instant real-time verification for official CodeComplex software engineering internship certificates, student achievements, and developer credentials. Publicly accessible with zero signup required for recruiters, tech employers, and universities.",
  keywords: [
    "verify internship certificate",
    "CodeComplex certificate verification",
    "software engineer internship verification",
    "check internship certificate online",
    "authenticate developer certificate",
    "internship certificate validation",
    "credential checker",
    "CodeComplex certificate",
  ],
  alternates: {
    canonical: "https://codecomplex.site/verify-certificate",
  },
  openGraph: {
    title: "Verify Internship Certificate & Engineering Credentials | CodeComplex",
    description:
      "Instant, public verification for official CodeComplex software engineering internship certificates. No signup required for recruiters or employers.",
    url: "https://codecomplex.site/verify-certificate",
    type: "website",
  },
};

export default function VerifyCertificateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

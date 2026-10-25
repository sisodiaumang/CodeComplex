import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Internship Certificate",
  description:
    "Verify official CodeComplex software engineering internship certificates and credentials in real-time. No signup required for recruiters, employers, or academic reviewers.",
  openGraph: {
    title: "Verify Internship Certificate | CodeComplex",
    description:
      "Verify official CodeComplex software engineering internship certificates and credentials in real-time. No signup required.",
    url: "https://codecomplex.site/verify-certificate",
  },
};

export default function VerifyCertificateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Developer Support & Partnerships — CodeComplex",
  description:
    "Get in touch with the CodeComplex team for technical support, bug reports, enterprise hiring challenges, university tournament sponsorships, or WebMCP agent integrations.",
  keywords: [
    "contact CodeComplex",
    "developer support CodeComplex",
    "competitive programming platform support",
    "hire developers coding battle",
    "hackathon tournament sponsorship",
  ],
  alternates: {
    canonical: "https://codecomplex.site/contact",
  },
  openGraph: {
    title: "Contact Developer Support — CodeComplex",
    description:
      "Reach out to CodeComplex for support, inquiries, tournament hostings, or agent integrations.",
    url: "https://codecomplex.site/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

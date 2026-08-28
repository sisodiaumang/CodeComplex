import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import Providers from "@/components/providers";
import WebMCPProvider from "@/components/WebMCPProvider";
import "./globals.css";

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const code = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://codecomplex.site"),
  title: {
    default: "CodeComplex — Real-Time Competitive Programming & 1v1 Coding Arena",
    template: "%s | CodeComplex — Competitive Programming",
  },
  description:
    "CodeComplex is the real-time competitive programming platform for developers. Duel 1v1 and in squads across DSA algorithms, live debugging, backend APIs, frontend layouts, and AI prompt engineering with instant Docker sandbox execution and Elo rating ladders.",
  keywords: [
    "competitive programming",
    "competitive programming platform",
    "real-time competitive programming",
    "1v1 coding battles",
    "multiplayer coding",
    "DSA practice",
    "data structures and algorithms",
    "algorithmic speed duels",
    "coding contests",
    "live code editor",
    "bug fixing challenge",
    "backend arena",
    "frontend pixel duel",
    "prompt engineering war",
    "Elo rating system",
    "CodeComplex",
  ],
  authors: [{ name: "Umang Sisodia", url: "https://codecomplex.site" }],
  creator: "CodeComplex",
  publisher: "CodeComplex",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://codecomplex.site",
    title: "CodeComplex — Real-Time Competitive Programming & 1v1 Coding Arena",
    description:
      "Master competitive programming in live 1v1 and team duels. Solve DSA algorithms, debug real-world bugs, build backend APIs, and climb global Elo leaderboards.",
    siteName: "CodeComplex Competitive Programming",
    images: [
      {
        url: "/logo.webp",
        width: 1200,
        height: 630,
        alt: "CodeComplex — Competitive Programming Arena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeComplex — Real-Time Competitive Programming & 1v1 Coding Arena",
    description:
      "The premier real-time competitive programming arena. Duel developers in timed 1v1 matches across DSA, debugging, APIs, and prompt wars.",
    images: ["/logo.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.webp", type: "image/webp" },
    ],
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "https://codecomplex.site",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "tv-rdgOm8EjVmavNQ-tyh3KSdrYYcW5zax8ZGodmjCo",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://codecomplex.site/#organization",
      "name": "CodeComplex",
      "url": "https://codecomplex.site",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://codecomplex.site/#logo",
        "url": "https://codecomplex.site/logo.webp",
        "contentUrl": "https://codecomplex.site/logo.webp",
        "caption": "CodeComplex Logo"
      },
      "image": "https://codecomplex.site/logo.webp",
      "description": "CodeComplex is a real-time competitive programming platform where developers duel in 1v1 and squad coding battles across DSA, Bug Fix, Frontend, Backend, and AI Prompt Wars.",
      "founder": {
        "@type": "Person",
        "name": "Umang Sisodia",
        "url": "https://codecomplex.site"
      },
      "sameAs": [
        "https://github.com/sisodiaumang/CodeComplex"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "support@codecomplex.site",
        "contactType": "customer support"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://codecomplex.site/#website",
      "url": "https://codecomplex.site",
      "name": "CodeComplex — Competitive Programming",
      "description": "Real-time competitive programming arena for developers. Battle in 1v1 & team duels across DSA algorithms, debugging, full-stack APIs, and AI Prompt Wars.",
      "publisher": {
        "@id": "https://codecomplex.site/#organization"
      },
      "inLanguage": "en-US",
      "potentialAction": [
        {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://codecomplex.site/battle?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      ]
    },
    {
      "@type": "WebApplication",
      "@id": "https://codecomplex.site/#webapp",
      "name": "CodeComplex — Competitive Programming Arena",
      "url": "https://codecomplex.site",
      "applicationCategory": "DeveloperApplication, EducationalApplication",
      "applicationSubCategory": "Competitive Programming Platform",
      "operatingSystem": "All (Web Browser)",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "softwareVersion": "2.4.0",
      "description": "Multiplayer real-time competitive programming platform. Match against other engineers in timed 1v1 and squad battles across data structures and algorithms (DSA), live bug debugging, backend APIs, frontend layouts, and prompt engineering.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "featureList": [
        "Real-time competitive programming in 1v1 and 4v4 duels",
        "DSA algorithmic problem solving in C++, Python, Java, JavaScript, and Go",
        "Bug Fix Hunter mode with live codebase debugging",
        "Backend API and microservice endpoint engineering challenges",
        "Frontend UI pixel-matching and DOM accessibility duels",
        "Prompt War adversarial prompt engineering and LLM judge testing",
        "Spaced repetition memory revision dashboard",
        "Competitive Elo rating system with 7 skill tiers from Bronze to Grandmaster",
        "Isolated Docker container execution sandbox with sub-50ms kernel latency",
        "WebMCP protocol integration for automated AI agents and programmatic battles"
      ],
      "author": {
        "@id": "https://codecomplex.site/#organization"
      },
      "provider": {
        "@id": "https://codecomplex.site/#organization"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} ${code.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <WebMCPProvider />
          {children}
        </Providers>
        <Script
          src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

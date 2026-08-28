import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
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
    default: "CodeComplex — Real-time Competitive Engineering Arena",
    template: "%s | CodeComplex",
  },
  description:
    "Real-time competitive coding arena for developers. Battle in 1v1 & 4v4 duels across DSA, Frontend, Backend, and AI Prompt Wars. Rank up on global Elo leaderboards.",
  keywords: [
    "competitive programming",
    "coding battles",
    "1v1 coding",
    "DSA practice",
    "frontend battle",
    "backend arena",
    "prompt war",
    "developer arena",
    "live code editor",
    "CodeComplex",
  ],
  authors: [{ name: "Umang Sisodia", url: "https://codecomplex.site" }],
  creator: "CodeComplex",
  publisher: "CodeComplex",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://codecomplex.site",
    title: "CodeComplex — Real-time Competitive Engineering Arena",
    description:
      "Real-time competitive coding arena for developers. Battle in 1v1 & 4v4 duels across DSA, Frontend, Backend, and AI Prompt Wars. Rank up on global Elo leaderboards.",
    siteName: "CodeComplex",
    images: [
      {
        url: "/logo.webp",
        width: 1200,
        height: 630,
        alt: "CodeComplex Competitive Arena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeComplex — Real-time Competitive Engineering Arena",
    description:
      "Compete in live 1v1 and 4v4 coding battles across DSA, Frontend, Backend, and Prompt Wars.",
    images: ["/logo.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.webp", type: "image/webp" },
    ],
    apple: "/apple-touch-icon.png",
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
      "description": "Real-time competitive engineering arena for developers to compete in 1v1 and squad coding battles across DSA, Bug Fix, Frontend, Backend, and Prompt Engineering.",
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
      "name": "CodeComplex",
      "description": "Real-time competitive engineering arena for developers. Battle in 1v1 & team duels across DSA, Frontend, Backend, and AI Prompt Wars.",
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
      "name": "CodeComplex Arena",
      "url": "https://codecomplex.site",
      "applicationCategory": "DeveloperApplication",
      "applicationSubCategory": "Competitive Programming & Engineering Arena",
      "operatingSystem": "All (Web Browser)",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "softwareVersion": "2.4.0",
      "description": "Multiplayer real-time competitive coding platform. Match against other engineers in timed 1v1 and team battles across algorithms, debugging, full-stack APIs, frontend layouts, and prompt engineering.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "featureList": [
        "Real-time 1v1 and 4v4 multiplayer coding duels",
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
      </body>
    </html>
  );
}

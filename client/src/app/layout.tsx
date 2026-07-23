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
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "tv-rdgOm8EjVmavNQ-tyh3KSdrYYcW5zax8ZGodmjCo",
  },
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
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/icon.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "CodeComplex",
              "url": "https://codecomplex.site",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "All",
              "description": "Real-time competitive engineering arena for developers to compete in 1v1 & team duels.",
              "publisher": {
                "@type": "Organization",
                "name": "CodeComplex",
                "url": "https://codecomplex.site",
                "logo": "https://codecomplex.site/logo.webp"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("devwar-theme");var d=(t==="dark")||(t!=="light");if(d)document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <WebMCPProvider />
          {children}
        </Providers>
      </body>
    </html>
  );
}

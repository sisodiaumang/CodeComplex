import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/providers";
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
  title: {
    default: "CodeComplex — Competitive Coding Platform",
    template: "%s | CodeComplex",
  },
  description:
    "Battle other developers in real-time DSA, bug-fix, backend, frontend, and prompt-war challenges. Climb the Elo tiers and secure your rank.",
  keywords: ["competitive coding", "DSA", "coding challenges", "programming battle", "interview prep", "algorithms"],
  metadataBase: new URL("https://codecomplex.work.gd"),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "lnWwrLDfhvp8UOO3IDtb7ULLq2wVzf8aBtJn4aJAR4A",
  },
  openGraph: {
    title: "CodeComplex — Competitive Coding Platform",
    description: "Battle other developers in real-time DSA, bug-fix, backend, frontend, and prompt-war challenges.",
    url: "https://codecomplex.work.gd",
    siteName: "CodeComplex",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "CodeComplex Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CodeComplex — Competitive Coding Platform",
    description: "Real-time, head-to-head programming battles.",
    images: ["/logo.png"],
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
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "CodeComplex",
                "url": "https://codecomplex.work.gd"
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "CodeComplex",
                "url": "https://codecomplex.work.gd",
                "logo": "https://codecomplex.work.gd/logo.webp",
                "sameAs": [
                  "https://github.com/sisodiaumang/CodeComplex"
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "CodeComplex",
                "url": "https://codecomplex.work.gd",
                "applicationCategory": "EducationalApplication, GameApplication",
                "operatingSystem": "All",
                "browserRequirements": "Requires HTML5 compatible browser",
                "offers": {
                  "@type": "Offer",
                  "price": "0.00",
                  "priceCurrency": "USD"
                }
              }
            ])
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
          {children}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevArena - Competitive Engineering Platform",
  description: "Battle other developers in real-time engineering challenges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
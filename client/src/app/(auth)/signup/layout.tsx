import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an Account — CodeComplex",
  description:
    "Join CodeComplex: the head-to-head competitive programming platform. Compete in 1v1 duels across DSA, bug fixing, backend APIs, frontend layouts, and AI prompt engineering.",
  alternates: {
    canonical: "https://codecomplex.site/signup",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

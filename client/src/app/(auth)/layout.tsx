import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2">
        <LogoMark size={28} />
        <span className="text-lg font-bold tracking-tight text-text">
          Code<span className="text-primary">Complex</span>
        </span>
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-sm">
        {children}
      </div>
    </div>
  );
}

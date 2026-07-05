import Link from "next/link";
import { Swords } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded bg-primary text-white">
          <Swords className="size-4" />
        </span>
        <span className="text-lg font-bold tracking-tight text-text">
          dev<span className="text-primary">Arena</span>
        </span>
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-5 shadow-sm">
        {children}
      </div>
    </div>
  );
}

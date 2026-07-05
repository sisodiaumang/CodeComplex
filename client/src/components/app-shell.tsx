"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Swords,
  LayoutDashboard,
  Trophy,
  History,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { unwrapList, type AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth-store";
import { Avatar, Spinner } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/battle", label: "Battle", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/matches", label: "Matches", icon: History },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<unknown>("/notifications"),
    refetchInterval: 30_000,
  });

  const unread = unwrapList<AppNotification>(notifications, "notifications").filter(
    (n) => !n.isRead
  ).length;

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors",
              active
                ? "bg-sidebar-active font-medium text-white"
                : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span className="flex-1">{label}</span>
            {href === "/notifications" && unread > 0 && (
              <span className="min-w-[20px] rounded-full bg-primary px-1.5 text-center font-mono text-[11px] font-medium leading-[20px] text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  async function logout() {
    try {
      await api("/user/logout", { method: "POST" });
    } catch {
      // clear locally regardless
    }
    setUser(null);
    queryClient.clear();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="border-t border-sidebar-border px-3 py-3">
      <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
        <Link href={`/profile/${user.username}`} className="shrink-0">
          <Avatar src={user.avatar?.profileImageURL} name={user.username} size={32} />
        </Link>
        <Link
          href={`/profile/${user.username}`}
          className="min-w-0 flex-1 hover:opacity-80"
        >
          <p className="truncate text-sm font-medium text-sidebar-text">{user.username}</p>
        </Link>
        <button
          onClick={logout}
          title="Log out"
          aria-label="Log out"
          className="rounded-md p-1 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-red-400"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
        <Swords className="size-4" />
      </span>
      <span className="text-lg font-bold tracking-tight text-sidebar-text">
        dev<span className="text-primary">Arena</span>
      </span>
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner />
      </div>
    );
  }

  if (status === "guest") return null;

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar — dark */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar-bg lg:flex">
        <Brand />
        <NavLinks />
        <UserFooter />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-surface px-3 lg:hidden">
        <Brand />
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="rounded-md p-1.5 text-text-muted hover:bg-surface-2"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar-bg pt-12">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <UserFooter />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 px-6 pb-12 pt-[60px] lg:ml-64 lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

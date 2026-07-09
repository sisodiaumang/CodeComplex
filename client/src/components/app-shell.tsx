"use client";

import { useEffect, useRef, useState } from "react";
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
  ChevronDown,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { api } from "@/lib/api";
import { unwrapList, type AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth-store";
import { useTheme } from "@/stores/theme-store";
import { useSocketNotifications } from "@/stores/socket-store";
import { Avatar, Spinner } from "@/components/ui";
import { LogoMark } from "@/components/logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/battle", label: "Battle", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/matches", label: "Matches", icon: History },
  { href: "/friends", label: "Friends", icon: Users },
] as const;

/* ─── Brand ───────────────────────────────────────────────────────────── */

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
      <LogoMark size={28} />
      <span className="text-lg font-bold tracking-tight text-sidebar-text">
        Dev<span className="text-primary">War</span>
      </span>
    </Link>
  );
}

/* ─── Desktop nav links (horizontal) ──────────────────────────────────── */

function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-active text-white"
                : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ─── Notification bell ───────────────────────────────────────────────── */

function NotificationBell() {
  const pathname = usePathname();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<unknown>("/notifications"),
    refetchInterval: 30_000,
  });

  const unread = unwrapList<AppNotification>(notifications, "notifications").filter(
    (n) => !n.isRead
  ).length;

  const active = pathname === "/notifications" || pathname.startsWith("/notifications/");

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative rounded-md p-2 transition-colors",
        active
          ? "bg-sidebar-active text-white"
          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
      )}
      title="Notifications"
    >
      <Bell className="size-4" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

/* ─── Theme toggle ────────────────────────────────────────────────────── */

const THEME_META = {
  light: { icon: Sun, label: "Light", next: "Switch to dark mode" },
  dark: { icon: Moon, label: "Dark", next: "Switch to system theme" },
  system: { icon: Monitor, label: "System", next: "Switch to light mode" },
} as const;

function ThemeToggle() {
  const { theme, cycle } = useTheme();
  const meta = THEME_META[theme];
  const Icon = meta.icon;

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
      title={meta.next}
      aria-label={meta.next}
    >
      <Icon className="size-4" />
      <span className="hidden text-xs font-medium sm:inline">{meta.label}</span>
    </button>
  );
}

/* ─── User dropdown ───────────────────────────────────────────────────── */

function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-hover"
      >
        <Avatar src={user.avatar?.profileImageURL} name={user.username} size={26} />
        <span className="hidden text-sm font-medium text-sidebar-text sm:block">
          {user.username}
        </span>
        <ChevronDown
          className={cn(
            "hidden size-3.5 text-sidebar-muted transition-transform sm:block",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
          <Link
            href={`/profile/${user.username}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text hover:bg-surface-2"
          >
            <Avatar src={user.avatar?.profileImageURL} name={user.username} size={20} />
            My Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text hover:bg-surface-2"
          >
            <Settings className="size-4 text-text-muted" />
            Settings
          </Link>
          <div className="my-1 border-t border-border" />
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-danger hover:bg-surface-2"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Mobile nav links (vertical, for drawer) ─────────────────────────── */

function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<unknown>("/notifications"),
    refetchInterval: 30_000,
  });

  const unread = unwrapList<AppNotification>(notifications, "notifications").filter(
    (n) => !n.isRead
  ).length;

  const allLinks = [
    ...NAV,
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {allLinks.map(({ href, label, icon: Icon }) => {
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

/* ─── Mobile user footer ──────────────────────────────────────────────── */

function MobileUserFooter() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  async function logout() {
    try {
      await api("/user/logout", { method: "POST" });
    } catch {}
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
        <Link href={`/profile/${user.username}`} className="min-w-0 flex-1 hover:opacity-80">
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

/* ─── App Shell ───────────────────────────────────────────────────────── */

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useSocketNotifications();

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
    <div className="min-h-screen bg-bg">
      {/* ── Top navbar (all screens) ── */}
      <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-sidebar-border bg-sidebar-bg">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4">
          {/* Left: brand + nav links (desktop) */}
          <div className="flex items-center gap-6">
            <Brand />
            <div className="hidden md:block">
              <DesktopNav />
            </div>
          </div>

          {/* Right: theme + bell + user (desktop) | hamburger (mobile) */}
          <div className="hidden items-center gap-1 md:flex">
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-hover md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar-bg pt-14">
            <MobileNavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="flex-1" />
            <MobileUserFooter />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="min-h-screen px-4 pb-12 pt-20 sm:px-6 md:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Swords,
  Trophy,
  Award,
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
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { unwrapList, type AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth-store";
import { useTheme } from "@/stores/theme-store";
import { useSocketNotifications } from "@/stores/socket-store";
import { Avatar, Spinner, Alert, Button, Input } from "@/components/ui";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "./ThemeToggle";
import { AchievementToastsContainer } from "@/components/AchievementToast";

const NAV = [
  { href: "/battle", label: "Battle", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/matches", label: "Matches", icon: History },
  { href: "/friends", label: "Friends", icon: Users },
] as const;

/* ─── Brand ───────────────────────────────────────────────────────────── */

function Brand() {
  return (
    <Link href="/battle" className="flex items-center gap-2 shrink-0">
      <LogoMark size={28} />
      <span className="text-lg font-bold tracking-tight text-sidebar-text">
        Code<span className="text-primary">Complex</span>
      </span>
    </Link>
  );
}

/* ─── Desktop nav links (horizontal) ──────────────────────────────────── */

function DesktopNav() {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const isAdmin = user && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || "");

  const navItems = [...NAV];
  if (isAdmin) {
    navItems.push({ href: "/admin", label: "Admin", icon: Shield } as any);
  }

  return (
    <nav className="flex items-center gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
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

// ThemeToggle is imported from "./ThemeToggle" to prevent circular reference compilation.

/* ─── User dropdown ───────────────────────────────────────────────────── */

function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
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
          <button
            onClick={() => {
              setOpen(false);
              setReportModalOpen(true);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-text hover:bg-surface-2 text-left"
          >
            <AlertTriangle className="size-4 text-text-muted" />
            Report Issue
          </button>
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

      <ReportSiteModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} />
    </div>
  );
}

/* ─── Mobile nav links (vertical, for drawer) ─────────────────────────── */

function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const isAdmin = user && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || "");

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

  if (isAdmin) {
    allLinks.push({ href: "/admin", label: "Admin Panel", icon: Shield } as any);
  }

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
      <AchievementToastsContainer />
      {/* ── Top navbar (all screens) ── */}
      <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-sidebar-border bg-sidebar-bg">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4">
          {/* Left: brand + nav links (desktop) */}
          <div className="flex items-center gap-6">
            <Brand />
            <div className="hidden lg:block">
              <DesktopNav />
            </div>
          </div>

          {/* Right: theme + bell + user (desktop) | hamburger (mobile) */}
          <div className="hidden items-center gap-1 lg:flex">
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-hover lg:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
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

function ReportSiteModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/user/report", {
        method: "POST",
        body: {
          targetType: "SITE",
          reason,
          details,
        },
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
      <div className="bg-surface border border-border shadow-2xl rounded-2xl max-w-md w-full overflow-hidden flex flex-col relative animate-scaleUp select-text">
        {/* Close button */}
        <button
          onClick={() => {
            onClose();
            setReason("");
            setDetails("");
            setSuccess(false);
            setError("");
          }}
          className="absolute top-4 right-4 text-text-muted hover:text-text hover:bg-surface-2 p-1.5 rounded-lg transition-colors cursor-pointer"
          title="Close"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-border bg-surface-2/30 flex items-center gap-4">
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl shadow-inner">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h2 className="text-md font-bold tracking-tight text-text">
              Report an Issue
            </h2>
            <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
              Report bugs, performance issues, or suggest site feedback directly to the owners.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-text uppercase tracking-wider font-mono">Report Submitted</h3>
                <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
                  Thank you for your feedback! The site owners have been notified and will look into this issue.
                </p>
              </div>
              <Button
                onClick={() => {
                  onClose();
                  setReason("");
                  setDetails("");
                  setSuccess(false);
                  setError("");
                }}
                className="h-9 px-6 text-xs font-bold bg-primary text-white border-none"
              >
                Close Window
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Subject / Reason"
                name="reason"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Broken links on matches tab, layout bug..."
                className="w-full"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-medium text-text">Details</label>
                <textarea
                  required
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-[15px] text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-text-faint transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    onClose();
                    setReason("");
                    setDetails("");
                    setError("");
                  }}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="h-9 text-xs bg-primary text-white border-none"
                >
                  Submit Report
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

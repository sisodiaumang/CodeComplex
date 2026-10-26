"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Menu,
  X,
  Swords,
  Code2,
  RotateCcw,
  Trophy,
  Award,
  History,
  Users,
  Shield,
  ShieldCheck,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  HelpCircle,
  FileText
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/stores/auth-store";
import { Avatar } from "@/components/ui";
import { api } from "@/lib/api";
import { unwrapList, type AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

const AUTH_NAV = [
  { href: "/battle", label: "Battle", icon: Swords },
  { href: "/problems", label: "Problems", icon: Code2 },
  { href: "/revision", label: "Revision", icon: RotateCcw },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/matches", label: "Matches", icon: History },
  { href: "/friends", label: "Friends", icon: Users },
] as const;

const PUBLIC_NAV = [
  { href: "/problems", label: "Problems", icon: Code2 },
  { href: "/battle", label: "1v1 Arena", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/verify-certificate", label: "Verify Credential", icon: ShieldCheck },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
] as const;

export function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status, setUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === "authed" && !!user;
  const isAdmin = user && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || "");

  // Notification query for logged in users
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<unknown>("/notifications"),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const unreadCount = isAuthenticated
    ? unwrapList<AppNotification>(notifications, "notifications").filter((n) => !n.isRead).length
    : 0;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on resize or escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => {
      if (wide.matches) setMenuOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [menuOpen]);

  async function handleLogout() {
    try {
      await api("/user/logout", { method: "POST" });
    } catch {}
    setUser(null);
    queryClient.clear();
    router.replace("/login");
  }

  const activeAuthLinks = [...AUTH_NAV];
  if (isAdmin) {
    activeAuthLinks.push({ href: "/admin", label: "Admin", icon: Shield } as any);
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-surface/90 border-b border-border text-text transition-colors no-print">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link
              href={isAuthenticated ? "/battle" : "/"}
              className="flex items-center gap-2.5 font-bold text-base tracking-tight text-text shrink-0 whitespace-nowrap hover:opacity-95 transition-opacity"
            >
              <LogoMark size={26} />
              <span>
                Code<span className="text-primary">Complex</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {isAuthenticated
                ? activeAuthLinks.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== "/battle" && pathname.startsWith(`${href}/`));
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "bg-surface-2 text-primary font-semibold shadow-xs"
                            : "text-text-muted hover:bg-surface-2 hover:text-text"
                        )}
                      >
                        <Icon className="size-3.5" />
                        <span>{label}</span>
                      </Link>
                    );
                  })
                : PUBLIC_NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "bg-surface-2 text-primary font-semibold shadow-xs"
                            : "text-text-muted hover:bg-surface-2 hover:text-text"
                        )}
                      >
                        <Icon className="size-3.5" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
            </nav>
          </div>

          {/* Right End Actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle className="text-text-muted hover:text-text" />

            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <Link
                  href="/notifications"
                  className={cn(
                    "relative rounded-lg p-2 transition-colors",
                    pathname === "/notifications"
                      ? "bg-surface-2 text-primary"
                      : "text-text-muted hover:bg-surface-2 hover:text-text"
                  )}
                  title="Notifications"
                >
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    <Avatar src={user?.avatar?.profileImageURL} name={user?.username || "User"} size={26} />
                    <span className="hidden sm:inline text-xs font-semibold text-text max-w-[120px] truncate">
                      {user?.username}
                    </span>
                    <ChevronDown className="size-3 text-text-muted hidden sm:inline" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-surface py-1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3.5 py-2 border-b border-border">
                        <div className="text-xs font-bold text-text truncate">{user?.username}</div>
                        <div className="text-[11px] text-text-muted font-mono truncate">{user?.email || "Competitive Programmer"}</div>
                      </div>
                      <Link
                        href={`/profile/${user?.username}`}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-2 transition-colors"
                      >
                        <Avatar src={user?.avatar?.profileImageURL} name={user?.username || "User"} size={18} />
                        My Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-2 transition-colors"
                      >
                        <Settings className="size-3.5 text-text-muted" />
                        Settings
                      </Link>
                      <Link
                        href="/verify-certificate"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-2 transition-colors"
                      >
                        <ShieldCheck className="size-3.5 text-text-muted" />
                        Verify Certificate
                      </Link>
                      <div className="my-1 border-t border-border" />
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-danger hover:bg-surface-2 cursor-pointer text-left transition-colors"
                      >
                        <LogOut className="size-3.5" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-medium text-text-muted hover:text-text px-2.5 py-1.5 transition-colors hidden sm:inline-block"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center size-9 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
            className="fixed top-0 right-0 bottom-0 z-51 w-[min(320px,84vw)] flex flex-col p-5 bg-surface border-l border-border text-text shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <Link
                href={isAuthenticated ? "/battle" : "/"}
                className="flex items-center gap-2 font-bold text-sm tracking-tight text-text"
                onClick={() => setMenuOpen(false)}
              >
                <LogoMark size={24} />
                <span>Code<span className="text-primary">Complex</span></span>
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center size-8 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav list */}
            <div className="py-4 space-y-1">
              {isAuthenticated ? (
                <>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-text-faint px-3 pb-1">
                    Arena Navigation
                  </div>
                  {activeAuthLinks.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== "/battle" && pathname.startsWith(`${href}/`));
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          active
                            ? "bg-surface-2 text-primary font-semibold"
                            : "text-text-muted hover:bg-surface-2 hover:text-text"
                        )}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon className="size-4" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </>
              ) : (
                <>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-text-faint px-3 pb-1">
                    Explore CodeComplex
                  </div>
                  {PUBLIC_NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          active
                            ? "bg-surface-2 text-primary font-semibold"
                            : "text-text-muted hover:bg-surface-2 hover:text-text"
                        )}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon className="size-4" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-text-muted">Theme Mode</span>
                <ThemeToggle className="text-text-muted hover:text-text" />
              </div>

              {isAuthenticated && user ? (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2.5 px-2 py-1.5">
                    <Avatar src={user.avatar?.profileImageURL} name={user.username} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-text truncate">{user.username}</div>
                      <div className="text-[11px] text-text-muted font-mono truncate">{user.email || "Competitive Programmer"}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-surface-2 hover:bg-surface-3 text-danger text-xs font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="size-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center h-10 rounded-lg border border-border bg-surface-2 text-text text-xs font-semibold hover:bg-surface-3 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center h-10 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

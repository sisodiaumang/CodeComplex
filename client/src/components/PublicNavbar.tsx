"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Swords,
  Code2,
  Trophy,
  Award,
  Shield,
  ShieldCheck,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import {
  Brand,
  DesktopNav,
  NotificationBell,
  UserMenu,
  MobileNavLinks,
  MobileUserFooter,
} from "./app-shell";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const PUBLIC_PRIMARY_NAV = [
  { href: "/battle", label: "Battle", icon: Swords },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/problems", label: "Problems", icon: Code2 },
  { href: "/leaderboard", label: "Leaderboard", icon: Award },
] as const;

const PUBLIC_MORE_NAV = [
  { href: "/verify-certificate", label: "Verify Credential", icon: ShieldCheck, desc: "Verify official CodeComplex certificates" },
  { href: "/faq", label: "FAQ", icon: HelpCircle, desc: "Frequently asked questions & platform rules" },
] as const;

function PublicMoreDropdown() {
  const pathname = usePathname();
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

  const isMoreActive = PUBLIC_MORE_NAV.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`)
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
          isMoreActive
            ? "bg-sidebar-active text-white"
            : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
        )}
      >
        <span>More</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Explore & Verify
          </div>
          {PUBLIC_MORE_NAV.map(({ href, label, icon: Icon, desc }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors",
                  active
                    ? "bg-surface-2 text-primary font-medium"
                    : "text-text hover:bg-surface-2"
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    active ? "text-primary" : "text-text-muted"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-text">{label}</span>
                  <span className="text-[11px] text-text-muted">{desc}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PublicDesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {PUBLIC_PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/battle" && pathname.startsWith(`${href}/`));
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
      <PublicMoreDropdown />
    </nav>
  );
}

export function PublicNavbar() {
  const pathname = usePathname();
  const { user, status } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = status === "authed" && !!user;
  const isAdmin = user && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || "");

  // Close mobile drawer on escape or wide screen
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => {
      if (wide.matches) setMobileOpen(false);
    };

    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-sidebar-border bg-sidebar-bg no-print">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4">
          {/* Left: brand + nav links (desktop) */}
          <div className="flex items-center gap-6">
            <Brand />
            <div className="hidden lg:block">
              {isAuthenticated ? <DesktopNav /> : <PublicDesktopNav />}
            </div>
          </div>

          {/* Right: theme + admin + bell + user (desktop) | hamburger (mobile) */}
          <div className="hidden items-center gap-1.5 lg:flex">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={cn(
                      "relative rounded-md p-2 transition-colors",
                      pathname.startsWith("/admin")
                        ? "bg-sidebar-active text-amber-400"
                        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-amber-400"
                    )}
                    title="Admin Control Panel"
                  >
                    <Shield className="size-4" />
                  </Link>
                )}
                <NotificationBell />
                <UserMenu />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text transition-colors hidden sm:inline-block"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-xs transition-colors shadow-xs"
                >
                  Sign up
                </Link>
              </div>
            )}
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
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar-bg pt-14">
            {isAuthenticated ? (
              <>
                <MobileNavLinks onNavigate={() => setMobileOpen(false)} />
                <div className="flex-1" />
                <MobileUserFooter />
              </>
            ) : (
              <>
                <nav className="flex flex-col gap-1 px-3 py-2">
                  {[...PUBLIC_PRIMARY_NAV, ...PUBLIC_MORE_NAV].map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== "/battle" && pathname.startsWith(`${href}/`));
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors",
                          active
                            ? "bg-sidebar-active font-medium text-white"
                            : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                        <span className="flex-1">{label}</span>
                      </Link>
                    );
                  })}
                </nav>
                <div className="flex-1" />
                <div className="border-t border-sidebar-border p-4 flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-text hover:bg-sidebar-hover transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

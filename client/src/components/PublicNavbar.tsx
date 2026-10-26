"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Swords } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/stores/auth-store";
import { Avatar } from "@/components/ui";

export function PublicNavbar() {
  const pathname = usePathname();
  const { user, status } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const wide = window.matchMedia("(min-width: 901px)");
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

  const isHome = pathname === "/";

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-[14px] bg-[#0B0B0C]/85 dark:bg-[#0B0B0C]/85 light:bg-[#FAF8F4]/88 border-b border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.08] transition-colors no-print">
        <div className="w-full max-w-[1160px] mx-auto px-6 h-[66px] flex items-center justify-between gap-[22px]">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-[17px] text-[#EFEDE8] dark:text-[#EFEDE8] light:text-[#141310] shrink-0 whitespace-nowrap hover:opacity-95 transition-opacity"
          >
            <LogoMark size={26} />
            <span>
              Code<span className="text-[#FF7A1A]">Complex</span>
            </span>
          </Link>

          {/* Desktop Nav Links - Identical to homepage */}
          <nav className="hidden md:flex items-center gap-7 text-[13.5px]">
            <Link
              href="/problems"
              className={`whitespace-nowrap transition-colors ${
                pathname === "/problems"
                  ? "text-[#EFEDE8] dark:text-[#EFEDE8] light:text-[#141310] font-medium"
                  : "text-[#A3A099] dark:text-[#A3A099] light:text-[#4F4B44] hover:text-[#EFEDE8] dark:hover:text-[#EFEDE8] light:hover:text-[#141310]"
              }`}
            >
              Problems
            </Link>
            <Link
              href={isHome ? "#modes" : "/#modes"}
              className="text-[#A3A099] dark:text-[#A3A099] light:text-[#4F4B44] hover:text-[#EFEDE8] dark:hover:text-[#EFEDE8] light:hover:text-[#141310] whitespace-nowrap transition-colors"
            >
              Modes
            </Link>
            <Link
              href={isHome ? "#ladder" : "/#ladder"}
              className="text-[#A3A099] dark:text-[#A3A099] light:text-[#4F4B44] hover:text-[#EFEDE8] dark:hover:text-[#EFEDE8] light:hover:text-[#141310] whitespace-nowrap transition-colors"
            >
              Ladder
            </Link>
            <Link
              href={isHome ? "#agents" : "/#agents"}
              className="text-[#A3A099] dark:text-[#A3A099] light:text-[#4F4B44] hover:text-[#EFEDE8] dark:hover:text-[#EFEDE8] light:hover:text-[#141310] whitespace-nowrap transition-colors"
            >
              For agents
            </Link>
            <Link
              href="/faq"
              className={`whitespace-nowrap transition-colors ${
                pathname === "/faq"
                  ? "text-[#EFEDE8] dark:text-[#EFEDE8] light:text-[#141310] font-medium"
                  : "text-[#A3A099] dark:text-[#A3A099] light:text-[#4F4B44] hover:text-[#EFEDE8] dark:hover:text-[#EFEDE8] light:hover:text-[#141310]"
              }`}
            >
              FAQ
            </Link>
          </nav>

          {/* Nav End Actions */}
          <div className="flex items-center gap-[18px] text-[13.5px] shrink-0">
            <ThemeToggle className="text-[#A3A099] hover:text-[#EFEDE8] dark:hover:text-[#EFEDE8] light:hover:text-[#141310] hidden sm:flex" />

            {status === "authed" && user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/battle"
                  className="inline-flex items-center gap-1.5 h-[33px] px-3.5 rounded-full border border-[#FF7A1A]/40 bg-[#FF7A1A]/10 text-xs font-mono text-[#FF7A1A] hover:bg-[#FF7A1A]/20 transition-colors"
                >
                  <Swords className="size-3" /> Enter 1v1 Arena
                </Link>
                <Link
                  href={`/profile/${user.username}`}
                  className="hidden sm:inline-flex items-center gap-2 h-[33px] pl-1 pr-3 rounded-full border border-white/12 dark:border-white/12 light:border-black/15 bg-white/[0.03] text-xs font-mono text-[#EFEDE8] hover:border-white/30 transition-colors"
                >
                  <Avatar src={user.avatar?.profileImageURL} name={user.username} size={22} />
                  <span>{user.username}</span>
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[#A3A099] dark:text-[#A3A099] light:text-[#4F4B44] hover:text-[#EFEDE8] dark:hover:text-[#EFEDE8] light:hover:text-[#141310] whitespace-nowrap transition-colors hidden sm:inline-block"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-[7px] h-[33px] px-[15px] rounded-full border border-white/12 dark:border-white/12 light:border-black/15 font-mono text-[10.5px] font-medium tracking-[0.11em] uppercase text-[#A3A099] dark:text-[#A3A099] light:text-[#4F4B44] hover:text-[#EFEDE8] dark:hover:text-[#EFEDE8] light:hover:text-[#141310] hover:border-white/30 dark:hover:border-white/30 light:hover:border-black/30 whitespace-nowrap transition-colors"
                >
                  SIGN UP
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center size-[38px] rounded-lg text-[#A3A099] hover:text-[#EFEDE8] hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="public-mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            id="public-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed top-0 right-0 bottom-0 z-61 w-[min(310px,84vw)] flex flex-col p-[18px_22px_26px] bg-[#101012] dark:bg-[#101012] light:bg-[#F1ECE3] border-l border-white/12 dark:border-white/12 light:border-black/15 overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3 h-[42px] mb-3">
              <span className="font-mono text-[10.5px] font-medium tracking-[0.15em] uppercase text-[#85827B]">
                Menu
              </span>
              <button
                type="button"
                className="inline-flex items-center justify-center size-[38px] -mr-2 rounded-lg text-[#A3A099] hover:text-[#EFEDE8] hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className="flex flex-col">
              <Link
                href="/problems"
                className="block py-3.5 border-t border-white/7 dark:border-white/7 light:border-black/8 text-[17px] font-semibold text-[#EFEDE8] dark:text-[#EFEDE8] light:text-[#141310]"
                onClick={() => setMenuOpen(false)}
              >
                Problems
              </Link>
              <Link
                href={isHome ? "#modes" : "/#modes"}
                className="block py-3.5 border-t border-white/7 dark:border-white/7 light:border-black/8 text-[17px] font-semibold text-[#EFEDE8] dark:text-[#EFEDE8] light:text-[#141310]"
                onClick={() => setMenuOpen(false)}
              >
                Modes
              </Link>
              <Link
                href={isHome ? "#ladder" : "/#ladder"}
                className="block py-3.5 border-t border-white/7 dark:border-white/7 light:border-black/8 text-[17px] font-semibold text-[#EFEDE8] dark:text-[#EFEDE8] light:text-[#141310]"
                onClick={() => setMenuOpen(false)}
              >
                Ladder
              </Link>
              <Link
                href={isHome ? "#agents" : "/#agents"}
                className="block py-3.5 border-t border-white/7 dark:border-white/7 light:border-black/8 text-[17px] font-semibold text-[#EFEDE8] dark:text-[#EFEDE8] light:text-[#141310]"
                onClick={() => setMenuOpen(false)}
              >
                For agents
              </Link>
              <Link
                href="/faq"
                className="block py-3.5 border-t border-white/7 dark:border-white/7 light:border-black/8 text-[17px] font-semibold text-[#EFEDE8] dark:text-[#EFEDE8] light:text-[#141310]"
                onClick={() => setMenuOpen(false)}
              >
                FAQ
              </Link>
            </div>

            <div className="mt-6 pt-5 border-t border-white/12 dark:border-white/12 light:border-black/15 flex flex-col items-start gap-3.5">
              <ThemeToggle className="text-[#A3A099]" />
              {status === "authed" ? (
                <Link
                  href="/battle"
                  className="w-full flex items-center justify-center h-12 rounded-full bg-[#FF7A1A] text-[#0B0B0C] font-bold text-[15px] hover:bg-[#FF9040] transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Enter 1v1 Arena
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-[#A3A099] dark:text-[#A3A099] light:text-[#4F4B44] hover:text-[#EFEDE8] text-[15px] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="w-full flex items-center justify-center h-12 rounded-full bg-[#FF7A1A] text-[#0B0B0C] font-bold text-[15px] hover:bg-[#FF9040] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Start a duel
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

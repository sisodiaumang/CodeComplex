"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/stores/theme-store";

const THEME_META = {
  light: { icon: Sun, label: "Light", next: "Switch to dark mode" },
  dark: { icon: Moon, label: "Dark", next: "Switch to system theme" },
  system: { icon: Monitor, label: "System", next: "Switch to light mode" },
} as const;

/**
 * `className` overrides the colour treatment only. Omitting it keeps the
 * original sidebar palette, so existing call sites are unchanged.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, cycle } = useTheme();
  const meta = THEME_META[theme];
  const Icon = meta.icon;

  return (
    <button
      onClick={cycle}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className ??
          "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
      )}
      title={meta.next}
      aria-label={meta.next}
    >
      <Icon className="size-4" />
      <span className="hidden text-xs font-medium sm:inline">{meta.label}</span>
    </button>
  );
}

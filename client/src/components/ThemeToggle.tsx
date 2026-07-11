"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/stores/theme-store";

const THEME_META = {
  light: { icon: Sun, label: "Light", next: "Switch to dark mode" },
  dark: { icon: Moon, label: "Dark", next: "Switch to system theme" },
  system: { icon: Monitor, label: "System", next: "Switch to light mode" },
} as const;

export function ThemeToggle() {
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

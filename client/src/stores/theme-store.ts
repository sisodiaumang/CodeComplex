import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  cycle: () => void;
}

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

function apply(theme: Theme) {
  const r = resolve(theme);
  document.documentElement.setAttribute("data-theme", r);
  localStorage.setItem("devwar-theme", theme);
  return r;
}

const ORDER: Theme[] = ["light", "dark", "system"];

export const useTheme = create<ThemeState>((set) => ({
  theme: "dark",
  resolved: "dark",
  setTheme: (t) => {
    const r = apply(t);
    set({ theme: t, resolved: r });
  },
  cycle: () =>
    set((s) => {
      const idx = ORDER.indexOf(s.theme);
      const next = ORDER[(idx + 1) % ORDER.length];
      const r = apply(next);
      return { theme: next, resolved: r };
    }),
}));

export function initTheme() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem("devwar-theme") as Theme | null;
  const theme: Theme =
    saved === "light" || saved === "dark" || saved === "system"
      ? saved
      : "dark";
  const r = apply(theme);
  useTheme.setState({ theme, resolved: r });

  // Listen for OS theme changes when in system mode
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    const current = useTheme.getState().theme;
    if (current === "system") {
      const r = apply("system");
      useTheme.setState({ resolved: r });
    }
  });
}

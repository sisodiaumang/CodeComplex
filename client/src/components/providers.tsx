"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Me } from "@/lib/types";
import { useAuth } from "@/stores/auth-store";
import { initTheme } from "@/stores/theme-store";

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const setUser = useAuth((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;

    api<Me>("/user/me")
      .then((me) => {
        if (!cancelled) setUser(me ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return <>{children}</>;
}

function ThemeBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initTheme();

    // Disable right-click context menu
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable developer tools shortcuts
    const disableDevShortcuts = (e: KeyboardEvent) => {
      // Prevent F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Prevent Ctrl + Shift + I, J, C
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "i" || e.key === "j" || e.key === "c")) {
        e.preventDefault();
      }
      // Prevent Ctrl + U (View Source)
      if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", disableContextMenu);
    document.addEventListener("keydown", disableDevShortcuts);

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("keydown", disableDevShortcuts);
    };
  }, []);
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeBootstrap>
        <AuthBootstrap>{children}</AuthBootstrap>
      </ThemeBootstrap>
    </QueryClientProvider>
  );
}

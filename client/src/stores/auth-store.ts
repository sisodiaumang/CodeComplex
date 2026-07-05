import { create } from "zustand";
import type { Me } from "@/lib/types";

export type AuthStatus = "loading" | "authed" | "guest";

interface AuthState {
  user: Me | null;
  status: AuthStatus;
  setUser: (user: Me | null) => void;
  patchUser: (patch: Partial<Me>) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: user ? "authed" : "guest" }),
  patchUser: (patch) =>
    set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
}));

import { create } from "zustand";

export interface AchievementToastData {
  id: string;
  name: string;
  description: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  category: string;
  xpReward?: number;
  icon?: string;
}

interface ToastState {
  toasts: AchievementToastData[];
  addToast: (toast: Omit<AchievementToastData, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

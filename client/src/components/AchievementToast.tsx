"use client";

import React, { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore, type AchievementToastData } from "@/stores/toast-store";
import { AchievementIcon } from "./AchievementIcon";

const RARITY_THEMES = {
  COMMON: {
    border: "border-slate-500/30",
    shadow: "shadow-[0_0_15px_rgba(100,116,139,0.2)]",
    text: "text-slate-400",
    badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    progress: "bg-slate-500",
    titleGlow: "text-slate-200",
    accent: "text-slate-400",
  },
  RARE: {
    border: "border-blue-500/30",
    shadow: "shadow-[0_0_20px_rgba(59,130,246,0.25)]",
    text: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    progress: "bg-blue-500",
    titleGlow: "text-blue-300 font-semibold",
    accent: "text-blue-400",
  },
  EPIC: {
    border: "border-purple-500/40",
    shadow: "shadow-[0_0_25px_rgba(168,85,247,0.3)]",
    text: "text-purple-400",
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/35",
    progress: "bg-purple-500",
    titleGlow: "text-purple-300 font-bold",
    accent: "text-purple-400",
  },
  LEGENDARY: {
    border: "border-amber-500/50",
    shadow: "shadow-[0_0_35px_rgba(245,158,11,0.4)] ring-1 ring-amber-500/20",
    text: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    progress: "bg-amber-500",
    titleGlow: "text-amber-300 font-extrabold tracking-wide",
    accent: "text-amber-400",
  },
};

function SingleAchievementToast({ toast }: { toast: AchievementToastData }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const theme = RARITY_THEMES[toast.rarity] || RARITY_THEMES.COMMON;

  useEffect(() => {
    // Start exit animation after 5.5s
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 5500);

    // Fully remove from store after 5.8s
    const removeTimer = setTimeout(() => {
      removeToast(toast.id);
    }, 5850);

    // Progress bar animation
    const startTime = Date.now();
    const duration = 5500;
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(nextProgress);
      if (nextProgress <= 0) {
        clearInterval(progressInterval);
      }
    }, 30);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
      clearInterval(progressInterval);
    };
  }, [toast.id, removeToast]);

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300);
  };

  return (
    <div
      className={cn(
        "pointer-events-auto relative w-96 overflow-hidden rounded-xl border bg-surface/95 p-4 pr-9 backdrop-blur-md transition-all duration-300",
        theme.border,
        theme.shadow,
        isExiting ? "animate-toast-out" : "animate-toast-in"
      )}
    >
      <div className="flex gap-4">
        {/* Left: Animated Icon Container */}
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl border bg-surface-2",
            theme.border
          )}
        >
          <AchievementIcon
            name={toast.name}
            category={toast.category}
            size="md"
            className={cn(theme.text)}
          />
        </div>

        {/* Center: Details */}
        <div className="min-w-0 flex-1 leading-snug">
          <div className="flex items-center gap-2">
            <span className={cn("text-[9px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border", theme.badge)}>
              {toast.rarity}
            </span>
            {toast.xpReward && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-success font-mono bg-success/10 border border-success/20 px-1.5 py-0.5 rounded">
                +{toast.xpReward} XP
              </span>
            )}
          </div>
          <h4 className={cn("mt-1 text-xs font-bold font-mono tracking-tight uppercase flex items-center gap-1", theme.titleGlow)}>
            <Sparkles className="size-3 text-amber-500 animate-pulse" />
            Achievement Unlocked!
          </h4>
          <p className="mt-0.5 text-[13px] font-bold text-text truncate">
            {toast.name}
          </p>
          <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
            {toast.description}
          </p>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={handleManualClose}
        className="absolute right-2 top-2 rounded p-1 text-text-faint hover:bg-surface-3 hover:text-text transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </button>

      {/* Progress countdown bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-border/20 rounded-b-xl overflow-hidden">
        <div
          className={cn("h-full transition-all duration-30 ease-linear", theme.progress)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function AchievementToastsContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <SingleAchievementToast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

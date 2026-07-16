"use client";

import React from "react";
import {
  Award,
  Sparkles,
  Zap,
  Shield,
  Trophy,
  Flame,
  Brain,
  MessageSquare,
  Swords,
  Star,
  Target,
  Cpu,
  Rocket,
  Layers,
  GitBranch,
  Code2,
  TrendingUp,
  Crown,
  Crosshair,
  Skull,
  Infinity,
  BotMessageSquare,
  Paintbrush,
  Server,
  Box,
  Milestone,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Map achievement names to Lucide SVG icons — no emojis
export const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  "First Blood":        Swords,
  "Rising Gladiator":   Shield,
  "Battle Hardened":    Shield,
  "Arena Regular":      Crosshair,
  "Bronze Veteran":     Award,
  "Legend":             Crown,
  "Centurion":          Layers,
  "Arena Champion":     Trophy,
  "First Win":          Star,
  "Victorious":         Trophy,
  "10 Victories":       Target,
  "Dominant":           TrendingUp,
  "Unstoppable":        Flame,
  "Battle Master":      Crown,
  "Streak Master":      Infinity,
  "Blazing Streak":     Zap,
  "First Blood DSA":    Code2,
  "DSA Starter":        Code2,
  "Problem Solver":     Brain,
  "Algorithm Ace":      Cpu,
  "Logic Wizard":       GitBranch,
  "DSA Expert":         Cpu,
  "Algorithm Overlord": Skull,
  "Legendary Coder":    Crown,
  "Novice Challenger":  Rocket,
  "Rising Star":        Star,
  "Elite Competitor":   Trophy,
  "Expert":             Brain,
  "Master":             Crown,
  "Prompt Novice":      BotMessageSquare,
  "Prompt Warrior":     MessageSquare,
  "Prompt Commander":   MessageSquare,
  "AI Whisperer":       Sparkles,
  "Prompt Master":      Crown,
  "Prompt Legend":      Skull,
  "Frontend Learner":   Paintbrush,
  "Frontend Artisan":   Paintbrush,
  "Frontend Master":    Crown,
  "Backend Learner":    Server,
  "Backend Architect":  Server,
  "Backend Overlord":   Skull,
  "Projects Initiate": Box,
  "Projects Developer":Layers,
  "Projects Titan":    Milestone,
};

interface AchievementIconProps {
  name: string;
  category: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AchievementIcon({ name, category, size = "md", className }: AchievementIconProps) {
  const Icon = ACHIEVEMENT_ICONS[name] ?? (
    category === "MATCHES" ? Trophy :
    category === "STREAK" ? Flame :
    category === "RATING" ? TrendingUp :
    category === "DSA" ? Code2 :
    category === "PROMPT_WAR" ? BotMessageSquare :
    Shield
  );
  const sizeClass = size === "sm" ? "size-5" : size === "lg" ? "size-9" : "size-6";
  return <Icon className={cn(sizeClass, className)} strokeWidth={1.75} />;
}

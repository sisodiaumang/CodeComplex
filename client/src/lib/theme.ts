// ─── Battle-mode colour map ───────────────────────────────────────────────

export type BattleType =
  | "DSA"
  | "BUG_FIX"
  | "PROMPT_WAR"
  | "BACKEND"
  | "FRONTEND"
  | "FULLSTACK";

export interface ModeColor {
  accent: string;
  subtle: string;
  hex: string;
  label: string;
  emoji: string;
}

export const MODE_COLORS: Record<BattleType, ModeColor> = {
  DSA: {
    accent: "var(--color-mode-dsa)",
    subtle: "var(--color-mode-dsa-subtle)",
    hex:    "#3B82F6",
    label:  "DSA",
    emoji:  "",
  },
  BUG_FIX: {
    accent: "var(--color-mode-bugfix)",
    subtle: "var(--color-mode-bugfix-subtle)",
    hex:    "#EF4444",
    label:  "Bug Fix",
    emoji:  "",
  },
  PROMPT_WAR: {
    accent: "var(--color-mode-promptwar)",
    subtle: "var(--color-mode-promptwar-subtle)",
    hex:    "#A855F7",
    label:  "Prompt War",
    emoji:  "",
  },
  BACKEND: {
    accent: "var(--color-mode-backend)",
    subtle: "var(--color-mode-backend-subtle)",
    hex:    "#2DB55D",
    label:  "Backend",
    emoji:  "",
  },
  FRONTEND: {
    accent: "var(--color-mode-frontend)",
    subtle: "var(--color-mode-frontend-subtle)",
    hex:    "#06B6D4",
    label:  "Frontend",
    emoji:  "",
  },
  FULLSTACK: {
    accent: "var(--color-mode-fullstack)",
    subtle: "var(--color-mode-fullstack-subtle)",
    hex:    "#F59E0B",
    label:  "Fullstack",
    emoji:  "",
  },
} as const;


// ─── Elo tier map ─────────────────────────────────────────────────────────

export type EloTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER";

export interface TierConfig {
  label: string;
  minRating: number;
  color: string;
  hex: string;
  emoji: string;
}

export const ELO_TIERS: TierConfig[] = [
  { label: "Bronze",      minRating: 0,    color: "var(--color-tier-bronze)",      hex: "#A16207", emoji: "" },
  { label: "Silver",      minRating: 1200, color: "var(--color-tier-silver)",      hex: "#6B7280", emoji: "" },
  { label: "Gold",        minRating: 1400, color: "var(--color-tier-gold)",        hex: "#D97706", emoji: "" },
  { label: "Platinum",    minRating: 1600, color: "var(--color-tier-platinum)",    hex: "#0891B2", emoji: "" },
  { label: "Diamond",     minRating: 1800, color: "var(--color-tier-diamond)",     hex: "#2563EB", emoji: "" },
  { label: "Master",      minRating: 2000, color: "var(--color-tier-master)",      hex: "#DC2626", emoji: "" },
  { label: "Grandmaster", minRating: 2200, color: "var(--color-tier-grandmaster)", hex: "#B45309", emoji: "" },
] as const;

/** Returns the tier config for a given rating value. */
export function getTier(rating: number): TierConfig {
  for (let i = ELO_TIERS.length - 1; i >= 0; i--) {
    if (rating >= ELO_TIERS[i].minRating) return ELO_TIERS[i];
  }
  return ELO_TIERS[0];
}

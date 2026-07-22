"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, CalendarDays, Pencil, Trophy, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  avatarUrl,
  unwrapList,
  type Achievement,
  type PublicUser,
  type RatingsMap,
  type Match,
} from "@/lib/types";
import { MODE_COLORS, type BattleType } from "@/lib/theme";
import { cn, countryFlag, formatDate } from "@/lib/utils";
import { useAuth } from "@/stores/auth-store";
import KeyboardMascotAnimation from "@/components/KeyboardMascotAnimation";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Skeleton,
  Spinner,
  TierBadge,
} from "@/components/ui";
import { AchievementIcon } from "@/components/AchievementIcon";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const LeetcodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863 0-.713.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.05 5.05 0 0 0-3.85-1.393c-1.42 0-2.84.53-3.882 1.572l-4.32 4.38a5.534 5.534 0 0 0-1.571 3.924c0 1.45.568 2.87 1.571 3.925l4.332 4.363a5.503 5.503 0 0 0 3.882 1.571c1.45 0 2.84-.567 3.882-1.571l2.697-2.607c.514-.514.496-1.365-.039-1.901-.535-.535-1.386-.552-1.9.038zM20.811 13.01H10.666c-.702 0-1.27.568-1.27 1.27 0 .702.568 1.27 1.27 1.27h10.145c.702 0 1.27-.568 1.27-1.27 0-.702-.568-1.27-1.27-1.27zM13.616 2.05a1.27 1.27 0 0 0-1.27 1.27v4.18c0 .702.568 1.27 1.27 1.27.702 0 1.27-.568 1.27-1.27V3.32c0-.702-.568-1.27-1.27-1.27z" />
  </svg>
);

const FlameIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="flameOuter" x1="12" y1="4" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF9100" />
        <stop offset="50%" stopColor="#FF3D00" />
        <stop offset="100%" stopColor="#C62828" />
      </linearGradient>
      <linearGradient id="flameInner" x1="12" y1="13" x2="12" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF59D" />
        <stop offset="60%" stopColor="#FFEB3B" />
        <stop offset="100%" stopColor="#FF9100" />
      </linearGradient>
      <filter id="flameGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Outer Glow Backing */}
    <path
      d="M17.55 11.2C17.52 10.98 17.47 10.77 17.4 10.57C16.92 9.07 15.42 8.32 14.28 7.37C13.48 6.7 12.87 5.8 12.7 4.75C12.3 4.97 11.94 5.25 11.64 5.58C9.52 7.9 9.3 11.45 11.08 14.02C11.18 14.17 11.17 14.37 11.05 14.5C10.92 14.62 10.72 14.63 10.58 14.52C9.58 13.75 9.05 12.48 9.05 11.23C9.05 10.63 9.18 10.05 9.4 9.53C7.57 10.87 6.5 13.08 6.5 15.5C6.5 19.1 9.4 22 13 22C16.6 22 19.5 19.1 19.5 15.5C19.5 13.97 18.73 12.42 17.55 11.2Z"
      fill="#FF3D00"
      opacity="0.25"
      filter="url(#flameGlow)"
    />
    {/* Outer main flame */}
    <path
      d="M17.55 11.2C17.52 10.98 17.47 10.77 17.4 10.57C16.92 9.07 15.42 8.32 14.28 7.37C13.48 6.7 12.87 5.8 12.7 4.75C12.3 4.97 11.94 5.25 11.64 5.58C9.52 7.9 9.3 11.45 11.08 14.02C11.18 14.17 11.17 14.37 11.05 14.5C10.92 14.62 10.72 14.63 10.58 14.52C9.58 13.75 9.05 12.48 9.05 11.23C9.05 10.63 9.18 10.05 9.4 9.53C7.57 10.87 6.5 13.08 6.5 15.5C6.5 19.1 9.4 22 13 22C16.6 22 19.5 19.1 19.5 15.5C19.5 13.97 18.73 12.42 17.55 11.2Z"
      fill="url(#flameOuter)"
    />
    {/* Inner main core */}
    <path
      d="M14.45 19.5C12.55 19.5 11 17.95 11 16.05C11 14.88 11.62 13.88 12.57 13.33C12.72 13.25 12.92 13.28 13.03 13.42C13.15 13.57 13.13 13.78 12.98 13.9C12.38 14.38 12.05 15.12 12.05 15.9C12.05 17.22 13.13 18.3 14.45 18.3C15.77 18.3 16.85 17.22 16.85 15.9C16.85 15.17 16.5 14.45 15.92 13.98C15.78 13.87 15.75 13.67 15.85 13.52C15.95 13.37 16.15 13.32 16.32 13.42C17.38 14.02 18.05 15.15 18.05 16.4C18.05 18.1 16.43 19.5 14.45 19.5Z"
      fill="url(#flameInner)"
    />
  </svg>
);

const RATING_KEYS: Array<{ key: keyof RatingsMap; mode: BattleType }> = [
  { key: "dsa", mode: "DSA" },
  { key: "frontend", mode: "FRONTEND" },
  { key: "backend", mode: "BACKEND" },
  { key: "projects", mode: "PROJECTS" },
  { key: "promptWar", mode: "PROMPT_WAR" },
];

function normalizeRatings(data: unknown): Partial<RatingsMap> {
  if (!data || typeof data !== "object") return {};
  const obj = data as Record<string, unknown>;
  const source =
    obj.ratings && typeof obj.ratings === "object"
      ? (obj.ratings as Record<string, unknown>)
      : obj;
  const out: Partial<RatingsMap> = {};
  for (const { key } of RATING_KEYS) {
    const v = source[key];
    if (typeof v === "number") out[key] = v;
  }
  return out;
}

const RARITY_STYLES: Record<string, string> = {
  COMMON: "border-border text-text-muted",
  RARE: "border-info/30 text-info",
  EPIC: "border-mode-promptwar/30 text-mode-promptwar",
  LEGENDARY: "border-draw/30 text-draw",
};

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Left Column (Sidebar style details) */}
      <div className="space-y-6 w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
        {/* Identity Card Skeleton */}
        <Card className="overflow-hidden border border-border bg-surface shadow-md">
          {/* Card Header Gradient banner */}
          <div className="h-20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border" />
          
          <div className="relative -mt-10 flex flex-col items-center px-4 pb-6 text-center">
            <Skeleton className="h-20 w-20 rounded-full ring-4 ring-surface shadow-md" />
            <div className="mt-4 w-full flex flex-col items-center space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
            
            <div className="mt-5 w-full space-y-4 border-t border-border/60 pt-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <div className="mt-5 h-9 w-full bg-surface-3 rounded-md animate-pulse" />
          </div>
        </Card>

        {/* Streak Card Skeleton */}
        <Card className="p-5 flex items-center gap-4 border border-border/80 bg-surface shadow-md">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        </Card>
        
        {/* Bio Card Skeleton */}
        <Card className="p-5 space-y-3">
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-4 w-full" count={3} />
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Ratings grid skeleton */}
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-44" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-border/60 rounded-xl p-4.5 space-y-2 bg-surface-2">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        </Card>

        {/* Activity Chart skeleton */}
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </Card>
      </div>
    </div>
  );
}

const BANNER_CLASSES: Record<string, string> = {
  apprentice: "bg-slate-950 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:10px_10px] border-slate-800 text-slate-400",
  novice: "bg-blue-950 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] bg-[size:8px_8px] border-blue-900 text-blue-400",
  bug_hunter: "bg-emerald-950 bg-[linear-gradient(45deg,#064e3b_25%,transparent_25%),linear-gradient(-45deg,#064e3b_25%,transparent_25%)] bg-[size:6px_6px] border-emerald-900 text-emerald-400",
  explorer: "bg-indigo-950 bg-[repeating-linear-gradient(45deg,#312e81,#312e81_4px,transparent_4px,transparent_8px)] border-indigo-900/60 text-indigo-400",
  architect: "bg-zinc-900 bg-[linear-gradient(to_bottom,transparent_95%,#0891b2_95%)] bg-[size:100%_12px] border-cyan-900/60 text-cyan-400",
  overlord: "bg-rose-950 bg-[repeating-linear-gradient(-45deg,#991b1b,#991b1b_2px,transparent_2px,transparent_8px)] border-rose-900/60 text-rose-400",
  slinger: "bg-neutral-950 bg-[radial-gradient(#9d174d_1.2px,transparent_1.2px)] bg-[size:12px_12px] border-pink-900/50 text-pink-400",
  stack_overlord: "bg-stone-900 bg-[linear-gradient(27deg,#1c1917_25%,transparent_25%),linear-gradient(207deg,#1c1917_25%,transparent_25%)] bg-[size:8px_8px] border-amber-900/60 text-amber-400",
  cyber_sentient: "bg-stone-950 bg-[linear-gradient(to_right,#5b21b6_0.5px,transparent_0.5px),linear-gradient(to_bottom,#5b21b6_0.5px,transparent_0.5px)] bg-[size:16px_16px] border-violet-900/60 text-violet-400",
  grandmaster: "bg-black bg-[radial-gradient(#d97706_0.8px,transparent_0.8px)] bg-[size:14px_14px] border-amber-500/30 text-amber-500",
  void_walker: "bg-violet-950 bg-[radial-gradient(#c084fc_1px,transparent_1px)] bg-[size:20px_20px] border-purple-900/60 text-purple-400",
  stellar_monarch: "bg-slate-950 bg-[radial-gradient(#fcd34d_0.8px,transparent_0.8px)] bg-[size:16px_16px] border-amber-600/40 text-amber-300",
  binary_beast: "bg-black bg-[linear-gradient(to_bottom,rgba(16,185,129,0.1)_50%,transparent_50%)] bg-[size:100%_4px] border-emerald-900/50 text-emerald-400",
  quantum_specter: "bg-cyan-950 bg-[repeating-linear-gradient(135deg,#0e7490,#0e7490_3px,transparent_3px,transparent_12px)] border-cyan-800/50 text-cyan-400",
  neon_shogun: "bg-neutral-950 bg-[linear-gradient(115deg,#701a75_10%,transparent_10%),linear-gradient(295deg,#701a75_10%,transparent_10%)] bg-[size:12px_12px] border-fuchsia-900/60 text-fuchsia-400",
  apex_predator: "bg-red-950 bg-[radial-gradient(#dc2626_1.2px,transparent_1.2px)] bg-[size:18px_18px] border-red-800/60 text-red-400",
  shadow_agent: "bg-zinc-950 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-[size:14px_14px] border-zinc-800 text-zinc-400",
  solar_flare: "bg-amber-950 bg-[radial-gradient(#f97316_1px,transparent_1px)] bg-[size:10px_10px] border-orange-950/60 text-orange-400",
  abyss_watcher: "bg-slate-900 bg-[repeating-linear-gradient(45deg,#1e293b,#1e293b_10px,#0f172a_10px,#0f172a_20px)] border-slate-800/80 text-slate-300",
  celestial_deity: "bg-slate-950 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px),radial-gradient(#fbbf24_1px,transparent_1px)] bg-[size:24px_24px] border-slate-700/50 text-amber-200",
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const me = useAuth((s) => s.user);
  const isMe = me?.username?.toLowerCase() === username.toLowerCase();
  const [selectedMode, setSelectedMode] = useState<BattleType>("DSA");
  const [timeRange, setTimeRange] = useState<string>("12");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ count: number; date: Date; x: number; y: number } | null>(null);

  const profileQuery = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api<PublicUser>(`/user/${username}`),
  });

  const historyQuery = useQuery({
    queryKey: ["matches", "history", username],
    queryFn: () => api<unknown>(`/match/history?username=${username}&limit=100`),
  });

  if (profileQuery.isLoading) return <ProfileSkeleton />;

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <EmptyState
        title="Player not found"
        message={`No profile for "${username}".`}
      />
    );
  }

  const profile = profileQuery.data;
  const profileData = profile.profileData;
  
  const ratings: RatingsMap = profileData?.ratings || { dsa: 1200, frontend: 1200, backend: 1200, projects: 1200, promptWar: 1200, team: 1200 };
  const peakRatings: RatingsMap = profileData?.peakRatings || { dsa: 1200, frontend: 1200, backend: 1200, projects: 1200, promptWar: 1200, team: 1200 };
  const stats = profileData?.stats || { wins: 0, losses: 0, draws: 0, totalMatches: 0, dsaSolved: 0, frontendCompleted: 0, backendCompleted: 0, projectsCompleted: 0 };
  const streak = profileData?.streak || 0;
  const achievements = (profileData?.achievements || []) as Achievement[];
  const allMatches = unwrapList<Match>(historyQuery.data, "matches", "history");

  const best = Math.max(
    1200,
    ...Object.values(ratings).filter((v): v is number => typeof v === "number")
  );

  const wins = stats.wins ?? 0;
  const losses = stats.losses ?? 0;
  const draws = stats.draws ?? 0;
  const totalMatches = stats.totalMatches ?? 0;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const dsaSolved = stats.dsaSolved ?? 0;
  const frontendCompleted = stats.frontendCompleted ?? 0;
  const backendCompleted = stats.backendCompleted ?? 0;
  const projectsCompleted = stats.projectsCompleted ?? 0;

  const totalXp = achievements.reduce((sum, a) => sum + (a.xpReward ?? 0), 0);
  const currentLevel = Math.floor(totalXp / 1000) + 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Left Column (Sidebar style details) */}
      <div className="space-y-6 w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
        {/* Identity Card */}
        <Card className="overflow-hidden border border-border bg-surface shadow-md">
          {/* Card Header (Gradient background with custom mascot!) */}
          <div className={cn(
            "h-20 bg-gradient-to-r border-b relative overflow-hidden flex items-center justify-end px-4",
            BANNER_CLASSES[profile.banner ?? "apprentice"] || "from-primary/10 via-primary/5 to-transparent border-border"
          )}>
            <div className="scale-75 origin-bottom-right translate-y-3 opacity-90 z-10">
              <KeyboardMascotAnimation active={true} pet={profile.mascot} onlyMascot={true} />
            </div>
          </div>
          
          <div className="relative -mt-10 flex flex-col items-center px-4 pb-6 text-center">
            <Avatar
              src={avatarUrl(profile.avatar)}
              name={profile.username}
              size={80}
              className="ring-4 ring-surface shadow-md"
            />
            <div className="mt-4 space-y-1">
              <h1 className="flex items-center justify-center gap-1.5 text-xl font-bold text-text">
                {profile.username}
                {profile.country && (
                  <span className="text-sm" title={profile.country}>{countryFlag(profile.country)}</span>
                )}
              </h1>

              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono tracking-wider bg-primary/10 border border-primary/20 text-primary">
                  LVL {currentLevel}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono tracking-wider bg-surface-3 border border-border/80 text-text-muted">
                  {totalXp} XP
                </span>
              </div>

              {profile.fullName && (
                <p className="text-sm text-text-muted mt-1">{profile.fullName}</p>
              )}
            </div>

            {/* Social Links */}
            {(profile.githubProfile || profile.linkedinProfile || profile.leetcodeProfile) && (
              <div className="mt-4 flex justify-center gap-3">
                {profile.githubProfile && (
                  <a
                    href={profile.githubProfile.startsWith("http") ? profile.githubProfile : `https://${profile.githubProfile}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-8 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    title="GitHub"
                  >
                    <GithubIcon className="size-4.5" />
                  </a>
                )}
                {profile.leetcodeProfile && (
                  <a
                    href={profile.leetcodeProfile.startsWith("http") ? profile.leetcodeProfile : `https://${profile.leetcodeProfile}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-8 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    title="LeetCode"
                  >
                    <LeetcodeIcon className="size-4.5" />
                  </a>
                )}
                {profile.linkedinProfile && (
                  <a
                    href={profile.linkedinProfile.startsWith("http") ? profile.linkedinProfile : `https://${profile.linkedinProfile}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-8 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    title="LinkedIn"
                  >
                    <LinkedinIcon className="size-4.5" />
                  </a>
                )}
              </div>
            )}

            <div className="mt-5 w-full space-y-3.5 border-t border-border/60 pt-5 text-left text-sm text-text-muted">
              <div className="flex items-center justify-between">
                <span className="text-text-faint">Joined</span>
                <span className="flex items-center gap-1.5 font-medium text-text">
                  <CalendarDays className="size-4 text-text-faint" />
                  {formatDate(profile.memberSince || profile.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-faint">Peak Tier</span>
                <TierBadge rating={best} />
              </div>
            </div>

            {isMe && (
              <Link href="/settings" className="mt-5 w-full">
                <Button variant="outline" size="sm" className="w-full justify-center gap-2">
                  <Pencil className="size-3.5" /> Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* Streak Card */}
        <Card className="relative overflow-hidden p-5 flex items-center gap-4 border border-border/80 bg-surface shadow-md hover:border-orange-500/30 transition-colors group">
          {/* Subtle background glow */}
          <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-orange-500/5 blur-2xl group-hover:bg-orange-500/10 transition-colors" />
          
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-orange-500/10 to-red-500/5 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.08)]">
            <FlameIcon className="size-7 animate-pulse" />
          </div>
          <div className="space-y-0.5 z-10">
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Active Win Streak</p>
            <p className="text-2xl font-black text-text tracking-tight">
              {streak} <span className="text-sm font-normal text-text-muted">Wins</span>
            </p>
            <p className="text-[11px] text-text-faint font-medium">
              {streak > 0 ? "Keep the winning streak alive!" : "Win your first match to start!"}
            </p>
          </div>
        </Card>

        {/* Bio Card (only if exists) */}
        {profile.bio && (
          <Card className="p-5 space-y-2">
            <span className="text-xs font-semibold text-text-faint uppercase tracking-wider">Bio</span>
            <p className="text-sm text-text-muted leading-relaxed break-words whitespace-pre-wrap">
              {profile.bio}
            </p>
          </Card>
        )}

        {/* Achievements Card (moved to left sidebar) */}
        <Card className="p-5 space-y-4 shadow-sm bg-surface border-border">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <Link href="/achievements" className="flex items-center gap-1 group cursor-pointer">
              <span className="text-xs font-bold text-text-faint group-hover:text-primary transition-colors uppercase tracking-wider font-mono">
                Achievements
              </span>
              <ChevronRight className="size-3.5 text-text-faint group-hover:text-primary transition-colors" />
            </Link>
            {achievements.length > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 font-bold font-mono">
                {achievements.length}
              </span>
            )}
          </div>
          {achievements.length === 0 ? (
            <p className="text-xs text-text-faint italic py-2 text-center">
              No achievements unlocked yet.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {achievements.map((a) => {
                  const rarityColors: Record<string, string> = {
                    COMMON: "text-slate-400 border-slate-500/20 bg-slate-500/5",
                    RARE: "text-blue-400 border-blue-500/20 bg-blue-500/5",
                    EPIC: "text-purple-400 border-purple-500/20 bg-purple-500/5",
                    LEGENDARY: "text-amber-400 border-amber-500/25 bg-amber-500/5",
                  };
                  const colorClass = rarityColors[a.rarity] || rarityColors.COMMON;
                  return (
                    <Link
                      href="/achievements"
                      key={a._id ?? a.name}
                      className="flex items-center gap-3 p-2 rounded-lg border border-border/60 bg-surface-2/40 hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <div className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg border shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]",
                        colorClass
                      )}>
                        <AchievementIcon
                          name={a.name}
                          category={a.category ?? ""}
                          size="sm"
                        />
                      </div>
                      <div className="min-w-0 flex-1 leading-snug">
                        <p className="text-xs font-bold text-text truncate">
                          {a.name}
                        </p>
                        <p className="text-[8px] text-text-faint uppercase font-bold tracking-wider font-mono mt-0.5">
                          {a.rarity}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="pt-1.5 border-t border-border/40">
                <Link href="/achievements">
                  <Button variant="ghost" size="sm" className="w-full text-xs font-bold py-1.5 h-8 font-mono border border-border/60 hover:bg-surface-2">
                    Open Badges Hub
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right Column (Stats and charts) */}
      <div className="space-y-6">
        {/* Ratings Section */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-text-muted uppercase tracking-wider">Competitive Ratings</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {RATING_KEYS.map(({ key, mode }) => {
              const rating = ratings[key] ?? 1200;
              const peak = peakRatings[key] ?? 1200;
              const color = MODE_COLORS[mode];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-border bg-surface px-5 py-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm text-text-faint">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: color.accent }}
                      />
                      {color.label}
                    </div>
                    <p className="mt-2 font-mono text-2xl font-semibold text-text">
                      {rating}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-text-faint">
                    <span>Peak</span>
                    <span className="font-mono font-medium">{peak}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LeetCode style Performance Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Matches Performance Donut */}
          <Card className="p-5 flex items-center justify-between gap-6">
            <div className="flex flex-col justify-between h-full py-1">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-text-faint uppercase tracking-wider block">Performance</span>
                <div className="text-2xl font-bold text-text">
                  {totalMatches} <span className="text-sm font-normal text-text-faint">Matches</span>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full bg-win" />
                  <span className="text-text-muted font-medium w-12">Wins</span>
                  <span className="text-text font-bold">{wins}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full bg-loss" />
                  <span className="text-text-muted font-medium w-12">Losses</span>
                  <span className="text-text font-bold">{losses}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full bg-draw" />
                  <span className="text-text-muted font-medium w-12">Draws</span>
                  <span className="text-text font-bold">{draws}</span>
                </div>
              </div>
            </div>
            
            <div className="relative flex items-center justify-center size-28 shrink-0">
              <svg className="size-full transform -rotate-90">
                {/* Background ring */}
                <circle
                  cx="56"
                  cy="56"
                  r="38"
                  className="stroke-border fill-transparent"
                  strokeWidth="8"
                />
                {/* Foreground filled ring */}
                <circle
                  cx="56"
                  cy="56"
                  r="38"
                  className="stroke-win fill-transparent transition-all duration-500 ease-out"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 - (winRate / 100) * (2 * Math.PI * 38)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-text leading-none">{winRate}%</span>
                <span className="text-[10px] text-text-faint font-semibold uppercase mt-0.5 tracking-wider">Win Rate</span>
              </div>
            </div>
          </Card>

          {/* Solved Summary Progress Bars */}
          <Card className="p-5 space-y-4">
            <span className="text-xs font-semibold text-text-faint uppercase tracking-wider block">Solved Summary</span>
            <div className="space-y-3.5">
              {[
                { label: "DSA Problems Solved", value: dsaSolved, color: "bg-mode-dsa" },
                { label: "Frontend Challenges", value: frontendCompleted, color: "bg-mode-frontend" },
                { label: "Backend Challenges", value: backendCompleted, color: "bg-mode-backend" },
                { label: "Project Challenges", value: projectsCompleted, color: "bg-mode-projects" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted font-medium">{item.label}</span>
                    <span className="text-text font-bold">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", item.color)} 
                      style={{ width: `${Math.min(100, item.value > 0 ? Math.max(10, (item.value / 20) * 100) : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 12-Month Battle Activity Heatmap */}
        {(() => {
          const timeRangeWeeks: Record<string, number> = {
            "12": 53,
            "6": 26,
            "3": 13,
            "1": 5
          };
          const COLS = timeRangeWeeks[timeRange] || 53;
          const totalDays = COLS * 7;

          const todayDate = new Date();
          const dayOfWeek = todayDate.getDay();
          
          const startDate = new Date(todayDate);
          startDate.setDate(startDate.getDate() - (totalDays - 7) - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);

          const activityData = Array.from({ length: totalDays }, (_, index) => {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + index);
            
            const dayStart = currentDate.getTime();
            const dayEnd = dayStart + 86400000;
            
            const count = allMatches.filter((m) => {
              if (m.battleType !== selectedMode) return false;
              const t = new Date(m.endedAt ?? m.createdAt ?? "").getTime();
              return t >= dayStart && t < dayEnd;
            }).length;
            
            return { date: currentDate, count };
          });

          const lastYearMatchesCount = activityData.reduce((sum, d) => sum + d.count, 0);

          const CELL = 13;
          const GAP = 3;
          const ROWS = 7;
          const gridW = COLS * CELL + (COLS - 1) * GAP;
          const gridH = ROWS * CELL + (ROWS - 1) * GAP;

          // Mode-specific configuration for labels and singular/plural nouns
          const MODES: { label: string; value: BattleType; unit: string; plural: string }[] = [
            { label: "DSA", value: "DSA", unit: "test", plural: "tests" },
            { label: "Bug Fix", value: "BUG_FIX", unit: "bug fix", plural: "bug fixes" },
            { label: "Prompt War", value: "PROMPT_WAR", unit: "war", plural: "wars" },
            { label: "Backend", value: "BACKEND", unit: "battle", plural: "battles" },
            { label: "Frontend", value: "FRONTEND", unit: "battle", plural: "battles" },
            { label: "Projects", value: "PROJECTS", unit: "battle", plural: "battles" },
          ];

          const currentModeConfig = MODES.find((m) => m.value === selectedMode) || MODES[0];
          const unitLabel = lastYearMatchesCount === 1 ? currentModeConfig.unit : currentModeConfig.plural;

          const activeColor = MODE_COLORS[selectedMode];
          const accentVar = activeColor.accent;

          const fmtTooltip = (d: { date: Date; count: number }) => {
            const day = d.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
            const noun = d.count === 1 ? currentModeConfig.unit : currentModeConfig.plural;
            return `${d.count} ${noun} on ${day}`;
          };

          return (
            <Card className="px-6 py-5 space-y-5">
              {/* Header row */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 rounded-md border border-border bg-surface-2 hover:bg-surface-3 hover:border-border-hover px-3 py-1.5 text-sm font-mono text-text-muted cursor-pointer transition-colors select-none"
                    >
                      <span>
                        {timeRange === "12" && "last 12 months"}
                        {timeRange === "6" && "last 6 months"}
                        {timeRange === "3" && "last 3 months"}
                        {timeRange === "1" && "last 30 days"}
                      </span>
                      <ChevronDown className="size-3.5 text-text-faint transition-transform duration-200" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                    </button>

                    {isDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40 cursor-default"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute left-0 mt-1.5 w-[160px] rounded-lg border border-border bg-surface shadow-xl z-50 py-1 font-mono text-sm animate-in fade-in duration-100">
                          {[
                            { value: "12", label: "last 12 months" },
                            { value: "6", label: "last 6 months" },
                            { value: "3", label: "last 3 months" },
                            { value: "1", label: "last 30 days" },
                          ].map((opt) => {
                            const isActive = timeRange === opt.value;
                            return (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  setTimeRange(opt.value);
                                  setIsDropdownOpen(false);
                                }}
                                className={cn(
                                  "px-3 py-2 cursor-pointer select-none transition-colors",
                                  isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-text-muted hover:bg-surface-2 hover:text-text"
                                )}
                              >
                                {opt.label}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  <span className="text-sm text-text-faint font-mono">
                    {lastYearMatchesCount} {unitLabel}
                  </span>
                </div>

                {/* Legend using active mode's color scale */}
                <div className="flex items-center gap-2 text-xs text-text-faint font-mono select-none">
                  <span>less</span>
                  <div className="flex items-center gap-1">
                    <div className="size-[13px] rounded-[2px] border border-border/60 dark:border-neutral-800/80 bg-transparent" />
                    <div className="size-[13px] rounded-[2px] border" style={{ backgroundColor: `color-mix(in srgb, ${accentVar} 20%, transparent)`, borderColor: `color-mix(in srgb, ${accentVar} 20%, transparent)` }} />
                    <div className="size-[13px] rounded-[2px] border" style={{ backgroundColor: `color-mix(in srgb, ${accentVar} 45%, transparent)`, borderColor: `color-mix(in srgb, ${accentVar} 45%, transparent)` }} />
                    <div className="size-[13px] rounded-[2px] border" style={{ backgroundColor: `color-mix(in srgb, ${accentVar} 70%, transparent)`, borderColor: `color-mix(in srgb, ${accentVar} 70%, transparent)` }} />
                    <div className="size-[13px] rounded-[2px] border" style={{ backgroundColor: accentVar, borderColor: accentVar }} />
                  </div>
                  <span>more</span>
                </div>
              </div>

              {/* Mode Selection Buttons */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-border/10">
                {MODES.map((mode) => {
                  const isActive = selectedMode === mode.value;
                  const modeAccent = MODE_COLORS[mode.value].accent;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setSelectedMode(mode.value)}
                      className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200 cursor-pointer select-none",
                        isActive
                          ? "border-neutral-900 dark:border-white font-semibold"
                          : "border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/10 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/80 hover:text-neutral-900 dark:hover:text-neutral-200"
                      )}
                      style={
                        isActive
                          ? {
                              color: modeAccent,
                              backgroundColor: `color-mix(in srgb, ${modeAccent} 12%, transparent)`, // 12% opacity color backing for better visibility
                              borderColor: modeAccent,
                            }
                          : undefined
                      }
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              {/* Grid area */}
              <div className="flex gap-3 pt-2">
                {/* Y-Axis day labels */}
                <div
                  className="flex flex-col justify-between shrink-0 select-none"
                  style={{ height: `${gridH}px`, width: "76px" }}
                >
                  <div style={{ height: `${CELL}px` }} />
                  <div style={{ height: `${CELL}px` }} className="flex items-center text-xs font-mono text-text-faint">monday</div>
                  <div style={{ height: `${CELL}px` }} />
                  <div style={{ height: `${CELL}px` }} className="flex items-center text-xs font-mono text-text-faint">wednesday</div>
                  <div style={{ height: `${CELL}px` }} />
                  <div style={{ height: `${CELL}px` }} className="flex items-center text-xs font-mono text-text-faint">friday</div>
                  <div style={{ height: `${CELL}px` }} />
                </div>

                {/* Heatmap Grid Wrapper */}
                <div className="relative flex-1 min-w-0">
                  <div className="overflow-x-auto scrollbar-thin pb-1">
                    <div
                      className="grid"
                      style={{
                        gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
                        gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
                        gridAutoFlow: "column",
                        gap: `${GAP}px`,
                        width: `${gridW}px`,
                      }}
                    >
                      {activityData.map((d, i) => {
                        const isLevel0 = d.count === 0;
                        const isLevel1 = d.count === 1;
                        const isLevel2 = d.count === 2;
                        const isLevel3 = d.count === 3;
                        const isLevel4 = d.count >= 4;

                        // Dynamic styling based on selected mode's active color
                        let cellStyle = {};
                        if (isLevel0) {
                          cellStyle = {};
                        } else if (isLevel1) {
                          cellStyle = {
                            backgroundColor: `color-mix(in srgb, ${accentVar} 20%, transparent)`,
                            borderColor: `color-mix(in srgb, ${accentVar} 20%, transparent)`
                          };
                        } else if (isLevel2) {
                          cellStyle = {
                            backgroundColor: `color-mix(in srgb, ${accentVar} 45%, transparent)`,
                            borderColor: `color-mix(in srgb, ${accentVar} 45%, transparent)`
                          };
                        } else if (isLevel3) {
                          cellStyle = {
                            backgroundColor: `color-mix(in srgb, ${accentVar} 70%, transparent)`,
                            borderColor: `color-mix(in srgb, ${accentVar} 70%, transparent)`
                          };
                        } else if (isLevel4) {
                          cellStyle = {
                            backgroundColor: accentVar,
                            borderColor: accentVar
                          };
                        }

                        return (
                          <div
                            key={i}
                            className={cn(
                              "rounded-[2px] transition-all duration-150 cursor-crosshair border",
                              isLevel0
                                ? "bg-transparent border-border/60 dark:border-neutral-800/80 hover:border-text dark:hover:border-white hover:ring-2 hover:ring-primary/20 dark:hover:ring-white/40"
                                : "hover:scale-105 hover:border-text dark:hover:border-white hover:ring-2 hover:ring-primary/20 dark:hover:ring-white/40"
                            )}
                            style={{
                              width: `${CELL}px`,
                              height: `${CELL}px`,
                              ...cellStyle,
                            }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const containerRect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                              if (containerRect) {
                                setHoveredCell({
                                  count: d.count,
                                  date: d.date,
                                  x: rect.left - containerRect.left + rect.width / 2,
                                  y: rect.top - containerRect.top,
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredCell(null)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Styled Tooltip */}
                  {hoveredCell && (
                    <div
                      className="absolute z-50 pointer-events-none flex flex-col items-center -translate-x-1/2 -translate-y-full mb-1 animate-in fade-in zoom-in-95 duration-100"
                      style={{
                        left: `${hoveredCell.x}px`,
                        top: `${hoveredCell.y}px`,
                      }}
                    >
                      <div className="bg-black/90 backdrop-blur-sm text-white text-[11px] font-mono py-1 px-2.5 rounded shadow-xl whitespace-nowrap border border-neutral-800">
                        {fmtTooltip(hoveredCell)}
                      </div>
                      {/* Arrow pointer */}
                      <div className="w-1.5 h-1.5 bg-black rotate-45 -mt-[3px] border-r border-b border-neutral-800" />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <p className="text-[10px] text-text-faint font-mono text-center">
                Note: All activity data is using UTC time.
              </p>
            </Card>
          );
        })()}
      </div>
    </div>
  );
}

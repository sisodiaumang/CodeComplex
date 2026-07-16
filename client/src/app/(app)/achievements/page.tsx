"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Lock,
  CheckCircle,
  Search,
  Sparkles,
  Zap,
  Shield,
  Trophy,
  Flame,
  Brain,
  MessageSquare,
  X,
  PawPrint,
} from "lucide-react";
import { api } from "@/lib/api";
import { unwrapList, type Achievement, type AchievementRarity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, Spinner, EmptyState, Button } from "@/components/ui";
import { AchievementIcon } from "@/components/AchievementIcon";


const CATEGORIES = [
  { id: "ALL", label: "All", icon: Award },
  { id: "MATCHES", label: "Matches", icon: Trophy },
  { id: "STREAK", label: "Streaks", icon: Flame },
  { id: "RATING", label: "Ratings", icon: Zap },
  { id: "DSA", label: "DSA", icon: Brain },
  { id: "PROMPT_WAR", label: "Prompt Wars", icon: MessageSquare },
  { id: "SPECIAL", label: "Special", icon: Shield },
];

const RARITIES: Record<
  AchievementRarity,
  { label: string; textClass: string; bgClass: string; borderClass: string; glowClass: string; dotColor: string }
> = {
  COMMON: {
    label: "Common",
    textClass: "text-slate-400 font-medium",
    bgClass: "from-slate-500/10 to-slate-600/5",
    borderClass: "border-slate-500/20",
    glowClass: "shadow-[0_0_10px_rgba(100,116,139,0.1)]",
    dotColor: "bg-slate-500",
  },
  RARE: {
    label: "Rare",
    textClass: "text-blue-400 font-semibold",
    bgClass: "from-blue-500/15 to-indigo-500/5 border-blue-500/30",
    borderClass: "border-blue-500/30",
    glowClass: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    dotColor: "bg-blue-500",
  },
  EPIC: {
    label: "Epic",
    textClass: "text-purple-400 font-bold",
    bgClass: "from-purple-500/20 to-pink-500/5 border-purple-500/40",
    borderClass: "border-purple-500/40",
    glowClass: "shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    dotColor: "bg-purple-500",
  },
  LEGENDARY: {
    label: "Legendary",
    textClass: "text-amber-400 font-extrabold tracking-wider uppercase text-[10px]",
    bgClass: "from-amber-500/25 to-yellow-500/5 border-amber-500/50 bg-gradient-to-br",
    borderClass: "border-amber-500/50",
    glowClass: "shadow-[0_0_30px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/20",
    dotColor: "bg-amber-500",
  },
};

export default function AchievementsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ACHIEVED" | "LOCKED">("ALL");
  const [inspectorAchievement, setInspectorAchievement] = useState<Achievement | null>(null);

  const query = useQuery({
    queryKey: ["achievements"],
    queryFn: () => api<unknown>("/achievements"),
  });

  const achievements = unwrapList<Achievement>(query.data, "achievements");

  const totalCount = achievements.length;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Mascot progress
  const mascots = achievements.filter((a) => a.mascotReward);
  const totalMascots = mascots.length;
  const unlockedMascots = mascots.filter((a) => a.unlocked).length;

  // Filtered achievements
  const filtered = achievements.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === "ALL" || a.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "ACHIEVED" && a.unlocked) ||
      (selectedStatus === "LOCKED" && !a.unlocked);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Circular progress SVG variables
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  if (query.isLoading) {
    return <Spinner className="py-24" />;
  }

  if (query.isError) {
    return (
      <EmptyState
        title="Failed to load achievements"
        message="Please check your connection and try again."
        action={<Button onClick={() => query.refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-12 items-start relative min-h-[calc(100vh-8rem)]">
      
      {/* ── LEFT SIDEBAR: User Console ── */}
      <div className="md:col-span-4 lg:col-span-3 space-y-6 md:sticky md:top-20">
        
        {/* Progress Console */}
        <Card className="p-6 bg-surface border-border flex flex-col items-center text-center space-y-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 size-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <h2 className="text-xs font-bold text-text-faint uppercase tracking-wider font-mono self-start">
            My Console Progress
          </h2>

          {/* Premium Circular SVG Progress */}
          <div className="relative flex items-center justify-center size-28">
            <svg className="size-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-border/40 fill-transparent"
                strokeWidth="8"
              />
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-primary fill-transparent transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-text tracking-tighter leading-none">
                {completionPercentage}%
              </span>
              <span className="text-[9px] font-mono text-text-faint font-semibold uppercase mt-0.5">
                Completed
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 pt-3 border-t border-border/40 font-mono text-center">
            <div>
              <p className="text-[10px] text-text-faint font-bold uppercase">Unlocked</p>
              <p className="text-lg font-black text-text mt-0.5">{unlockedCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-faint font-bold uppercase">Remaining</p>
              <p className="text-lg font-black text-text-muted mt-0.5">{totalCount - unlockedCount}</p>
            </div>
          </div>
        </Card>

        {/* Mascot Shelter Tracker */}
        <Card className="p-5 bg-surface border-border space-y-4 shadow-sm relative">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <span className="text-xs font-bold text-text-faint uppercase tracking-wider font-mono flex items-center gap-1.5">
              <PawPrint className="size-3.5 text-amber-500" />
              Mascot Shelter
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded px-1.5 py-0.5 font-bold font-mono">
              {unlockedMascots}/{totalMascots}
            </span>
          </div>

          <p className="text-[11px] text-text-muted leading-relaxed">
            Mascots are special companion pets awarded for legendary achievements. Keep playing to rescue them!
          </p>

          <div className="space-y-2 pt-1">
            {achievements
              .filter((a) => a.mascotReward)
              .map((ach) => {
                const pet = ach.mascotReward!;
                return (
                  <div
                    key={ach._id}
                    onClick={() => setInspectorAchievement(ach)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all hover:bg-surface-2",
                      ach.unlocked
                        ? "bg-amber-500/5 border-amber-500/20 text-text"
                        : "bg-surface-2/40 border-border/30 text-text-faint opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex size-7 items-center justify-center rounded-lg border shrink-0",
                        ach.unlocked ? "bg-amber-500/15 border-amber-500/30" : "bg-surface border-border/50"
                      )}>
                        <PawPrint className={cn("size-3.5", ach.unlocked ? "text-amber-500" : "text-text-faint")} strokeWidth={1.5} />
                      </div>
                      <span className="font-semibold">{pet.name}</span>
                    </div>
                    {ach.unlocked ? (
                      <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">
                        Active
                      </span>
                    ) : (
                      <span className="text-[9px] text-text-faint font-mono">Locked</span>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* ── RIGHT MAIN PANEL: Badges Board ── */}
      <div className={cn(
        "space-y-6 transition-all duration-300",
        inspectorAchievement ? "md:col-span-5 lg:col-span-6" : "md:col-span-8 lg:col-span-9"
      )}>
        
        {/* Controls Panel */}
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-4 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Status buttons */}
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5 self-start sm:self-auto font-mono">
            {(["ALL", "ACHIEVED", "LOCKED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                  selectedStatus === status
                    ? "bg-primary text-primary-fg"
                    : "text-text-muted hover:text-text"
                )}
              >
                {status === "ALL" ? "All" : status === "ACHIEVED" ? "Unlocked" : "Locked"}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex overflow-x-auto pb-1 gap-2 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border shrink-0 transition-all font-mono",
                  active
                    ? "bg-primary border-primary text-primary-fg shadow-sm"
                    : "bg-surface border-border text-text-muted hover:border-text-muted hover:text-text"
                )}
              >
                <Icon className="size-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Badges Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            title="No achievements matched"
            message="No achievements match your selection. Reset search or status filter."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ach) => {
              const rConf = RARITIES[ach.rarity];
              const isSelected = inspectorAchievement?._id === ach._id;

              return (
                <div
                  key={ach._id}
                  onClick={() => setInspectorAchievement(ach)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between",
                    ach.unlocked
                      ? "bg-surface hover:-translate-y-0.5 border-border hover:border-text-muted shadow-sm"
                      : "bg-surface/40 border-border/50 hover:border-border opacity-75",
                    isSelected && "ring-2 ring-primary border-transparent hover:border-transparent",
                    ach.unlocked && rConf.glowClass
                  )}
                >
                  {/* Badge circular container */}
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-tr transition-transform duration-300 group-hover:scale-105",
                        rConf.bgClass,
                        rConf.borderClass,
                        !ach.unlocked && "grayscale opacity-50"
                      )}
                    >
                      <AchievementIcon
                        name={ach.name}
                        category={ach.category ?? ""}
                        size="md"
                        className={cn(rConf.textClass.split(" ")[0])}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("size-1.5 rounded-full shrink-0", rConf.dotColor)} />
                        <span className={cn("text-[9px] font-bold tracking-wider uppercase font-mono", rConf.textClass)}>
                          {ach.rarity}
                        </span>
                      </div>
                      <h3 className="font-bold text-text truncate text-sm mt-0.5 leading-snug">
                        {ach.name}
                      </h3>
                    </div>
                  </div>

                  {/* Requirements & Pet Badge info */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] font-mono">
                    <div className="text-text-faint">
                      Target: <span className="font-bold text-text-muted">{ach.requirement}</span>
                    </div>
                    {ach.mascotReward && (
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px]">
                        <PawPrint className="size-2.5" />
                        Pet
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {ach.unlocked ? (
                        <CheckCircle className="size-3.5 text-success fill-success/10" />
                      ) : (
                        <Lock className="size-3.5 text-text-faint" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SLIDE-OUT DRAWER: Badge Inspector ── */}
      {inspectorAchievement && (
        <div className="md:col-span-3 lg:col-span-3 md:sticky md:top-20">
          <Card className="border border-border bg-surface p-5 space-y-5 shadow-lg relative animate-in fade-in slide-in-from-right duration-250">
            
            {/* Close button */}
            <button
              onClick={() => setInspectorAchievement(null)}
              className="absolute right-4 top-4 rounded-md p-1.5 text-text-faint hover:bg-surface-2 hover:text-text transition-colors"
            >
              <X className="size-4" />
            </button>

            {/* Title / Badge display */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div
                className={cn(
                  "flex size-20 items-center justify-center rounded-2xl border bg-gradient-to-tr shadow-md relative",
                  RARITIES[inspectorAchievement.rarity].bgClass,
                  RARITIES[inspectorAchievement.rarity].borderClass,
                  !inspectorAchievement.unlocked && "grayscale opacity-50"
                )}
              >
                <AchievementIcon
                  name={inspectorAchievement.name}
                  category={inspectorAchievement.category ?? ""}
                  size="lg"
                  className={cn(RARITIES[inspectorAchievement.rarity].textClass.split(" ")[0])}
                />
                
                {/* Big Lock Overlay if Locked */}
                {!inspectorAchievement.unlocked && (
                  <div className="absolute inset-0 bg-surface/30 backdrop-blur-xs flex items-center justify-center rounded-2xl">
                    <Lock className="size-6 text-text/60" />
                  </div>
                )}
              </div>

              <div>
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase font-mono border border-current bg-surface-2",
                  RARITIES[inspectorAchievement.rarity].textClass
                )}>
                  {inspectorAchievement.rarity}
                </span>
                <h3 className="font-extrabold text-text text-base mt-2 tracking-tight">
                  {inspectorAchievement.name}
                </h3>
                <p className="text-[10px] text-text-faint font-mono uppercase font-bold tracking-widest mt-1">
                  Category: {inspectorAchievement.category}
                </p>
              </div>
            </div>

            {/* Description & Requirements */}
            <div className="space-y-4 border-t border-border/40 pt-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-faint font-mono uppercase tracking-wider block">
                  Description
                </span>
                <p className="text-xs text-text-muted leading-relaxed font-medium">
                  {inspectorAchievement.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-surface-2/60 rounded-xl p-3 border border-border/40 font-mono text-center">
                <div>
                  <span className="text-[9px] font-bold text-text-faint uppercase block">Target</span>
                  <span className="text-sm font-extrabold text-text mt-0.5 block">
                    {inspectorAchievement.requirement}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-text-faint uppercase block">XP Reward</span>
                  <span className="text-sm font-extrabold text-primary mt-0.5 block">
                    +{inspectorAchievement.xpReward} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Mascot Companion Reward Slot */}
            {inspectorAchievement.mascotReward && (
              <div className={cn(
                "rounded-xl p-4 border space-y-2.5 relative transition-all",
                inspectorAchievement.unlocked
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300"
                  : "bg-surface-2 border-border/60 text-text-faint"
              )}>
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                    inspectorAchievement.unlocked ? "bg-amber-500/20 border-amber-500/40" : "bg-surface border-border"
                  )}>
                    <PawPrint className={cn("size-5", inspectorAchievement.unlocked ? "text-amber-500" : "text-text-faint")} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      Mascot Reward: {inspectorAchievement.mascotReward.name}
                    </h4>
                    <span className={cn(
                      "inline-flex items-center gap-0.5 text-[8px] font-bold uppercase rounded px-1.5 py-0.5 mt-0.5 font-mono",
                      inspectorAchievement.unlocked ? "bg-amber-500 text-black" : "bg-border text-text-muted"
                    )}>
                      {inspectorAchievement.unlocked ? <><PawPrint className="size-2" /> Companion Active</> : "Requires Unlock"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted leading-normal">
                  {inspectorAchievement.mascotReward.description}
                </p>
              </div>
            )}

            {/* Bottom status badge */}
            <div className="pt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-text-muted">
              {inspectorAchievement.unlocked ? (
                <>
                  <CheckCircle className="size-4 text-success fill-success/15" />
                  <span className="text-success font-bold font-mono text-[10px] uppercase tracking-wider">
                    Unlocked on Profile
                  </span>
                </>
              ) : (
                <>
                  <Lock className="size-4 text-text-faint" />
                  <span className="text-text-faint font-bold font-mono text-[10px] uppercase tracking-wider">
                    Locked
                  </span>
                </>
              )}
            </div>

          </Card>
        </div>
      )}

    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Crown, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { LeaderboardPage, LeaderboardPlayer } from "@/lib/types";
import { unwrapList } from "@/lib/types";
import { MODE_COLORS, type BattleType } from "@/lib/theme";
import { cn, countryFlag } from "@/lib/utils";
import { Avatar, Button, Card, EmptyState, Skeleton, Spinner, TierBadge } from "@/components/ui";

const MODES: BattleType[] = [
  "DSA",
  "BUG_FIX",
  "FRONTEND",
  "BACKEND",
  "PROMPT_WAR",
];

function normalizePage(data: unknown): LeaderboardPage {
  if (data && typeof data === "object" && Array.isArray((data as LeaderboardPage).players)) {
    return data as LeaderboardPage;
  }
  return { players: unwrapList<LeaderboardPlayer>(data, "players", "leaderboard") };
}

function getRankStyles(rank: number) {
  if (rank === 1) {
    return {
      rowClass: "bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-amber-500 shadow-[inset_4px_0_0_0_rgba(245,158,11,0.2)]",
      textClass: "text-amber-500 font-black flex items-center gap-1.5",
      iconClass: "text-amber-500 fill-amber-500/20 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-bounce",
      hasCrown: true,
      crownColor: "text-amber-500 fill-amber-500/15"
    };
  }
  if (rank === 2) {
    return {
      rowClass: "bg-slate-400/5 hover:bg-slate-400/10 border-l-4 border-slate-400/80 shadow-[inset_4px_0_0_0_rgba(148,163,184,0.15)]",
      textClass: "text-slate-400 font-extrabold flex items-center gap-1.5",
      iconClass: "text-slate-400 fill-slate-400/20",
      hasCrown: true,
      crownColor: "text-slate-400 fill-slate-400/10"
    };
  }
  if (rank === 3) {
    return {
      rowClass: "bg-amber-700/5 hover:bg-amber-700/10 border-l-4 border-amber-700/60 shadow-[inset_4px_0_0_0_rgba(180,83,9,0.15)]",
      textClass: "text-amber-700 font-extrabold flex items-center gap-1.5",
      iconClass: "text-amber-700/80 fill-amber-700/10",
      hasCrown: true,
      crownColor: "text-amber-700 fill-amber-700/5"
    };
  }
  return {
    rowClass: "hover:bg-surface-2",
    textClass: "text-text-faint font-mono font-medium",
    iconClass: "",
    hasCrown: false,
    crownColor: ""
  };
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<BattleType>("DSA");
  const [page, setPage] = useState(1);
  const [friendsOnly, setFriendsOnly] = useState(false);

  const endpoint = friendsOnly ? "/leaderboard/friends" : "/leaderboard/global";

  const query = useQuery({
    queryKey: ["leaderboard", mode, page, friendsOnly],
    queryFn: () =>
      api<unknown>(`${endpoint}?battleType=${mode}&page=${page}&limit=50`),
  });

  const board = normalizePage(query.data);
  const totalPages = board.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Leaderboard</h1>

      {/* Mode tabs + friends filter */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Battle mode">
        {MODES.map((m) => {
          const color = MODE_COLORS[m];
          const active = m === mode;
          return (
            <button
              key={m}
              role="tab"
              aria-selected={active}
              onClick={() => { setMode(m); setPage(1); }}
              className={cn(
                "rounded-lg border px-3.5 py-1.5 text-[15px] font-medium transition-colors",
                active
                  ? "border-transparent"
                  : "border-border text-text-muted hover:border-border-strong hover:text-text"
              )}
              style={active ? { backgroundColor: color.subtle, color: color.accent } : undefined}
            >
              {color.label}
            </button>
          );
        })}

        <div className="ml-auto">
          <button
            onClick={() => { setFriendsOnly((v) => !v); setPage(1); }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[15px] font-medium transition-colors",
              friendsOnly
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-text-muted hover:border-border-strong hover:text-text"
            )}
          >
            <Users className="size-4" />
            Friends
          </button>
        </div>
      </div>

      <Card>
        {query.isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead>
                <tr className="border-b border-border text-left text-sm text-text-faint">
                  <th className="w-16 px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Player</th>
                  <th className="px-5 py-3 font-medium">Tier</th>
                  <th className="px-5 py-3 text-right font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-6" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="h-[30px] w-[30px] rounded-full" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Skeleton className="ml-auto h-4 w-12" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : board.players.length === 0 ? (
          <EmptyState
            icon={friendsOnly ? <Users className="size-6" /> : <Trophy className="size-6" />}
            title={friendsOnly ? "No friends ranked yet" : "No ranked players yet"}
            message={
              friendsOnly
                ? "Add friends to see how you rank against them!"
                : `Be the first to play a ranked ${MODE_COLORS[mode].label} match.`
            }
            action={
              friendsOnly
                ? <Link href="/friends"><Button size="sm">Find friends</Button></Link>
                : <Link href="/battle"><Button size="sm">Start a battle</Button></Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead>
                <tr className="border-b border-border text-left text-sm text-text-faint">
                  <th className="w-16 px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Player</th>
                  <th className="px-5 py-3 font-medium">Tier</th>
                  <th className="px-5 py-3 text-right font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {board.players.map((p) => {
                  const styles = getRankStyles(p.rank);
                  return (
                    <tr 
                      key={`${p.rank}-${p.username}`} 
                      className={cn("transition-all duration-200", styles.rowClass)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-mono w-4 text-center", styles.textClass)}>
                            {p.rank}
                          </span>
                          {styles.hasCrown && (
                            <Crown className={cn("size-3.5 shrink-0", styles.crownColor)} />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.username ? (
                          <Link
                            href={`/profile/${p.username}`}
                            className="flex items-center gap-2.5 hover:opacity-80"
                          >
                            <Avatar src={p.avatar} name={p.username} size={30} className={cn(
                              p.rank === 1 && "ring-2 ring-amber-500/40",
                              p.rank === 2 && "ring-2 ring-slate-400/30",
                              p.rank === 3 && "ring-2 ring-amber-700/20"
                            )} />
                            <span className={cn("text-[15px] font-medium text-text", p.rank <= 3 && "font-semibold")}>
                              {p.username}
                            </span>
                            {p.country && (
                              <span className="text-sm" title={p.country}>{countryFlag(p.country)}</span>
                            )}
                          </Link>
                        ) : (
                          <span className="text-text-faint">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <TierBadge rating={p.rating} showRating={false} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-[15px] font-bold text-text">
                        {p.rating}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <span className="font-mono text-sm text-text-faint">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

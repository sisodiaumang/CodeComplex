"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { LeaderboardPage, LeaderboardPlayer } from "@/lib/types";
import { unwrapList } from "@/lib/types";
import { MODE_COLORS, type BattleType } from "@/lib/theme";
import { cn, countryFlag } from "@/lib/utils";
import { Avatar, Button, Card, EmptyState, Spinner, TierBadge } from "@/components/ui";

const MODES: BattleType[] = [
  "DSA",
  "BUG_FIX",
  "FRONTEND",
  "BACKEND",
  "FULLSTACK",
  "PROMPT_WAR",
];

function normalizePage(data: unknown): LeaderboardPage {
  if (data && typeof data === "object" && Array.isArray((data as LeaderboardPage).players)) {
    return data as LeaderboardPage;
  }
  return { players: unwrapList<LeaderboardPlayer>(data, "players", "leaderboard") };
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<BattleType>("DSA");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["leaderboard", mode, page],
    queryFn: () =>
      api<unknown>(`/leaderboard/global?battleType=${mode}&page=${page}&limit=50`),
  });

  const board = normalizePage(query.data);
  const totalPages = board.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Leaderboard</h1>

      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Battle mode">
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
      </div>

      <Card>
        {query.isLoading ? (
          <Spinner />
        ) : board.players.length === 0 ? (
          <EmptyState
            icon={<Trophy className="size-6" />}
            title="No ranked players yet"
            message={`Be the first to play a ranked ${MODE_COLORS[mode].label} match.`}
            action={<Link href="/battle"><Button size="sm">Start a battle</Button></Link>}
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
              <tbody className="divide-y divide-border">
                {board.players.map((p) => (
                  <tr key={`${p.rank}-${p.username}`} className="transition-colors hover:bg-surface-2">
                    <td className="px-5 py-3">
                      <span className={cn(
                        "font-mono text-[15px]",
                        p.rank <= 3 ? "font-semibold text-primary" : "text-text-faint"
                      )}>
                        {p.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {p.username ? (
                        <Link
                          href={`/profile/${p.username}`}
                          className="flex items-center gap-2.5 hover:opacity-80"
                        >
                          <Avatar src={p.avatar} name={p.username} size={30} />
                          <span className="text-[15px] font-medium text-text">{p.username}</span>
                          {p.country && (
                            <span className="text-sm" title={p.country}>{countryFlag(p.country)}</span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-text-faint">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <TierBadge rating={p.rating} showRating={false} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[15px] font-semibold text-text">
                      {p.rating}
                    </td>
                  </tr>
                ))}
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

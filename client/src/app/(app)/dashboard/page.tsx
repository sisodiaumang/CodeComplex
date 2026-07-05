"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Swords, ArrowRight, History } from "lucide-react";
import { api } from "@/lib/api";
import {
  unwrapList,
  type Match,
  type RatingsMap,
} from "@/lib/types";
import { MODE_COLORS, getTier, type BattleType } from "@/lib/theme";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/stores/auth-store";
import { Button, Card, EmptyState, ModeBadge, Spinner, TierBadge } from "@/components/ui";

const RATING_KEYS: Array<{ key: keyof RatingsMap; mode: BattleType }> = [
  { key: "dsa", mode: "DSA" },
  { key: "frontend", mode: "FRONTEND" },
  { key: "backend", mode: "BACKEND" },
  { key: "fullstack", mode: "FULLSTACK" },
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

export default function DashboardPage() {
  const user = useAuth((s) => s.user);

  const ratingsQuery = useQuery({
    queryKey: ["ratings", "me"],
    queryFn: () => api<unknown>("/ratings/me"),
  });

  const historyQuery = useQuery({
    queryKey: ["matches", "history"],
    queryFn: () => api<unknown>("/match/history"),
  });

  const ratings = normalizeRatings(ratingsQuery.data);
  const recentMatches = unwrapList<Match>(historyQuery.data, "matches", "history").slice(0, 5);

  const bestRating = Math.max(1200, ...Object.values(ratings).filter((v): v is number => typeof v === "number"));
  const tier = getTier(bestRating);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">
            Welcome back, {user?.username ?? "challenger"}
          </h1>
          <p className="mt-1 text-[15px] text-text-muted">
            {tier.label} &middot; peak rating {bestRating}
          </p>
        </div>
        <Link href="/battle">
          <Button>
            <Swords className="size-4" />
            New battle
          </Button>
        </Link>
      </div>

      {/* Ratings grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {RATING_KEYS.map(({ key, mode }) => {
          const rating = ratings[key] ?? 1200;
          const color = MODE_COLORS[mode];
          return (
            <Card key={key} className="px-5 py-5">
              <div className="flex items-center gap-2 text-[15px] text-text-muted">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: color.accent }}
                />
                {color.label}
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-text">
                {ratingsQuery.isLoading ? "—" : rating}
              </p>
              <TierBadge rating={rating} showRating={false} className="mt-1" />
            </Card>
          );
        })}
      </div>

      {/* Recent matches */}
      <Card>
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-semibold text-text">Recent matches</h2>
          <Link
            href="/matches"
            className="flex items-center gap-1.5 text-[15px] text-primary hover:underline"
          >
            All matches <ArrowRight className="size-4" />
          </Link>
        </div>
        {historyQuery.isLoading ? (
          <Spinner />
        ) : recentMatches.length === 0 ? (
          <EmptyState
            icon={<History className="size-8" />}
            title="No matches yet"
            message="Battle history appears here after your first match."
            action={
              <Link href="/battle">
                <Button>Start a battle</Button>
              </Link>
            }
          />
        ) : (
          <div className="border-t border-border">
            {recentMatches.map((m) => (
              <Link
                key={m._id}
                href={`/matches?match=${m._id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ModeBadge type={m.battleType} />
                  <span className="truncate font-mono text-[15px] text-text-muted">
                    {m.questionSlug ?? "—"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="font-mono text-[15px] text-text">
                    {m.teamAScore ?? 0} : {m.teamBScore ?? 0}
                  </span>
                  <MatchOutcome match={m} />
                  <span className="hidden text-[15px] text-text-faint sm:inline">
                    {timeAgo(m.endedAt ?? m.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MatchOutcome({ match }: { match: Match }) {
  if (match.status === "ONGOING") {
    return <span className="text-[15px] font-medium text-info">Live</span>;
  }
  if (match.status === "ABANDONED") {
    return <span className="text-[15px] text-text-faint">ABD</span>;
  }
  if (match.winnerTeam === "DRAW") {
    return <span className="text-[15px] font-medium text-draw">Draw</span>;
  }
  return (
    <span className="text-[15px] text-text-muted">
      {match.winnerTeam ?? "?"}
    </span>
  );
}

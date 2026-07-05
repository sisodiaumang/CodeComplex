"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { History, Swords } from "lucide-react";
import { api } from "@/lib/api";
import { unwrapList, asUser, type Match } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Button, Card, EmptyState, ModeBadge, Spinner } from "@/components/ui";

export default function MatchesPage() {
  const historyQuery = useQuery({
    queryKey: ["matches", "history", "all"],
    queryFn: () => api<unknown>("/match/history"),
  });

  const currentQuery = useQuery({
    queryKey: ["matches", "current"],
    queryFn: () => api<unknown>("/match/current").catch(() => null),
    retry: false,
  });

  const matches = unwrapList<Match>(historyQuery.data, "matches", "history");
  const current = currentQuery.data as Match | null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Matches</h1>

      {/* Live match banner */}
      {current && current._id && current.status === "ONGOING" && (
        <Card className="border-primary/30">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              <div>
                <p className="text-[15px] font-medium text-text">Match in progress</p>
                <p className="font-mono text-sm text-text-faint">
                  {current.questionSlug ?? "unknown"}
                </p>
              </div>
              <ModeBadge type={current.battleType} />
            </div>
            <span className="text-sm text-text-faint">
              started {timeAgo(current.startedAt)}
            </span>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-semibold text-text">History</h2>
          <span className="text-sm text-text-faint">{matches.length} recorded</span>
        </div>
        {historyQuery.isLoading ? (
          <Spinner />
        ) : matches.length === 0 ? (
          <EmptyState
            icon={<History className="size-6" />}
            title="No matches yet"
            message="Results will appear here after your first battle."
            action={
              <Link href="/battle">
                <Button size="sm"><Swords className="size-3.5" /> Start a battle</Button>
              </Link>
            }
          />
        ) : (
          <div className="border-t border-border">
            {matches.map((m) => (
              <div key={m._id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-surface-2">
                <div className="flex min-w-0 items-center gap-3">
                  <ModeBadge type={m.battleType} />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-text">
                      {m.questionSlug ?? "—"}
                    </p>
                    <p className="text-sm text-text-faint">
                      {m.matchType ?? "CASUAL"}
                      {m.difficulty ? ` · ${m.difficulty}` : ""}
                      {" · "}
                      {timeAgo(m.endedAt ?? m.startedAt ?? m.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TeamsSummary match={m} />
                  <span className="font-mono text-[15px] font-medium text-text">
                    {m.teamAScore ?? 0} : {m.teamBScore ?? 0}
                  </span>
                  <OutcomePill match={m} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function TeamsSummary({ match }: { match: Match }) {
  const nameOf = (members: Match["teamA"]) => {
    const users = members.map(asUser).filter(Boolean);
    if (users.length === 0) return `${members.length}p`;
    return users.map((u) => u!.username).join(", ");
  };
  return (
    <span className="hidden max-w-56 truncate text-sm text-text-faint md:inline">
      {nameOf(match.teamA)} <span className="text-text-faint/60">vs</span> {nameOf(match.teamB)}
    </span>
  );
}

function OutcomePill({ match }: { match: Match }) {
  if (match.status === "ONGOING") {
    return <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-info">Live</span>;
  }
  if (match.status === "ABANDONED") {
    return <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-text-faint">ABD</span>;
  }
  if (match.winnerTeam === "DRAW") {
    return <span className="rounded bg-draw-subtle px-1.5 py-0.5 text-xs font-medium text-draw">Draw</span>;
  }
  return (
    <span className="rounded bg-win-subtle px-1.5 py-0.5 text-xs font-medium text-win">
      {match.winnerTeam ?? "?"}
    </span>
  );
}

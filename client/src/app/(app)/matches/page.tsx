"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { History, Swords, X, Calendar, Clock, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { unwrapList, asUser, avatarUrl, type Match, type RoomMember } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Button, Card, EmptyState, ModeBadge, Skeleton, Spinner, Avatar } from "@/components/ui";

export default function MatchesPage() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

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
          <div className="border-t border-border divide-y divide-border/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Skeleton className="h-7 w-20 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-2 max-w-xs">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="hidden h-4 w-32 md:block" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-6 w-14 rounded" />
                </div>
              </div>
            ))}
          </div>
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
              <div
                key={m._id}
                onClick={() => setSelectedMatch(m)}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-surface-2 cursor-pointer"
              >
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

      {/* Match details modal */}
      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}

function MatchDetailsModal({ match, onClose }: { match: Match; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const nameOf = (member: RoomMember) => {
    const user = asUser(member);
    return user ? user.username : typeof member === "string" ? member : "Unknown";
  };

  const getWinnerBadge = () => {
    if (match.status === "ONGOING") {
      return (
        <span className="text-info font-medium text-xs px-2.5 py-1 rounded-full bg-info/10 border border-info/20">
          Match in Progress
        </span>
      );
    }
    if (match.status === "ABANDONED") {
      return (
        <span className="text-text-faint font-medium text-xs px-2.5 py-1 rounded-full bg-surface-3 border border-border">
          Abandoned
        </span>
      );
    }
    if (match.winnerTeam === "DRAW") {
      return (
        <span className="text-draw font-medium text-xs px-2.5 py-1 rounded-full bg-draw-subtle border border-draw/20">
          Draw Match
        </span>
      );
    }
    return (
      <span className="text-win font-medium text-xs px-2.5 py-1 rounded-full bg-win-subtle border border-win/20 flex items-center gap-1">
        <Trophy className="size-3.5" /> Team {match.winnerTeam} Wins
      </span>
    );
  };

  const durationStr = match.durationInMinutes
    ? `${match.durationInMinutes} mins`
    : match.startedAt && match.endedAt
      ? `${Math.round((new Date(match.endedAt).getTime() - new Date(match.startedAt).getTime()) / 60000)} mins`
      : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface shadow-lg transition-transform duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 p-5">
          <div className="space-y-1.5 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <ModeBadge type={match.battleType} />
              <span className="text-xs uppercase tracking-wider text-text-faint font-semibold font-mono bg-surface-3 px-2 py-0.5 rounded">
                {match.matchType ?? "CASUAL"}
              </span>
              {match.difficulty && (
                <span className="text-xs uppercase tracking-wider text-text-faint font-semibold font-mono bg-surface-3 px-2 py-0.5 rounded">
                  {match.difficulty}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-text font-mono break-all leading-tight">
              {match.questionSlug ?? "unknown-challenge"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-faint hover:bg-surface-3 hover:text-text transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border/50 bg-surface-2">
              <Trophy className="size-5 text-win shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-text-faint uppercase tracking-wider font-mono">Result</p>
                <div className="mt-0.5">{getWinnerBadge()}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border/50 bg-surface-2">
              <Clock className="size-5 text-primary shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-text-faint uppercase tracking-wider font-mono">Duration</p>
                <p className="mt-0.5 text-sm font-semibold text-text">{durationStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border/50 bg-surface-2">
              <Calendar className="size-5 text-info shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-text-faint uppercase tracking-wider font-mono">Date</p>
                <p className="mt-0.5 text-sm font-semibold text-text">
                  {match.startedAt ? new Date(match.startedAt).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Teams / Score Arena */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Team A */}
            <div className={`p-4 rounded-xl border transition-all ${
              match.winnerTeam === "A"
                ? "border-win/30 bg-win-subtle/10"
                : "border-border/60 bg-surface-2/40"
            }`}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className={`text-[15px] font-bold ${match.winnerTeam === "A" ? "text-win" : "text-text"}`}>
                    Team A
                  </span>
                  {match.winnerTeam === "A" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-win/20 text-win px-1.5 py-0.2 rounded">
                      Winner
                    </span>
                  )}
                </div>
                <span className="font-mono text-xl font-bold text-text">
                  {match.teamAScore ?? 0} <span className="text-xs text-text-faint font-normal">pts</span>
                </span>
              </div>

              <div className="space-y-3">
                {match.teamA.map((member, i) => {
                  const user = asUser(member);
                  return (
                    <div key={i} className="flex items-center justify-between gap-3">
                      {user ? (
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={onClose}
                          className="flex items-center gap-2.5 group cursor-pointer"
                        >
                          <Avatar src={avatarUrl(user.avatar)} name={user.username} size={28} />
                          <span className="text-[14px] font-medium text-text group-hover:text-primary transition-colors hover:underline">
                            {user.username}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <Avatar size={28} />
                          <span className="text-[14px] font-medium text-text-faint">
                            {typeof member === "string" ? member : "User"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team B */}
            <div className={`p-4 rounded-xl border transition-all ${
              match.winnerTeam === "B"
                ? "border-win/30 bg-win-subtle/10"
                : "border-border/60 bg-surface-2/40"
            }`}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className={`text-[15px] font-bold ${match.winnerTeam === "B" ? "text-win" : "text-text"}`}>
                    Team B
                  </span>
                  {match.winnerTeam === "B" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-win/20 text-win px-1.5 py-0.2 rounded">
                      Winner
                    </span>
                  )}
                </div>
                <span className="font-mono text-xl font-bold text-text">
                  {match.teamBScore ?? 0} <span className="text-xs text-text-faint font-normal">pts</span>
                </span>
              </div>

              <div className="space-y-3">
                {match.teamB.map((member, i) => {
                  const user = asUser(member);
                  return (
                    <div key={i} className="flex items-center justify-between gap-3">
                      {user ? (
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={onClose}
                          className="flex items-center gap-2.5 group cursor-pointer"
                        >
                          <Avatar src={avatarUrl(user.avatar)} name={user.username} size={28} />
                          <span className="text-[14px] font-medium text-text group-hover:text-primary transition-colors hover:underline">
                            {user.username}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <Avatar size={28} />
                          <span className="text-[14px] font-medium text-text-faint">
                            {typeof member === "string" ? member : "User"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 bg-surface-2 p-4 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
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

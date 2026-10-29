"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  Swords,
  Users,
  User,
  ArrowLeft,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Crown,
  ChevronRight,
  Shield,
  AlertTriangle,
  RotateCcw,
  Zap
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { type Tournament, type TournamentMatch, type TournamentRound } from "@/lib/types";
import { useAuth } from "@/stores/auth-store";
import { socket } from "@/stores/socket-store";
import { Button, Spinner, Alert, Card, Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tournamentId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status } = useAuth();
  const isAuthenticated = status === "authed" && !!user;
  const isAdmin = user && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || "");

  const [activeTab, setActiveTab] = useState<"bracket" | "participants">("bracket");

  // Fetch tournament query
  const { data: tourneyData, isLoading, error } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: async () => {
      const res = await api<{ success: boolean; data: Tournament }>(`/tournaments/${tournamentId}`);
      return (res as any)?.data ?? res;
    },
    refetchInterval: 5000,
  });

  const tournament: Tournament | null = tourneyData as any;

  // Socket room connection
  useEffect(() => {
    if (!socket || !tournamentId) return;

    socket.emit("tournament:join", { tournamentId });

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    };

    socket.on("tournament:updated", handleUpdate);
    socket.on("tournament:started", handleUpdate);
    socket.on("tournament:round_advanced", handleUpdate);
    socket.on("tournament:champion_crowned", handleUpdate);

    return () => {
      socket.emit("tournament:leave", { tournamentId });
      socket.off("tournament:updated", handleUpdate);
      socket.off("tournament:started", handleUpdate);
      socket.off("tournament:round_advanced", handleUpdate);
      socket.off("tournament:champion_crowned", handleUpdate);
    };
  }, [socket, tournamentId, queryClient]);

  // Start tournament mutation
  const startMutation = useMutation({
    mutationFn: () =>
      api(`/tournaments/${tournamentId}/start`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },
  });

  // Join solo mutation
  const joinMutation = useMutation({
    mutationFn: () =>
      api(`/tournaments/${tournamentId}/join`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: () =>
      api(`/tournaments/${tournamentId}/leave`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-xs font-mono text-text-muted">Loading tournament arena...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="size-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="text-lg font-bold text-text">Tournament Not Found</h2>
        <p className="text-xs text-text-muted">
          The requested tournament could not be found or has been deleted.
        </p>
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-xs font-mono text-text hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Tournaments
        </Link>
      </div>
    );
  }

  const isCreator = user && String((tournament.creator as any)?._id || tournament.creator) === String(user._id);

  const isUserRegistered = !!user && tournament.participants.some((p) =>
    p.members.some((m) => {
      const mId = typeof m.userId === "string" ? m.userId : (m.userId as any)?._id || (m.userId as any);
      return String(mId) === String(user._id);
    })
  );

  // Check if current user has an active match in current round
  const currentRoundObj = tournament.rounds?.find((r) => r.roundIndex === tournament.currentRound);
  const userActiveMatch = currentRoundObj?.matches?.find((m) => {
    if (m.status !== "ACTIVE" || !m.battleRoomCode) return false;
    const inA = m.participantA?.members?.some((mem) => {
      const memId = typeof mem.userId === "string" ? mem.userId : (mem.userId as any)?._id || (mem.userId as any);
      return String(memId) === String(user?._id);
    });
    const inB = m.participantB?.members?.some((mem) => {
      const memId = typeof mem.userId === "string" ? mem.userId : (mem.userId as any)?._id || (mem.userId as any);
      return String(memId) === String(user?._id);
    });
    return inA || inB;
  });

  const statusColors = {
    REGISTRATION: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    IN_PROGRESS: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    COMPLETED: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    CANCELLED: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  }[tournament.status];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ── Back Navigation ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Tournaments
        </Link>

        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase", statusColors)}>
            {tournament.status === "REGISTRATION" ? "Registration Open" : tournament.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* ── Prominent Live Match Alert for User ───────────── */}
      {userActiveMatch && (
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-500 bg-gradient-to-r from-amber-500/20 via-primary/20 to-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
              <Swords className="size-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                Your Tournament Match Is LIVE!
              </div>
              <div className="text-sm sm:text-base font-bold text-text">
                {currentRoundObj?.roundName || `Round ${tournament.currentRound}`}: Fight for bracket advancement!
              </div>
            </div>
          </div>

          <Link
            href={`/battle/${userActiveMatch.battleRoomCode}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Play className="size-4 fill-white" /> Enter Battle Arena
          </Link>
        </div>
      )}

      {/* ── Tournament Header Card ────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border border-border bg-surface-2 text-text-muted flex items-center gap-1.5">
                {tournament.format === "SOLO" ? <User className="size-3.5" /> : <Users className="size-3.5" />}
                {tournament.format === "SOLO" ? "1v1 Solo Tournament" : `${tournament.teamSize}v${tournament.teamSize} Team Tournament`}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                {tournament.battleType}
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-surface-2 border border-border text-text-muted">
                {tournament.difficulty} Difficulty
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              {tournament.title}
            </h1>

            {tournament.description && (
              <p className="text-xs sm:text-sm text-text-muted max-w-2xl leading-relaxed">
                {tournament.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs font-mono text-text-muted pt-1">
              <span className="flex items-center gap-1.5">
                <Trophy className="size-4 text-amber-500" />
                Winner Prize: <strong className="text-text">+{tournament.prizes?.winnerXp || tournament.maxParticipants * 100} XP</strong>
              </span>
              <span>·</span>
              <span>
                Participants: <strong className="text-text">{tournament.participants.length} / {tournament.maxParticipants}</strong>
              </span>
              <span>·</span>
              <span>
                Host: <strong className="text-text">{(tournament.creator as any)?.username || "Host"}</strong>
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {tournament.status === "REGISTRATION" && (
              <>
                {isUserRegistered ? (
                  <Button
                    variant="outline"
                    disabled={leaveMutation.isPending}
                    onClick={() => leaveMutation.mutate()}
                    className="text-xs font-mono text-rose-500 hover:text-rose-600 hover:border-rose-500 cursor-pointer"
                  >
                    Withdraw from Tournament
                  </Button>
                ) : (
                  tournament.format === "SOLO" ? (
                    <Button
                      disabled={joinMutation.isPending || tournament.participants.length >= tournament.maxParticipants}
                      onClick={() => {
                        if (!isAuthenticated) router.push(`/login?redirect=/tournaments/${tournamentId}`);
                        else joinMutation.mutate();
                      }}
                      className="bg-primary text-white font-bold text-xs font-mono cursor-pointer shadow-md"
                    >
                      {joinMutation.isPending ? "Joining..." : "Register Solo (1v1)"}
                    </Button>
                  ) : (
                    <Link
                      href="/tournaments"
                      className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-white font-bold text-xs font-mono hover:bg-primary-hover transition-colors shadow-md"
                    >
                      Register Team
                    </Link>
                  )
                )}

                {(isCreator || isAdmin) && (
                  <Button
                    disabled={startMutation.isPending || tournament.participants.length < 2}
                    onClick={() => startMutation.mutate()}
                    className="bg-gradient-to-r from-amber-500 to-primary text-white font-bold text-xs font-mono cursor-pointer shadow-md"
                  >
                    {startMutation.isPending ? "Starting..." : "Start Tournament Bracket"}
                  </Button>
                )}
              </>
            )}

            {tournament.status === "IN_PROGRESS" && (
              <div className="px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 font-mono text-xs text-amber-500 font-bold flex items-center gap-2">
                <Play className="size-3.5 fill-amber-500" /> Current: Round {tournament.currentRound} of {tournament.totalRounds}
              </div>
            )}
          </div>
        </div>

        {/* ── Champion Podium Banner (If Completed) ────────── */}
        {tournament.status === "COMPLETED" && tournament.winner && (
          <div className="p-6 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-surface to-surface-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-lg">
                <Crown className="size-7" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                  Tournament Concluded · Grand Champion
                </div>
                <div className="text-xl font-extrabold text-text flex items-center gap-2">
                  {tournament.winner.name}
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    1st Place 🏆
                  </span>
                </div>
              </div>
            </div>

            {tournament.runnerUp && (
              <div className="text-xs font-mono text-text-muted flex items-center gap-2 pt-1 border-t border-border">
                <span>Runner-up: <strong className="text-text">{tournament.runnerUp.name}</strong> (2nd Place 🥈)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Tabs (Bracket vs Participants) ────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("bracket")}
          className={cn(
            "px-4 py-2 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer",
            activeTab === "bracket"
              ? "bg-surface border border-border text-primary shadow-xs"
              : "text-text-muted hover:text-text hover:bg-surface-2"
          )}
        >
          Tournament Bracket ({tournament.rounds?.length || 0} Rounds)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("participants")}
          className={cn(
            "px-4 py-2 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer",
            activeTab === "participants"
              ? "bg-surface border border-border text-primary shadow-xs"
              : "text-text-muted hover:text-text hover:bg-surface-2"
          )}
        >
          Participants Roster ({tournament.participants.length})
        </button>
      </div>

      {/* ── Bracket View ──────────────────────────────────── */}
      {activeTab === "bracket" && (
        <div className="space-y-6">
          {(!tournament.rounds || tournament.rounds.length === 0) ? (
            <div className="p-16 text-center rounded-2xl border border-dashed border-border bg-surface space-y-3">
              <Swords className="size-8 text-text-muted mx-auto" />
              <h3 className="text-sm font-bold text-text">Bracket Generation Pending</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                {tournament.participants.length < 2
                  ? "At least 2 participants must register before the bracket can be generated."
                  : "Registration is open! The single-elimination bracket will be generated when the tournament begins."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-6">
              <div className="flex items-start gap-8 min-w-max">
                {tournament.rounds.map((round) => (
                  <div key={round.roundIndex} className="w-72 space-y-4 shrink-0">
                    {/* Round Header */}
                    <div className="p-3 rounded-xl border border-border bg-surface flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-text uppercase tracking-wider">
                        {round.roundName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-text-muted border border-border">
                        {round.matches.length} Match{round.matches.length > 1 ? "es" : ""}
                      </span>
                    </div>

                    {/* Matches in Round */}
                    <div className="space-y-4">
                      {round.matches.map((m) => {
                        const isMatchActive = m.status === "ACTIVE";
                        const isMatchCompleted = m.status === "COMPLETED";
                        const winnerIsA = m.winnerId === m.participantA?.id;
                        const winnerIsB = m.winnerId === m.participantB?.id;

                        return (
                          <div
                            key={m.matchIndex}
                            className={cn(
                              "rounded-xl border bg-surface transition-all overflow-hidden shadow-xs",
                              isMatchActive
                                ? "border-amber-500/50 shadow-md ring-1 ring-amber-500/20"
                                : "border-border hover:border-border-strong"
                            )}
                          >
                            {/* Match Header */}
                            <div className="h-7 px-3 bg-surface-2/60 border-b border-border flex items-center justify-between text-[10px] font-mono text-text-muted">
                              <span>Match #{m.matchIndex + 1}</span>
                              <span
                                className={cn(
                                  "font-bold uppercase",
                                  isMatchActive
                                    ? "text-amber-500"
                                    : isMatchCompleted
                                    ? "text-purple-400"
                                    : m.status === "BYE"
                                    ? "text-emerald-500"
                                    : "text-text-faint"
                                )}
                              >
                                {m.status}
                              </span>
                            </div>

                            {/* Participant A */}
                            <div
                              className={cn(
                                "p-3 flex items-center justify-between border-b border-border/60 transition-colors",
                                winnerIsA ? "bg-emerald-500/10 font-bold" : ""
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="size-6 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {m.participantA?.name?.charAt(0) || "?"}
                                </div>
                                <span className="text-xs font-mono text-text truncate">
                                  {m.participantA?.name || "TBD"}
                                </span>
                              </div>
                              {winnerIsA && (
                                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                              )}
                            </div>

                            {/* Participant B */}
                            <div
                              className={cn(
                                "p-3 flex items-center justify-between transition-colors",
                                winnerIsB ? "bg-emerald-500/10 font-bold" : ""
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="size-6 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {m.participantB?.name?.charAt(0) || "?"}
                                </div>
                                <span className="text-xs font-mono text-text truncate">
                                  {m.participantB?.name || (m.status === "BYE" ? "BYE" : "TBD")}
                                </span>
                              </div>
                              {winnerIsB && (
                                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                              )}
                            </div>

                            {/* Live Arena Link if Match is Ongoing */}
                            {m.battleRoomCode && isMatchActive && (
                              <div className="p-2 bg-amber-500/10 border-t border-amber-500/20 text-center">
                                <Link
                                  href={`/battle/${m.battleRoomCode}`}
                                  className="inline-flex items-center justify-center gap-1.5 w-full py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-mono text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  <Play className="size-3 fill-white" /> Watch / Join Battle
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Participants Roster View ──────────────────────── */}
      {activeTab === "participants" && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-surface-2 flex items-center justify-between text-xs font-mono font-bold text-text">
            <span>Roster ({tournament.participants.length} Registered)</span>
            <span>Slots: {tournament.maxParticipants}</span>
          </div>

          <div className="divide-y divide-border">
            {tournament.participants.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-text-muted">
                No participants registered yet.
              </div>
            ) : (
              tournament.participants.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-4 flex items-center justify-between hover:bg-surface-2/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-faint w-6 text-right">
                      #{idx + 1}
                    </span>
                    <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text flex items-center gap-2">
                        {p.name}
                        {p.id === tournament.winner?.id && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                            Champion 🏆
                          </span>
                        )}
                      </div>
                      {p.members && p.members.length > 1 && (
                        <div className="text-xs font-mono text-text-muted flex items-center gap-1.5 mt-0.5">
                          <span>Members:</span>
                          {p.members.map((m, mIdx) => (
                            <span key={mIdx} className="text-text font-semibold">
                              {m.username}{mIdx < p.members.length - 1 ? "," : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-mono text-text-faint">
                    Seed {p.seed || idx + 1}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

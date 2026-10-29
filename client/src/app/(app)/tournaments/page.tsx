"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  Swords,
  Users,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  ArrowRight,
  Shield,
  Award,
  Trash2,
  X,
  Code2,
  Bug,
  Layout,
  Server,
  Play
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { unwrapList, type Tournament, type TournamentFormat, type BattleType, type Difficulty } from "@/lib/types";
import { useAuth } from "@/stores/auth-store";
import { Card, Button, Spinner, Alert, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const BATTLE_MODES: Array<{ key: BattleType; label: string; icon: any; color: string }> = [
  { key: "DSA", label: "DSA", icon: Code2, color: "text-blue-500" },
  { key: "BUG_FIX", label: "Bug Fix", icon: Bug, color: "text-red-500" },
  { key: "FRONTEND", label: "Frontend", icon: Layout, color: "text-cyan-500" },
  { key: "BACKEND", label: "Backend", icon: Server, color: "text-emerald-500" },
  { key: "PROMPT_WAR", label: "Prompt War", icon: Sparkles, color: "text-purple-500" },
];

export default function TournamentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status } = useAuth();
  const isAuthenticated = status === "authed" && !!user;
  const isAdmin = user && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role || "");

  // Filters
  const [formatFilter, setFormatFilter] = useState<string>("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningTournament, setJoiningTournament] = useState<Tournament | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("SOLO");
  const [teamSize, setTeamSize] = useState<number>(2);
  const [battleType, setBattleType] = useState<BattleType>("DSA");
  const [difficulty, setDifficulty] = useState<Difficulty | "MIXED">("MEDIUM");
  const [maxParticipants, setMaxParticipants] = useState<number>(8);
  const [autoStart, setAutoStart] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Join Team Tournament form state
  const [teamName, setTeamName] = useState("");
  const [teammateUsernames, setTeammateUsernames] = useState<string>("");
  const [joinError, setJoinError] = useState<string | null>(null);

  // Tournaments query
  const { data: tournamentsData, isLoading } = useQuery({
    queryKey: ["tournaments", formatFilter, modeFilter, statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (formatFilter !== "ALL") params.set("format", formatFilter);
      if (modeFilter !== "ALL") params.set("battleType", modeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      return api<Tournament[]>(`/tournaments?${params.toString()}`);
    },
    refetchInterval: 8000,
  });

  const tournaments = unwrapList<Tournament>(tournamentsData, "tournaments");

  // Create mutation
  const createMutation = useMutation({
    mutationFn: () =>
      api<Tournament>("/tournaments", {
        method: "POST",
        body: {
          title,
          description,
          format,
          teamSize: format === "SOLO" ? 1 : teamSize,
          battleType,
          difficulty,
          maxParticipants,
          autoStartWhenFull: autoStart,
        },
      }),
    onSuccess: (data: any) => {
      setShowCreateModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      const tourneyId = data?.data?._id || data?._id;
      if (tourneyId) router.push(`/tournaments/${tourneyId}`);
    },
    onError: (err) => {
      setFormError(errorMessage(err));
    },
  });

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: ({ tourneyId, body }: { tourneyId: string; body: any }) =>
      api(`/tournaments/${tourneyId}/join`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      setJoiningTournament(null);
      setJoinError(null);
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
    onError: (err) => {
      setJoinError(errorMessage(err));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (tourneyId: string) =>
      api(`/tournaments/${tourneyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });

  function resetForm() {
    setTitle("");
    setDescription("");
    setFormat("SOLO");
    setTeamSize(2);
    setBattleType("DSA");
    setDifficulty("MEDIUM");
    setMaxParticipants(8);
    setAutoStart(true);
    setFormError(null);
  }

  function handleStartJoin(t: Tournament) {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/tournaments/${t._id}`);
      return;
    }

    if (t.format === "TEAM") {
      setJoiningTournament(t);
      setTeamName(`${user?.username}'s Squad`);
      setTeammateUsernames("");
      setJoinError(null);
    } else {
      joinMutation.mutate({ tourneyId: t._id, body: {} });
    }
  }

  function handleConfirmTeamJoin() {
    if (!joiningTournament) return;
    const teammates = teammateUsernames
      .split(/[, ]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    joinMutation.mutate({
      tourneyId: joiningTournament._id,
      body: {
        teamName,
        teamMemberUsernames: teammates,
      },
    });
  }

  const isUserInTournament = (t: Tournament) => {
    if (!user?._id) return false;
    const uid = String(user._id);
    return t.participants.some((p) =>
      p.members.some((m) => {
        const mId = typeof m.userId === "string" ? m.userId : (m.userId as any)?._id || (m.userId as any);
        return String(mId) === uid;
      })
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-surface to-surface-2 p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 font-mono text-[11px] font-bold uppercase tracking-wider">
              <Trophy className="size-3.5" /> Esports Tournament Arenas
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
              Compete in Bracket Tournaments
            </h1>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Battle in single-elimination tournament brackets. Choose Solo 1v1 duels or Squad Team Battles across DSA, Bug Fixing, Frontend, and Backend. Win championships, claim XP bounties, and unlock rare mascot companions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gap-2 bg-gradient-to-r from-amber-500 to-primary text-white font-bold shadow-md cursor-pointer hover:opacity-95"
              >
                <Plus className="size-4" /> Host Tournament
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/login?redirect=/tournaments")}
                className="gap-2 bg-primary text-white font-bold cursor-pointer"
              >
                Log In to Participate
              </Button>
            )}

            <Link
              href="/achievements"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-xs font-mono text-text transition-colors"
            >
              <Award className="size-3.5 text-primary" /> View Trophies
            </Link>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournament by title or host..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-xs sm:text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format */}
          <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl text-xs font-mono">
            {["ALL", "SOLO", "TEAM"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormatFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                  formatFilter === f ? "bg-primary text-white font-bold shadow-xs" : "text-text-muted hover:text-text"
                )}
              >
                {f === "ALL" ? "All Formats" : f === "SOLO" ? "Solo (1v1)" : "Team"}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl text-xs font-mono">
            {[
              { key: "ALL", label: "All" },
              { key: "REGISTRATION", label: "Open" },
              { key: "IN_PROGRESS", label: "Live" },
              { key: "COMPLETED", label: "Past" },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStatusFilter(s.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                  statusFilter === s.key ? "bg-primary text-white font-bold shadow-xs" : "text-text-muted hover:text-text"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tournaments Grid ─────────────────────────────── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Spinner className="size-8 text-primary" />
          <p className="text-xs font-mono text-text-muted">Loading tournament arenas...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-surface space-y-4">
          <div className="size-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mx-auto text-text-muted">
            <Trophy className="size-6 text-amber-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text">No Tournaments Found</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              There are currently no tournaments matching your filters. Create your own tournament to battle with friends or solo competitors!
            </p>
          </div>
          {isAuthenticated && (
            <Button onClick={() => setShowCreateModal(true)} className="gap-2 cursor-pointer">
              <Plus className="size-4" /> Create First Tournament
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tournaments.map((t) => {
            const isRegistered = isUserInTournament(t);
            const isFull = t.participants.length >= t.maxParticipants;
            const isCreator = user && String((t.creator as any)?._id || t.creator) === String(user._id);

            const statusColors = {
              REGISTRATION: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
              IN_PROGRESS: "text-amber-500 bg-amber-500/10 border-amber-500/20 animate-pulse",
              COMPLETED: "text-purple-500 bg-purple-500/10 border-purple-500/20",
              CANCELLED: "text-rose-500 bg-rose-500/10 border-rose-500/20",
            }[t.status];

            const fillPercent = Math.min(100, Math.round((t.participants.length / t.maxParticipants) * 100));

            return (
              <div
                key={t._id}
                className="group relative rounded-2xl border border-border bg-surface hover:border-primary/40 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top / Header */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase", statusColors)}>
                        {t.status === "REGISTRATION" ? "Registration Open" : t.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-border bg-surface-2 text-text-muted flex items-center gap-1">
                        {t.format === "SOLO" ? <User className="size-3" /> : <Users className="size-3" />}
                        {t.format === "SOLO" ? "1v1 Solo" : `${t.teamSize}v${t.teamSize} Team`}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                      {t.battleType}
                    </span>
                  </div>

                  <div>
                    <Link
                      href={`/tournaments/${t._id}`}
                      className="text-base font-bold text-text group-hover:text-primary transition-colors line-clamp-1"
                    >
                      {t.title}
                    </Link>
                    {t.description && (
                      <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">
                        {t.description}
                      </p>
                    )}
                  </div>

                  {/* Details Badges */}
                  <div className="flex items-center gap-3 text-xs font-mono text-text-muted pt-1">
                    <span className="flex items-center gap-1">
                      <Trophy className="size-3 text-amber-500" />
                      +{t.prizes?.winnerXp || t.maxParticipants * 100} XP
                    </span>
                    <span>·</span>
                    <span>{t.difficulty}</span>
                    <span>·</span>
                    <span>{t.totalRounds || Math.log2(t.maxParticipants)} Rounds</span>
                  </div>

                  {/* Participant Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                      <span>Participants</span>
                      <span className="font-bold text-text">
                        {t.participants.length} / {t.maxParticipants}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden border border-border">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          t.status === "COMPLETED" ? "bg-purple-500" : isFull ? "bg-amber-500" : "bg-primary"
                        )}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Winner announcement if completed */}
                  {t.status === "COMPLETED" && t.winner && (
                    <div className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs font-mono flex items-center gap-2 text-purple-400">
                      <Trophy className="size-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Champion: <strong>{t.winner.name}</strong></span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 border-t border-border bg-surface-2/40 flex items-center justify-between gap-2">
                  <Link
                    href={`/tournaments/${t._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-text hover:text-primary transition-colors cursor-pointer"
                  >
                    View Bracket <ArrowRight className="size-3" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {(isCreator || isAdmin) && t.status === "REGISTRATION" && (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(t._id)}
                        disabled={deleteMutation.isPending}
                        title="Delete Tournament"
                        className="p-1.5 text-text-muted hover:text-rose-500 rounded hover:bg-surface transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}

                    {t.status === "REGISTRATION" && (
                      isRegistered ? (
                        <span className="text-[11px] font-mono text-emerald-500 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="size-3.5" /> Registered
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isFull || joinMutation.isPending}
                          onClick={() => handleStartJoin(t)}
                          className="h-8 text-xs font-mono cursor-pointer"
                        >
                          {isFull ? "Tournament Full" : "Register Now"}
                        </Button>
                      )
                    )}

                    {t.status === "IN_PROGRESS" && (
                      <Link
                        href={`/tournaments/${t._id}`}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-amber-500 text-white font-mono text-xs font-bold hover:bg-amber-600 transition-colors shadow-xs"
                      >
                        <Play className="size-3 fill-white" /> Live Arena
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Host Tournament Modal ─────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-amber-500" />
                <h2 className="text-lg font-bold text-text">Host a Tournament</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-text-muted hover:text-text cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && <Alert>{formError}</Alert>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4 text-xs font-mono"
            >
              <div>
                <label className="block text-text font-bold uppercase tracking-wider mb-1">
                  Tournament Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CodeComplex Friday Blitz Cup"
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-2 border border-border text-text font-sans text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-text font-bold uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rules, schedule, or extra notes..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-surface-2 border border-border text-text font-sans text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Format: Solo vs Team */}
              <div>
                <label className="block text-text font-bold uppercase tracking-wider mb-1.5">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("SOLO")}
                    className={cn(
                      "p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer",
                      format === "SOLO"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border bg-surface-2 text-text-muted hover:border-border-strong hover:text-text"
                    )}
                  >
                    <User className="size-4" />
                    <div>
                      <div className="text-xs font-bold">Solo (1v1)</div>
                      <div className="text-[10px] text-text-muted font-normal">Individual brackets</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat("TEAM")}
                    className={cn(
                      "p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer",
                      format === "TEAM"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border bg-surface-2 text-text-muted hover:border-border-strong hover:text-text"
                    )}
                  >
                    <Users className="size-4" />
                    <div>
                      <div className="text-xs font-bold">Team Battle</div>
                      <div className="text-[10px] text-text-muted font-normal">Squad brackets</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Team Size (if team format) */}
              {format === "TEAM" && (
                <div>
                  <label className="block text-text font-bold uppercase tracking-wider mb-1">
                    Team Size (Per Roster)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setTeamSize(size)}
                        className={cn(
                          "py-2 rounded-xl border text-center transition-all cursor-pointer",
                          teamSize === size
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border bg-surface-2 text-text-muted hover:text-text"
                        )}
                      >
                        {size} vs {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Battle Type */}
              <div>
                <label className="block text-text font-bold uppercase tracking-wider mb-1.5">
                  Battle Discipline
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BATTLE_MODES.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setBattleType(m.key)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer",
                          battleType === m.key
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border bg-surface-2 text-text-muted hover:text-text"
                        )}
                      >
                        <Icon className={cn("size-3.5", m.color)} />
                        <span className="text-xs">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty & Bracket Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text font-bold uppercase tracking-wider mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="MIXED">Mixed (Progressive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text font-bold uppercase tracking-wider mb-1">
                    Bracket Size
                  </label>
                  <select
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value={4}>4 Participants (2 Rounds)</option>
                    <option value={8}>8 Participants (3 Rounds)</option>
                    <option value={16}>16 Participants (4 Rounds)</option>
                    <option value={32}>32 Participants (5 Rounds)</option>
                  </select>
                </div>
              </div>

              {/* Auto start checkbox */}
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
                <span className="text-text-muted text-xs">
                  Auto-start bracket when full ({maxParticipants} participants)
                </span>
              </label>

              <div className="flex items-center gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-primary text-white font-bold cursor-pointer"
                >
                  {createMutation.isPending ? "Creating..." : "Create Tournament"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Join Team Modal ───────────────────────────────── */}
      {joiningTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h2 className="text-base font-bold text-text">Register Your Team</h2>
              </div>
              <button
                type="button"
                onClick={() => setJoiningTournament(null)}
                className="text-text-muted hover:text-text cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              This is a <strong>{joiningTournament.teamSize}v{joiningTournament.teamSize} Team Tournament</strong>. Enter a team name and optional teammate usernames to fight together.
            </p>

            {joinError && <Alert>{joinError}</Alert>}

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-text font-bold uppercase tracking-wider mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Byte Brawlers"
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-2 border border-border text-text font-sans text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-text font-bold uppercase tracking-wider mb-1">
                  Teammate Usernames (Optional)
                </label>
                <input
                  type="text"
                  value={teammateUsernames}
                  onChange={(e) => setTeammateUsernames(e.target.value)}
                  placeholder="e.g. alex, sarah (separated by comma)"
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-2 border border-border text-text font-sans text-xs focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-text-faint mt-1 block">
                  You can register solo for a team slot or specify up to {joiningTournament.teamSize - 1} teammates.
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setJoiningTournament(null)}
                  className="flex-1 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={joinMutation.isPending || !teamName.trim()}
                  onClick={handleConfirmTeamJoin}
                  className="flex-1 cursor-pointer font-bold"
                >
                  {joinMutation.isPending ? "Registering..." : "Confirm & Enter"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

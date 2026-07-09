"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Check,
  Play,
  DoorOpen,
  Trash2,
  Crown,
  Swords,
  Users,
  Zap,
  Clock,
  UserPlus,
  Send,
  Search,
  X,
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import {
  asUser,
  avatarUrl,
  type BattleRoom,
  type PublicUser,
  type RoomMember,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth-store";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  ModeBadge,
  Spinner,
} from "@/components/ui";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function normalizeRoom(data: unknown): BattleRoom | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (obj.roomCode) return data as BattleRoom;
  if (obj.room && typeof obj.room === "object") return obj.room as BattleRoom;
  return null;
}

function memberId(m: RoomMember): string {
  return typeof m === "string" ? m : (m._id ?? m.username);
}

/* ─── main page ───────────────────────────────────────────────────────── */

export default function BattleLobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);

  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const roomQuery = useQuery({
    queryKey: ["battle", roomCode],
    queryFn: () => api<unknown>(`/battle/${roomCode}`),
    refetchInterval: 3000,
    enabled: Boolean(roomCode),
  });

  const room = normalizeRoom(roomQuery.data);

  const hostId = room ? memberId(room.host) : null;
  const isHost = Boolean(
    user && hostId && (hostId === user._id || hostId === user.username)
  );
  const started = room?.status === "STARTED";

  function act(
    path: string,
    opts?: { method?: "POST" | "DELETE"; onDone?: () => void }
  ) {
    return async () => {
      setActionError(null);
      try {
        await api(path, { method: opts?.method ?? "POST" });
        await queryClient.invalidateQueries({
          queryKey: ["battle", roomCode],
        });
        opts?.onDone?.();
      } catch (err) {
        setActionError(errorMessage(err));
      }
    };
  }

  const startMutation = useMutation({
    mutationFn: () => api(`/battle/${roomCode}/start`, { method: "POST" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["battle", roomCode] }),
    onError: (err) => setActionError(errorMessage(err)),
  });

  async function copyCode() {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setActionError("Couldn't copy — do it manually.");
    }
  }

  /* ── loading / error states ── */

  if (roomQuery.isLoading) return <Spinner />;

  if (!room || room.status === "CANCELLED" || room.status === "FINISHED") {
    return (
      <div className="mx-auto max-w-md pt-16 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-surface-2">
          <Swords className="size-6 text-text-faint" />
        </div>
        <p className="text-lg font-semibold text-text">
          {room?.status === "CANCELLED" ? "Room closed" : room?.status === "FINISHED" ? "Battle finished" : "Room not found"}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {room?.status === "CANCELLED"
            ? "The host closed this room."
            : room?.status === "FINISHED"
              ? "This battle has ended."
              : "This room may have been closed or doesn't exist."}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-5"
          onClick={() => router.push("/battle")}
        >
          Back to battles
        </Button>
      </div>
    );
  }

  const teamA = room.teams?.teamA ?? [];
  const teamB = room.teams?.teamB ?? [];
  const totalPlayers = teamA.length + teamB.length;
  const totalCapacity = room.teamSize * 2;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      {/* ── Room header ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ModeBadge type={room.battleType} />
              {room.difficulty && (
                <Badge className="border border-border bg-surface-2 text-text-muted">
                  {room.difficulty}
                </Badge>
              )}
              <Badge
                className={
                  started
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                    : "border border-border bg-surface-2 text-text-faint"
                }
              >
                {started ? (
                  <><Zap className="size-3" /> LIVE</>
                ) : (
                  <><Clock className="size-3" /> WAITING</>
                )}
              </Badge>
            </div>

            {room.topics && room.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {room.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-text-faint"
                  >
                    {t.toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-text-faint">
              <Users className="size-3.5" />
              {totalPlayers}/{totalCapacity}
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-3.5 py-1.5 font-mono text-sm font-semibold tracking-wider text-text transition-all hover:border-primary/50 hover:bg-surface-2"
              title="Copy room code"
            >
              {room.roomCode}
              {copied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5 text-text-faint" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {actionError && <Alert>{actionError}</Alert>}
      {started && <Alert tone="success">Battle started — good luck!</Alert>}

      {/* ── Teams ── */}
      <div className="grid gap-5 sm:grid-cols-[1fr_auto_1fr]">
        <TeamPanel
          label="Team A"
          color="blue"
          members={teamA}
          capacity={room.teamSize}
          hostId={hostId}
          onJoin={act(`/battle/${roomCode}/team-a`)}
          disabled={started}
        />

        <div className="flex items-center justify-center">
          <div className="flex size-11 items-center justify-center rounded-full border border-border bg-surface-1">
            <Swords className="size-4 text-text-faint" />
          </div>
        </div>

        <TeamPanel
          label="Team B"
          color="red"
          members={teamB}
          capacity={room.teamSize}
          hostId={hostId}
          onJoin={act(`/battle/${roomCode}/team-b`)}
          disabled={started}
        />
      </div>

      {/* ── Invite friends ── */}
      {!started && (
        <Card>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-surface-2"
          >
            <span className="flex items-center gap-2 text-[15px] font-medium text-text">
              <UserPlus className="size-4 text-primary" />
              Invite friends
            </span>
            <span className="text-xs text-text-faint">
              {showInvite ? "Hide" : "Show"}
            </span>
          </button>
          {showInvite && (
            <div className="border-t border-border">
              <InvitePanel roomCode={roomCode} />
            </div>
          )}
        </Card>
      )}

      {/* ── Actions bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={act(`/battle/${roomCode}/leave`, {
              onDone: () => router.push("/battle"),
            })}
          >
            <DoorOpen className="size-4" /> Leave
          </Button>
          {isHost && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger"
              onClick={act(`/battle/${roomCode}`, {
                method: "DELETE",
                onDone: () => router.push("/battle"),
              })}
            >
              <Trash2 className="size-4" /> Close room
            </Button>
          )}
        </div>

        {isHost && !started && (
          <Button
            size="sm"
            loading={startMutation.isPending}
            onClick={() => startMutation.mutate()}
          >
            <Play className="size-4" /> Start battle
          </Button>
        )}
      </div>

      {/* ── Waiting indicator ── */}
      {!isHost && !started && (
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <p className="text-sm text-text-faint">
            Waiting for host to start...
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Team Panel ──────────────────────────────────────────────────────── */

const TEAM_ACCENT = {
  blue: {
    header: "text-blue-400",
    count: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
  },
  red: {
    header: "text-red-400",
    count: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
  },
} as const;

function TeamPanel({
  label,
  color,
  members,
  capacity,
  hostId,
  onJoin,
  disabled,
}: {
  label: string;
  color: "blue" | "red";
  members: RoomMember[];
  capacity: number;
  hostId: string | null;
  onJoin: () => void;
  disabled?: boolean;
}) {
  const seats = Math.max(capacity, members.length);
  const accent = TEAM_ACCENT[color];

  return (
    <Card className={cn("flex flex-col overflow-hidden", accent.border)}>
      <div className={cn("flex items-center justify-between px-4 py-2.5", accent.bg)}>
        <p className={cn("text-sm font-semibold", accent.header)}>{label}</p>
        <span className={cn("font-mono text-xs font-bold", accent.count)}>
          {members.length}/{capacity}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <ul className="flex-1 space-y-1.5">
          {Array.from({ length: seats }).map((_, i) => {
            const member = members[i];
            if (!member) {
              return (
                <li
                  key={`empty-${i}`}
                  className="flex h-11 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-text-faint"
                >
                  waiting...
                </li>
              );
            }
            const u = asUser(member);
            const id = memberId(member);
            return (
              <li
                key={id}
                className="flex h-11 items-center gap-2.5 rounded-lg bg-surface-2 px-3"
              >
                <Avatar
                  src={avatarUrl(u?.avatar)}
                  name={u?.username ?? id}
                  size={26}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
                  {u?.username ?? id.slice(0, 10)}
                </span>
                {hostId === id && (
                  <Crown
                    className="size-3.5 shrink-0 text-amber-500"
                    aria-label="Host"
                  />
                )}
              </li>
            );
          })}
        </ul>

        <Button
          variant="secondary"
          size="sm"
          className="mt-3 w-full"
          onClick={onJoin}
          disabled={disabled || members.length >= capacity}
        >
          {members.length >= capacity ? "Team full" : `Join ${label}`}
        </Button>
      </div>
    </Card>
  );
}

/* ─── Invite Panel ────────────────────────────────────────────────────── */

function InvitePanel({ roomCode }: { roomCode: string }) {
  const [search, setSearch] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const friendsQuery = useQuery({
    queryKey: ["battle", roomCode, "friends"],
    queryFn: () => api<unknown>(`/battle/${roomCode}/friends`),
  });

  const raw = friendsQuery.data;
  const friends: PublicUser[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? (Array.isArray((raw as Record<string, unknown>).data)
          ? (raw as Record<string, unknown>).data as PublicUser[]
          : Object.values(raw as Record<string, unknown>).find(Array.isArray) as PublicUser[] ?? [])
      : [];

  const filtered = search.trim()
    ? friends.filter((f) =>
        f.username?.toLowerCase().includes(search.trim().toLowerCase())
      )
    : friends;

  const invite = useMutation({
    mutationFn: (userId: string) =>
      api(`/battle/${roomCode}/invite/${userId}`, { method: "POST" }),
    onSuccess: (_data, userId) => {
      setSentIds((prev) => new Set(prev).add(userId));
    },
    onError: (err) => setError(errorMessage(err)),
  });

  if (friendsQuery.isLoading) return <Spinner className="py-6" />;

  if (friends.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-sm text-text-faint">
        No friends available to invite.
      </p>
    );
  }

  return (
    <div className="px-5 py-4 space-y-3">
      {error && <Alert>{error}</Alert>}

      {friends.length > 5 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-text-faint" />
          <input
            type="text"
            placeholder="Filter friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-surface-1 pl-9 pr-8 text-sm text-text placeholder:text-text-faint focus:border-primary focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      <ul className="max-h-60 space-y-1 overflow-y-auto">
        {filtered.map((f) => {
          const id = f._id ?? f.username;
          const sent = sentIds.has(id);
          return (
            <li
              key={id}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface-2"
            >
              <span className="flex items-center gap-2.5">
                <Avatar
                  src={avatarUrl(f.avatar)}
                  name={f.username}
                  size={28}
                />
                <span className="text-sm font-medium text-text">
                  {f.username}
                </span>
              </span>
              {sent ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                  <Check className="size-3.5" /> Sent
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => invite.mutate(id)}
                  loading={invite.isPending}
                >
                  <Send className="size-3" /> Invite
                </Button>
              )}
            </li>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-3 text-center text-sm text-text-faint">
            No friends match &ldquo;{search.trim()}&rdquo;
          </p>
        )}
      </ul>
    </div>
  );
}

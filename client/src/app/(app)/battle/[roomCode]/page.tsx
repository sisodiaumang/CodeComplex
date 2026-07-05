"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Check, Play, DoorOpen, Trash2, Crown } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { asUser, avatarUrl, type BattleRoom, type RoomMember } from "@/lib/types";
import { useAuth } from "@/stores/auth-store";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  ModeBadge,
  Spinner,
} from "@/components/ui";

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

export default function BattleLobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);

  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const roomQuery = useQuery({
    queryKey: ["battle", roomCode],
    queryFn: () => api<unknown>(`/battle/${roomCode}`),
    refetchInterval: 3000,
    enabled: Boolean(roomCode),
  });

  const room = normalizeRoom(roomQuery.data);

  const hostId = room ? memberId(room.host) : null;
  const isHost = Boolean(user && hostId && (hostId === user._id || hostId === user.username));
  const started = room?.status === "STARTED";

  function act(path: string, opts?: { method?: "POST" | "DELETE"; onDone?: () => void }) {
    return async () => {
      setActionError(null);
      try {
        await api(path, { method: opts?.method ?? "POST" });
        await queryClient.invalidateQueries({ queryKey: ["battle", roomCode] });
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

  if (roomQuery.isLoading) return <Spinner />;

  if (!room) {
    return (
      <div className="mx-auto max-w-md pt-10">
        <Alert>Room not found or no longer available.</Alert>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => router.push("/battle")}
        >
          Back to battles
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Room header */}
      <Card className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ModeBadge type={room.battleType} />
            {room.difficulty && (
              <Badge className="bg-surface-2 text-text-muted">{room.difficulty}</Badge>
            )}
            <Badge
              className={
                started
                  ? "bg-win-subtle text-win"
                  : "bg-surface-2 text-text-faint"
              }
            >
              {room.status}
            </Badge>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs font-medium text-text transition-colors hover:border-primary"
            title="Copy room code"
          >
            {room.roomCode}
            {copied ? <Check className="size-3 text-win" /> : <Copy className="size-3" />}
          </button>
        </div>
        {room.topics && room.topics.length > 0 && (
          <p className="mt-2 text-xs text-text-faint">
            {room.topics.join(", ").toLowerCase()}
          </p>
        )}
      </Card>

      {actionError && <Alert>{actionError}</Alert>}
      {started && (
        <Alert tone="success">Battle started — good luck!</Alert>
      )}

      {/* Teams */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <TeamPanel
          label="Team A"
          members={room.teams?.teamA ?? []}
          capacity={room.teamSize}
          hostId={hostId}
          onJoin={act(`/battle/${roomCode}/team-a`)}
          disabled={started}
        />
        <div className="hidden items-center sm:flex">
          <span className="text-sm font-semibold text-text-faint">vs</span>
        </div>
        <TeamPanel
          label="Team B"
          members={room.teams?.teamB ?? []}
          capacity={room.teamSize}
          hostId={hostId}
          onJoin={act(`/battle/${roomCode}/team-b`)}
          disabled={started}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={act(`/battle/${roomCode}/leave`, {
              onDone: () => router.push("/battle"),
            })}
          >
            <DoorOpen className="size-3.5" /> Leave
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
              <Trash2 className="size-3.5" /> Close
            </Button>
          )}
        </div>
        {isHost && !started && (
          <Button
            size="sm"
            loading={startMutation.isPending}
            onClick={() => startMutation.mutate()}
          >
            <Play className="size-3.5" /> Start battle
          </Button>
        )}
      </div>
      {!isHost && !started && (
        <p className="text-center text-xs text-text-faint">
          Waiting for host to start...
        </p>
      )}
    </div>
  );
}

function TeamPanel({
  label,
  members,
  capacity,
  hostId,
  onJoin,
  disabled,
}: {
  label: string;
  members: RoomMember[];
  capacity: number;
  hostId: string | null;
  onJoin: () => void;
  disabled?: boolean;
}) {
  const seats = Math.max(capacity, members.length);

  return (
    <Card>
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <span className="font-mono text-[11px] text-text-faint">
          {members.length}/{capacity}
        </span>
      </div>
      <div className="border-t border-border">
        <ul className="space-y-1 p-2">
          {Array.from({ length: seats }).map((_, i) => {
            const member = members[i];
            if (!member) {
              return (
                <li
                  key={`empty-${i}`}
                  className="flex h-9 items-center justify-center rounded-md border border-dashed border-border text-[11px] text-text-faint"
                >
                  open
                </li>
              );
            }
            const u = asUser(member);
            const id = memberId(member);
            return (
              <li
                key={id}
                className="flex h-9 items-center gap-2 rounded-md bg-surface-2 px-2.5"
              >
                <Avatar src={avatarUrl(u?.avatar)} name={u?.username ?? id} size={22} />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-text">
                  {u?.username ?? id.slice(0, 10)}
                </span>
                {hostId === id && (
                  <Crown className="size-3 shrink-0 text-draw" aria-label="Host" />
                )}
              </li>
            );
          })}
        </ul>
        <div className="px-2 pb-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={onJoin}
            disabled={disabled || members.length >= capacity}
          >
            Join {label}
          </Button>
        </div>
      </div>
    </Card>
  );
}

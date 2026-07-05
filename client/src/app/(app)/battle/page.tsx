"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Swords, KeyRound, DoorOpen, ArrowRight } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { BattleRoom } from "@/lib/types";
import { MODE_COLORS, type BattleType } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Alert, Button, Card, Input, ModeBadge } from "@/components/ui";

const MODES = Object.entries(MODE_COLORS) as [
  BattleType,
  (typeof MODE_COLORS)[BattleType],
][];

const DSA_TOPICS = [
  { key: "ARRAY", label: "Arrays" },
  { key: "STRING", label: "Strings" },
  { key: "LINKED_LIST", label: "Linked List" },
  { key: "STACK", label: "Stack" },
  { key: "QUEUE", label: "Queue" },
  { key: "HEAP", label: "Heap" },
  { key: "TREE", label: "Trees" },
  { key: "GRAPH", label: "Graphs" },
  { key: "BINARY_SEARCH", label: "Binary Search" },
  { key: "SORTING", label: "Sorting" },
  { key: "GREEDY", label: "Greedy" },
  { key: "DP", label: "DP" },
  { key: "BACKTRACKING", label: "Backtracking" },
  { key: "BIT_MANIPULATION", label: "Bit Manipulation" },
  { key: "MATH", label: "Math" },
  { key: "TRIE", label: "Trie" },
] as const;

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

const DIFF_COLORS: Record<Difficulty, string> = {
  EASY: "text-emerald-600 border-emerald-300 bg-emerald-50",
  MEDIUM: "text-amber-600 border-amber-300 bg-amber-50",
  HARD: "text-red-600 border-red-300 bg-red-50",
};

export default function BattlePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [battleType, setBattleType] = useState<BattleType>("DSA");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [teamSize, setTeamSize] = useState(1);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [roomCode, setRoomCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const activeRoomQuery = useQuery({
    queryKey: ["battle", "me", "active"],
    queryFn: () => api<{ room: BattleRoom | null }>("/battle/me/active"),
    refetchInterval: 10000,
  });

  const activeRoom =
    activeRoomQuery.data && typeof activeRoomQuery.data === "object"
      ? (activeRoomQuery.data as { room: BattleRoom | null }).room ??
        ((activeRoomQuery.data as unknown as BattleRoom).roomCode
          ? (activeRoomQuery.data as unknown as BattleRoom)
          : null)
      : null;

  const leaveMutation = useMutation({
    mutationFn: (code: string) =>
      api(`/battle/${code}/leave`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["battle", "me", "active"] });
    },
  });

  function toggleTopic(key: string) {
    setSelectedTopics((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (selectedTopics.length < 3) {
      setCreateError("Select at least 3 topics");
      return;
    }
    setCreating(true);
    try {
      const room = await api<BattleRoom | { room: BattleRoom }>("/battle", {
        method: "POST",
        body: { battleType, difficulty, topics: selectedTopics, maxTeamSize: teamSize },
      });
      const code =
        (room as BattleRoom).roomCode ??
        (room as { room: BattleRoom }).room?.roomCode;
      if (!code) throw new Error("Room created but no code returned.");
      router.push(`/battle/${code}`);
    } catch (err) {
      setCreateError(errorMessage(err));
      setCreating(false);
    }
  }

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);
    setJoining(true);
    const code = roomCode.trim().toUpperCase();
    try {
      await api(`/battle/${code}/join`, {
        method: "POST",
        body: { teamPreference: "NONE" },
      });
      router.push(`/battle/${code}`);
    } catch (err) {
      setJoinError(errorMessage(err));
      setJoining(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-text">Battle</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Create */}
        <Card>
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-text">Create a room</h2>
          </div>
          <form onSubmit={onCreate} className="space-y-6 border-t border-border px-6 py-6">
            {createError && <Alert>{createError}</Alert>}

            {/* Mode */}
            <div>
              <label className="mb-2 block text-[15px] font-medium text-text">Mode</label>
              <div className="flex flex-wrap gap-2">
                {MODES.map(([key, mode]) => {
                  const active = battleType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setBattleType(key)}
                      className={cn(
                        "rounded-md border px-3.5 py-1.5 text-[15px] font-medium transition-colors",
                        active
                          ? "border-transparent shadow-sm"
                          : "border-border text-text-muted hover:border-border-strong hover:text-text"
                      )}
                      style={
                        active
                          ? { backgroundColor: mode.subtle, color: mode.accent }
                          : undefined
                      }
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topics */}
            <div>
              <label className="mb-2 block text-[15px] font-medium text-text">
                Topics <span className="font-normal text-text-faint">(pick at least 3)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DSA_TOPICS.map(({ key, label }) => {
                  const active = selectedTopics.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleTopic(key)}
                      className={cn(
                        "rounded-md border px-3.5 py-2 text-[15px] font-medium transition-colors",
                        active
                          ? "border-primary bg-primary-subtle text-primary shadow-sm"
                          : "border-border text-text-muted hover:border-border-strong hover:text-text"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {selectedTopics.length > 0 && selectedTopics.length < 3 && (
                <p className="mt-2 text-sm text-danger">
                  {3 - selectedTopics.length} more needed
                </p>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label className="mb-2 block text-[15px] font-medium text-text">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "rounded-md border px-5 py-2 text-[15px] font-medium capitalize transition-colors",
                      difficulty === d
                        ? DIFF_COLORS[d]
                        : "border-border text-text-muted hover:border-border-strong"
                    )}
                  >
                    {d.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Team size */}
            <div>
              <label className="mb-2 block text-[15px] font-medium text-text">Team size</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTeamSize(n)}
                    className={cn(
                      "size-10 rounded-lg border font-mono text-[15px] font-medium transition-colors",
                      teamSize === n
                        ? "border-primary bg-primary-subtle text-primary shadow-sm"
                        : "border-border text-text-muted hover:border-border-strong"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[15px] text-text-faint">
                {teamSize === 1 ? "1v1 duel" : `${teamSize}v${teamSize}`}
              </p>
            </div>

            <Button type="submit" loading={creating}>
              <Swords className="size-4" />
              Create room
            </Button>
          </form>
        </Card>

        {/* Join */}
        <Card className="h-fit">
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-text">Join a room</h2>
          </div>
          <form onSubmit={onJoin} className="space-y-5 border-t border-border px-6 py-6">
            {joinError && <Alert>{joinError}</Alert>}
            <Input
              label="Room code"
              name="roomCode"
              required
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="XK4-92F"
              className="text-center font-mono text-lg tracking-[0.25em]"
            />
            <Button type="submit" variant="secondary" loading={joining} className="w-full">
              <KeyRound className="size-4" />
              Join room
            </Button>
          </form>
        </Card>
      </div>

      {/* Active room bar */}
      {activeRoom && activeRoom.roomCode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)] lg:left-64">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-4">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-medium text-text">Active room</span>
                <span className="rounded-md bg-surface-2 px-3 py-1.5 font-mono text-[15px] font-bold tracking-wider text-primary">
                  {activeRoom.roomCode}
                </span>
                <ModeBadge type={activeRoom.battleType} />
                {activeRoom.difficulty && (
                  <span className="text-[15px] text-text-faint">{activeRoom.difficulty}</span>
                )}
                <span className="rounded-md bg-surface-2 px-2.5 py-1 text-sm font-medium text-text-faint">
                  {activeRoom.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeRoom.status === "WAITING" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => leaveMutation.mutate(activeRoom.roomCode)}
                  loading={leaveMutation.isPending}
                  className="text-danger hover:text-danger"
                >
                  <DoorOpen className="size-4" /> Leave
                </Button>
              )}
              <Link href={`/battle/${activeRoom.roomCode}`}>
                <Button size="sm">
                  Rejoin <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

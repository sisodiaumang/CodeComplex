"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Swords, KeyRound, DoorOpen, ArrowRight, Users, Play } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { BattleRoom } from "@/lib/types";
import { MODE_COLORS, type BattleType } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Alert, Badge, Button, Card, Input, ModeBadge } from "@/components/ui";

const MODES = Object.entries(MODE_COLORS) as [
  BattleType,
  (typeof MODE_COLORS)[BattleType],
][];

const TOPICS_BY_MODE: Record<BattleType, { key: string; label: string }[]> = {
  DSA: [
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
  ],
  BUG_FIX: [
    { key: "DSA", label: "DSA" },
    { key: "FRONTEND", label: "Frontend" },
    { key: "BACKEND", label: "Backend" },
    { key: "FULLSTACK", label: "Fullstack" },
  ],
  FRONTEND: [
    { key: "HTML_CSS", label: "HTML / CSS" },
    { key: "JAVASCRIPT", label: "JavaScript" },
    { key: "REACT", label: "React" },
    { key: "TYPESCRIPT", label: "TypeScript" },
    { key: "RESPONSIVE", label: "Responsive Design" },
    { key: "ACCESSIBILITY", label: "Accessibility" },
    { key: "ANIMATION", label: "Animation" },
  ],
  BACKEND: [
    { key: "REST_API", label: "REST API" },
    { key: "DATABASE", label: "Database" },
    { key: "AUTH", label: "Authentication" },
    { key: "NODE_JS", label: "Node.js" },
    { key: "CACHING", label: "Caching" },
    { key: "WEBSOCKETS", label: "WebSockets" },
    { key: "FILE_HANDLING", label: "File Handling" },
  ],
  FULLSTACK: [
    { key: "FRONTEND", label: "Frontend" },
    { key: "BACKEND", label: "Backend" },
    { key: "DATABASE", label: "Database" },
    { key: "AUTH", label: "Authentication" },
    { key: "DEPLOYMENT", label: "Deployment" },
    { key: "API_INTEGRATION", label: "API Integration" },
  ],
  PROMPT_WAR: [
    { key: "TEXT_GENERATION", label: "Text Generation" },
    { key: "CODE_GENERATION", label: "Code Generation" },
    { key: "REASONING", label: "Reasoning" },
    { key: "CREATIVE", label: "Creative" },
    { key: "DATA_EXTRACTION", label: "Data Extraction" },
    { key: "SUMMARIZATION", label: "Summarization" },
  ],
};

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

const DIFF_COLORS: Record<Difficulty, string> = {
  EASY: "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15",
  MEDIUM: "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15",
  HARD: "text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/15",
};

export default function BattlePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [battleType, setBattleType] = useState<BattleType>("DSA");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [lobbyMode, setLobbyMode] = useState<"RANKED" | "VERSUS" | "SOLO">("RANKED");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [teamSize, setTeamSize] = useState(1);
  const [isPrivate, setIsPrivate] = useState(false);
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
    const minTopics = lobbyMode === "RANKED" ? 3 : 1;
    if (selectedTopics.length < minTopics) {
      setCreateError(`Select at least ${minTopics} topic${minTopics > 1 ? "s" : ""}`);
      return;
    }
    setCreating(true);
    const isPublicMatch = !isPrivate && lobbyMode !== "SOLO";
    const endpoint = isPublicMatch ? "/battle/matchmaking" : "/battle";
    try {
      const room = await api<BattleRoom | { room: BattleRoom }>(endpoint, {
        method: "POST",
        body: {
          battleType,
          difficulty,
          topics: selectedTopics,
          maxTeamSize: lobbyMode === "SOLO" ? 1 : teamSize,
          isRanked: lobbyMode === "RANKED",
          isSolo: lobbyMode === "SOLO",
          isPrivate: lobbyMode === "SOLO" ? true : isPrivate,
        },
      });
      const dataObj = (room as any).data ?? room;
      const code = dataObj.roomCode;
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
                      onClick={() => { setBattleType(key); setSelectedTopics([]); }}
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

            {/* Match Type */}
            <div>
              <label className="mb-2.5 block text-xs font-semibold text-text uppercase tracking-wider font-mono">Match Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    key: "RANKED",
                    title: "Ranked Battle",
                    desc: "Affects rating points & stats. Select at least 3 topics.",
                    icon: Swords,
                    accent: "border-primary bg-primary/5 text-primary shadow-[0_0_12px_rgba(255,107,0,0.1)]",
                    iconBg: "bg-primary/10 text-primary"
                  },
                  {
                    key: "VERSUS",
                    title: "Versus Practice",
                    desc: "No rating change. Select 1 or more topics.",
                    icon: Users,
                    accent: "border-primary bg-primary/5 text-primary shadow-[0_0_12px_rgba(255,107,0,0.1)]",
                    iconBg: "bg-primary/10 text-primary"
                  },
                  {
                    key: "SOLO",
                    title: "Solo Practice",
                    desc: "Practice coding solo. Start instantly. Select 1 or more topics.",
                    icon: Play,
                    accent: "border-primary bg-primary/5 text-primary shadow-[0_0_12px_rgba(255,107,0,0.1)]",
                    iconBg: "bg-primary/10 text-primary"
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = lobbyMode === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setLobbyMode(item.key as any)}
                      className={cn(
                        "group flex flex-col gap-3 rounded-xl border p-4 text-left transition-all hover:scale-[1.01] duration-200",
                        active
                          ? item.accent
                          : "border-border/60 bg-surface/30 text-text-muted hover:border-border hover:bg-surface-2"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn(
                          "flex size-8 items-center justify-center rounded-lg transition-colors",
                          active ? item.iconBg : "bg-surface-2 text-text-faint group-hover:text-text-muted"
                        )}>
                          <Icon className="size-4.5" />
                        </div>
                        {active && (
                          <span className="size-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-text">{item.title}</span>
                        <p className="text-[10px] text-text-faint leading-relaxed mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Room Visibility */}
            {lobbyMode !== "SOLO" && (
              <div>
                <label className="mb-2.5 block text-xs font-semibold text-text uppercase tracking-wider font-mono">Room Visibility</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={cn(
                      "group flex flex-col gap-1 rounded-xl border p-4 text-left transition-all hover:scale-[1.01] duration-200",
                      !isPrivate
                        ? "border-primary bg-primary/5 text-primary shadow-[0_0_12px_rgba(255,107,0,0.1)]"
                        : "border-border/60 bg-surface/30 text-text-muted hover:border-border hover:bg-surface-2"
                    )}
                  >
                    <span className="font-bold text-xs text-text">Public Matchmaking</span>
                    <span className="text-[10px] text-text-faint leading-relaxed mt-0.5">
                      Enter a queue to automatically find and play with online players matching your settings.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={cn(
                      "group flex flex-col gap-1 rounded-xl border p-4 text-left transition-all hover:scale-[1.01] duration-200",
                      isPrivate
                        ? "border-primary bg-primary/5 text-primary shadow-[0_0_12px_rgba(255,107,0,0.1)]"
                        : "border-border/60 bg-surface/30 text-text-muted hover:border-border hover:bg-surface-2"
                    )}
                  >
                    <span className="font-bold text-xs text-text">Private Custom Room</span>
                    <span className="text-[10px] text-text-faint leading-relaxed mt-0.5">
                      Create a private lobby. Play custom games only with friends using room code or invites.
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Topics */}
            <div>
              <label className="mb-2 block text-[15px] font-medium text-text">
                Topics <span className="font-normal text-text-faint">{lobbyMode === "RANKED" ? "(pick at least 3)" : "(pick at least 1)"}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(TOPICS_BY_MODE[battleType] ?? []).map(({ key, label }) => {
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
              {selectedTopics.length > 0 && selectedTopics.length < (lobbyMode === "RANKED" ? 3 : 1) && (
                <p className="mt-2 text-sm text-danger">
                  {(lobbyMode === "RANKED" ? 3 : 1) - selectedTopics.length} more needed
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
            {lobbyMode !== "SOLO" && (
              <div>
                <label className="mb-2 block text-[15px] font-medium text-text">Team size</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
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
            )}

            <Button type="submit" loading={creating}>
              <Swords className="size-4" />
              {!isPrivate && lobbyMode !== "SOLO" ? "Find Match" : "Create room"}
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
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
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
                <Badge
                  className={cn(
                    "border font-medium",
                    activeRoom.isSolo
                      ? "border-blue-500/20 bg-blue-500/10 text-blue-600"
                      : activeRoom.isRanked !== false
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
                        : "border-purple-500/20 bg-purple-500/10 text-purple-600"
                  )}
                >
                  {activeRoom.isSolo ? "Solo Practice" : activeRoom.isRanked !== false ? "Ranked" : "Practice"}
                </Badge>
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

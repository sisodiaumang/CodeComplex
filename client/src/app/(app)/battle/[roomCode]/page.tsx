"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  RotateCcw,
  Code2,
  Terminal,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Maximize2,
  ChevronDown,
  MessageSquare,
  Volume2,
  AlertTriangle,
  Settings,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { api, errorMessage } from "@/lib/api";
import {
  asUser,
  avatarUrl,
  type BattleRoom,
  type PublicUser,
  type RoomMember,
} from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { useAuth } from "@/stores/auth-store";
import { useTheme } from "@/stores/theme-store";
import { socket } from "@/stores/socket-store";
import { ChatConsole } from "@/components/ChatConsole";
import KeyboardMascotAnimation from "@/components/KeyboardMascotAnimation";
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

function splitCode(language: string, fullCode: string): { visibleCode: string; hiddenCode: string; splitType: "before" | "after" | "none" } {
  if (!fullCode) return { visibleCode: "", hiddenCode: "", splitType: "none" };

  const lang = language.toLowerCase();

  // check for explicit delimiters first
  const explicitDelimiter = lang === "python" || lang === "python3" ? "# @driver-code-start" : "// @driver-code-start";
  const explicitIndex = fullCode.indexOf(explicitDelimiter);
  if (explicitIndex !== -1) {
    let visible = fullCode.substring(0, explicitIndex).trim() + "\n";
    if (lang === "java" && visible.includes("public class Main") && !visible.endsWith("}")) {
      visible += "\n}\n";
    }
    return {
      visibleCode: visible,
      hiddenCode: fullCode.substring(explicitIndex + explicitDelimiter.length).trim(),
      splitType: "after"
    };
  }

  if (lang === "cpp" || lang === "c++") {
    const mainIndex = fullCode.indexOf("int main(");
    if (mainIndex !== -1) {
      return {
        visibleCode: fullCode.substring(0, mainIndex).trim() + "\n",
        hiddenCode: fullCode.substring(mainIndex),
        splitType: "after"
      };
    }
  } else if (lang === "python" || lang === "python3") {
    let mainIndex = fullCode.indexOf("def main():");
    if (mainIndex === -1) {
      mainIndex = fullCode.indexOf("if __name__ ==");
    }
    if (mainIndex !== -1) {
      return {
        visibleCode: fullCode.substring(0, mainIndex).trim() + "\n",
        hiddenCode: fullCode.substring(mainIndex),
        splitType: "after"
      };
    }
  } else if (lang === "java") {
    const mainIndex = fullCode.indexOf("public static void main(");
    if (mainIndex !== -1) {
      let visible = fullCode.substring(0, mainIndex).trim() + "\n";
      if (visible.includes("public class Main") && !visible.endsWith("}")) {
        visible += "\n}\n";
      }
      return {
        visibleCode: visible,
        hiddenCode: fullCode.substring(mainIndex),
        splitType: "after"
      };
    }
  } else if (lang === "javascript" || lang === "js") {
    const solutionIndex = fullCode.indexOf("class Solution");
    if (solutionIndex !== -1) {
      return {
        visibleCode: fullCode.substring(solutionIndex),
        hiddenCode: fullCode.substring(0, solutionIndex),
        splitType: "before"
      };
    }
  }

  return { visibleCode: fullCode, hiddenCode: "", splitType: "none" };
}

function combineCode(language: string, visibleCode: string, hiddenCode: string, splitType: "before" | "after" | "none"): string {
  if (splitType === "none" || !hiddenCode) return visibleCode;

  const lang = language.toLowerCase();
  let processedVisible = visibleCode.trim();

  if (lang === "java" && processedVisible.includes("public class Main") && processedVisible.endsWith("}")) {
    processedVisible = processedVisible.slice(0, -1).trim();
  }

  if (splitType === "before") {
    return hiddenCode + "\n" + processedVisible;
  } else {
    const delimiter = lang === "python" || lang === "python3" ? "# @driver-code-start" : "// @driver-code-start";
    return processedVisible + "\n\n" + delimiter + "\n" + hiddenCode;
  }
}

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
  const [chatOpen, setChatOpen] = useState(false);

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

  const resolvedMatchId = room?.matchId && typeof room.matchId === "object"
    ? (room.matchId as any)._id
    : room?.matchId;

  // If the room has transitioned to STARTED or FINISHED and has a valid matchId,
  // we mount the CodingWorkspace so players can play or view the results scoreboard.
  if (room && (room.status === "STARTED" || room.status === "FINISHED") && resolvedMatchId) {
    return (
      <CodingWorkspace
        room={room}
        matchId={resolvedMatchId}
        onLeave={() => router.push("/battle")}
      />
    );
  }

  if (!room || room.status === "CANCELLED" || (room.status === "FINISHED" && !resolvedMatchId)) {
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

  const inTeamA = teamA.some((m) => {
    const id = memberId(m);
    return user && (id === user._id || id === user.username);
  });
  const inTeamB = teamB.some((m) => {
    const id = memberId(m);
    return user && (id === user._id || id === user.username);
  });
  const userTeam = inTeamA ? "A" : inTeamB ? "B" : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      {/* ── Room header ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ModeBadge type={room.battleType} />
              <Badge
                className={cn(
                  "border font-medium",
                  room.isSolo
                    ? "border-blue-500/20 bg-blue-500/10 text-blue-600"
                    : room.isRanked !== false
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
                      : "border-purple-500/20 bg-purple-500/10 text-purple-600"
                )}
              >
                {room.isSolo ? "Solo Practice" : room.isRanked !== false ? "Ranked" : "Practice"}
              </Badge>
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

            {/* Chat Toggle Button */}
            {userTeam && (
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all cursor-pointer h-9 shadow-sm",
                  chatOpen
                    ? "bg-primary border-primary text-white"
                    : "bg-surface-1 border-border text-text-muted hover:text-text hover:border-primary/50"
                )}
              >
                <MessageSquare className="size-3.5" />
                <span>Chat</span>
              </button>
            )}

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
      {room.isSolo ? (
        <div className="grid gap-5">
          <TeamPanel
            label="Your Team"
            color="blue"
            members={teamA}
            capacity={room.teamSize}
            hostId={hostId}
            onJoin={act(`/battle/${roomCode}/team-a`)}
            disabled={started}
          />
        </div>
      ) : (
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
      )}

      {/* ── Invite friends ── */}
      {!started && !room.isSolo && (
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

      {userTeam && (
        <ChatConsole
          roomCode={roomCode}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          userTeam={userTeam}
          roomStatus={room.status}
        />
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
      </ul>
    </div>
  );
}

/* ─── Coding Workspace ─────────────────────────────────────────────────── */

interface CodingWorkspaceProps {
  room: BattleRoom;
  matchId: string;
  onLeave: () => void;
}

function CodingWorkspace({ room, matchId, onLeave }: CodingWorkspaceProps) {
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  
  const [chatOpen, setChatOpen] = useState(false);
  const teamA = room.teams?.teamA ?? [];
  const teamB = room.teams?.teamB ?? [];
  const inTeamA = teamA.some((m) => {
    const id = memberId(m);
    return user && (id === user._id || id === user.username);
  });
  const inTeamB = teamB.some((m) => {
    const id = memberId(m);
    return user && (id === user._id || id === user.username);
  });
  const userTeam = inTeamA ? "A" : inTeamB ? "B" : null;

  const [selectedLang, setSelectedLang] = useState<string>("cpp");
  const [codeByLang, setCodeByLang] = useState<Record<string, string>>({});
  const [consoleTab, setConsoleTab] = useState<"result" | "submissions">("result");
  const [activeTab, setActiveTab] = useState<"description" | "submissions">("description");
  const { resolved: resolvedTheme } = useTheme();
  
  // Submission execution state
  const [submitting, setSubmitting] = useState(false);

  // Resizable layout states
  const [leftWidth, setLeftWidth] = useState<number>(45); // width in %
  const [bottomHeight, setBottomHeight] = useState<number>(224); // height in px
  const [fontSize, setFontSize] = useState<number>(14); // editor text size
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const isDraggingLeftRef = useRef(false);
  const isDraggingBottomRef = useRef(false);

  const handleMouseMoveLeft = useCallback((e: MouseEvent) => {
    if (!isDraggingLeftRef.current) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    setLeftWidth(Math.max(20, Math.min(80, newWidth)));
  }, []);

  const handleMouseUpLeft = useCallback(() => {
    isDraggingLeftRef.current = false;
    setIsDragging(false);
    document.body.style.cursor = "";
    document.removeEventListener("mousemove", handleMouseMoveLeft);
    document.removeEventListener("mouseup", handleMouseUpLeft);
  }, [handleMouseMoveLeft]);

  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeftRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", handleMouseMoveLeft);
    document.addEventListener("mouseup", handleMouseUpLeft);
  };

  const handleMouseMoveBottom = useCallback((e: MouseEvent) => {
    if (!isDraggingBottomRef.current) return;
    const rightPanel = document.getElementById("right-workspace-panel");
    if (!rightPanel) return;
    const rect = rightPanel.getBoundingClientRect();
    const newHeight = rect.bottom - e.clientY;
    setBottomHeight(Math.max(100, Math.min(rect.height - 100, newHeight)));
  }, []);

  const handleMouseUpBottom = useCallback(() => {
    isDraggingBottomRef.current = false;
    setIsDragging(false);
    document.body.style.cursor = "";
    document.removeEventListener("mousemove", handleMouseMoveBottom);
    document.removeEventListener("mouseup", handleMouseUpBottom);
  }, [handleMouseMoveBottom]);

  const handleMouseDownBottom = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingBottomRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "row-resize";
    document.addEventListener("mousemove", handleMouseMoveBottom);
    document.addEventListener("mouseup", handleMouseUpBottom);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMoveLeft);
      document.removeEventListener("mouseup", handleMouseUpLeft);
      document.removeEventListener("mousemove", handleMouseMoveBottom);
      document.removeEventListener("mouseup", handleMouseUpBottom);
    };
  }, [handleMouseMoveLeft, handleMouseUpLeft, handleMouseMoveBottom, handleMouseUpBottom]);
  const [latestSubmission, setLatestSubmission] = useState<any | null>(null);
  
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [hasTriggeredModal, setHasTriggeredModal] = useState(false);

  // Moderation / Flag Report state variables
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetType, setReportTargetType] = useState<"USER" | "QUESTION">("USER");
  const [reportedPlayerUsername, setReportedPlayerUsername] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState("");

  const submitReport = async () => {
    setSubmittingReport(true);
    setReportError("");
    try {
      const payload: any = {
        targetType: reportTargetType,
        reason: reportReason,
        details: reportDetails,
        matchId: matchId || undefined,
      };

      if (reportTargetType === "USER") {
        payload.reportedUsername = reportedPlayerUsername;
      } else {
        payload.reportedQuestionId = questionQuery.data?.question?._id;
      }

      await api("/user/report", {
        method: "POST",
        body: payload,
      });

      setReportSuccess(true);
      setReportReason("");
      setReportDetails("");
      setReportedPlayerUsername("");
    } catch (err: any) {
      setReportError(errorMessage(err) || "Failed to submit report. Please try again.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const opponentsList = [
    ...teamA.map((m) => asUser(m)?.username),
    ...teamB.map((m) => asUser(m)?.username),
  ].filter((username): username is string => Boolean(username) && username !== user?.username);

  // Queries
  const questionQuery = useQuery({
    queryKey: ["match", matchId, "question"],
    queryFn: () => api<{ question: any }>(`/match/${matchId}/question`),
    enabled: Boolean(matchId),
  });

  const liveMatchQuery = useQuery({
    queryKey: ["match", matchId, "live"],
    queryFn: () => api<any>(`/match/${matchId}/live`),
    enabled: Boolean(matchId) && room?.status !== "FINISHED",
    refetchInterval: room?.status === "FINISHED" ? false : 3000,
  });

  const submissionsQuery = useQuery({
    queryKey: ["match", matchId, "submissions"],
    queryFn: () => api<any[]>(`/submission/match/${matchId}`),
    enabled: Boolean(matchId),
    refetchInterval: room?.status === "FINISHED" ? false : 3000,
  });

  const isRankedMatch = room && !room.isSolo && room.isRanked !== false;

  const ratingChangesQuery = useQuery({
    queryKey: ["match", matchId, "rating-changes"],
    queryFn: () => api<{ success: boolean; data: any[] }>(`/rating/match/${matchId}`),
    enabled: Boolean(matchId && (room?.status === "FINISHED" || liveMatchQuery.data?.status === "COMPLETED" || liveMatchQuery.data?.status === "ABANDONED")),
    refetchInterval: (query) => {
      const historyData = query.state.data?.data || [];
      const hasRecord = historyData.some(
        (h: any) => h.user === user?._id || h.user === user?.username
      );
      return hasRecord ? false : 2000;
    },
    retry: 5,
    retryDelay: 1000,
  });

  useEffect(() => {
    const liveMatchStatus = liveMatchQuery.data?.status;
    const isEnded = room?.status === "FINISHED" || liveMatchStatus === "COMPLETED" || liveMatchStatus === "ABANDONED";
    if (isEnded && !hasTriggeredModal) {
      setHasTriggeredModal(true);
    }
  }, [liveMatchQuery.data?.status, room?.status, hasTriggeredModal]);

  const question = questionQuery.data?.question;
  const liveMatch = liveMatchQuery.data;
  const matchSubmissions = submissionsQuery.data || [];

  // Opponent typing indicator logic
  const [typingState, setTypingState] = useState<Record<string, boolean>>({});
  const [opponentPetState, setOpponentPetState] = useState<Record<string, { type: string; color: string }>>({});
  const [lastActiveOpponentName, setLastActiveOpponentName] = useState<string | null>(null);

  // Sync mascot preferences from room members on load/change
  useEffect(() => {
    if (!room || !room.teams) return;
    const newPets: Record<string, { type: string; color: string }> = {};
    const processMember = (member: any) => {
      if (member && typeof member === "object" && member.username) {
        newPets[member.username] = {
          type: member.mascot?.type ?? "cat",
          color: member.mascot?.color ?? "#FF6B00",
        };
      }
    };
    (room.teams.teamA ?? []).forEach(processMember);
    (room.teams.teamB ?? []).forEach(processMember);
    
    if (Object.keys(newPets).length > 0) {
      setOpponentPetState((prev) => ({
        ...prev,
        ...newPets,
      }));
    }
  }, [room]);

  useEffect(() => {
    const activeName = Object.keys(typingState).find((username) => typingState[username]);
    if (activeName) {
      setLastActiveOpponentName(activeName);
    }
  }, [typingState]);

  const [hideMascots, setHideMascots] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mascot-hidden") === "true";
    }
    return false;
  });

  const toggleHideMascots = () => {
    const next = !hideMascots;
    setHideMascots(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("mascot-hidden", String(next));
    }
  };

  const [myPetType, setMyPetType] = useState("cat");
  const [myPetColor, setMyPetColor] = useState("#FF6B00");

  useEffect(() => {
    if (user?.mascot) {
      setMyPetType(user.mascot.type);
      setMyPetColor(user.mascot.color);
    } else if (typeof window !== "undefined") {
      setMyPetType(localStorage.getItem("mascot-type") ?? "cat");
      setMyPetColor(localStorage.getItem("mascot-color") ?? "#FF6B00");
    }
  }, [user?.mascot]);

  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOpponentTyping = ({ username, isTyping, pet }: { username: string; isTyping: boolean; pet?: { type: string; color: string } }) => {
      setTypingState((prev) => ({ ...prev, [username]: isTyping }));
      if (pet) {
        setOpponentPetState((prev) => ({ ...prev, [username]: pet }));
      }
    };

    socket.on("battle:opponent-typing", handleOpponentTyping);

    return () => {
      socket.off("battle:opponent-typing", handleOpponentTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        socket.emit("battle:typing", { roomCode: room.roomCode, isTyping: false });
      }
    };
  }, [room.roomCode]);

  const handleEditorChange = (val: string | undefined) => {
    setCodeByLang(prev => ({ ...prev, [selectedLang]: val ?? "" }));

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("battle:typing", {
        roomCode: room.roomCode,
        isTyping: true,
        pet: { type: myPetType, color: myPetColor }
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("battle:typing", { roomCode: room.roomCode, isTyping: false });
    }, 2000);
  };

  const isOpponentTyping = Object.values(typingState).some(Boolean);
  const activeOpponentName = Object.keys(typingState).find((username) => typingState[username]);
  const activeOpponentPet = (activeOpponentName ? opponentPetState[activeOpponentName] : null)
    || (lastActiveOpponentName ? opponentPetState[lastActiveOpponentName] : null)
    || Object.values(opponentPetState)[0]
    || null;

  // Initialize starter code when question changes
  useEffect(() => {
    if (question && question.starterCode) {
      const initial: Record<string, string> = {};
      const supported = question.judgeConfig?.supportedLanguages || ["cpp", "java", "python", "javascript"];
      
      for (const lang of supported) {
        const fullCode = question.starterCode[lang] || "";
        const { visibleCode } = splitCode(lang, fullCode);
        initial[lang] = visibleCode;
      }
      setCodeByLang(initial);
      
      // Set default selected language based on supported languages
      if (supported.length > 0) {
        setSelectedLang(supported[0]);
      }
    }
  }, [question]);

  // Initialize Prompt War state
  useEffect(() => {
    if (room.battleType === "PROMPT_WAR") {
      setSelectedLang("javascript");
      setCodeByLang(prev => ({ ...prev, javascript: prev.javascript ?? "" }));
    }
  }, [room.battleType]);

  // Timer countdown
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!liveMatch?.timer?.endsAt) return;
    const endsAtTime = new Date(liveMatch.timer.endsAt).getTime();
    
    const tick = () => {
      const diff = Math.max(0, Math.floor((endsAtTime - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0) {
        clearInterval(interval);
      }
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [liveMatch?.timer?.endsAt]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Submit code mutation
  const submitCodeMutation = useMutation({
    mutationFn: (payload: { matchId: string; language: string; code: string }) =>
      api<{ submissionId: string; status: string }>("/submission", {
        method: "POST",
        body: payload,
      }),
    onSuccess: async (res) => {
      const subId = res?.submissionId;
      if (!subId) {
        setSubmitting(false);
        return;
      }
      
      // Poll submission status until settled (not PENDING or RUNNING)
      let attempts = 0;
      const poll = async () => {
        try {
          const sub = await api<any>(`/submission/${subId}`);
          
          if (sub.status === "PENDING" || sub.status === "RUNNING") {
            attempts++;
            if (attempts < 20) {
              setTimeout(poll, 1500);
            } else {
              setSubmitting(false);
            }
          } else {
            setLatestSubmission(sub);
            setSubmitting(false);
            setConsoleTab("result");
            queryClient.invalidateQueries({ queryKey: ["match", matchId] });
          }
        } catch {
          setSubmitting(false);
        }
      };
      
      setTimeout(poll, 1500);
    },
    onError: (err) => {
      setSubmitting(false);
      alert("Submission failed: " + errorMessage(err));
    }
  });

  const handleResetCode = () => {
    if (question && question.starterCode && question.starterCode[selectedLang]) {
      if (confirm("Reset editor to starter code? Your current edits in this language will be discarded.")) {
        const { visibleCode } = splitCode(selectedLang, question.starterCode[selectedLang]);
        setCodeByLang(prev => ({ ...prev, [selectedLang]: visibleCode }));
      }
    }
  };

  const handleSubmit = () => {
    const currentCode = codeByLang[selectedLang] || "";
    if (currentCode.trim().length === 0) return;
    
    // Combine visible user code with hidden driver code if it exists
    const fullStarterCode = question?.starterCode?.[selectedLang] || "";
    const { hiddenCode, splitType } = splitCode(selectedLang, fullStarterCode);
    const combinedCode = combineCode(selectedLang, currentCode, hiddenCode, splitType);

    setSubmitting(true);
    setLatestSubmission(null);
    submitCodeMutation.mutate({
      matchId,
      language: selectedLang,
      code: combinedCode
    });
  };

  const [resigning, setResigning] = useState(false);
  const resignMutation = useMutation({
    mutationFn: () => api(`/match/${matchId}/abandon`, { method: "POST", body: { reason: "Forfeited via Resign button" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["battle", "me", "active"] });
      onLeave();
    },
    onError: (err) => {
      alert("Resignation failed: " + errorMessage(err));
    },
    onSettled: () => {
      setResigning(false);
    }
  });

  const handleResign = () => {
    if (confirm("Are you sure you want to resign and forfeit this match? This will count as a loss and end the battle.")) {
      setResigning(true);
      resignMutation.mutate();
    }
  };

  const solved = matchSubmissions.some((sub: any) => {
    const subUserId = typeof sub.userId === "object" && sub.userId ? sub.userId._id : sub.userId;
    return subUserId === user?._id && sub.status === "ACCEPTED";
  });

  const hasSubmitted = matchSubmissions.some((sub: any) => {
    const subUserId = typeof sub.userId === "object" && sub.userId ? sub.userId._id : sub.userId;
    return subUserId === user?._id;
  });
  
  const matchEnded = room?.status === "FINISHED" || liveMatch?.status === "COMPLETED" || liveMatch?.status === "ABANDONED" || (liveMatch?.timer?.endsAt && new Date(liveMatch.timer.endsAt).getTime() <= Date.now());
  const canLeaveSafely = solved || matchEnded;

  const hasEmbeddedFormats = !!question?.statement?.markdown && (
    question.statement.markdown.toLowerCase().includes("input format") || 
    question.statement.markdown.toLowerCase().includes("examples")
  );

  const supportedLangs = question?.judgeConfig?.supportedLanguages || ["cpp", "java", "python", "javascript"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg text-text antialiased font-sans">
      {/* Header Panel */}
      <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0 shadow-sm select-none">
        <div className="flex items-center gap-3">
          {canLeaveSafely ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (liveMatch?.status === "COMPLETED" || liveMatch?.status === "ABANDONED" || room?.status === "FINISHED") {
                    setShowResultsModal(true);
                  } else {
                    onLeave();
                  }
                }} 
                className="flex items-center gap-1.5 text-text-muted hover:text-text text-sm font-semibold transition-colors cursor-pointer"
              >
                <DoorOpen className="size-4 text-emerald-500" /> Leave Arena
              </button>
              {(liveMatch?.status === "COMPLETED" || liveMatch?.status === "ABANDONED") && (
                <button
                  onClick={() => setShowResultsModal(true)}
                  className="flex items-center gap-1.5 text-amber-500 hover:text-amber-400 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Trophy className="size-4" /> View Results
                </button>
              )}
            </div>
          ) : (
            <button onClick={handleResign} disabled={resigning} className="flex items-center gap-1.5 text-red-500 hover:text-red-400 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50">
              <XCircle className="size-4" /> Resign
            </button>
          )}
          <span className="text-border">|</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold bg-surface-3 px-2 py-0.5 rounded border border-border/60">
              Room Code: {room.roomCode}
            </span>
          </div>
        </div>

        {/* Timer countdown banner */}
        <div className="flex items-center gap-2 bg-primary/5 dark:bg-primary-subtle border border-primary/20 rounded-full px-4 py-1">
          <Clock className="size-4 text-primary animate-pulse" />
          <span className="font-mono text-sm font-black tracking-wider text-primary">
            {formatTime(timeLeft)}
          </span>
          <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-bold select-none tracking-wide text-[10px] scale-90 uppercase">
            Live Round
          </Badge>
        </div>

        {/* Voice and Chat controls */}
        <div className="flex items-center gap-3">
          {userTeam && (
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border bg-surface border-border text-text-muted hover:text-text hover:border-red-500/50 cursor-pointer h-9 shadow-sm"
            >
              <AlertTriangle className="size-3.5 text-red-500" />
              <span>Report</span>
            </button>
          )}
          {userTeam && (
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all cursor-pointer h-9 shadow-sm",
                chatOpen
                  ? "bg-primary border-primary text-white"
                  : "bg-surface border-border text-text-muted hover:text-text hover:border-primary/50"
              )}
            >
              <MessageSquare className="size-3.5" />
              <span>Chat</span>
            </button>
          )}
        </div>

        {/* Score Board */}
        <div className="flex items-center gap-5">
          {room.isSolo ? (
            <div className="text-right">
              <span className="text-[10px] text-text-faint font-semibold uppercase block">Score</span>
              <span className="font-mono text-sm font-bold text-primary">
                {(userTeam === "B" ? liveMatch?.score?.teamB : liveMatch?.score?.teamA) ?? 0} pts
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <span className="text-[10px] text-text-faint font-semibold uppercase block">Team A</span>
                <span className="font-mono text-sm font-bold text-blue-400">{liveMatch?.score?.teamA ?? 0} pts</span>
              </div>
              <div className="text-center font-mono text-xs font-bold text-text-faint px-1.5 py-0.5 bg-surface-2 rounded border border-border/50">VS</div>
              <div className="text-left">
                <span className="text-[10px] text-text-faint font-semibold uppercase block">Team B</span>
                <span className="font-mono text-sm font-bold text-red-400">{liveMatch?.score?.teamB ?? 0} pts</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace (IDE splitter layout) */}
      <main className="flex-1 flex flex-row overflow-hidden min-h-0">
        {/* Left Side: Question Pane */}
        <div 
          style={{ width: `${leftWidth}%` }}
          className="border-r border-border bg-surface/30 flex flex-col overflow-hidden min-h-0 shrink-0 min-w-[280px]"
        >
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 h-10 shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("description")}
                className={cn(
                  "h-10 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                  activeTab === "description"
                    ? "border-primary text-text font-bold"
                    : "border-transparent text-text-muted hover:text-text"
                )}
              >
                <Code2 className="size-3.5 inline mr-1" /> Description
              </button>
              <button
                onClick={() => setActiveTab("submissions")}
                className={cn(
                  "h-10 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                  activeTab === "submissions"
                    ? "border-primary text-text font-bold"
                    : "border-transparent text-text-muted hover:text-text"
                )}
              >
                <Terminal className="size-3.5 inline mr-1" /> Team Submissions
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {activeTab === "description" ? (
              <div className="p-6 space-y-5">
                {questionQuery.isLoading ? (
                  <Spinner className="py-20" />
                ) : !question ? (
                  <div className="text-center py-20 text-sm text-text-faint">Question statement is loading...</div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold tracking-tight text-text">
                        {question.title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "border font-medium text-xs",
                            question.difficulty === "Easy" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                            question.difficulty === "Medium" && "border-amber-500/20 bg-amber-500/10 text-amber-500",
                            question.difficulty === "Hard" && "border-red-500/20 bg-red-500/10 text-red-500"
                          )}
                        >
                          {question.difficulty}
                        </Badge>
                        <Badge className="border border-border bg-surface-2 text-text-muted text-xs capitalize">
                          {room.battleType === "PROMPT_WAR" ? "Prompt War" : question.category?.toLowerCase()}
                        </Badge>
                      </div>
                    </div>

                    {room.battleType === "PROMPT_WAR" ? (
                      <>
                        {/* Scenario Brief */}
                        <div className="prose dark:prose-invert max-w-none text-[13px] leading-relaxed text-text-muted font-sans whitespace-pre-wrap">
                          {question.scenario}
                        </div>

                        {/* Target Artifact Type */}
                        <div className="space-y-1.5 pt-2">
                          <h4 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Target Artifact</h4>
                          <Badge className="border border-primary/20 bg-primary/10 text-primary font-bold text-xs uppercase">
                            {question.targetArtifactType || "text"}
                          </Badge>
                        </div>

                        {/* Constraints */}
                        {question.constraints && question.constraints.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Constraints</h3>
                            <ul className="list-disc pl-5 text-xs text-text-muted space-y-2">
                              {question.constraints.map((c: string, idx: number) => (
                                <li key={idx} className="leading-relaxed">{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Rubric Criteria */}
                        {question.evaluationCriteria && question.evaluationCriteria.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Grading Criteria Rubric</h3>
                            <div className="space-y-2.5">
                              {question.evaluationCriteria.map((c: any, idx: number) => (
                                <div key={idx} className="bg-surface-2 border border-border/50 rounded-lg p-3 text-[12px] leading-relaxed shadow-sm font-sans flex justify-between items-start gap-4">
                                  <div>
                                    <span className="text-text font-bold block mb-0.5 text-xs text-text-muted">{c.id}</span>
                                    <p className="text-text-faint text-xs">{c.description}</p>
                                  </div>
                                  <Badge className="shrink-0 bg-surface border border-border text-text-muted text-xs font-semibold">Weight: {c.weight}%</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Statement markdown text description */}
                        <div className="prose dark:prose-invert max-w-none text-[13px] leading-relaxed text-text-muted font-sans whitespace-pre-wrap">
                          {question.statement?.markdown?.replace(/\\n/g, "\n")}
                        </div>

                        {/* Input / Output Formats */}
                        {!hasEmbeddedFormats && question.statement?.inputFormat && (
                          <div className="space-y-1.5 pt-2">
                            <h4 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Input Format</h4>
                            <div className="text-[13px] leading-relaxed text-text-muted font-sans whitespace-pre-wrap">
                              {question.statement.inputFormat.replace(/\\n/g, "\n")}
                            </div>
                          </div>
                        )}

                        {!hasEmbeddedFormats && question.statement?.outputFormat && (
                          <div className="space-y-1.5 pt-2">
                            <h4 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Output Format</h4>
                            <div className="text-[13px] leading-relaxed text-text-muted font-sans whitespace-pre-wrap">
                              {question.statement.outputFormat.replace(/\\n/g, "\n")}
                            </div>
                          </div>
                        )}

                        {!hasEmbeddedFormats && question.statement?.notes && (
                          <div className="space-y-1.5 pt-2 border-t border-border/10">
                            <h4 className="text-xs font-bold text-text-faint uppercase tracking-wider font-mono">Notes</h4>
                            <div className="text-[12px] italic leading-relaxed text-text-faint font-sans whitespace-pre-wrap">
                              {question.statement.notes.replace(/\\n/g, "\n")}
                            </div>
                          </div>
                        )}

                        {/* Examples */}
                        {!hasEmbeddedFormats && question.statement?.examples && question.statement.examples.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Examples</h3>
                            {question.statement.examples.map((ex: any, idx: number) => (
                              <div key={idx} className="bg-surface-2 border border-border/50 rounded-lg p-4 text-[13px] font-mono leading-relaxed space-y-1.5 shadow-sm">
                                <span className="text-text font-bold block mb-1 text-xs text-text-muted">Example {idx + 1}:</span>
                                <div className="text-text-muted text-xs space-y-1">
                                  <span className="text-text-faint block font-semibold uppercase tracking-wider text-[10px]">Input:</span>
                                  <pre className="text-text bg-surface-3/50 px-3 py-1.5 rounded border border-border/40 font-mono whitespace-pre-wrap leading-relaxed select-text">{ex.input}</pre>
                                </div>
                                <div className="text-text-muted text-xs space-y-1">
                                  <span className="text-text-faint block font-semibold uppercase tracking-wider text-[10px]">Output:</span>
                                  <pre className="text-text bg-surface-3/50 px-3 py-1.5 rounded border border-border/40 font-mono whitespace-pre-wrap leading-relaxed select-text">{ex.output}</pre>
                                </div>
                                 {ex.explanation && (
                                   <div className="text-text-faint mt-1.5 leading-relaxed bg-surface-3/55 px-2.5 py-1.5 rounded border border-border/30 text-xs whitespace-pre-wrap">
                                     <span className="text-text-muted font-bold">Explanation:</span> {ex.explanation?.replace(/\\n/g, "\n")}
                                   </div>
                                 )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Constraints */}
                        {!hasEmbeddedFormats && question.statement?.constraints && question.statement.constraints.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Constraints</h3>
                            <ul className="list-disc pl-5 text-xs text-text-muted space-y-2">
                              {question.statement.constraints.map((c: any, idx: number) => (
                                <li key={idx} className="leading-relaxed">
                                  <code className="bg-surface-2 border border-border/50 px-1 py-0.5 rounded font-mono text-[11px] text-text font-bold mr-1">{c.variable}</code>: {c.description} (Min: {c.min}, Max: {c.max})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Hints */}
                        {question.hints && question.hints.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/10">
                            <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Hints</h3>
                            <div className="space-y-2">
                              {question.hints.map((hint: any, idx: number) => (
                                <details key={idx} className="bg-surface-2 border border-border/50 rounded-lg group transition-all duration-200">
                                  <summary className="px-4 py-2.5 text-xs font-semibold text-text-muted hover:text-text cursor-pointer select-none outline-none list-none flex items-center justify-between">
                                    <span>Hint {hint.order || idx + 1}</span>
                                    <ChevronDown className="size-3 text-text-faint transition-transform duration-200 group-open:rotate-180" />
                                  </summary>
                                   <div className="px-4 pb-3 text-xs text-text-muted leading-relaxed border-t border-border/30 pt-2 font-mono whitespace-pre-wrap">
                                     {hint.text?.replace(/\\n/g, "\n")}
                                   </div>
                                </details>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="p-0 divide-y divide-border/40">
                <div className="px-5 py-4 border-b border-border bg-surface shrink-0">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Submissions Log</h3>
                </div>
                {matchSubmissions.length === 0 ? (
                  <div className="py-20 text-center text-xs text-text-faint">No submissions yet. Be the first to submit!</div>
                ) : (
                  matchSubmissions.map((sub: any) => {
                    const isAccepted = sub.status === "ACCEPTED";
                    const isCompErr = sub.judgeResult === "COMPILATION_ERROR";
                    return (
                      <div key={sub._id} className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-surface-2/40 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text">{sub.userId?.username}</span>
                            <Badge className="text-[10px] scale-90 border border-border uppercase bg-surface-3">{sub.language}</Badge>
                          </div>
                          <p className="text-[11px] text-text-faint font-mono">
                            Sub #{sub.submissionNumber} · {timeAgo(sub.createdAt)}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className={cn(
                            "font-bold uppercase tracking-wider font-mono text-[10px] px-2 py-0.5 rounded border inline-block",
                            isAccepted
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                              : isCompErr
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                : "border-red-500/20 bg-red-500/10 text-red-500"
                          )}>
                            {sub.judgeResult || sub.status}
                          </span>
                          <p className="text-[10px] text-text-faint font-mono font-bold">
                            Score: {sub.score} / 100
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Vertical Resize Splitter */}
        <div 
          onMouseDown={handleMouseDownLeft}
          className="w-1.5 hover:w-2 bg-border/20 hover:bg-primary/50 transition-all cursor-col-resize shrink-0 relative z-30 self-stretch flex items-center justify-center group"
        >
          <div className="w-[1px] h-6 bg-border group-hover:bg-primary" />
        </div>

        {/* Right Side: Code Editor Workspace */}
        <div id="right-workspace-panel" className="flex-1 flex flex-col overflow-hidden min-h-0 bg-surface/10">
          {/* Editor Header Bar */}
          <div className="h-10 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0 select-none">
            <div className="flex items-center gap-2">
              {room.battleType === "PROMPT_WAR" ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                    Prompt Instructions Box
                  </span>
                  <span className="text-[10px] text-text-faint/80 italic font-medium">
                    (Only 1 submission attempt allowed)
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="appearance-none rounded border border-border bg-surface-2 hover:bg-surface-3 hover:border-border-strong pl-3 pr-8 py-1 text-xs font-semibold text-text-muted hover:text-text cursor-pointer transition-colors outline-none h-7"
                  >
                    {supportedLangs.map((lang: string) => (
                      <option key={lang} value={lang}>
                        {lang === "cpp" ? "C++" : lang === "java" ? "Java" : lang === "python" ? "Python" : lang === "javascript" ? "JavaScript" : lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-text-faint pointer-events-none" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Font Size Controls */}
              <div className="flex items-center rounded border border-border bg-surface-2 overflow-hidden h-7 divide-x divide-border mr-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
                  className="px-2 h-full text-[10px] font-bold text-text-muted hover:text-text hover:bg-surface-3 transition-colors cursor-pointer flex items-center justify-center select-none border-none bg-transparent"
                  title="Decrease text size"
                >
                  A-
                </button>
                <span className="px-2 h-full flex items-center justify-center text-[10px] font-mono font-bold text-text-faint bg-surface select-none min-w-[34px]">
                  {fontSize}px
                </span>
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
                  className="px-2 h-full text-[10px] font-bold text-text-muted hover:text-text hover:bg-surface-3 transition-colors cursor-pointer flex items-center justify-center select-none border-none bg-transparent"
                  title="Increase text size"
                >
                  A+
                </button>
              </div>
              <button
                onClick={toggleHideMascots}
                className="flex items-center justify-center size-7 rounded border border-border bg-surface hover:bg-surface-2 text-text-muted hover:text-text transition-colors cursor-pointer"
                title={hideMascots ? "Show typing mascot pet" : "Hide typing mascot pet"}
              >
                {hideMascots ? (
                  <EyeOff className="size-3.5 text-text-muted" />
                ) : (
                  <Eye className="size-3.5 text-primary" />
                )}
              </button>
              <button
                onClick={handleResetCode}
                disabled={solved || matchEnded || (room.battleType === "PROMPT_WAR" && hasSubmitted)}
                className={cn(
                  "flex items-center justify-center size-7 rounded border border-border bg-surface text-text-muted hover:text-text transition-colors",
                  (solved || matchEnded || (room.battleType === "PROMPT_WAR" && hasSubmitted)) ? "opacity-50 cursor-not-allowed" : "hover:bg-surface-2 cursor-pointer"
                )}
                title="Reset starter code"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative min-h-[300px] border-b border-border">
            {/* Floating Animal Typing Animation */}
            {!hideMascots && !room.isSolo && (
              <div className="absolute top-3.5 right-3.5 z-10 animate-in fade-in duration-300">
                <KeyboardMascotAnimation active={isOpponentTyping} pet={activeOpponentPet} />
              </div>
            )}

            {questionQuery.isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/50"><Spinner /></div>
            ) : room.battleType === "PROMPT_WAR" ? (
              <textarea
                value={codeByLang[selectedLang] ?? ""}
                onChange={(e) => handleEditorChange(e.target.value)}
                readOnly={solved || matchEnded || hasSubmitted}
                placeholder={hasSubmitted 
                  ? "Prompt submitted! Waiting for opponent to submit before LLM grading begins." 
                  : "Write your prompt engineering instructions here... The sharper instruction wins the judge. Only 1 attempt is allowed."}
                style={{ fontSize: `${fontSize}px`, lineHeight: `${Math.round(fontSize * 1.5)}px` }}
                className="w-full h-full p-4 resize-none bg-[#090a0f] text-text font-mono border-none focus:outline-none placeholder:text-text-faint/60"
              />
            ) : (
              <Editor
                height="100%"
                theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                language={selectedLang === "cpp" ? "cpp" : selectedLang === "java" ? "java" : selectedLang === "python" ? "python" : "javascript"}
                value={codeByLang[selectedLang] ?? ""}
                onChange={handleEditorChange}
                options={{
                  readOnly: solved || matchEnded,
                  minimap: { enabled: false },
                  fontSize: fontSize,
                  automaticLayout: true,
                  fontFamily: "var(--font-mono)",
                  lineHeight: Math.round(fontSize * 1.5),
                  padding: { top: 12 },
                }}
              />
            )}
          </div>

          {/* Horizontal Resize Splitter */}
          <div 
            onMouseDown={handleMouseDownBottom}
            className="h-1.5 hover:h-2 bg-border/20 hover:bg-primary/50 transition-all cursor-row-resize shrink-0 relative z-30 w-full flex items-center justify-center group"
          >
            <div className="h-[1px] w-6 bg-border group-hover:bg-primary" />
          </div>

          {/* Bottom Terminal Output Drawer */}
          <div 
            style={{ height: `${bottomHeight}px` }}
            className="bg-surface/80 border-t border-border flex flex-col shrink-0 overflow-hidden select-none"
          >
            <div className="h-9 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setConsoleTab("result")}
                  className={cn(
                    "h-9 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                    consoleTab === "result"
                      ? "border-primary text-text font-bold"
                      : "border-transparent text-text-muted hover:text-text"
                  )}
                >
                  Console Outcome
                </button>
              </div>
              <div className="flex items-center">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={submitting || solved || matchEnded || (codeByLang[selectedLang] || "").trim().length === 0 || (room.battleType === "PROMPT_WAR" && hasSubmitted)}
                  className="h-7 px-4 text-xs font-bold gap-1 bg-primary hover:bg-primary-hover text-white shadow-sm"
                >
                  <Send className="size-3" /> 
                  {room.battleType === "PROMPT_WAR" && hasSubmitted 
                    ? "Submitted" 
                    : submitting 
                      ? "Submitting..." 
                      : "Submit Solution"}
                </Button>
              </div>
            </div>

            {/* Console tab content container */}
            <div className={cn("flex-1 overflow-y-auto p-4 scrollbar-thin font-mono text-xs select-text", resolvedTheme === "dark" ? "bg-[#090a0f]" : "bg-surface")}>
              {submitting ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <Spinner className="py-2" />
                  <p className="text-text-muted text-xs animate-pulse">
                    {room.battleType === "PROMPT_WAR" 
                      ? "Judging prompt against scenario criteria using LLM judge..." 
                      : "Compiling solution & running test cases on Judge0..."}
                  </p>
                </div>
              ) : latestSubmission ? (
                <div className="space-y-4">
                  {/* Verdict header block */}
                  {latestSubmission.status === "PENDING" || latestSubmission.status === "RUNNING" ? (
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
                      <Spinner className="size-4 shrink-0 text-amber-500" />
                      <div>
                        <span className="font-black text-sm block uppercase">
                          {room.battleType === "PROMPT_WAR" ? "PROMPT SUBMITTED" : "GRADING IN PROGRESS"}
                        </span>
                        <span className="text-[11px] text-amber-500/80">
                          {room.battleType === "PROMPT_WAR"
                            ? "Prompt solution submitted successfully! Waiting for opponent to submit..."
                            : "Your code is being evaluated. Please wait..."}
                        </span>
                      </div>
                    </div>
                  ) : latestSubmission.status === "ACCEPTED" ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <div>
                        <span className="font-black text-sm block">ACCEPTED</span>
                        <span className="text-[11px] text-emerald-500/80">
                          {room.battleType === "PROMPT_WAR" 
                            ? `All grading criteria satisfied! Score: ${latestSubmission.score ?? 100}/100` 
                            : `All test cases passed! Score: ${latestSubmission.score ?? 100}/100`}
                        </span>
                      </div>
                    </div>
                  ) : latestSubmission.judgeResult === "COMPILATION_ERROR" ? (
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
                      <AlertCircle className="size-4 shrink-0" />
                      <div>
                        <span className="font-black text-sm block">COMPILATION ERROR</span>
                        <span className="text-[11px] text-amber-500/80">Failed to compile your source code. Check the details below.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                      <XCircle className="size-4 shrink-0" />
                      <div>
                        <span className="font-black text-sm block uppercase">{latestSubmission.judgeResult || latestSubmission.status}</span>
                        <span className="text-[11px] text-red-500/80">
                          {room.battleType === "PROMPT_WAR"
                            ? `Rubric evaluation. Score: ${latestSubmission.score ?? 0}/100`
                            : `Failing on test cases. Score: ${latestSubmission.score ?? 0}/100`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submission statistics (execution time, memory) */}
                  {latestSubmission.status !== "PENDING" && latestSubmission.status !== "RUNNING" && (
                    room.battleType === "PROMPT_WAR" ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-surface-2 p-2.5 rounded border border-border/40 text-center">
                          <span className="text-text-faint text-[10px] block uppercase font-sans">Criteria Passed</span>
                          <span className="text-text font-bold font-mono text-sm">{latestSubmission.passedTestCases ?? 0} / {latestSubmission.totalTestCases ?? 0}</span>
                        </div>
                        <div className="bg-surface-2 p-2.5 rounded border border-border/40 text-center">
                          <span className="text-text-faint text-[10px] block uppercase font-sans">Rubric Score</span>
                          <span className="text-text font-bold font-mono text-sm">{latestSubmission.score ?? 0} / 100</span>
                        </div>
                        <div className="bg-surface-2 p-2.5 rounded border border-border/40 text-center">
                          <span className="text-text-faint text-[10px] block uppercase font-sans">Evaluation Mode</span>
                          <span className="text-text font-bold font-mono text-sm">LLM Rubric</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-surface-2 p-2.5 rounded border border-border/40 text-center">
                          <span className="text-text-faint text-[10px] block uppercase font-sans">Pass Rate</span>
                          <span className="text-text font-bold font-mono text-sm">{latestSubmission.passedTestCases ?? 0} / {latestSubmission.totalTestCases ?? 0}</span>
                        </div>
                        <div className="bg-surface-2 p-2.5 rounded border border-border/40 text-center">
                          <span className="text-text-faint text-[10px] block uppercase font-sans">Time</span>
                          <span className="text-text font-bold font-mono text-sm">
                            {typeof latestSubmission.executionTime === "number" ? `${latestSubmission.executionTime}s` : "0.00s"}
                          </span>
                        </div>
                        <div className="bg-surface-2 p-2.5 rounded border border-border/40 text-center">
                          <span className="text-text-faint text-[10px] block uppercase font-sans">Memory</span>
                          <span className="text-text font-bold font-mono text-sm">
                            {typeof latestSubmission.memoryUsage === "number" ? `${(latestSubmission.memoryUsage / 1024).toFixed(1)}MB` : "0.0MB"}
                          </span>
                        </div>
                      </div>
                    )
                  )}

                  {/* Error feedback if compilation error or execution error */}
                  {latestSubmission.feedback && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-text-muted text-xs block font-sans font-bold">
                        {room.battleType === "PROMPT_WAR" ? "LLM Judge Rubric Feedback:" : "Compiler / Runtime Logs:"}
                      </span>
                      <pre className="bg-surface p-3 border border-border/50 rounded overflow-x-auto text-[11px] text-text-muted leading-relaxed font-mono whitespace-pre-wrap max-h-40">
                        {latestSubmission.feedback}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-text-faint text-xs space-y-1">
                  <Terminal className="size-5 text-text-faint" />
                  <p>
                    {room.battleType === "PROMPT_WAR"
                      ? "Welcome challenger! Write your prompt instructions on the box above and click \"Submit Solution\" to grade it."
                      : "Welcome challenger! Click \"Submit Solution\" to compile and run your code against the judge."}
                  </p>
                  <p className="text-[10px] text-text-faint/60">
                    {room.battleType === "PROMPT_WAR"
                      ? "LLM judge grading verdict, score, and rubric feedback will render here."
                      : "Results, pass rates, and compilation errors will render here."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {userTeam && (
        <ChatConsole
          roomCode={room.roomCode}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          userTeam={userTeam}
          roomStatus={room.status}
        />
      )}

      {/* Post-Match Results Overlay Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-surface border border-border shadow-2xl rounded-xl max-w-md w-full overflow-hidden flex flex-col select-none relative animate-scaleUp">
            
            {/* Close button to view code */}
            <button
              onClick={() => setShowResultsModal(false)}
              className="absolute top-3 right-3 text-text-faint hover:text-text p-1 rounded-md transition-colors cursor-pointer"
              title="Close and inspect code"
            >
              <X className="size-4" />
            </button>

            {/* Header */}
            <div className="p-6 text-center border-b border-border/60 bg-surface-2/40">
              <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <Trophy className="size-6" />
              </div>
              <h2 className="text-lg font-black tracking-wider font-mono text-text uppercase">
                Battle Results
              </h2>
              <p className="text-[11px] text-text-faint font-mono mt-1">
                Room Code: {room.roomCode}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 flex-1">
              {ratingChangesQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-2">
                  <Spinner className="py-2" />
                  <p className="text-xs text-text-muted font-mono animate-pulse">Calculating rating updates...</p>
                </div>
              ) : (
                (() => {
                  const myHistory = ratingChangesQuery.data?.data?.find(
                    (h: any) => h.user === user?._id || h.user === user?.username
                  );

                  if (!myHistory) {
                    if (ratingChangesQuery.isLoading) {
                      return (
                        <div className="flex flex-col items-center justify-center py-6 space-y-2">
                          <Spinner className="py-2" />
                          <p className="text-xs text-text-muted font-mono animate-pulse">Calculating rating updates...</p>
                        </div>
                      );
                    }

                    return (
                      <div className="text-center py-4 space-y-1">
                        <p className="text-sm font-semibold text-text">Battle Complete!</p>
                        <p className="text-xs text-text-faint max-w-xs mx-auto leading-relaxed animate-pulse">
                          {isRankedMatch
                            ? "Calculating rating updates..."
                            : "This was a casual match. Rating adjustments are only recorded for competitive ranked rooms."}
                        </p>
                      </div>
                    );
                  }

                  const isPositive = myHistory.change > 0;
                  const isZero = myHistory.change === 0;

                  return (
                    <div className="space-y-4 text-center">
                      {myHistory.result && (
                        <p className="text-xs font-semibold text-text-muted capitalize">
                          {myHistory.result}
                        </p>
                      )}

                      {/* Elo Delta Indicator */}
                      <div className="py-3 bg-surface-2/60 rounded-lg border border-border/50">
                        <span className="text-[10px] text-text-faint uppercase font-bold font-mono tracking-wider block">
                          {isRankedMatch ? "Rating Change" : "Casual Match Points"} ({myHistory.category || "DSA"})
                        </span>
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                          <span
                            className={cn(
                              "text-3xl font-black font-mono tracking-wider",
                              isPositive
                                ? "text-emerald-500"
                                : isZero
                                ? "text-text-muted"
                                : "text-danger"
                            )}
                          >
                            {isPositive ? `+${myHistory.change}` : myHistory.change}
                          </span>
                          <span className="text-[10px] text-text-faint font-bold font-mono uppercase">
                            {isRankedMatch ? "Elo" : "Pts"}
                          </span>
                        </div>
                      </div>

                      {/* Rating Flow */}
                      <div className="flex items-center justify-center gap-6 font-mono text-xs font-semibold">
                        <div>
                          <span className="text-[9px] text-text-faint block uppercase font-sans">Old Rating</span>
                          <span className="text-text-muted">{myHistory.oldRating}</span>
                        </div>
                        <div className="text-text-faint text-sm">➔</div>
                        <div>
                          <span className="text-[9px] text-text-faint block uppercase font-sans">New Rating</span>
                          <span className="text-emerald-500 font-bold">{myHistory.newRating}</span>
                        </div>
                      </div>
                      
                      {!isRankedMatch && (
                        <p className="text-[10px] text-text-faint/80 italic mt-1 font-sans">
                          (Casual match: Your profile's permanent competitive rating remains unchanged)
                        </p>
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-border/60 bg-surface-2/30 flex gap-2.5 shrink-0">
              {solved ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowResultsModal(false)}
                    className="flex-1 text-xs"
                  >
                    {room.battleType === "PROMPT_WAR" ? "Inspect Prompt" : "Inspect Code"}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onLeave}
                    className="flex-1 text-xs"
                  >
                    Return to Lobby
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onLeave}
                    className="flex-1 text-xs"
                  >
                    Return to Lobby
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowResultsModal(false)}
                    className="flex-1 text-xs bg-primary hover:bg-primary-hover text-white font-bold"
                  >
                    {room.battleType === "PROMPT_WAR" ? "Inspect Prompt" : "Continue to Edit"}
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Report Player / Question Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-surface border border-border shadow-2xl rounded-2xl max-w-md w-full overflow-hidden flex flex-col relative animate-scaleUp select-text">
            
            {/* Close button */}
            <button
              onClick={() => {
                setReportModalOpen(false);
                setReportTargetType("USER");
                setReportReason("");
                setReportDetails("");
                setReportedPlayerUsername("");
                setReportSuccess(false);
                setReportError("");
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text hover:bg-surface-2 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="size-4" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-border bg-surface-2/30 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl shadow-inner">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h2 className="text-md font-bold tracking-tight text-text">
                  File Match Report
                </h2>
                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                  Flag cheating behavior or report question issues to platform moderators.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {reportSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-text uppercase tracking-wider font-mono">Report Submitted</h3>
                    <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
                      Thank you for keeping DevArena fair. Administrators will review your report and audits.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setReportModalOpen(false);
                      setReportSuccess(false);
                    }}
                    className="h-9 px-6 text-xs font-bold bg-primary text-white border-none"
                  >
                    Close Window
                  </Button>
                </div>
              ) : (
                <>
                  {reportError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2 animate-shake">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{reportError}</span>
                    </div>
                  )}

                  {/* Target Type Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest font-mono">Report Target</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setReportTargetType("USER");
                          setReportReason("");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 py-3.5 px-4 rounded-xl border text-center transition-all cursor-pointer font-bold",
                          reportTargetType === "USER"
                            ? "bg-primary border-primary text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)]"
                            : "bg-surface-2 border-border text-text-muted hover:text-text hover:bg-surface-3"
                        )}
                      >
                        <Users className="size-4" />
                        <span className="text-[11px] uppercase font-mono tracking-wider">Report Player</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReportTargetType("QUESTION");
                          setReportReason("");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 py-3.5 px-4 rounded-xl border text-center transition-all cursor-pointer font-bold",
                          reportTargetType === "QUESTION"
                            ? "bg-primary border-primary text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)]"
                            : "bg-surface-2 border-border text-text-muted hover:text-text hover:bg-surface-3"
                        )}
                      >
                        <Terminal className="size-4" />
                        <span className="text-[11px] uppercase font-mono tracking-wider">Report Question</span>
                      </button>
                    </div>
                  </div>

                  {/* If target type is USER, show player dropdown */}
                  {reportTargetType === "USER" && (
                    <div className="space-y-2 animate-fadeIn">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest font-mono">Target Player</label>
                      <select
                        value={reportedPlayerUsername}
                        onChange={(e) => setReportedPlayerUsername(e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-xs text-text focus:border-primary focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="">Select a player in the match...</option>
                        {opponentsList.map((op: any) => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Reason selector based on target type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest font-mono">Select Reason</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-xs text-text focus:border-primary focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="">Choose a reason...</option>
                      {reportTargetType === "USER" ? (
                        <>
                          <option value="CHEATING">Suspected Cheating / Scripting</option>
                          <option value="OFFENSIVE_CHAT">Offensive Chat / Toxic Behavior</option>
                          <option value="SPAMMING">Spamming / Abuse</option>
                          <option value="ABANDONING">AFK / Leaving match</option>
                          <option value="OTHER">Other Issue</option>
                        </>
                      ) : (
                        <>
                          <option value="WRONG_DESCRIPTION">Wrong / Incorrect Description</option>
                          <option value="WRONG_STARTER_CODE">Wrong / Invalid Starter Code</option>
                          <option value="WRONG_TEST_CASES">Incorrect or Failing Test Cases</option>
                          <option value="OTHER">Other / Content feedback</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Details text area */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest font-mono">Description / Details</label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder={
                        reportTargetType === "USER"
                          ? "Please specify any cheating methods, timestamps, or context..."
                          : "Please specify the incorrect parts of the statement, starter code issues, or sample case errors..."
                      }
                      rows={3}
                      className="w-full rounded-lg border border-border bg-surface p-3 text-xs text-text placeholder:text-text-faint focus:border-primary focus:outline-none resize-none font-sans leading-relaxed transition-colors"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end gap-3 border-t border-border/40">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setReportModalOpen(false)}
                      className="h-9 text-xs font-semibold px-4 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      loading={submittingReport}
                      disabled={
                        !reportReason ||
                        !reportDetails.trim() ||
                        (reportTargetType === "USER" && !reportedPlayerUsername)
                      }
                      onClick={submitReport}
                      className={cn(
                        "h-9 text-xs font-bold px-5 rounded-lg transition-all text-white border-none",
                        (!reportReason || !reportDetails.trim() || (reportTargetType === "USER" && !reportedPlayerUsername))
                          ? "bg-danger/40 cursor-not-allowed opacity-50"
                          : "bg-gradient-to-r from-red-600 to-amber-600 shadow-md shadow-red-500/20 hover:shadow-red-500/35 hover:from-red-500 hover:to-amber-500 active:scale-95 cursor-pointer"
                      )}
                    >
                      Submit Report
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isDragging && (
        <div className="fixed inset-0 z-50 select-none bg-transparent" />
      )}
    </div>
  );
}



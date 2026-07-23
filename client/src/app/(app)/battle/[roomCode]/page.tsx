"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Cpu,
  Terminal,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Maximize2,
  Bot,
  Minimize2,
  GripHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Volume2,
  AlertTriangle,
  Settings,
  Sparkles,
  Eye,
  EyeOff,
  User,
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
import { cn, timeAgo, countryFlag } from "@/lib/utils";
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
  Skeleton,
  Spinner,
} from "@/components/ui";

const DEFAULT_REACT_STARTER = `import React from 'react';

const PricingCard = () => {
  return <>
    
  </>
};

export default PricingCard;`;

const resolveMockupUrl = (url: string) => {
  if (!url) return "";
  try {
    if (typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      return url.replace("localhost", currentHost);
    }
  } catch (e) {
    console.error(e);
  }
  return url;
};

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

function buildPreviewHtml(html: string, css: string, js: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        ${css}
      </style>
    </head>
    <body style="margin: 0; padding: 0;">
      ${html}
      <script>
        try {
          ${js}
        } catch (err) {
          console.error(err);
        }
      <\/script>
    </body>
    </html>
  `;
}

function buildReactPreviewHtml(reactCode: string): string {
  const base64Code = typeof Buffer !== 'undefined'
    ? Buffer.from(reactCode).toString('base64')
    : btoa(unescape(encodeURIComponent(reactCode)));

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <script>
        window.onerror = function(message, source, lineno, colno, error) {
          const rootEl = document.getElementById('root') || document.body;
          if (rootEl) {
            rootEl.innerHTML = '<div style="padding:20px;color:#ef4444;font-size:13px;font-family:monospace;background:#0f172a;min-height:100vh;box-sizing:border-box;">' +
              '<h3>Global script error caught:</h3>' +
              '<p>Message: ' + message + '</p>' +
              '<p>Source: ' + source + '</p>' +
              '<p>Line: ' + lineno + ' / Column: ' + colno + '</p>' +
              '</div>';
          }
          return false;
        };
      <\/script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
      <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin><\/script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin><\/script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
      <script src="https://cdn.tailwindcss.com"><\/script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
      </style>
    </head>
    <body>
      <div id="root"></div>
      <script>
        (function() {
          const rootEl = document.getElementById('root');
          try {
            if (typeof React === 'undefined' || typeof ReactDOM === 'undefined' || typeof Babel === 'undefined') {
              throw new Error("Required libraries (React, ReactDOM, or Babel) failed to load. Please check your internet connection.");
            }

            // Define Lucide components and icons as helper stubs
            const LucideStub = (props) => {
              const { size = 24, className = '', strokeWidth = 2, ...rest } = props;
              return React.createElement('svg', {
                width: size, height: size, viewBox: '0 0 24 24',
                fill: 'none', stroke: 'currentColor', strokeWidth: strokeWidth,
                strokeLinecap: 'round', strokeLinejoin: 'round',
                className: className, ...rest
              }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
                 React.createElement('line', { x1: 12, y1: 8, x2: 12, y2: 16 }),
                 React.createElement('line', { x1: 8, y1: 12, x2: 16, y2: 12 })
              );
            };

            const Check = (props) => {
              const { size = 24, className = '', strokeWidth = 2, ...rest } = props;
              return React.createElement('svg', {
                width: size, height: size, viewBox: '0 0 24 24',
                fill: 'none', stroke: 'currentColor', strokeWidth: strokeWidth,
                strokeLinecap: 'round', strokeLinejoin: 'round',
                className: className, ...rest
              }, React.createElement('polyline', { points: '20 6 9 17 4 12' }));
            };

            const X = (props) => {
              const { size = 24, className = '', strokeWidth = 2, ...rest } = props;
              return React.createElement('svg', {
                width: size, height: size, viewBox: '0 0 24 24',
                fill: 'none', stroke: 'currentColor', strokeWidth: strokeWidth,
                strokeLinecap: 'round', strokeLinejoin: 'round',
                className: className, ...rest
              }, React.createElement('line', { x1: 18, y1: 6, x2: 6, y2: 18 }),
                 React.createElement('line', { x1: 6, y1: 6, x2: 18, y2: 18 }));
            };

            // Custom require function to resolve imports in transpiled code
            window.require = function(moduleName) {
              if (moduleName === 'react') return React;
              if (moduleName === 'react-dom') return ReactDOM;
              if (moduleName === 'lucide-react') {
                return new Proxy({}, {
                  get: function(target, prop) {
                    if (prop === 'Check') return Check;
                    if (prop === 'X') return X;
                    return (props) => React.createElement(LucideStub, { ...props, name: prop });
                  }
                });
              }
              return {};
            };

            window.exports = {};
            window.module = { exports: window.exports };

            const userCode = decodeURIComponent(escape(atob("${base64Code}")));

            // Transpile user code
            const transformed = Babel.transform(userCode, {
              presets: [['env', { modules: 'commonjs' }], ['react', { runtime: 'classic' }]],
              filename: 'user.jsx'
            }).code;

            // Execute transpiled code
            const fn = new Function('require', 'exports', 'module', transformed);
            fn(window.require, window.exports, window.module);

            // Find component
            let Component = window.module.exports.default || window.module.exports;
            if (!Component || typeof Component !== 'function') {
              // Try searching all exports
              for (const key in window.module.exports) {
                if (typeof window.module.exports[key] === 'function') {
                  Component = window.module.exports[key];
                  break;
                }
              }
            }

            if (Component && typeof Component === 'function') {
              const root = ReactDOM.createRoot(rootEl);
              root.render(React.createElement(Component));
            } else {
              throw new Error("Could not find a valid React component to render. Make sure to export default your component function.");
            }

          } catch (err) {
            rootEl.innerHTML = '<div style="padding:20px;color:#ef4444;font-size:13px;font-family:monospace;background:#0f172a;min-height:100%;box-sizing:border-box;">Error compiling/rendering React preview:<br/><pre style="margin-top:10px;white-space:pre-wrap;">' + err.message + '</pre></div>';
            console.error(err);
          }
        })();
      <\/script>
    </body>
    </html>
  `;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const splitParts = text.split(regex);
  
  return splitParts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-extrabold text-text">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={idx} className="bg-surface-3 border border-border/80 text-[10px] px-1.5 py-0.5 rounded font-mono text-amber-500">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.replace(/\\n/g, "\n").split("\n");
  
  let inCodeBlock = false;
  let codeLines: string[] = [];
  const renderedElements: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Code block detection
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        renderedElements.push(
          <pre key={`code-${i}`} className="bg-[#090a0f] border border-border/40 rounded-lg p-3 my-3 font-mono text-[11px] text-[#4af626] overflow-x-auto select-all leading-normal">
            {codeLines.join("\n")}
          </pre>
        );
        codeLines = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    
    const trimmed = line.trim();
    
    // Headings
    if (trimmed.startsWith("###")) {
      renderedElements.push(
        <h4 key={i} className="text-xs font-bold text-text uppercase tracking-wider font-mono mt-4 mb-1.5 flex items-center gap-1.5">
          {trimmed.replace(/^###\s*/, "")}
        </h4>
      );
    } else if (trimmed.startsWith("##")) {
      renderedElements.push(
        <h3 key={i} className="text-sm font-black text-text uppercase tracking-wide border-b border-border/30 pb-1 mt-6 mb-2.5">
          {trimmed.replace(/^##\s*/, "")}
        </h3>
      );
    } else if (trimmed.startsWith("#")) {
      renderedElements.push(
        <h2 key={i} className="text-base font-extrabold text-text uppercase tracking-wide mt-6 mb-3">
          {trimmed.replace(/^#\s*/, "")}
        </h2>
      );
    } 
    // Bullet lists
    else if (/^([*+-]\s+|[*+-]$)/.test(trimmed)) {
      const text = trimmed.replace(/^[*+-]\s*/, "");
      renderedElements.push(
        <li key={i} className="list-disc ml-5 text-text-muted text-[13px] leading-relaxed my-0.5">
          {renderInlineFormatting(text)}
        </li>
      );
    } 
    // Empty lines
    else if (trimmed.length === 0) {
      renderedElements.push(<div key={i} className="h-1.5" />);
    } 
    // Regular paragraphs
    else {
      renderedElements.push(
        <p key={i} className="text-text-muted text-[13px] leading-relaxed my-0.5">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    }
  }
  
  return <div className="space-y-0.5">{renderedElements}</div>;
}

const BANNER_CLASSES: Record<string, string> = {
  apprentice: "bg-slate-950 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:10px_10px] border-slate-800 text-slate-400",
  novice: "bg-blue-950 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] bg-[size:8px_8px] border-blue-900 text-blue-400",
  bug_hunter: "bg-emerald-950 bg-[linear-gradient(45deg,#064e3b_25%,transparent_25%),linear-gradient(-45deg,#064e3b_25%,transparent_25%)] bg-[size:6px_6px] border-emerald-900 text-emerald-400",
  explorer: "bg-indigo-950 bg-[repeating-linear-gradient(45deg,#312e81,#312e81_4px,transparent_4px,transparent_8px)] border-indigo-900/60 text-indigo-400",
  architect: "bg-zinc-900 bg-[linear-gradient(to_bottom,transparent_95%,#0891b2_95%)] bg-[size:100%_12px] border-cyan-900/60 text-cyan-400",
  overlord: "bg-rose-950 bg-[repeating-linear-gradient(-45deg,#991b1b,#991b1b_2px,transparent_2px,transparent_8px)] border-rose-900/60 text-rose-400",
  slinger: "bg-neutral-950 bg-[radial-gradient(#9d174d_1.2px,transparent_1.2px)] bg-[size:12px_12px] border-pink-900/50 text-pink-400",
  stack_overlord: "bg-stone-900 bg-[linear-gradient(27deg,#1c1917_25%,transparent_25%),linear-gradient(207deg,#1c1917_25%,transparent_25%)] bg-[size:8px_8px] border-amber-900/60 text-amber-400",
  cyber_sentient: "bg-stone-950 bg-[linear-gradient(to_right,#5b21b6_0.5px,transparent_0.5px),linear-gradient(to_bottom,#5b21b6_0.5px,transparent_0.5px)] bg-[size:16px_16px] border-violet-900/60 text-violet-400",
  grandmaster: "bg-black bg-[radial-gradient(#d97706_0.8px,transparent_0.8px)] bg-[size:14px_14px] border-amber-500/30 text-amber-500",
  void_walker: "bg-violet-950 bg-[radial-gradient(#c084fc_1px,transparent_1px)] bg-[size:20px_20px] border-purple-900/60 text-purple-400",
  stellar_monarch: "bg-slate-950 bg-[radial-gradient(#fcd34d_0.8px,transparent_0.8px)] bg-[size:16px_16px] border-amber-600/40 text-amber-300",
  binary_beast: "bg-black bg-[linear-gradient(to_bottom,rgba(16,185,129,0.1)_50%,transparent_50%)] bg-[size:100%_4px] border-emerald-900/50 text-emerald-400",
  quantum_specter: "bg-cyan-950 bg-[repeating-linear-gradient(135deg,#0e7490,#0e7490_3px,transparent_3px,transparent_12px)] border-cyan-800/50 text-cyan-400",
  neon_shogun: "bg-neutral-950 bg-[linear-gradient(115deg,#701a75_10%,transparent_10%),linear-gradient(295deg,#701a75_10%,transparent_10%)] bg-[size:12px_12px] border-fuchsia-900/60 text-fuchsia-400",
  apex_predator: "bg-red-950 bg-[radial-gradient(#dc2626_1.2px,transparent_1.2px)] bg-[size:18px_18px] border-red-800/60 text-red-400",
  shadow_agent: "bg-zinc-950 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-[size:14px_14px] border-zinc-800 text-zinc-400",
  solar_flare: "bg-amber-950 bg-[radial-gradient(#f97316_1px,transparent_1px)] bg-[size:10px_10px] border-orange-950/60 text-orange-400",
  abyss_watcher: "bg-slate-900 bg-[repeating-linear-gradient(45deg,#1e293b,#1e293b_10px,#0f172a_10px,#0f172a_20px)] border-slate-800/80 text-slate-300",
  celestial_deity: "bg-slate-950 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px),radial-gradient(#fbbf24_1px,transparent_1px)] bg-[size:24px_24px] border-slate-700/50 text-amber-200",
};

const getRatingKey = (battleType: string): string => {
  switch (battleType) {
    case "DSA": return "dsa";
    case "FRONTEND": return "frontend";
    case "BACKEND": return "backend";
    case "PROJECTS": return "projects";
    case "PROMPT_WAR": return "promptWar";
    default: return "dsa";
  }
};

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

function RoomLobbySkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Room header skeleton */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-20 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        <Skeleton className="h-4 w-44" />
      </div>

      {/* Lobby content grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
        {/* Teams and code columns */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-surface-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-surface-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar settings/actions skeleton */}
        <div className="space-y-6">
          <Card className="p-5 text-center space-y-4">
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-8 w-36 mx-auto rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
          </Card>
          <Card className="p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BattleLobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);

  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isTriggeringBot, setIsTriggeringBot] = useState(false);
  const [dismissedBotPrompt, setDismissedBotPrompt] = useState(false);

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

  if (roomQuery.isLoading) return <RoomLobbySkeleton />;

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

      {/* ── Bot Matchmaker Option Banner ── */}
      {isHost && !started && !room.isSolo && room.teamSize === 1 && room.teams.teamB.length === 0 && !dismissedBotPrompt && (
        <div className="rounded-2xl border border-primary/30 bg-surface-2/95 p-5 shadow-xl backdrop-blur-md space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
              <Bot className="size-5 text-primary animate-pulse shrink-0" />
              <span>No real player currently coding in this topic</span>
            </div>
            <button
              onClick={() => setDismissedBotPrompt(true)}
              className="text-text-faint hover:text-text p-1 transition-colors"
              title="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="text-xs text-text-faint leading-relaxed">
            There are currently no active human competitors in the queue for <strong className="text-text font-semibold">{room.battleType}</strong> ({room.topics?.join(", ") || "General"}). Would you like to match with <strong className="text-primary font-bold">DevBot V1 (AI Rival)</strong> or keep searching?
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button
              size="sm"
              loading={isTriggeringBot}
              onClick={async () => {
                setIsTriggeringBot(true);
                try {
                  await api("/battle/matchmaking/fallback", {
                    method: "POST",
                    body: { roomCode: room.roomCode }
                  });
                  await queryClient.invalidateQueries({ queryKey: ["battle", room.roomCode] });
                } catch (e) {
                  console.error("Bot trigger error:", e);
                } finally {
                  setIsTriggeringBot(false);
                }
              }}
            >
              <Bot className="size-4 mr-1.5" /> Match with DevBot V1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissedBotPrompt(true)}
            >
              Keep Searching for Human
            </Button>
          </div>
        </div>
      )}

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

  if (friendsQuery.isLoading) {
    return (
      <div className="px-5 py-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-2 border border-border/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-7 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }

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

  // Queries (Moved to top to prevent ReferenceError)
  const questionQuery = useQuery({
    queryKey: ["match", matchId, "question"],
    queryFn: () => api<{ question: any }>(`/match/${matchId}/question`),
    enabled: Boolean(matchId),
  });

  const question = questionQuery.data?.question;
  const isMultiFile = useMemo(() => {
    return room?.battleType === "FRONTEND" || room?.battleType === "BACKEND" || room?.battleType === "PROJECTS" || 
      (question?.starterCode && Object.keys(question.starterCode).some(key => key.includes('.')));
  }, [room?.battleType, question]);

  const isCSSBattle = useMemo(() => {
    const hasAssets = question?.referenceAssets && question.referenceAssets.length > 0;
    const isAccessibility = question?.topics?.some((t: string) => t.toUpperCase() === "ACCESSIBILITY");
    return Boolean(hasAssets && !isAccessibility);
  }, [question]);

  const workspaceLangs = useMemo(() => {
    if (isMultiFile && question?.starterCode) {
      return Object.keys(question.starterCode);
    }
    return question?.judgeConfig?.supportedLanguages || 
           question?.judgeConfig?.stack || 
           (room?.battleType === "FRONTEND" ? ["html", "css"] : ["cpp", "java", "python", "javascript"]);
  }, [question, room?.battleType, isMultiFile]);
  
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
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewMinimized, setIsPreviewMinimized] = useState(false);
  const [codeByLang, setCodeByLang] = useState<Record<string, string>>({});
  const [isSlideCompareEnabled, setIsSlideCompareEnabled] = useState(false);
  const [sliderX, setSliderX] = useState(200);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const leftClippedRef = useRef<HTMLDivElement>(null);
  const rightClippedRef = useRef<HTMLDivElement>(null);
  const sliderLineRef = useRef<HTMLDivElement>(null);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSlideCompareEnabled || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    let newX = ((e.clientX - rect.left) / rect.width) * 400;
    newX = Math.max(0, Math.min(400, newX));
    
    // Update local state to persist
    setSliderX(newX);
    
    // Update DOM directly for perfect performance
    if (sliderLineRef.current) {
      sliderLineRef.current.style.left = `${newX}px`;
      const badge = sliderLineRef.current.querySelector(".slider-badge");
      if (badge) badge.textContent = String(Math.round(newX));
    }
    if (leftClippedRef.current) {
      leftClippedRef.current.style.clipPath = `inset(0px ${400 - newX}px 0px 0px)`;
    }
    if (rightClippedRef.current) {
      rightClippedRef.current.style.clipPath = `inset(0px 0px 0px ${newX}px)`;
    }
  }, [isSlideCompareEnabled]);

  const handleCanvasTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSlideCompareEnabled || !canvasContainerRef.current || e.touches.length === 0) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    let newX = ((e.touches[0].clientX - rect.left) / rect.width) * 400;
    newX = Math.max(0, Math.min(400, newX));
    
    setSliderX(newX);
    
    if (sliderLineRef.current) {
      sliderLineRef.current.style.left = `${newX}px`;
      const badge = sliderLineRef.current.querySelector(".slider-badge");
      if (badge) badge.textContent = String(Math.round(newX));
    }
    if (leftClippedRef.current) {
      leftClippedRef.current.style.clipPath = `inset(0px ${400 - newX}px 0px 0px)`;
    }
    if (rightClippedRef.current) {
      rightClippedRef.current.style.clipPath = `inset(0px 0px 0px ${newX}px)`;
    }
  }, [isSlideCompareEnabled]);

  useEffect(() => {
    if (workspaceLangs && workspaceLangs.length > 0) {
      if (!workspaceLangs.includes(selectedLang)) {
        setSelectedLang(workspaceLangs[0]);
      }
    }
  }, [workspaceLangs, selectedLang]);

  const [consoleTab, setConsoleTab] = useState<"result" | "submissions">("result");
  const [activeTab, setActiveTab] = useState<"description" | "submissions" | "opponent">("description");
  const [selectedOpponentName, setSelectedOpponentName] = useState<string>("");
  const { resolved: resolvedTheme } = useTheme();
  
  // Submission execution state
  const [submitting, setSubmitting] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<{ compiled: boolean; error: string | null } | null>(null);

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

  const handlePopOut = () => {
    const newWindow = window.open("", "_blank", "width=800,height=600");
    if (newWindow) {
      const targetImgUrl = questionQuery.data?.question?.referenceAssets?.[0]?.url || "";
      const isReactStack = workspaceLangs.some((l: string) => l.toLowerCase() === "react");
      const iframeSrcDoc = isReactStack
        ? buildReactPreviewHtml(codeByLang.react || "")
        : buildPreviewHtml(
            codeByLang.html || "",
            codeByLang.css || "",
            codeByLang.javascript || ""
          );

      const resolvedUrl = resolveMockupUrl(targetImgUrl);
      const targetImgHtml = targetImgUrl
        ? targetImgUrl.endsWith(".svg")
          ? `<iframe id="target-img" src="${resolvedUrl}" style="width:400px;height:300px;border:none;overflow:hidden;pointer-events:auto;" scrolling="no"></iframe>`
          : `<img id="target-img" src="${resolvedUrl}" alt="Target Mockup" />`
        : `<div style="width:400px;height:300px;background:#191919;display:flex;align-items:center;justify-content:center;color:#666;font-size:12px;">No Target Image</div>`;

      const htmlContent = isCSSBattle ? `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>CSSBattle - Slide & Compare Popout</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #090a0f;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100vw;
              height: 100vh;
              overflow: hidden;
              font-family: monospace;
            }
            #canvas-container {
              width: 400px;
              height: 300px;
              position: relative;
              background: #191919;
              border: 1px solid #2d2d2d;
              box-shadow: 0 10px 25px rgba(0,0,0,0.5);
              border-radius: 8px;
              overflow: hidden;
              user-select: none;
            }
            .layer {
              position: absolute;
              left: 0;
              top: 0;
              width: 400px;
              height: 300px;
            }
            #left-layer {
              z-index: 10;
              clip-path: inset(0px 200px 0px 0px);
            }
            #right-layer {
              z-index: 5;
              clip-path: inset(0px 0px 0px 200px);
            }
            #iframe-preview {
              width: 400px;
              height: 300px;
              border: none;
              background: white;
            }
            #target-img {
              width: 400px;
              height: 300px;
              object-fit: cover;
            }
            #slider-line {
              position: absolute;
              left: 200px;
              top: 0;
              bottom: 0;
              width: 2px;
              background: #ff2e2e;
              z-index: 30;
              pointer-events: none;
            }
            #slider-badge {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: #ff2e2e;
              color: white;
              font-weight: 900;
              font-size: 9px;
              padding: 2px 6px;
              border-radius: 4px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            }
            #event-catcher {
              position: absolute;
              left: 0;
              top: 0;
              width: 400px;
              height: 300px;
              z-index: 25;
              background: transparent;
              cursor: ew-resize;
            }
          </style>
        </head>
        <body>
          <div id="canvas-container">
            <div id="event-catcher"></div>
            
            <div id="left-layer" class="layer">
              <iframe id="iframe-preview" title="Player Preview"></iframe>
            </div>
            
            <div id="right-layer" class="layer">
              ${targetImgHtml}
            </div>
            
            <div id="slider-line">
              <div id="slider-badge">200</div>
            </div>
          </div>
 
          <script>
            const iframe = document.getElementById('iframe-preview');
            iframe.srcdoc = ${JSON.stringify(iframeSrcDoc).replace(/<\/script>/gi, '<\\/script>')};
 
            const container = document.getElementById('canvas-container');
            const leftLayer = document.getElementById('left-layer');
            const rightLayer = document.getElementById('right-layer');
            const sliderLine = document.getElementById('slider-line');
            const sliderBadge = document.getElementById('slider-badge');
            const eventCatcher = document.getElementById('event-catcher');
 
            function updateSlider(clientX) {
              const rect = container.getBoundingClientRect();
              let newX = ((clientX - rect.left) / rect.width) * 400;
              newX = Math.max(0, Math.min(400, newX));
 
              sliderLine.style.left = newX + 'px';
              sliderBadge.textContent = Math.round(newX);
              leftLayer.style.clipPath = 'inset(0px ' + (400 - newX) + 'px 0px 0px)';
              rightLayer.style.clipPath = 'inset(0px 0px 0px ' + newX + 'px)';
            }
 
            eventCatcher.addEventListener('mousemove', (e) => {
              updateSlider(e.clientX);
            });
 
            eventCatcher.addEventListener('touchmove', (e) => {
              if (e.touches.length > 0) {
                updateSlider(e.touches[0].clientX);
              }
            });
          </script>
        </body>
        </html>
      ` : `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${questionQuery.data?.question?.title || "Webpage"} - Preview</title>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: 100vw;
              height: 100vh;
              background: white;
              overflow: auto;
            }
            #iframe-preview {
              width: 100%;
              height: 100%;
              border: none;
              display: block;
            }
          </style>
        </head>
        <body>
          <iframe id="iframe-preview" title="Player Preview" sandbox="allow-scripts allow-same-origin"></iframe>
          <script>
            const iframe = document.getElementById('iframe-preview');
            iframe.srcdoc = ${JSON.stringify(iframeSrcDoc).replace(/<\/script>/gi, '<\\/script>')};
          </script>
        </body>
        </html>
      `;
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
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

  const opponentsOnlyList = useMemo(() => {
    if (!room) return [];
    if (room.isSolo) return [];
    if (userTeam === "A") {
      return teamB
        .map((m) => asUser(m)?.username)
        .filter((username): username is string => Boolean(username) && username !== user?.username);
    }
    if (userTeam === "B") {
      return teamA
        .map((m) => asUser(m)?.username)
        .filter((username): username is string => Boolean(username) && username !== user?.username);
    }
    return [
      ...teamA.map((m) => asUser(m)?.username),
      ...teamB.map((m) => asUser(m)?.username),
    ].filter((username): username is string => Boolean(username) && username !== user?.username);
  }, [room, userTeam, teamA, teamB, user?.username]);



  const liveMatchQuery = useQuery({
    queryKey: ["match", matchId, "live"],
    queryFn: () => api<any>(`/match/${matchId}/live`),
    enabled: Boolean(matchId),
    refetchInterval: (query) => {
      const matchStatus = query.state.data?.status;
      return (matchStatus === "COMPLETED" || matchStatus === "ABANDONED" || room?.status === "FINISHED") ? false : 3000;
    },
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

  // Socket listeners for real-time score updates and match end events
  useEffect(() => {
    if (!matchId) return;

    const rCode = room?.roomCode;

    const handleScoreUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId, "live"] });
      if (rCode) queryClient.invalidateQueries({ queryKey: ["battle", rCode] });
    };

    const handleMatchEnded = () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId, "live"] });
      if (rCode) queryClient.invalidateQueries({ queryKey: ["battle", rCode] });
      queryClient.invalidateQueries({ queryKey: ["match", matchId, "rating-changes"] });
    };

    socket.on("score:update", handleScoreUpdate);
    socket.on("match:ended", handleMatchEnded);
    socket.on("match:winner", handleMatchEnded);

    return () => {
      socket.off("score:update", handleScoreUpdate);
      socket.off("match:ended", handleMatchEnded);
      socket.off("match:winner", handleMatchEnded);
    };
  }, [matchId, room?.roomCode, queryClient]);

  useEffect(() => {
    const liveMatchStatus = liveMatchQuery.data?.status;
    const isEnded = room?.status === "FINISHED" || liveMatchStatus === "COMPLETED" || liveMatchStatus === "ABANDONED";
    if (isEnded && !hasTriggeredModal) {
      setHasTriggeredModal(true);
    }
  }, [liveMatchQuery.data?.status, room?.status, hasTriggeredModal]);

  const liveMatch = liveMatchQuery.data;
  const matchSubmissions = submissionsQuery.data || [];

  // Opponent typing indicator logic
  const [typingState, setTypingState] = useState<Record<string, boolean>>({});
  const [opponentPetState, setOpponentPetState] = useState<Record<string, { type: string; color: string }>>({});
  const [lastActiveOpponentName, setLastActiveOpponentName] = useState<string | null>(null);

  const [mascotPos, setMascotPos] = useState({ x: 0, y: 0 });
  const [isDraggingMascots, setIsDraggingMascots] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const mascotPosStartRef = useRef({ x: 0, y: 0 });

  const handleMascotMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDraggingMascots(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    mascotPosStartRef.current = { ...mascotPos };
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDraggingMascots) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setMascotPos({
        x: mascotPosStartRef.current.x + dx,
        y: mascotPosStartRef.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDraggingMascots(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingMascots]);

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
    const activeName = Object.keys(typingState)
      .filter((username) => opponentsOnlyList.includes(username))
      .find((username) => typingState[username]);
    if (activeName) {
      setLastActiveOpponentName(activeName);
    }
  }, [typingState, opponentsOnlyList]);

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
    const newVal = val ?? "";
    setCodeByLang(prev => ({ ...prev, [selectedLang]: newVal }));

    if (room.teamSize > 1) {
      socket.emit("battle:code-sync", {
        roomCode: room.roomCode,
        lang: selectedLang,
        code: newVal
      });
    }

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

  const isOpponentTyping = Object.keys(typingState)
    .filter((username) => opponentsOnlyList.includes(username))
    .some((username) => typingState[username]);
  const activeOpponentName = Object.keys(typingState)
    .filter((username) => opponentsOnlyList.includes(username))
    .find((username) => typingState[username]);
  const activeOpponentPet = (activeOpponentName ? opponentPetState[activeOpponentName] : null)
    || (lastActiveOpponentName && opponentsOnlyList.includes(lastActiveOpponentName) ? opponentPetState[lastActiveOpponentName] : null)
    || Object.values(opponentPetState)[0]
    || null;

  const displayOpponentName = activeOpponentName 
    || (lastActiveOpponentName && opponentsOnlyList.includes(lastActiveOpponentName) ? lastActiveOpponentName : null)
    || opponentsOnlyList[0] 
    || "Opponent";

  const opponentProfileQuery = useQuery({
    queryKey: ["opponent-profile", selectedOpponentName],
    queryFn: () => api<any>(`/user/${selectedOpponentName}`),
    enabled: Boolean(selectedOpponentName) && activeTab === "opponent",
  });

  useEffect(() => {
    if (opponentsOnlyList.length > 0 && (!selectedOpponentName || !opponentsOnlyList.includes(selectedOpponentName))) {
      setSelectedOpponentName(opponentsOnlyList[0]);
    }
  }, [opponentsOnlyList, selectedOpponentName]);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const teammateCursorsRef = useRef<Record<string, { widget: any, domNode: HTMLDivElement }>>({});

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e: any) => {
      if (room.teamSize > 1) {
        socket.emit("battle:cursor-sync", {
          roomCode: room.roomCode,
          cursor: {
            lineNumber: e.position.lineNumber,
            column: e.position.column
          }
        });
      }
    });
  };

  useEffect(() => {
    if (!room || room.teamSize <= 1) return;

    const handleCodeSync = ({ username, lang, code }: { username: string; lang: string; code: string }) => {
      setCodeByLang((prev) => {
        if (prev[lang] === code) return prev;
        return { ...prev, [lang]: code };
      });
    };

    socket.on("battle:code-sync", handleCodeSync);
    return () => {
      socket.off("battle:code-sync", handleCodeSync);
    };
  }, [room]);

  useEffect(() => {
    const handleCursorSync = ({ username, cursor }: { username: string; cursor: { lineNumber: number; column: number } | null }) => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;

      if (!cursor) {
        if (teammateCursorsRef.current[username]) {
          editor.removeContentWidget(teammateCursorsRef.current[username].widget);
          delete teammateCursorsRef.current[username];
        }
        return;
      }

      const hash = Array.from(username).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colors = ["#ff0055", "#00ffaa", "#ffaa00", "#00aaff", "#a900ff", "#ff5500"];
      const cursorColor = colors[hash % colors.length];

      let cursorData = teammateCursorsRef.current[username];
      if (!cursorData) {
        const domNode = document.createElement("div");
        domNode.className = "flex items-center gap-1 pointer-events-none select-none z-50 transition-all duration-75";
        
        const outerPing = document.createElement("div");
        outerPing.style.position = "absolute";
        outerPing.style.width = "10px";
        outerPing.style.height = "10px";
        outerPing.style.borderRadius = "50%";
        outerPing.style.backgroundColor = cursorColor;
        outerPing.style.opacity = "0.7";
        outerPing.className = "animate-ping";
        domNode.appendChild(outerPing);

        const innerDot = document.createElement("div");
        innerDot.style.width = "6px";
        innerDot.style.height = "6px";
        innerDot.style.borderRadius = "50%";
        innerDot.style.backgroundColor = cursorColor;
        innerDot.style.boxShadow = `0 0 6px ${cursorColor}`;
        domNode.appendChild(innerDot);

        const nameTag = document.createElement("div");
        nameTag.innerText = username;
        nameTag.style.backgroundColor = cursorColor;
        nameTag.style.color = "#000";
        nameTag.style.fontWeight = "bold";
        nameTag.style.fontSize = "9px";
        nameTag.style.padding = "1px 4px";
        nameTag.style.borderRadius = "3px";
        nameTag.style.marginLeft = "4px";
        nameTag.style.whiteSpace = "nowrap";
        nameTag.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        domNode.appendChild(nameTag);

        const widget = {
          getId: () => `cursor-widget-${username}`,
          getDomNode: () => domNode,
          getPosition: () => ({
            position: {
              lineNumber: cursor.lineNumber,
              column: cursor.column
            },
            preference: [
              monaco.editor.ContentWidgetPositionPreference.EXACT,
              monaco.editor.ContentWidgetPositionPreference.ABOVE
            ]
          })
        };

        editor.addContentWidget(widget);
        cursorData = { widget, domNode };
        teammateCursorsRef.current[username] = cursorData;
      } else {
        cursorData.widget.getPosition = () => ({
          position: {
            lineNumber: cursor.lineNumber,
            column: cursor.column
          },
          preference: [
            monaco.editor.ContentWidgetPositionPreference.EXACT,
            monaco.editor.ContentWidgetPositionPreference.ABOVE
          ]
        });
        editor.layoutContentWidget(cursorData.widget);
      }
    };

    socket.on("battle:cursor-sync", handleCursorSync);
    return () => {
      socket.off("battle:cursor-sync", handleCursorSync);
      const editor = editorRef.current;
      if (editor) {
        Object.values(teammateCursorsRef.current).forEach(({ widget }) => {
          editor.removeContentWidget(widget);
        });
      }
      teammateCursorsRef.current = {};
    };
  }, [selectedLang]);

  // Initialize starter code when question changes (restores from localStorage if available)
  useEffect(() => {
    if (question) {
      const initial: Record<string, string> = {};
      const supported = workspaceLangs;
      const isBugFix = room?.battleType === "BUG_FIX";
      const starterCodeObj = (isBugFix ? (question.buggyStarterCode || question.starterCode) : question.starterCode) || {};
      
      // Load saved code from localStorage if it exists
      const storageKey = `devarena:match:${matchId}:code`;
      let savedCode: Record<string, string> = {};
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          savedCode = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to parse saved code from localStorage", e);
      }

      for (const lang of supported) {
        if (savedCode && savedCode[lang] !== undefined) {
          initial[lang] = savedCode[lang];
        } else {
          let fullCode = starterCodeObj[lang] || "";
          if (lang.toLowerCase() === "react" && !fullCode.trim()) {
            fullCode = DEFAULT_REACT_STARTER;
          }
          const { visibleCode } = splitCode(lang, fullCode);
          initial[lang] = visibleCode;
        }
      }
      setCodeByLang(initial);
      
      // Set default selected language based on supported languages
      if (supported.length > 0) {
        let defaultLang = supported[0];
        const preferred = ["index.js", "app.js", "index.ts", "app.ts", "server.js", "main.py"];
        for (const pref of preferred) {
          if (supported.includes(pref)) {
            defaultLang = pref;
            break;
          }
        }
        setSelectedLang(defaultLang);
      }
    }
  }, [question, workspaceLangs, matchId]);

  // Persist code changes to localStorage temporarily
  useEffect(() => {
    if (matchId && Object.keys(codeByLang).length > 0) {
      const storageKey = `devarena:match:${matchId}:code`;
      localStorage.setItem(storageKey, JSON.stringify(codeByLang));
    }
  }, [codeByLang, matchId]);

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
    const isBugFix = room?.battleType === "BUG_FIX";
    const starter = (isBugFix ? (question?.buggyStarterCode?.[selectedLang] || question?.starterCode?.[selectedLang]) : question?.starterCode?.[selectedLang]) || 
                    (selectedLang.toLowerCase() === "react" ? DEFAULT_REACT_STARTER : "");
    if (starter) {
      if (confirm("Reset editor to starter code? Your current edits in this language will be discarded.")) {
        const { visibleCode } = splitCode(selectedLang, starter);
        setCodeByLang(prev => ({ ...prev, [selectedLang]: visibleCode }));
      }
    }
  };

  const getSubmissionLanguage = () => {
    const langs = question?.judgeConfig?.supportedLanguages || question?.judgeConfig?.stack || [];
    const primary = (langs[0] || "").toLowerCase();
    if (primary === "node" || primary === "express") {
      const hasTs = Object.keys(codeByLang).some(k => k.endsWith(".ts") || k.endsWith(".tsx"));
      return hasTs ? "typescript" : "javascript";
    }
    if (primary === "python" || primary === "py") return "python";
    if (primary === "cpp" || primary === "c++") return "cpp";
    return primary || "javascript";
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setLatestSubmission(null);
    setCompileResult(null);

    if (isMultiFile) {
      submitCodeMutation.mutate({
        matchId,
        language: getSubmissionLanguage(),
        code: JSON.stringify(codeByLang)
      });
    } else {
      const currentCode = codeByLang[selectedLang] || "";
      if (currentCode.trim().length === 0) {
        setSubmitting(false);
        return;
      }
      
      // Combine visible user code with hidden driver code if it exists
      const isBugFix = room?.battleType === "BUG_FIX";
      let fullStarterCode = (isBugFix ? (question?.buggyStarterCode?.[selectedLang] || question?.starterCode?.[selectedLang]) : question?.starterCode?.[selectedLang]) || "";
      if (selectedLang.toLowerCase() === "react" && !fullStarterCode.trim()) {
        fullStarterCode = DEFAULT_REACT_STARTER;
      }
      const { hiddenCode, splitType } = splitCode(selectedLang, fullStarterCode);
      const combinedCode = combineCode(selectedLang, currentCode, hiddenCode, splitType);

      submitCodeMutation.mutate({
        matchId,
        language: selectedLang,
        code: combinedCode
      });
    }
  };

  const compileMutation = useMutation({
    mutationFn: (payload: { matchId: string; language: string; code: string }) =>
      api<{ compiled: boolean; error: string | null }>("/submission/compile", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (res) => {
      setCompiling(false);
      if (res) {
        setCompileResult(res);
      } else {
        setCompileResult({ compiled: false, error: "Invalid response from compile server." });
      }
      setConsoleTab("result");
    },
    onError: (err) => {
      setCompiling(false);
      setCompileResult({ compiled: false, error: errorMessage(err) || "Failed to connect to compilation service." });
      setConsoleTab("result");
    }
  });

  const handleCompile = () => {
    setCompiling(true);
    setCompileResult(null);
    setLatestSubmission(null);

    if (isMultiFile) {
      compileMutation.mutate({
        matchId,
        language: getSubmissionLanguage(),
        code: JSON.stringify(codeByLang)
      });
    } else {
      const currentCode = codeByLang[selectedLang] || "";
      if (currentCode.trim().length === 0) {
        setCompiling(false);
        return;
      }

      const isBugFix = room?.battleType === "BUG_FIX";
      let fullStarterCode = (isBugFix ? (question?.buggyStarterCode?.[selectedLang] || question?.starterCode?.[selectedLang]) : question?.starterCode?.[selectedLang]) || "";
      if (selectedLang.toLowerCase() === "react" && !fullStarterCode.trim()) {
        fullStarterCode = DEFAULT_REACT_STARTER;
      }
      const { hiddenCode, splitType } = splitCode(selectedLang, fullStarterCode);
      const combinedCode = combineCode(selectedLang, currentCode, hiddenCode, splitType);

      compileMutation.mutate({
        matchId,
        language: selectedLang,
        code: combinedCode
      });
    }
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

  const hasPerfectScore = matchSubmissions.some((sub: any) => {
    const subUserId = typeof sub.userId === "object" && sub.userId ? sub.userId._id : sub.userId;
    return subUserId === user?._id && sub.status === "ACCEPTED" && sub.score === 100;
  });

  const hasSubmitted = matchSubmissions.some((sub: any) => {
    const subUserId = typeof sub.userId === "object" && sub.userId ? sub.userId._id : sub.userId;
    return subUserId === user?._id;
  });
  
  const matchEnded = room?.status === "FINISHED" || liveMatch?.status === "COMPLETED" || liveMatch?.status === "ABANDONED" || (liveMatch?.timer?.endsAt && new Date(liveMatch.timer.endsAt).getTime() <= Date.now());
  const canLeaveSafely = solved || matchEnded;

  const statementStr = typeof question?.statement === 'string' ? question.statement : question?.statement?.markdown;
  const hasEmbeddedFormats = !!statementStr && (
    statementStr.toLowerCase().includes("input format") || 
    statementStr.toLowerCase().includes("examples")
  );

  const supportedLangs = question?.judgeConfig?.supportedLanguages || 
                         question?.judgeConfig?.stack || 
                         (room?.battleType === "FRONTEND" ? ["html", "css"] : ["cpp", "java", "python", "javascript"]);

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
        {(() => {
          const subsList = Array.isArray(submissionsQuery.data) ? submissionsQuery.data : [];
          const bestSubScore = subsList.length > 0 ? Math.max(...subsList.map((s: any) => s.score ?? 0)) : 0;
          const scoreA = liveMatch?.score?.teamA ?? liveMatch?.teamAScore ?? (userTeam === "A" ? bestSubScore : 0);
          const scoreB = liveMatch?.score?.teamB ?? liveMatch?.teamBScore ?? (userTeam === "B" ? bestSubScore : 0);
          const displayScore = userTeam === "B" ? scoreB : scoreA;

          return (
            <div className="flex items-center gap-5">
              {room.isSolo ? (
                <div className="text-right">
                  <span className="text-[10px] text-text-faint font-semibold uppercase block">Score</span>
                  <span className="font-mono text-sm font-bold text-primary">
                    {displayScore} pts
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="text-[10px] text-text-faint font-semibold uppercase block">Team A</span>
                    <span className="font-mono text-sm font-bold text-blue-400">{scoreA} pts</span>
                  </div>
                  <div className="text-center font-mono text-xs font-bold text-text-faint px-1.5 py-0.5 bg-surface-2 rounded border border-border/50">VS</div>
                  <div className="text-left">
                    <span className="text-[10px] text-text-faint font-semibold uppercase block">Team B</span>
                    <span className="font-mono text-sm font-bold text-red-400">{scoreB} pts</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </header>

      {/* Main Workspace (IDE splitter layout) */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        {/* Left Side: Question Pane */}
        <div 
          style={{ '--left-width': `${leftWidth}%` } as React.CSSProperties}
          className="w-full md:w-[var(--left-width)] border-b md:border-b-0 md:border-r border-border bg-surface/30 flex flex-col overflow-hidden min-h-0 shrink-0 md:min-w-[280px] h-[35vh] md:h-auto"
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
              {!room.isSolo && opponentsOnlyList.length > 0 && (
                <button
                  onClick={() => setActiveTab("opponent")}
                  className={cn(
                    "h-10 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                    activeTab === "opponent"
                      ? "border-primary text-text font-bold"
                      : "border-transparent text-text-muted hover:text-text"
                  )}
                >
                  <User className="size-3.5 inline mr-1" /> Opponent
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {activeTab === "description" ? (
              <div className="p-6 space-y-5">
                {questionQuery.isLoading ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-1/3" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" count={4} />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                    <div className="space-y-2 border-t border-border pt-4">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-full" count={2} />
                    </div>
                  </div>
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
                        {/* Target Mockup Visual Image Preview */}
                        {question.referenceAssets?.[0]?.url && (
                          <div className="space-y-2 mb-4">
                            <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Target Design</h3>
                            <div className="w-[300px] h-[225px] bg-[#191919] border border-border/50 rounded-lg overflow-hidden relative shadow-sm">
                              {question.referenceAssets[0].url.endsWith(".svg") ? (
                                <iframe
                                  src={resolveMockupUrl(question.referenceAssets[0].url)}
                                  className="w-full h-full border-none overflow-hidden select-none"
                                  style={{ pointerEvents: "auto" }}
                                  scrolling="no"
                                />
                              ) : (
                                <img
                                  src={resolveMockupUrl(question.referenceAssets[0].url)}
                                  alt="Target Mockup"
                                  className="w-full h-full object-cover select-none pointer-events-none"
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Live React Component Preview from reference solution (when no image mockup exists) */}
                        {!question.referenceAssets?.[0]?.url && question.judgeConfig?.referenceSolution && workspaceLangs.some((l: string) => l.toLowerCase() === "react") && (
                          <div className="space-y-2 mb-4">
                            <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Target Component</h3>
                            <div className="w-full max-w-[380px] h-[320px] bg-[#191919] border border-border/50 rounded-lg overflow-hidden relative shadow-sm">
                              <iframe
                                srcDoc={buildReactPreviewHtml(question.judgeConfig.referenceSolution)}
                                title="Target React Component Preview"
                                sandbox="allow-scripts allow-same-origin"
                                className="w-full h-full border-none overflow-hidden"
                              />
                            </div>
                            <p className="text-[9px] text-text-faint font-mono">Live render of the target component. Build yours to match this.</p>
                          </div>
                        )}

                        {/* Statement markdown text description */}
                        <SimpleMarkdown content={typeof question.statement === 'string' ? question.statement : question.statement?.markdown} />

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

                        {/* Top-level Constraints (e.g. for backend/DSA) */}
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

                        {/* Color Swatches */}
                        {(() => {
                          const tags = question.tags || [];
                          const colors = tags
                            .filter((t: string) => t.startsWith("color:"))
                            .map((t: string) => t.replace("color:", ""));
                          if (colors.length === 0) return null;

                          return (
                            <div className="space-y-2 pt-2 border-t border-border/10">
                              <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Color Palette</h3>
                              <div className="flex flex-wrap gap-2">
                                {colors.map((color: string, idx: number) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(color);
                                    }}
                                    className="flex items-center gap-1.5 bg-surface border border-border hover:border-primary/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono text-text shadow-sm transition-all duration-150 active:scale-95 group cursor-pointer"
                                    title="Click to copy color code"
                                  >
                                    <span 
                                      className="w-3.5 h-3.5 rounded-md border border-black/10 shadow-inner shrink-0" 
                                      style={{ backgroundColor: color }}
                                    />
                                    <span>{color}</span>
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-text-faint font-sans">Click on any swatch to copy the hex code to your clipboard.</p>
                            </div>
                          );
                        })()}

                        {/* Rubric Criteria */}
                        {question.gradingCriteria && question.gradingCriteria.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/10">
                            <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Grading Rubric</h3>
                            <div className="space-y-2">
                              {question.gradingCriteria.map((c: any, idx: number) => (
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
            ) : activeTab === "submissions" ? (
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
            ) : (
              <div className="p-5 space-y-5 select-none">
                <div className="px-1 py-1 border-b border-border bg-transparent shrink-0 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Opponent Profile</h3>
                </div>
                
                {opponentsOnlyList.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 border-b border-border/20 pb-3 mb-2">
                    {opponentsOnlyList.map((oppName) => (
                      <button
                        key={oppName}
                        onClick={() => setSelectedOpponentName(oppName)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border transition-all cursor-pointer",
                          selectedOpponentName === oppName
                            ? "bg-primary/15 border-primary text-primary"
                            : "bg-surface-2 border-border/60 text-text-muted hover:text-text"
                        )}
                      >
                        {oppName}
                      </button>
                    ))}
                  </div>
                )}

                {opponentProfileQuery.isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[110px] w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </div>
                ) : opponentProfileQuery.isError || !opponentProfileQuery.data ? (
                  <div className="py-12 text-center text-xs text-text-faint">
                    Failed to load opponent details.
                  </div>
                ) : (() => {
                  const opp = opponentProfileQuery.data;
                  const oppData = opp.profileData;
                  const oppRatings = oppData?.ratings || { dsa: 1200, frontend: 1200, backend: 1200, projects: 1200, promptWar: 1200, team: 1200 };
                  const oppStats = oppData?.stats || { wins: 0, losses: 0, draws: 0, totalMatches: 0 };
                  const ratingKey = getRatingKey(room.battleType);
                  const currentRating = oppRatings[ratingKey] ?? 1200;
                  
                  return (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {/* Banner / Card Header */}
                      <div className={cn(
                        "relative rounded-xl border p-4 overflow-hidden min-h-[110px] flex flex-col justify-end shadow-sm",
                        BANNER_CLASSES[opp.banner ?? "apprentice"] || "from-primary/10 via-primary/5 to-transparent border-border"
                      )}>
                        {/* Mascot element in corner */}
                        {opp.mascot && (
                          <div className="absolute right-2 top-2 scale-[0.65] opacity-90 origin-top-right">
                            <KeyboardMascotAnimation active={false} pet={opp.mascot} onlyMascot={true} />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 relative z-10 mt-6">
                          <Avatar
                            src={avatarUrl(opp.avatar)}
                            name={opp.username}
                            size={44}
                            className="border border-black/20"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-text truncate max-w-[120px]">{opp.username}</span>
                              {opp.country && (
                                <span className="text-xs" title={opp.country}>{countryFlag(opp.country)}</span>
                              )}
                            </div>
                            {opp.fullName && (
                              <p className="text-[11px] text-text-muted truncate max-w-[140px]">{opp.fullName}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {opp.bio && (
                        <div className="bg-surface-2/65 border border-border/40 rounded-xl p-3 text-xs text-text-muted leading-relaxed">
                          <p className="font-semibold text-[10px] text-text-faint uppercase tracking-wider mb-0.5 font-mono">Bio</p>
                          <p className="italic select-text">"{opp.bio}"</p>
                        </div>
                      )}

                      {/* Rating info */}
                      <div className="bg-surface-2 border border-border/50 rounded-xl p-4 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-text-faint font-bold uppercase tracking-wider font-mono">Current Field Rating</span>
                            <h4 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                              <Zap className="size-3 text-primary animate-pulse" /> {room.battleType} Rating
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black font-mono text-primary">{currentRating}</span>
                          </div>
                        </div>
                      </div>

                      {/* General Stats */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-surface-2/70 border border-border/40 rounded-xl p-3 text-center space-y-1">
                          <span className="text-[9px] text-text-faint font-bold uppercase tracking-wider font-mono block">Win Rate</span>
                          <span className="text-sm font-bold font-mono text-text">
                            {oppStats.totalMatches > 0 
                              ? `${Math.round((oppStats.wins / oppStats.totalMatches) * 100)}%` 
                              : "0%"}
                          </span>
                        </div>
                        <div className="bg-surface-2/70 border border-border/40 rounded-xl p-3 text-center space-y-1">
                          <span className="text-[9px] text-text-faint font-bold uppercase tracking-wider font-mono block">Matches played</span>
                          <span className="text-sm font-bold font-mono text-text">{oppStats.totalMatches}</span>
                        </div>
                      </div>
                      
                      {/* Detailed stats */}
                      <div className="bg-surface-2/50 border border-border/40 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-center text-text-muted">
                          <span>Wins:</span>
                          <span className="font-bold text-emerald-500">{oppStats.wins}</span>
                        </div>
                        <div className="flex justify-between items-center text-text-muted border-t border-border/10 pt-1.5">
                          <span>Losses:</span>
                          <span className="font-bold text-red-500">{oppStats.losses}</span>
                        </div>
                        <div className="flex justify-between items-center text-text-muted border-t border-border/10 pt-1.5">
                          <span>Draws:</span>
                          <span className="font-bold text-text-faint">{oppStats.draws}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Vertical Resize Splitter */}
        <div 
          onMouseDown={handleMouseDownLeft}
          className="hidden md:flex w-1.5 hover:w-2 bg-border/20 hover:bg-primary/50 transition-all cursor-col-resize shrink-0 relative z-30 self-stretch items-center justify-center group"
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
                    {workspaceLangs.map((lang: string) => (
                      <option key={lang} value={lang}>
                        {lang === "cpp" ? "C++" : lang === "java" ? "Java" : lang === "python" ? "Python" : lang === "javascript" ? "JavaScript" : lang.includes(".") ? lang : lang.toUpperCase()}
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
                disabled={hasPerfectScore || matchEnded || (room.battleType === "PROMPT_WAR" && hasSubmitted)}
                className={cn(
                  "flex items-center justify-center size-7 rounded border border-border bg-surface text-text-muted hover:text-text transition-colors",
                  (hasPerfectScore || matchEnded || (room.battleType === "PROMPT_WAR" && hasSubmitted)) ? "opacity-50 cursor-not-allowed" : "hover:bg-surface-2 cursor-pointer"
                )}
                title="Reset starter code"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative min-h-[300px] border-b border-border">

            {questionQuery.isLoading ? (
              <div className="absolute inset-0 flex flex-col p-6 space-y-4 bg-surface-2 animate-pulse">
                <div className="flex gap-2">
                  <div className="h-3 w-12 bg-surface-3 rounded" />
                  <div className="h-3 w-8 bg-surface-3 rounded" />
                  <div className="h-3 w-16 bg-surface-3 rounded" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 bg-surface-3 rounded" />
                  <div className="h-4 w-1/2 bg-surface-3 rounded" />
                  <div className="h-4 w-1/4 bg-surface-3 rounded" />
                  <div className="h-4 w-2/3 bg-surface-3 rounded animate-pulse" />
                  <div className="h-4 w-5/12 bg-surface-3 rounded" />
                </div>
              </div>
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
            ) : room.battleType === "FRONTEND" ? (
              <div className="flex w-full h-full min-h-0 divide-x divide-border">
                {/* Editor */}
                <div className="flex-1 min-w-0 h-full relative">
                  <Editor
                    height="100%"
                    theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                    language={
                      selectedLang === "html" ? "html" :
                      selectedLang === "css" ? "css" :
                      "javascript"
                    }
                    value={codeByLang[selectedLang] ?? ""}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                      readOnly: hasPerfectScore || matchEnded,
                      minimap: { enabled: false },
                      fontSize: fontSize,
                      automaticLayout: true,
                      fontFamily: "var(--font-mono)",
                      lineHeight: Math.round(fontSize * 1.5),
                      padding: { top: 12 },
                    }}
                  />
                </div>
                {/* Live Output Preview */}
                {isPreviewMinimized ? (
                  <div className="w-8 shrink-0 h-full bg-bg flex flex-col items-center py-2 select-none border-l border-border gap-4">
                    <button
                      type="button"
                      onClick={() => setIsPreviewMinimized(false)}
                      className="hover:text-text text-text-faint hover:bg-surface-2 transition-colors cursor-pointer p-1 rounded-md"
                      title="Expand Preview"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <div className="text-[9px] font-bold text-text-muted/80 select-none uppercase tracking-[0.2em] [writing-mode:vertical-lr] mt-2 font-mono">
                      PREVIEW
                    </div>
                  </div>
                ) : (
                  <div className="w-[380px] shrink-0 h-full bg-bg flex flex-col relative select-none border-l border-border">
                    <div className="h-7 border-b border-border bg-surface-2 px-3 flex items-center justify-between shrink-0 text-[10px] font-bold text-text-muted select-none">
                      <div className="flex items-center gap-3">
                        <span>PREVIEW</span>
                        {isCSSBattle && (
                          <label className="flex items-center gap-1 cursor-pointer text-text-faint hover:text-text select-none text-[9px] font-semibold">
                            <input
                              type="checkbox"
                              checked={isSlideCompareEnabled}
                              onChange={(e) => setIsSlideCompareEnabled(e.target.checked)}
                              className="size-2.5 rounded border-border bg-surface-1 cursor-pointer accent-primary"
                            />
                            <span>Slide & Compare</span>
                          </label>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPreviewMinimized(true)}
                          className="hover:text-text text-text-faint transition-colors cursor-pointer p-0.5"
                          title="Minimize Preview"
                        >
                          <ChevronRight className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPreviewModalOpen(true)}
                          className="hover:text-text text-text-faint transition-colors cursor-pointer p-0.5"
                          title="View Full Resolution Overlay"
                        >
                          <Maximize2 className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={handlePopOut}
                          className="hover:text-text text-text-faint transition-colors cursor-pointer p-0.5"
                          title="Pop out to new window"
                        >
                          <ExternalLink className="size-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 bg-[#090a0f] flex items-center justify-center p-2 relative overflow-hidden">
                      {isCSSBattle ? (
                        <div 
                          ref={canvasContainerRef}
                          onMouseMove={handleCanvasMouseMove}
                          onTouchMove={handleCanvasTouchMove}
                          className="w-[400px] h-[300px] shadow-lg border border-border/50 bg-[#191919] relative shrink-0 scale-90 sm:scale-95 origin-center rounded-lg overflow-hidden"
                        >
                          {!isSlideCompareEnabled ? (
                            <iframe
                              srcDoc={workspaceLangs.some((l: string) => l.toLowerCase() === "react")
                                ? buildReactPreviewHtml(codeByLang.react || "")
                                : buildPreviewHtml(
                                    codeByLang.html || "",
                                    codeByLang.css || "",
                                    codeByLang.javascript || ""
                                  )}
                              title="Live Output Preview"
                              sandbox="allow-scripts allow-same-origin"
                              className="w-[400px] h-[300px] border-none overflow-hidden"
                            />
                          ) : (
                            <div className="w-[400px] h-[300px] relative select-none">
                              {/* Event-catcher overlay to prevent iframe from swallowing mousemove hover events */}
                              <div 
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  width: 400,
                                  height: 300,
                                  zIndex: 25,
                                  background: "transparent",
                                  cursor: "ew-resize"
                                }}
                              />
                              {/* 1. Player's output (iframe) on left clipped */}
                              <div 
                                ref={leftClippedRef}
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  width: 400,
                                  height: 300,
                                  clipPath: `inset(0px ${400 - sliderX}px 0px 0px)`
                                }}
                              >
                                <iframe
                                  srcDoc={workspaceLangs.some((l: string) => l.toLowerCase() === "react")
                                    ? buildReactPreviewHtml(codeByLang.react || "")
                                    : buildPreviewHtml(
                                        codeByLang.html || "",
                                        codeByLang.css || "",
                                        codeByLang.javascript || ""
                                      )}
                                  title="Live Output Preview"
                                  sandbox="allow-scripts allow-same-origin"
                                  className="w-[400px] h-[300px] border-none overflow-hidden bg-white"
                                />
                              </div>
                              
                              {/* 2. Target Design mockup on right clipped */}
                              <div 
                                ref={rightClippedRef}
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  width: 400,
                                  height: 300,
                                  clipPath: `inset(0px 0px 0px ${sliderX}px)`,
                                  pointerEvents: "none"
                                }}
                              >
                                {questionQuery.data?.question?.referenceAssets?.[0]?.url ? (
                                  questionQuery.data.question.referenceAssets[0].url.endsWith(".svg") ? (
                                    <iframe
                                      src={resolveMockupUrl(questionQuery.data.question.referenceAssets[0].url)}
                                      className="w-[400px] h-[300px] border-none overflow-hidden select-none"
                                      style={{ pointerEvents: "none" }}
                                      scrolling="no"
                                    />
                                  ) : (
                                    <img
                                      src={resolveMockupUrl(questionQuery.data.question.referenceAssets[0].url)}
                                      alt="Target Mockup"
                                      className="w-[400px] h-[300px] object-cover pointer-events-none select-none"
                                    />
                                  )
                                ) : (
                                  <div className="w-[400px] h-[300px] bg-neutral-900 flex items-center justify-center text-text-faint text-xs">
                                    No Target Image
                                  </div>
                                )}
                              </div>
                              
                              {/* 3. Slider line divider and handle */}
                              <div
                                ref={sliderLineRef}
                                style={{
                                  position: "absolute",
                                  left: `${sliderX}px`,
                                  top: 0,
                                  bottom: 0,
                                  width: "2px",
                                  background: "#ff2e2e",
                                  zIndex: 30,
                                  pointerEvents: "none"
                                }}
                                className="group"
                              >
                                {/* Drag handle line badge */}
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)"
                                  }}
                                  className="slider-badge px-1.5 py-0.5 rounded bg-[#ff2e2e] text-white text-[9px] font-black font-mono shadow-md select-none pointer-events-none"
                                >
                                  {Math.round(sliderX)}
                                </div>
                                
                                {/* Thin glow highlight on hover */}
                                <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-red-500/20 transition-colors pointer-events-none" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-white rounded-lg overflow-hidden relative shadow-lg">
                          <iframe
                            srcDoc={workspaceLangs.some((l: string) => l.toLowerCase() === "react")
                              ? buildReactPreviewHtml(codeByLang.react || "")
                              : buildPreviewHtml(
                                  codeByLang.html || "",
                                  codeByLang.css || "",
                                  codeByLang.javascript || ""
                                )}
                            title="Live Output Preview"
                            sandbox="allow-scripts allow-same-origin"
                            className="w-full h-full border-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
              )}
            </div>
            ) : (
              <Editor
                height="100%"
                theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                language={
                  selectedLang === "cpp" ? "cpp" :
                  selectedLang === "java" ? "java" :
                  selectedLang === "python" ? "python" :
                  selectedLang === "html" ? "html" :
                  selectedLang === "css" ? "css" :
                  selectedLang === "typescript" ? "typescript" :
                  selectedLang === "react" ? "typescript" :
                  selectedLang.endsWith(".js") || selectedLang.endsWith(".jsx") ? "javascript" :
                  selectedLang.endsWith(".ts") || selectedLang.endsWith(".tsx") ? "typescript" :
                  selectedLang.endsWith(".json") ? "json" :
                  selectedLang.endsWith(".py") ? "python" :
                  selectedLang.endsWith(".html") ? "html" :
                  selectedLang.endsWith(".css") ? "css" :
                  selectedLang.endsWith(".md") ? "markdown" :
                  "javascript"
                }
                value={codeByLang[selectedLang] ?? ""}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  readOnly: hasPerfectScore || matchEnded,
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
            className="hidden md:flex h-1.5 hover:h-2 bg-border/20 hover:bg-primary/50 transition-all cursor-row-resize shrink-0 relative z-30 w-full items-center justify-center group"
          >
            <div className="h-[1px] w-6 bg-border group-hover:bg-primary" />
          </div>

          {/* Bottom Terminal Output Drawer */}
          <div 
            style={{ '--bottom-height': `${bottomHeight}px` } as React.CSSProperties}
            className="w-full h-[180px] md:h-[var(--bottom-height)] bg-surface/80 border-t border-border flex flex-col shrink-0 overflow-hidden select-none"
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
              <div className="flex items-center gap-2 pr-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCompile}
                  loading={compiling}
                  disabled={compiling || submitting || hasPerfectScore || matchEnded || (codeByLang[selectedLang] || "").trim().length === 0}
                  className="h-7 px-3 text-xs font-bold gap-1 bg-surface border-border hover:bg-surface-2 text-text shadow-sm"
                >
                  <Cpu className="size-3" />
                  {compiling ? "Compiling..." : "Compile Code"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={submitting || compiling || hasPerfectScore || matchEnded || (codeByLang[selectedLang] || "").trim().length === 0 || (room.battleType === "PROMPT_WAR" && hasSubmitted)}
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
              {submitting || compiling ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <Spinner className="py-2" />
                  <p className="text-text-muted text-xs animate-pulse">
                    {compiling 
                      ? "Compiling your code..."
                      : room.battleType === "PROMPT_WAR" 
                        ? "Judging prompt against scenario criteria using LLM judge..." 
                        : "Compiling solution & running test cases on Judge0..."}
                  </p>
                </div>
              ) : compileResult ? (
                <div className="space-y-4">
                  {compileResult.compiled ? (
                    compileResult.error ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
                          <AlertCircle className="size-4 shrink-0" />
                          <div>
                            <span className="font-black text-sm block">COMPILED WITH WARNINGS/ERRORS</span>
                            <span className="text-[11px] text-amber-500/80">Code parsed but has errors or warnings.</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 pt-2">
                          <span className="text-text-muted text-xs block font-sans font-bold">Compiler Logs:</span>
                          <pre className="bg-surface p-3 border border-border/50 rounded overflow-x-auto text-[11px] text-text-muted leading-relaxed font-mono whitespace-pre-wrap max-h-40">
                            {compileResult.error}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <div>
                          <span className="font-black text-sm block">COMPILATION SUCCESSFUL</span>
                          <span className="text-[11px] text-emerald-500/80">
                            Your code compiled successfully with no syntax or compiler errors!
                          </span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                        <XCircle className="size-4 shrink-0" />
                        <div>
                          <span className="font-black text-sm block">COMPILATION FAILED</span>
                          <span className="text-[11px] text-red-500/80">Failed to compile your source code. Check the details below.</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-2">
                        <span className="text-text-muted text-xs block font-sans font-bold">Compiler Logs:</span>
                        <pre className="bg-surface p-3 border border-border/50 rounded overflow-x-auto text-[11px] text-red-500 leading-relaxed font-mono whitespace-pre-wrap max-h-40">
                          {compileResult.error}
                        </pre>
                      </div>
                    </div>
                  )}
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
            {/* Floating Animal Typing Animation */}
            {!hideMascots && !room.isSolo && (
              <div 
                style={{ transform: `translate(${mascotPos.x}px, ${mascotPos.y}px)` }}
                className={cn(
                  "absolute top-3.5 right-3.5 z-40 flex flex-col gap-1.5 items-end max-h-[80%] overflow-visible pointer-events-auto select-none scrollbar-none",
                  isDraggingMascots ? "cursor-grabbing" : ""
                )}
              >
                {/* Drag Handle / Controls Bar */}
                <div 
                  onMouseDown={handleMascotMouseDown}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 bg-surface-2/95 border border-border/80 rounded-full shadow-md text-[10px] text-text-faint hover:text-text transition-colors select-none",
                    isDraggingMascots ? "cursor-grabbing" : "cursor-grab"
                  )}
                >
                  <GripHorizontal className="size-3 shrink-0" />
                  <span className="font-mono font-bold tracking-wider uppercase text-[9px] shrink-0">Opponents ({opponentsOnlyList.length})</span>
                  <button 
                    onClick={() => setCompactMode(!compactMode)} 
                    title={compactMode ? "Show details" : "Collapse details"}
                    className="ml-1 p-0.5 rounded hover:bg-surface-3 transition-colors cursor-pointer pointer-events-auto shrink-0"
                  >
                    {compactMode ? <Maximize2 className="size-3" /> : <Minimize2 className="size-3" />}
                  </button>
                </div>

                {/* Mascots List Container */}
                <div className={cn(
                  "flex gap-2 items-end",
                  compactMode ? "flex-row bg-surface-2/80 border border-border/50 p-1.5 rounded-2xl shadow-lg backdrop-blur-sm" : "flex-col"
                )}>
                  {opponentsOnlyList.map((oppName) => {
                    const isTyping = typingState[oppName] ?? false;
                    const pet = opponentPetState[oppName] || null;
                    return (
                      <div key={oppName} className="relative group/mascot">
                        <KeyboardMascotAnimation 
                          active={isTyping} 
                          pet={pet} 
                          opponentName={oppName}
                          onlyMascot={compactMode}
                        />
                        {/* Hover Tooltip when collapsed */}
                        {compactMode && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-3/95 border border-border/80 rounded-lg text-[10px] font-mono text-text whitespace-nowrap opacity-0 group-hover/mascot:opacity-100 transition-all pointer-events-none shadow-lg z-20 scale-95 group-hover/mascot:scale-100">
                            <span className="font-bold text-primary mr-1">{oppName}</span>
                            <span className="text-text-faint">{isTyping ? "is coding" : "is thinking"}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                      ) : room?.battleType === "BUG_FIX" ? (
                        <>
                          <option value="WRONG_DESCRIPTION">Wrong / Incorrect Description</option>
                          <option value="INVALID_BUG_CODE">Buggy code does not reproduce the bug</option>
                          <option value="WRONG_TEST_CASES">Incorrect or Failing Test Cases</option>
                          <option value="OTHER">Other / Content feedback</option>
                        </>
                      ) : room?.battleType === "PROMPT_WAR" ? (
                        <>
                          <option value="WRONG_DESCRIPTION">Wrong / Incorrect Prompt Description</option>
                          <option value="INVALID_TARGET">Failing or Invalid Target Image/Design</option>
                          <option value="WRONG_TEST_CASES">Incorrect Evaluation / Grading Criteria</option>
                          <option value="OTHER">Other / Content feedback</option>
                        </>
                      ) : room?.battleType === "FRONTEND" ? (
                        <>
                          <option value="WRONG_DESCRIPTION">Wrong / Incorrect Description</option>
                          <option value="INVALID_TARGET">Broken / Incorrect Visual Target</option>
                          <option value="WRONG_STARTER_CODE">Invalid HTML / CSS Starter Code</option>
                          <option value="OTHER">Other / Content feedback</option>
                        </>
                      ) : room?.battleType === "BACKEND" ? (
                        <>
                          <option value="WRONG_DESCRIPTION">Wrong / Incorrect Description</option>
                          <option value="WRONG_STARTER_CODE">Invalid / Broken Starter Boilerplate</option>
                          <option value="WRONG_TEST_CASES">Broken Integration / API Test Suite</option>
                          <option value="OTHER">Other / Content feedback</option>
                        </>
                      ) : room?.battleType === "PROJECTS" ? (
                        <>
                          <option value="WRONG_DESCRIPTION">Wrong / Incorrect Description</option>
                          <option value="WRONG_STARTER_CODE">Broken Starter Template / Boilerplate</option>
                          <option value="WRONG_TEST_CASES">Failing End-to-End Test Suite</option>
                          <option value="OTHER">Other / Content feedback</option>
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
                          : room?.battleType === "BUG_FIX"
                          ? "Please specify the incorrect description parts, code reproductive issues, or test case errors..."
                          : room?.battleType === "PROMPT_WAR"
                          ? "Please specify target design discrepancies, prompt description issues, or grading inaccuracies..."
                          : room?.battleType === "FRONTEND"
                          ? "Please specify visual target issues, starter HTML/CSS bugs, or description errors..."
                          : room?.battleType === "BACKEND"
                          ? "Please specify boilerplate errors, test suite failures, or description mismatches..."
                          : room?.battleType === "PROJECTS"
                          ? "Please specify template issues, test suite configuration errors, or description bugs..."
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

      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
          <div className="bg-[#0b0c10] border border-border rounded-xl shadow-2xl p-6 relative flex flex-col items-center gap-4 max-w-[95vw] max-h-[95vh]">
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute top-3 right-3 text-text-faint hover:text-text cursor-pointer transition-colors p-1.5 rounded-lg hover:bg-surface-2 border-none bg-transparent"
              title="Close Preview"
            >
              <XCircle className="size-5" />
            </button>
            <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono mr-8 self-start">
              {isCSSBattle ? "Full Resolution Target Preview (400x300 Canvas)" : "Full Page Live Preview"}
            </h3>
            <div className={cn(
              "bg-white border border-border/50 rounded-lg overflow-hidden relative shrink-0 shadow-lg",
              isCSSBattle ? "w-[400px] h-[300px]" : "w-[80vw] h-[70vh] max-w-[1200px]"
            )}>
              <iframe
                srcDoc={workspaceLangs.some((l: string) => l.toLowerCase() === "react")
                  ? buildReactPreviewHtml(codeByLang.react || "")
                  : buildPreviewHtml(
                      codeByLang.html || "",
                      codeByLang.css || "",
                      codeByLang.javascript || ""
                    )}
                title="Expanded Live Preview"
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border-none"
              />
            </div>
            <p className="text-[10px] text-text-faint font-sans text-center">
              {isCSSBattle 
                ? "This preview is rendered at exact 1:1 pixel scale (400px x 300px)." 
                : "This preview is rendered as a full-viewport web page."}
            </p>
          </div>
        </div>
      )}

      {isDragging && (
        <div className="fixed inset-0 z-50 select-none bg-transparent" />
      )}
    </div>
  );
}



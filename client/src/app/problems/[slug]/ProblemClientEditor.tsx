"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Play,
  Send,
  Swords,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Terminal,
  Code2,
  Lock,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  LogIn,
  UserPlus,
  Bug,
  Layout,
  Server,
  Sparkles,
  RotateCcw,
  Star,
  Bookmark,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/stores/auth-store";
import { useTheme } from "@/stores/theme-store";
import { API_URL, api } from "@/lib/api";
import type { QuestionDetail } from "@/lib/questions";
import type { UserProblemStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-surface-2 text-text-muted text-xs font-mono">
      <span className="animate-pulse">Loading Monaco code editor...</span>
    </div>
  ),
});

export type SupportedLang = "python" | "cpp" | "javascript" | "java" | "prompt";
export type QuestionData = QuestionDetail;

export interface RunTestResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  time: string;
  status: string;
  stderr?: string | null;
}

export function getInitialLangAndCode(q: QuestionData): { lang: SupportedLang; code: string } {
  const qMode = q.mode?.toUpperCase();
  if (qMode === "PROMPT_WAR") {
    return {
      lang: "prompt",
      code: q.starterCode?.prompt || "# Enter your system instruction and prompt template here:\n",
    };
  }
  if (qMode === "BUG_FIX") {
    const buggy = q.buggyStarterCode || q.starterCode;
    if (buggy?.python) return { lang: "python", code: buggy.python };
    if (buggy?.cpp) return { lang: "cpp", code: buggy.cpp };
    if (buggy?.javascript) return { lang: "javascript", code: buggy.javascript };
    if (buggy?.java) return { lang: "java", code: buggy.java };
  }
  const starter = q.starterCode;
  if (starter?.python) return { lang: "python", code: starter.python };
  if (starter?.cpp) return { lang: "cpp", code: starter.cpp };
  if (starter?.javascript) return { lang: "javascript", code: starter.javascript };
  if (starter?.java) return { lang: "java", code: starter.java };
  if (typeof starter === "object" && starter !== null) {
    const firstKey = Object.keys(starter)[0] as SupportedLang;
    if (firstKey && starter[firstKey]) {
      return { lang: firstKey, code: starter[firstKey] };
    }
  }
  return {
    lang: "python",
    code: "# Write your solution here\nclass Solution:\n    pass\n",
  };
}

export function ProblemClientEditor({
  initialQuestion,
  slug,
}: {
  initialQuestion: QuestionData;
  slug: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status } = useAuth();
  const { resolved: resolvedTheme } = useTheme();

  const [question, setQuestion] = useState<QuestionData>(initialQuestion);
  const [loading, setLoading] = useState(false);

  // User Problem Status & Favorites
  const { data: userStatusRes } = useQuery({
    queryKey: ["userProblemStatus"],
    queryFn: () => api<UserProblemStatus>("/problem-lists/user-status"),
    enabled: status === "authed",
    staleTime: 10_000,
  });

  const userStatus: UserProblemStatus | null = (userStatusRes as any)?.data ?? userStatusRes ?? null;
  const isQuestionSolved = useMemo(
    () => (userStatus?.solvedSlugs || []).includes(question.slug),
    [userStatus, question.slug]
  );
  const defaultFavList = useMemo(
    () => (userStatus?.lists || []).find((l: any) => l.isDefault),
    [userStatus]
  );
  const isQuestionFavorite = useMemo(
    () => (defaultFavList?.slugs || []).includes(question.slug),
    [defaultFavList, question.slug]
  );

  const toggleFavoriteMutation = useMutation({
    mutationFn: () =>
      api("/problem-lists/favorite/toggle", {
        method: "POST",
        body: {
          questionSlug: question.slug,
          title: question.title,
          difficulty: question.difficulty,
          mode: question.mode || "DSA",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProblemStatus"] });
    },
  });
  const [error, setError] = useState<string | null>(null);

  // Editor states
  const initialSetup = useMemo(() => getInitialLangAndCode(initialQuestion), [initialQuestion]);
  const [selectedLang, setSelectedLang] = useState<SupportedLang>(initialSetup.lang);
  const [code, setCode] = useState<string>(initialSetup.code);

  useEffect(() => {
    setQuestion(initialQuestion);
    const setup = getInitialLangAndCode(initialQuestion);
    setSelectedLang(setup.lang);
    setCode(setup.code);
  }, [initialQuestion]);

  // Resizable layout states (LeetCode-style splitters)
  const [leftWidth, setLeftWidth] = useState<number>(48); // width in %
  const [bottomHeight, setBottomHeight] = useState<number>(230); // height in px
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rightWorkspaceRef = useRef<HTMLDivElement>(null);
  const isDraggingLeftRef = useRef(false);
  const isDraggingBottomRef = useRef(false);

  // Restore saved layout preferences
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem("cc_problem_left_width");
      if (savedWidth) {
        const val = parseFloat(savedWidth);
        if (!isNaN(val) && val >= 20 && val <= 80) setLeftWidth(val);
      }
      const savedHeight = localStorage.getItem("cc_problem_bottom_height");
      if (savedHeight) {
        const val = parseFloat(savedHeight);
        if (!isNaN(val) && val >= 90 && val <= 600) setBottomHeight(val);
      }
    } catch {}
  }, []);

  // Left-right horizontal dragging handler
  const handleMouseMoveLeft = useCallback((e: MouseEvent) => {
    if (!isDraggingLeftRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(20, Math.min(80, newWidth));
    setLeftWidth(clamped);
  }, []);

  const handleMouseUpLeft = useCallback(() => {
    if (!isDraggingLeftRef.current) return;
    isDraggingLeftRef.current = false;
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleMouseMoveLeft);
    document.removeEventListener("mouseup", handleMouseUpLeft);
    try {
      localStorage.setItem("cc_problem_left_width", String(leftWidth));
    } catch {}
  }, [handleMouseMoveLeft, leftWidth]);

  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeftRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMoveLeft);
    document.addEventListener("mouseup", handleMouseUpLeft);
  };

  // Top-bottom vertical dragging handler
  const handleMouseMoveBottom = useCallback((e: MouseEvent) => {
    if (!isDraggingBottomRef.current || !rightWorkspaceRef.current) return;
    const rect = rightWorkspaceRef.current.getBoundingClientRect();
    const newHeight = rect.bottom - e.clientY;
    const clamped = Math.max(90, Math.min(rect.height - 100, newHeight));
    setBottomHeight(clamped);
  }, []);

  const handleMouseUpBottom = useCallback(() => {
    if (!isDraggingBottomRef.current) return;
    isDraggingBottomRef.current = false;
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleMouseMoveBottom);
    document.removeEventListener("mouseup", handleMouseUpBottom);
    try {
      localStorage.setItem("cc_problem_bottom_height", String(bottomHeight));
    } catch {}
  }, [handleMouseMoveBottom, bottomHeight]);

  const handleMouseDownBottom = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingBottomRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMoveBottom);
    document.addEventListener("mouseup", handleMouseUpBottom);
  };

  const handleResetLayout = () => {
    setLeftWidth(48);
    setBottomHeight(230);
    try {
      localStorage.removeItem("cc_problem_left_width");
      localStorage.removeItem("cc_problem_bottom_height");
    } catch {}
  };

  // Test run states
  const [activeTab, setActiveTab] = useState<"examples" | "testcases" | "console">("examples");
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState<RunTestResult[] | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);

  // Hints expand state
  const [openHint, setOpenHint] = useState<number | null>(null);

  // Auth Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update starter code on language switch
  const handleLangChange = (newLang: SupportedLang) => {
    setSelectedLang(newLang);
    const pool = (question?.mode === "BUG_FIX" ? question.buggyStarterCode : question?.starterCode) || question?.starterCode;
    if (pool?.[newLang]) {
      setCode(pool[newLang]);
    } else {
      const defaultSnippet: Record<SupportedLang, string> = {
        python: "# Write your solution here\nclass Solution:\n    pass\n",
        cpp: "// Write your solution here\n#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n};\n",
        javascript: "// Write your solution here\nfunction solution() {\n}\n",
        java: "// Write your solution here\nclass Solution {\n}\n",
        prompt: "# Enter your prompt instructions here:\n",
      };
      setCode(defaultSnippet[newLang]);
    }
  };

  // Run sample code without requiring login
  const handleRunSample = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setCompileError(null);
    setActiveTab("console");

    try {
      const res = await fetch(`${API_URL}/questions/${encodeURIComponent(slug)}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: selectedLang,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCompileError(data.message || "Execution failed");
      } else if (!data.data.compiled) {
        setCompileError(data.data.error || "Compilation Error");
      } else {
        setRunResults(data.data.results || []);
      }
    } catch (err: any) {
      setCompileError(err.message || "Failed to execute sample code");
    } finally {
      setIsRunning(false);
    }
  };

  // Submit handler: gates submission behind login
  const handleSubmit = async () => {
    if (status !== "authed") {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const bType =
        question?.mode === "FRONTEND"
          ? "FRONTEND"
          : question?.mode === "BACKEND"
          ? "BACKEND"
          : question?.mode === "PROMPT_WAR"
          ? "PROMPT_WAR"
          : question?.mode === "BUG_FIX"
          ? "BUG_FIX"
          : "DSA";

      const room = await api<any>("/battle", {
        method: "POST",
        body: {
          battleType: bType,
          isPrivate: true,
          isSolo: true,
          maxTeamSize: 1,
          selectedQuestion: question?.slug || question?._id,
        },
      });

      if (room && room.code) {
        router.push(`/battle/${room.code}`);
      } else {
        router.push("/battle");
      }
    } catch {
      router.push("/battle");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center space-y-4">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm font-mono text-text-muted">Loading challenge environment...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-500">
          <XCircle className="size-8" />
        </div>
        <h1 className="text-2xl font-bold">Challenge Not Found</h1>
        <p className="text-sm text-text-muted max-w-md">
          The requested problem could not be located. It may have been archived or renamed.
        </p>
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-2 text-sm font-medium transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="size-4" /> Browse Challenge Library
        </Link>
      </div>
    );
  }

  const difficultyColors = {
    Easy: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Medium: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    Hard: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  }[question.difficulty];

  const modeBadgeStyles: Record<string, { label: string; cls: string; icon: any }> = {
    DSA: { label: "DSA Algorithm", cls: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Code2 },
    BUG_FIX: { label: "Bug Fix Hunter", cls: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20", icon: Bug },
    FRONTEND: { label: "Frontend UI", cls: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: Layout },
    BACKEND: { label: "Backend API", cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Server },
    PROMPT_WAR: { label: "AI Prompt War", cls: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20", icon: Sparkles },
  };

  const currentModeInfo = modeBadgeStyles[question.mode?.toUpperCase() || "DSA"] || modeBadgeStyles.DSA;
  const ModeIcon = currentModeInfo.icon;

  const examples = question.statement?.examples || [];
  const constraints = question.statement?.constraints || [];
  const hints = question.hints || [];
  const endpoints = question.endpoints || [];
  const criteria = question.evaluationCriteria || [];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* ── Top Bar ──────────────────────────────────────── */}
      <header className="h-14 border-b border-border bg-surface px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/problems" className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-text transition-colors cursor-pointer" title="Back to Library">
            <ArrowLeft className="size-4" />
          </Link>
          <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-text mr-2">
            <LogoMark size={22} />
            <span>Code<span className="text-primary">Complex</span></span>
          </Link>
          <span className="text-border hidden sm:inline">|</span>
          <div className="flex items-center gap-2 truncate">
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${currentModeInfo.cls}`}>
              <ModeIcon className="size-2.5" />
              {currentModeInfo.label}
            </span>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${difficultyColors}`}>
              {question.difficulty}
            </span>
            <span className="text-xs font-semibold text-text truncate max-w-[160px] sm:max-w-xs md:max-w-md">
              {question.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetLayout}
            title="Reset Splitter Sizes (50/50)"
            className="hidden md:flex items-center gap-1 text-[11px] font-mono text-text-muted hover:text-text px-2 py-1 rounded hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span className="hidden lg:inline">Reset Layout</span>
          </button>

          <ThemeToggle className="text-text-muted hover:text-text hidden sm:flex" />

          {status === "authed" ? (
            <Link
              href="/battle"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border text-xs font-mono text-text hover:border-primary hover:text-primary transition-colors bg-surface-2"
            >
              <Swords className="size-3 text-primary" /> 1v1 Arena
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-medium text-text-muted hover:text-text transition-colors hidden sm:inline-block px-2"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs transition-colors shadow-xs"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Resizable Split View (LeetCode Style) ────── */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row overflow-hidden relative"
      >
        {/* Left Column: Problem Statement & Details */}
        <div
          style={{ width: `${leftWidth}%` }}
          className="w-full lg:w-[var(--left-w)] flex flex-col border-b lg:border-b-0 border-border bg-surface overflow-y-auto shrink-0"
        >
          <div className="p-6 space-y-6 max-w-2xl">
            {/* Meta tags */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border uppercase flex items-center gap-1.5 ${currentModeInfo.cls}`}>
                  <ModeIcon className="size-3" />
                  {currentModeInfo.label}
                </span>
                <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border uppercase ${difficultyColors}`}>
                  {question.difficulty}
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-surface-2 border border-border text-text-muted">
                  {question.category}
                </span>
                {(question.metadata?.estimatedTime || question.estimatedTime) && (
                  <span className="text-[11px] font-mono text-text-muted flex items-center gap-1">
                    <Clock className="size-3" /> {question.metadata?.estimatedTime || question.estimatedTime}m
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
                  {question.title}
                </h1>
                {status === "authed" && (
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    {isQuestionSolved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 shadow-2xs">
                        <CheckCircle2 className="size-3.5" /> Solved
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleFavoriteMutation.mutate()}
                      className={cn(
                        "p-2 rounded-xl border transition-colors cursor-pointer",
                        isQuestionFavorite
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-border bg-surface hover:bg-surface-2 text-text-faint hover:text-amber-400"
                      )}
                      title={isQuestionFavorite ? "Favorited" : "Add to favorites"}
                    >
                      <Star className={cn("size-4", isQuestionFavorite && "fill-amber-400")} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-border" />

            {/* Mode-specific guidance banner */}
            {question.mode === "BUG_FIX" && (
              <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-600 dark:text-red-300 leading-relaxed flex items-start gap-2.5">
                <Bug className="size-4 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <strong className="text-red-500 font-semibold block mb-0.5">Bug Fix Challenge:</strong>
                  The starter code contains broken logic, regressions, or edge-case bugs. Diagnose the failure and modify the code until all test cases return green!
                </div>
              </div>
            )}

            {question.mode === "PROMPT_WAR" && (
              <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-purple-600 dark:text-purple-300 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="size-4 shrink-0 text-purple-500 mt-0.5" />
                <div>
                  <strong className="text-purple-500 font-semibold block mb-0.5">AI Prompt War Scenario:</strong>
                  Craft a robust system prompt that guides an LLM to fulfill the scenario, adhere to schema, and satisfy all evaluation criteria under adversarial testing.
                </div>
              </div>
            )}

            {/* Endpoints specification (for Backend mode) */}
            {endpoints.length > 0 && (
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Server className="size-3.5" /> API Endpoints Required
                </h3>
                <div className="space-y-2">
                  {endpoints.map((ep, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ep.method === "GET" ? "bg-blue-500/20 text-blue-500" : ep.method === "POST" ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"}`}>
                          {ep.method}
                        </span>
                        <span className="text-text font-semibold">{ep.path}</span>
                      </div>
                      {ep.description && <span className="text-[11px] text-text-muted">{ep.description}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evaluation Criteria (for Prompt War mode) */}
            {criteria.length > 0 && (
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="size-3.5" /> Evaluation Criteria
                </h3>
                <ul className="space-y-2 font-mono text-xs text-text list-disc list-inside bg-surface-2 p-3 rounded-xl border border-border">
                  {criteria.map((cr, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="text-purple-600 dark:text-purple-300 font-semibold">{cr.name || `Rule ${idx + 1}`}: </span>
                      <span className="text-text-muted">{cr.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Problem Statement Body */}
            <div className="space-y-4 text-sm leading-relaxed text-text">
              <div className="whitespace-pre-line font-sans">
                {question.statement?.markdown}
              </div>

              {question.statement?.inputFormat && (
                <div className="space-y-1.5 pt-2">
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-faint">Input Format</h3>
                  <p className="text-xs font-mono bg-surface-2 p-2.5 rounded-lg border border-border text-text whitespace-pre-line">
                    {question.statement.inputFormat}
                  </p>
                </div>
              )}

              {question.statement?.outputFormat && (
                <div className="space-y-1.5 pt-1">
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-faint">Output Format</h3>
                  <p className="text-xs font-mono bg-surface-2 p-2.5 rounded-lg border border-border text-text whitespace-pre-line">
                    {question.statement.outputFormat}
                  </p>
                </div>
              )}
            </div>

            {/* Examples */}
            {examples.length > 0 && (
              <div className="space-y-3.5 pt-2">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                  Examples
                </h3>
                <div className="space-y-3">
                  {examples.map((ex, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-surface-2 p-3.5 space-y-2 font-mono text-xs">
                      <div className="font-semibold text-text-muted text-[11px]">Example {idx + 1}:</div>
                      <div className="space-y-1.5">
                        <div className="bg-bg p-2 rounded border border-border">
                          <span className="text-text-faint">Input: </span>
                          <span className="text-text">{ex.input}</span>
                        </div>
                        <div className="bg-bg p-2 rounded border border-border">
                          <span className="text-text-faint">Output: </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="text-[11px] text-text-muted pt-1 font-sans">
                            <span className="font-semibold text-text">Explanation: </span>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Constraints */}
            {constraints.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-faint">
                  Constraints
                </h3>
                <ul className="space-y-1.5 font-mono text-xs text-text-muted list-disc list-inside bg-surface-2 p-3 rounded-xl border border-border">
                  {constraints.map((c, idx) => {
                    const str = typeof c === "string" ? c : `${c.variable || ""}: ${c.description || `${c.min !== undefined ? `${c.min} ≤ ` : ""}${c.variable || ""}${c.max !== undefined ? ` ≤ ${c.max}` : ""}`}`;
                    return <li key={idx}>{str}</li>;
                  })}
                </ul>
              </div>
            )}

            {/* Hints (Accordion) */}
            {hints.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-faint">
                  Hints
                </h3>
                <div className="space-y-1.5">
                  {hints.map((hint, idx) => {
                    const isOpen = openHint === idx;
                    return (
                      <div key={idx} className="rounded-lg border border-border bg-surface-2 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenHint(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-2.5 text-xs font-mono text-left text-text hover:text-primary cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <HelpCircle className="size-3.5 text-primary" />
                            Hint {hint.order || idx + 1}
                          </span>
                          {isOpen ? <ChevronUp className="size-3.5 text-text-faint" /> : <ChevronDown className="size-3.5 text-text-faint" />}
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 pt-1 text-xs text-text-muted border-t border-border bg-surface">
                            {hint.text}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Solo Practice Callout */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary-subtle space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Zap className="size-4" /> Free Solo Sandbox
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Test and execute your code in our isolated Docker environment without signing up. Log in when you want to officially submit, climb the Elo ratings, and benchmark against other developers.
              </p>
            </div>
          </div>
        </div>

        {/* ── Vertical Resizer (Left-Right Splitter) ─────── */}
        <div
          onMouseDown={handleMouseDownLeft}
          className="hidden lg:flex w-2 hover:w-2.5 bg-transparent hover:bg-primary/30 transition-all cursor-col-resize shrink-0 relative z-30 self-stretch items-center justify-center group select-none"
          title="Drag to resize problem / editor split"
        >
          <div className="w-[2px] h-8 bg-border group-hover:bg-primary rounded-full transition-colors" />
        </div>

        {/* Right Column: Code Editor Workspace */}
        <div
          ref={rightWorkspaceRef}
          style={{ width: `calc(${100 - leftWidth}% - 8px)` }}
          className="w-full flex-1 flex flex-col bg-bg overflow-hidden min-w-[300px]"
        >
          {/* Editor Header */}
          <div className="h-10 border-b border-border bg-surface px-4 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Code2 className="size-3.5 text-text-muted" />
              {question.mode === "PROMPT_WAR" ? (
                <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">Prompt Template</span>
              ) : (
                <select
                  value={selectedLang}
                  onChange={(e) => handleLangChange(e.target.value as SupportedLang)}
                  className="bg-transparent border-0 text-xs font-mono font-medium text-text focus:outline-none cursor-pointer"
                >
                  <option value="python" className="bg-surface text-text">Python 3</option>
                  <option value="cpp" className="bg-surface text-text">C++ (GCC 20)</option>
                  <option value="javascript" className="bg-surface text-text">JavaScript (Node 20)</option>
                  <option value="java" className="bg-surface text-text">Java (OpenJDK 21)</option>
                </select>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-text-faint hidden sm:inline">
                Docker Linux Sandbox
              </span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className={`flex-1 relative w-full overflow-hidden min-h-[140px] ${isDragging ? "pointer-events-none select-none" : ""}`}>
            <Editor
              height="100%"
              language={selectedLang === "cpp" ? "cpp" : selectedLang === "python" ? "python" : selectedLang === "java" ? "java" : selectedLang === "prompt" ? "markdown" : "javascript"}
              theme={resolvedTheme === "light" ? "light" : "vs-dark"}
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                automaticLayout: true,
                fontFamily: "var(--font-mono, monospace)",
                cursorBlinking: "smooth",
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                padding: { top: 12 },
              }}
            />
          </div>

          {/* ── Horizontal Resizer (Editor-Console Splitter) ── */}
          <div
            onMouseDown={handleMouseDownBottom}
            className="hidden md:flex h-2 hover:h-2.5 bg-transparent hover:bg-primary/30 transition-all cursor-row-resize shrink-0 relative z-30 w-full items-center justify-center group select-none"
            title="Drag to resize console drawer"
          >
            <div className="h-[2px] w-8 bg-border group-hover:bg-primary rounded-full transition-colors" />
          </div>

          {/* Bottom Execution & Console Panel */}
          <div
            style={{ height: `${bottomHeight}px` }}
            className="border-t border-border bg-surface flex flex-col shrink-0 overflow-hidden select-none"
          >
            {/* Panel Tabs */}
            <div className="h-9 px-4 border-b border-border bg-surface-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("examples")}
                  className={`text-[11px] font-mono font-medium tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "examples" ? "text-primary border-b-2 border-primary py-2 font-bold" : "text-text-muted hover:text-text"}`}
                >
                  Sample Cases
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("console")}
                  className={`text-[11px] font-mono font-medium tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === "console" ? "text-primary border-b-2 border-primary py-2 font-bold" : "text-text-muted hover:text-text"}`}
                >
                  <Terminal className="size-3" /> Console Output
                </button>
              </div>

              {runResults && (
                <div className="text-[11px] font-mono flex items-center gap-1.5">
                  {runResults.every((r) => r.passed) ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="size-3" /> All Samples Passed
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                      <XCircle className="size-3" /> Some Samples Failed
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
              {activeTab === "examples" && (
                <div className="space-y-3">
                  {examples.length === 0 ? (
                    <p className="text-text-faint text-xs">No sample cases specified.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {examples.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveSampleIndex(idx)}
                            className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${activeSampleIndex === idx ? "bg-primary text-white font-bold" : "bg-surface-2 border border-border text-text-muted hover:text-text"}`}
                          >
                            Case {idx + 1}
                          </button>
                        ))}
                      </div>

                      {examples[activeSampleIndex] && (
                        <div className="space-y-2 rounded-xl bg-surface-2 p-3 border border-border">
                          <div>
                            <span className="text-text-faint block text-[11px] mb-1">Input:</span>
                            <pre className="bg-bg p-2 rounded border border-border text-text overflow-x-auto">
                              {examples[activeSampleIndex].input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-text-faint block text-[11px] mb-1">Expected Output:</span>
                            <pre className="bg-bg p-2 rounded border border-border text-emerald-600 dark:text-emerald-400 font-bold overflow-x-auto">
                              {examples[activeSampleIndex].output}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "console" && (
                <div className="space-y-3">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-text-muted py-4">
                      <Spinner className="size-4 text-primary" />
                      <span>Executing code in isolated container...</span>
                    </div>
                  ) : compileError ? (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <XCircle className="size-3.5" /> Execution Error
                      </div>
                      <pre className="text-xs whitespace-pre-wrap font-mono mt-1 text-text">
                        {compileError}
                      </pre>
                    </div>
                  ) : runResults ? (
                    <div className="space-y-3">
                      {runResults.map((res, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border space-y-2 ${res.passed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              {res.passed ? (
                                <CheckCircle2 className="size-3.5 text-emerald-500" />
                              ) : (
                                <XCircle className="size-3.5 text-rose-500" />
                              )}
                              Sample Test {idx + 1}
                            </span>
                            <span className="text-[10px] text-text-faint font-mono">{res.time}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-bg p-2 rounded border border-border">
                              <span className="text-text-faint block">Expected:</span>
                              <pre className="text-emerald-600 dark:text-emerald-400 overflow-x-auto">{res.expectedOutput}</pre>
                            </div>
                            <div className="bg-bg p-2 rounded border border-border">
                              <span className="text-text-faint block">Your Output:</span>
                              <pre className={res.passed ? "text-emerald-600 dark:text-emerald-400 overflow-x-auto" : "text-rose-500 overflow-x-auto"}>{res.actualOutput || "(No Output)"}</pre>
                            </div>
                          </div>

                          {res.stderr && (
                            <div className="bg-bg p-2 rounded border border-rose-500/20 text-rose-400 text-[11px]">
                              <span className="text-text-faint block">Standard Error:</span>
                              <pre className="overflow-x-auto whitespace-pre-wrap">{res.stderr}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-faint py-4">Click &quot;Run Samples&quot; to compile and execute your solution against public sample cases.</p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="h-12 border-t border-border bg-surface px-4 flex items-center justify-between shrink-0">
              <div className="text-[11px] font-mono text-text-muted hidden sm:flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full bg-emerald-500" /> Docker Sandbox Ready
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={handleRunSample}
                  disabled={isRunning}
                  className="h-8 px-3 rounded-lg border border-border hover:bg-surface-2 text-text font-medium text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Play className="size-3 text-emerald-500 fill-emerald-500" />
                  {isRunning ? "Running..." : "Run Samples"}
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-8 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Send className="size-3" />
                  {isSubmitting ? "Submitting..." : "Submit Solution"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Login-Gated Submission Modal ─────────────────── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <div className="mx-auto size-12 rounded-full bg-primary-subtle border border-primary/20 flex items-center justify-center text-primary">
                <Lock className="size-6" />
              </div>
              <h2 className="text-xl font-bold text-text tracking-tight">
                Log In to Submit Solution
              </h2>
              <p className="text-xs text-text-muted leading-relaxed max-w-xs mx-auto">
                You can practice and test sample cases for free. To officially submit, verify hidden stress cases, and climb the global Elo rating ladder, please sign in.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface-2 space-y-2 text-xs font-mono text-text">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Run against full hidden test suite
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Earn Elo rating points & unlock badges
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Add problem to SuperMemo-2 revision queue
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href={`/login?redirect=/problems/${encodeURIComponent(slug)}`}
                className="w-full h-10 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <LogIn className="size-4" /> Log In
              </Link>
              <Link
                href={`/signup?redirect=/problems/${encodeURIComponent(slug)}`}
                className="w-full h-10 rounded-full border border-border hover:bg-surface-2 text-text font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserPlus className="size-4" /> Create Free Account
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-text-muted hover:text-text pt-1 transition-colors cursor-pointer"
              >
                Continue practicing without submitting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

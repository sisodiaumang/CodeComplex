"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
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
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, Spinner } from "@/components/ui";
import { useAuth } from "@/stores/auth-store";
import { API_URL, api } from "@/lib/api";

type SupportedLang = "python" | "cpp" | "javascript" | "java" | "prompt";

interface QuestionData {
  _id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  subCategory?: string;
  mode?: "DSA" | "BUG_FIX" | "FRONTEND" | "BACKEND" | "PROMPT_WAR" | string;
  metadata?: {
    estimatedTime?: number;
    points?: number;
    topics?: string[];
    tags?: string[];
  };
  statement?: {
    markdown: string;
    inputFormat?: string;
    outputFormat?: string;
    notes?: string;
    constraints?: Array<string | {
      variable?: string;
      type?: string;
      min?: number;
      max?: number;
      description?: string;
    }>;
    examples?: Array<{
      input: string;
      output: string;
      explanation?: string;
    }>;
  };
  hints?: Array<{
    order: number;
    text: string;
  }>;
  starterCode?: Record<string, string>;
  buggyStarterCode?: Record<string, string>;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string;
  }>;
  endpoints?: Array<{
    method: string;
    path: string;
    description?: string;
  }>;
  evaluationCriteria?: Array<{
    id?: string;
    name?: string;
    description: string;
  }>;
}

interface RunTestResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  time: string;
  status: string;
  stderr?: string | null;
}

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params?.slug || "");
  const { user, status } = useAuth();

  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor states
  const [selectedLang, setSelectedLang] = useState<SupportedLang>("python");
  const [code, setCode] = useState<string>("");

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

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_URL}/questions/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Question not found");
        return res.json();
      })
      .then((data) => {
        if (data?.data) {
          const q: QuestionData = data.data;
          setQuestion(q);

          const qMode = q.mode?.toUpperCase();

          if (qMode === "PROMPT_WAR") {
            setSelectedLang("prompt");
            setCode(q.starterCode?.prompt || "# Enter your system instruction and prompt template here:\n");
          } else if (qMode === "BUG_FIX") {
            const buggy = q.buggyStarterCode || q.starterCode;
            if (buggy?.python) {
              setSelectedLang("python");
              setCode(buggy.python);
            } else if (buggy?.cpp) {
              setSelectedLang("cpp");
              setCode(buggy.cpp);
            } else if (buggy?.javascript) {
              setSelectedLang("javascript");
              setCode(buggy.javascript);
            } else if (buggy?.java) {
              setSelectedLang("java");
              setCode(buggy.java);
            }
          } else {
            const starter = q.starterCode;
            if (starter?.python) {
              setSelectedLang("python");
              setCode(starter.python);
            } else if (starter?.cpp) {
              setSelectedLang("cpp");
              setCode(starter.cpp);
            } else if (starter?.javascript) {
              setSelectedLang("javascript");
              setCode(starter.javascript);
            } else if (starter?.java) {
              setSelectedLang("java");
              setCode(starter.java);
            } else if (typeof starter === "object" && starter !== null) {
              const firstKey = Object.keys(starter)[0];
              if (firstKey) {
                setCode(starter[firstKey]);
              }
            }
          }
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load challenge");
      })
      .finally(() => setLoading(false));
  }, [slug]);

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
      <div className="min-h-screen bg-[#0B0B0C] text-[#EFEDE8] flex flex-col items-center justify-center space-y-4">
        <Spinner className="size-8" />
        <p className="text-sm font-mono text-white/50">Loading challenge environment...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] text-[#EFEDE8] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-400">
          <XCircle className="size-8" />
        </div>
        <h1 className="text-2xl font-bold">Challenge Not Found</h1>
        <p className="text-sm text-white/60 max-w-md">
          The requested problem could not be located. It may have been archived or renamed.
        </p>
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Browse Challenge Library
        </Link>
      </div>
    );
  }

  const difficultyColors = {
    Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    Hard: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  }[question.difficulty];

  const modeBadgeStyles: Record<string, { label: string; cls: string; icon: any }> = {
    DSA: { label: "DSA Algorithm", cls: "text-[#4D8DFF] bg-[#4D8DFF]/10 border-[#4D8DFF]/20", icon: Code2 },
    BUG_FIX: { label: "Bug Fix Hunter", cls: "text-[#FF5A52] bg-[#FF5A52]/10 border-[#FF5A52]/20", icon: Bug },
    FRONTEND: { label: "Frontend UI", cls: "text-[#2FCBDB] bg-[#2FCBDB]/10 border-[#2FCBDB]/20", icon: Layout },
    BACKEND: { label: "Backend API", cls: "text-[#35C46A] bg-[#35C46A]/10 border-[#35C46A]/20", icon: Server },
    PROMPT_WAR: { label: "AI Prompt War", cls: "text-[#B57BF5] bg-[#B57BF5]/10 border-[#B57BF5]/20", icon: Sparkles },
  };

  const currentModeInfo = modeBadgeStyles[question.mode?.toUpperCase() || "DSA"] || modeBadgeStyles.DSA;
  const ModeIcon = currentModeInfo.icon;

  const examples = question.statement?.examples || [];
  const constraints = question.statement?.constraints || [];
  const hints = question.hints || [];
  const endpoints = question.endpoints || [];
  const criteria = question.evaluationCriteria || [];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#EFEDE8] flex flex-col font-sans selection:bg-[#FF7A1A] selection:text-[#0B0B0C]">
      {/* ── Top Bar ──────────────────────────────────────── */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0E0E10] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/problems" className="p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer" title="Back to Library">
            <ArrowLeft className="size-4" />
          </Link>
          <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-white mr-2">
            <LogoMark size={22} />
            <span>Code<span className="text-[#FF7A1A]">Complex</span></span>
          </Link>
          <span className="text-white/20 hidden sm:inline">|</span>
          <div className="flex items-center gap-2 truncate">
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${currentModeInfo.cls}`}>
              <ModeIcon className="size-2.5" />
              {currentModeInfo.label}
            </span>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${difficultyColors}`}>
              {question.difficulty}
            </span>
            <span className="text-xs font-semibold text-white truncate max-w-[160px] sm:max-w-xs md:max-w-md">
              {question.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetLayout}
            title="Reset Splitter Sizes (50/50)"
            className="hidden md:flex items-center gap-1 text-[11px] font-mono text-white/40 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span className="hidden lg:inline">Reset Layout</span>
          </button>

          <ThemeToggle className="text-white/60 hover:text-white hidden sm:flex" />

          {status === "authed" ? (
            <Link
              href="/battle"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-white/20 text-xs font-mono text-white/80 hover:text-white hover:border-white/40 transition-colors"
            >
              <Swords className="size-3 text-[#FF7A1A]" /> 1v1 Arena
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-medium text-white/70 hover:text-white transition-colors hidden sm:inline-block px-2"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-[#FF7A1A] text-black font-semibold text-xs transition-opacity hover:opacity-90"
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
          className="w-full lg:w-[var(--left-w)] flex flex-col border-b lg:border-b-0 border-white/[0.08] bg-[#0B0B0C] overflow-y-auto shrink-0"
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
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                  {question.category}
                </span>
                {question.metadata?.estimatedTime && (
                  <span className="text-[11px] font-mono text-white/40 flex items-center gap-1">
                    <Clock className="size-3" /> {question.metadata.estimatedTime}m
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {question.title}
              </h1>
            </div>

            <hr className="border-white/[0.08]" />

            {/* Mode-specific guidance banner */}
            {question.mode === "BUG_FIX" && (
              <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-300 leading-relaxed flex items-start gap-2.5">
                <Bug className="size-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <strong className="text-red-400 font-semibold block mb-0.5">Bug Fix Challenge:</strong>
                  The starter code contains broken logic, regressions, or edge-case bugs. Diagnose the failure and modify the code until all test cases return green!
                </div>
              </div>
            )}

            {question.mode === "PROMPT_WAR" && (
              <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-purple-300 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="size-4 shrink-0 text-purple-400 mt-0.5" />
                <div>
                  <strong className="text-purple-400 font-semibold block mb-0.5">AI Prompt War Scenario:</strong>
                  Craft a robust system prompt that guides an LLM to fulfill the scenario, adhere to schema, and satisfy all evaluation criteria under adversarial testing.
                </div>
              </div>
            )}

            {/* Endpoints specification (for Backend mode) */}
            {endpoints.length > 0 && (
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#35C46A] flex items-center gap-1.5">
                  <Server className="size-3.5" /> API Endpoints Required
                </h3>
                <div className="space-y-2">
                  {endpoints.map((ep, idx) => (
                    <div key={idx} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 font-mono text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ep.method === "GET" ? "bg-blue-500/20 text-blue-400" : ep.method === "POST" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                          {ep.method}
                        </span>
                        <span className="text-white font-semibold">{ep.path}</span>
                      </div>
                      {ep.description && <span className="text-[11px] text-white/50">{ep.description}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evaluation Criteria (for Prompt War mode) */}
            {criteria.length > 0 && (
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#B57BF5] flex items-center gap-1.5">
                  <Sparkles className="size-3.5" /> Evaluation Criteria
                </h3>
                <ul className="space-y-2 font-mono text-xs text-white/80 list-disc list-inside bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                  {criteria.map((cr, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="text-purple-300 font-semibold">{cr.name || `Rule ${idx + 1}`}: </span>
                      <span className="text-white/70">{cr.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Problem Statement Body */}
            <div className="space-y-4 text-sm leading-relaxed text-white/80">
              <div className="whitespace-pre-line font-sans">
                {question.statement?.markdown}
              </div>

              {question.statement?.inputFormat && (
                <div className="space-y-1.5 pt-2">
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white/50">Input Format</h3>
                  <p className="text-xs font-mono bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.06] text-white/70 whitespace-pre-line">
                    {question.statement.inputFormat}
                  </p>
                </div>
              )}

              {question.statement?.outputFormat && (
                <div className="space-y-1.5 pt-1">
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white/50">Output Format</h3>
                  <p className="text-xs font-mono bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.06] text-white/70 whitespace-pre-line">
                    {question.statement.outputFormat}
                  </p>
                </div>
              )}
            </div>

            {/* Examples */}
            {examples.length > 0 && (
              <div className="space-y-3.5 pt-2">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#FF7A1A]">
                  Examples
                </h3>
                <div className="space-y-3">
                  {examples.map((ex, idx) => (
                    <div key={idx} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-2 font-mono text-xs">
                      <div className="font-semibold text-white/60 text-[11px]">Example {idx + 1}:</div>
                      <div className="space-y-1.5">
                        <div className="bg-black/40 p-2 rounded border border-white/[0.04]">
                          <span className="text-white/40">Input: </span>
                          <span className="text-white/90">{ex.input}</span>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-white/[0.04]">
                          <span className="text-white/40">Output: </span>
                          <span className="text-emerald-400 font-bold">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="text-[11px] text-white/50 pt-1 font-sans">
                            <span className="font-semibold text-white/70">Explanation: </span>
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
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white/50">
                  Constraints
                </h3>
                <ul className="space-y-1.5 font-mono text-xs text-white/70 list-disc list-inside bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
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
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white/50">
                  Hints
                </h3>
                <div className="space-y-1.5">
                  {hints.map((hint, idx) => {
                    const isOpen = openHint === idx;
                    return (
                      <div key={idx} className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenHint(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-2.5 text-xs font-mono text-left text-white/80 hover:text-white cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <HelpCircle className="size-3.5 text-[#FF7A1A]" />
                            Hint {hint.order || idx + 1}
                          </span>
                          {isOpen ? <ChevronUp className="size-3.5 text-white/40" /> : <ChevronDown className="size-3.5 text-white/40" />}
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 pt-1 text-xs text-white/60 border-t border-white/[0.06] bg-white/[0.01]">
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
            <div className="p-4 rounded-xl border border-[#FF7A1A]/20 bg-[#FF7A1A]/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FF7A1A]">
                <Zap className="size-4" /> Free Solo Sandbox
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Test and execute your code in our isolated Docker environment without signing up. Log in when you want to officially submit, climb the Elo ratings, and benchmark against other developers.
              </p>
            </div>
          </div>
        </div>

        {/* ── Vertical Resizer (Left-Right Splitter) ─────── */}
        <div
          onMouseDown={handleMouseDownLeft}
          className="hidden lg:flex w-2 hover:w-2.5 bg-transparent hover:bg-[#FF7A1A]/40 transition-all cursor-col-resize shrink-0 relative z-30 self-stretch items-center justify-center group select-none"
          title="Drag to resize problem / editor split"
        >
          <div className="w-[2px] h-8 bg-white/20 group-hover:bg-[#FF7A1A] rounded-full transition-colors" />
        </div>

        {/* Right Column: Code Editor Workspace */}
        <div
          ref={rightWorkspaceRef}
          style={{ width: `calc(${100 - leftWidth}% - 8px)` }}
          className="w-full flex-1 flex flex-col bg-[#08090D] overflow-hidden min-w-[300px]"
        >
          {/* Editor Header */}
          <div className="h-10 border-b border-white/[0.08] bg-[#0E0E12] px-4 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Code2 className="size-3.5 text-white/40" />
              {question.mode === "PROMPT_WAR" ? (
                <span className="text-xs font-mono text-purple-400 font-semibold">Prompt Template</span>
              ) : (
                <select
                  value={selectedLang}
                  onChange={(e) => handleLangChange(e.target.value as SupportedLang)}
                  className="bg-transparent border-0 text-xs font-mono font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="python" className="bg-[#141416] text-white">Python 3</option>
                  <option value="cpp" className="bg-[#141416] text-white">C++ (GCC 20)</option>
                  <option value="javascript" className="bg-[#141416] text-white">JavaScript (Node 20)</option>
                  <option value="java" className="bg-[#141416] text-white">Java (OpenJDK 21)</option>
                </select>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/30 hidden sm:inline">
                Docker Linux Sandbox
              </span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className={`flex-1 relative w-full overflow-hidden min-h-[140px] ${isDragging ? "pointer-events-none select-none" : ""}`}>
            <Editor
              height="100%"
              language={selectedLang === "cpp" ? "cpp" : selectedLang === "python" ? "python" : selectedLang === "java" ? "java" : selectedLang === "prompt" ? "markdown" : "javascript"}
              theme="vs-dark"
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
            className="hidden md:flex h-2 hover:h-2.5 bg-transparent hover:bg-[#FF7A1A]/40 transition-all cursor-row-resize shrink-0 relative z-30 w-full items-center justify-center group select-none"
            title="Drag to resize console drawer"
          >
            <div className="h-[2px] w-8 bg-white/20 group-hover:bg-[#FF7A1A] rounded-full transition-colors" />
          </div>

          {/* Bottom Execution & Console Panel */}
          <div
            style={{ height: `${bottomHeight}px` }}
            className="border-t border-white/[0.08] bg-[#0B0B0E] flex flex-col shrink-0 overflow-hidden select-none"
          >
            {/* Panel Tabs */}
            <div className="h-9 px-4 border-b border-white/[0.08] bg-[#0E0E12] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("examples")}
                  className={`text-[11px] font-mono font-medium tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "examples" ? "text-[#FF7A1A] border-b-2 border-[#FF7A1A] py-2" : "text-white/40 hover:text-white"}`}
                >
                  Sample Cases
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("console")}
                  className={`text-[11px] font-mono font-medium tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === "console" ? "text-[#FF7A1A] border-b-2 border-[#FF7A1A] py-2" : "text-white/40 hover:text-white"}`}
                >
                  <Terminal className="size-3" /> Console Output
                </button>
              </div>

              {runResults && (
                <div className="text-[11px] font-mono flex items-center gap-1.5">
                  {runResults.every((r) => r.passed) ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> All Samples Passed
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <XCircle className="size-3" /> Some Cases Failed
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs select-text">
              {activeTab === "examples" && (
                <div className="space-y-2">
                  {examples.length > 0 ? (
                    <>
                      <div className="flex gap-2 mb-2">
                        {examples.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveSampleIndex(i)}
                            className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${activeSampleIndex === i ? "bg-white/10 text-white font-semibold" : "bg-white/5 text-white/40 hover:text-white"}`}
                          >
                            Case {i + 1}
                          </button>
                        ))}
                      </div>

                      {examples[activeSampleIndex] && (
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className="text-white/40">Input: </span>
                            <span className="text-white/90">{examples[activeSampleIndex].input}</span>
                          </div>
                          <div>
                            <span className="text-white/40">Expected: </span>
                            <span className="text-emerald-400">{examples[activeSampleIndex].output}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-white/40 py-2">
                      Review the challenge specification and constraints on the left, then click <strong className="text-white">Run Code</strong> to test in sandbox.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "console" && (
                <div className="space-y-2">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-white/50 py-4">
                      <Spinner className="size-4" />
                      <span>Compiling and running sample test cases...</span>
                    </div>
                  ) : compileError ? (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded text-rose-300 whitespace-pre-wrap leading-relaxed">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-400">
                        <XCircle className="size-3.5" /> Compilation / Execution Error:
                      </div>
                      {compileError}
                    </div>
                  ) : runResults && runResults.length > 0 ? (
                    <div className="space-y-2">
                      {runResults.map((res) => (
                        <div
                          key={res.testCaseIndex}
                          className={`p-2.5 rounded border ${res.passed ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-rose-500/5 border-rose-500/20 text-rose-300"}`}
                        >
                          <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
                            <span className="flex items-center gap-1.5">
                              {res.passed ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <XCircle className="size-3.5 text-rose-400" />}
                              Case {res.testCaseIndex} — {res.passed ? "Passed" : "Wrong Answer"}
                            </span>
                            <span className="text-white/40 font-normal">{res.time}</span>
                          </div>
                          <div className="text-[11px] space-y-0.5 text-white/80">
                            <div><span className="text-white/40">Input: </span>{res.input}</div>
                            <div><span className="text-white/40">Expected: </span><span className="text-emerald-400">{res.expectedOutput}</span></div>
                            <div><span className="text-white/40">Actual: </span><span className={res.passed ? "text-emerald-400" : "text-rose-400"}>{res.actualOutput || "(empty)"}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/40 py-2">
                      Click <strong className="text-white">Run Code</strong> to test your solution against visible sample cases without logging in.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="h-12 border-t border-white/[0.08] bg-[#0E0E12] px-4 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-mono text-white/40">
                {status === "authed" ? `Logged in as @${user?.username}` : "Guest Mode · Free Solo Practice"}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleRunSample}
                  disabled={isRunning}
                  variant="outline"
                  className="h-8 px-3 text-xs font-mono border-white/20 hover:bg-white/5 cursor-pointer"
                >
                  {isRunning ? <Spinner className="size-3.5 mr-1.5" /> : <Play className="size-3.5 mr-1.5 text-emerald-400 fill-emerald-400" />}
                  Run Code
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-8 px-4 text-xs font-mono font-bold bg-[#FF7A1A] hover:bg-[#FF9040] text-black border-0 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Spinner className="size-3.5 mr-1.5" />
                  ) : status === "authed" ? (
                    <Send className="size-3.5 mr-1.5" />
                  ) : (
                    <Lock className="size-3.5 mr-1.5" />
                  )}
                  {status === "authed" ? "Submit Solution" : "Submit (Login Required)"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Login-Gated Submission Modal ─────────────────── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#121215] p-6 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <div className="mx-auto size-12 rounded-full bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 flex items-center justify-center text-[#FF7A1A]">
                <Lock className="size-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Log In to Submit Solution
              </h2>
              <p className="text-xs text-white/60 leading-relaxed max-w-xs mx-auto">
                You can practice and test sample cases for free. To officially submit, verify hidden stress cases, and climb the global Elo rating ladder, please sign in.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2 text-xs font-mono text-white/70">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Run against full hidden test suite
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Earn Elo rating points & unlock badges
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Add problem to SuperMemo-2 revision queue
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href={`/login?redirect=/problems/${encodeURIComponent(slug)}`}
                className="w-full h-10 rounded-full bg-[#FF7A1A] hover:bg-[#FF9040] text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogIn className="size-4" /> Log In
              </Link>
              <Link
                href={`/signup?redirect=/problems/${encodeURIComponent(slug)}`}
                className="w-full h-10 rounded-full border border-white/20 hover:border-white/40 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserPlus className="size-4" /> Create Free Account
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-white/40 hover:text-white pt-1 transition-colors cursor-pointer"
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

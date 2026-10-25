"use client";

import { useEffect, useState, useTransition } from "react";
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
  Sparkles,
  Zap,
  Clock,
  Layers,
  LogIn,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, Badge, Spinner } from "@/components/ui";
import { useAuth } from "@/stores/auth-store";
import { API_URL, api } from "@/lib/api";

type SupportedLang = "python" | "cpp" | "javascript" | "java";

interface QuestionData {
  _id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  subCategory?: string;
  mode?: string;
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
    constraints?: Array<{
      variable: string;
      type: string;
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
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string;
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
          setQuestion(data.data);
          const starter = data.data.starterCode;
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
          } else {
            setCode("// Write your solution here");
          }
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load problem");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Update starter code on language switch
  const handleLangChange = (newLang: SupportedLang) => {
    setSelectedLang(newLang);
    if (question?.starterCode?.[newLang]) {
      setCode(question.starterCode[newLang]);
    } else {
      const defaultSnippet: Record<SupportedLang, string> = {
        python: "# Write your solution here\nclass Solution:\n    pass\n",
        cpp: "// Write your solution here\n#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n};\n",
        javascript: "// Write your solution here\nfunction solution() {\n}\n",
        java: "// Write your solution here\nclass Solution {\n}\n",
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

    // If logged in: create a Solo battle room with this specific question and enter it!
    setIsSubmitting(true);
    try {
      const room = await api<any>("/battle", {
        method: "POST",
        body: {
          battleType: "DSA",
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" /> Browse All Challenges
        </Link>
      </div>
    );
  }

  const difficultyColors = {
    Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    Hard: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  }[question.difficulty];

  const examples = question.statement?.examples || [];
  const constraints = question.statement?.constraints || [];
  const hints = question.hints || [];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#EFEDE8] flex flex-col font-sans selection:bg-[#FF7A1A] selection:text-[#0B0B0C]">
      {/* ── Top Bar ──────────────────────────────────────── */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0E0E10] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/problems" className="p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white transition-colors" title="Back to Problems">
            <ArrowLeft className="size-4" />
          </Link>
          <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-white mr-2">
            <LogoMark size={22} />
            <span>Code<span className="text-[#FF7A1A]">Complex</span></span>
          </Link>
          <span className="text-white/20 hidden sm:inline">|</span>
          <div className="flex items-center gap-2 truncate">
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${difficultyColors}`}>
              {question.difficulty}
            </span>
            <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {question.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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

      {/* ── Main Split View ──────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Problem Statement & Details */}
        <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#0B0B0C] overflow-y-auto">
          <div className="p-6 space-y-6 max-w-2xl">
            {/* Meta tags */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
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
                {question.mode === "bug_fix" && (
                  <span className="text-[11px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                    Bug Fix Mode
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {question.title}
              </h1>
            </div>

            <hr className="border-white/[0.08]" />

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
                  {constraints.map((c, idx) => (
                    <li key={idx}>
                      <span className="text-white/90">{c.variable}</span>: {c.description || `${c.min !== undefined ? `${c.min} ≤ ` : ""}${c.variable}${c.max !== undefined ? ` ≤ ${c.max}` : ""}`}
                    </li>
                  ))}
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
                          className="w-full flex items-center justify-between p-2.5 text-xs font-mono text-left text-white/80 hover:text-white"
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
                <Zap className="size-4" /> Real-Time Solo Practice
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Test your code against sample cases directly in the sandbox editor without signing in. To submit your official solution, verify hidden edge cases, and earn global Elo rating points, log in or create a free account.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor + Runner & Submission */}
        <div className="w-full lg:w-1/2 flex flex-col bg-[#08090D] min-h-[500px]">
          {/* Editor Header */}
          <div className="h-10 border-b border-white/[0.08] bg-[#0E0E12] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Code2 className="size-3.5 text-white/40" />
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
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/30 hidden sm:inline">
                Docker Linux Sandbox
              </span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative w-full overflow-hidden min-h-[300px]">
            <Editor
              height="100%"
              language={selectedLang === "cpp" ? "cpp" : selectedLang === "python" ? "python" : selectedLang === "java" ? "java" : "javascript"}
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

          {/* Bottom Execution & Console Panel */}
          <div className="h-56 border-t border-white/[0.08] bg-[#0B0B0E] flex flex-col shrink-0">
            {/* Panel Tabs */}
            <div className="h-9 px-4 border-b border-white/[0.08] bg-[#0E0E12] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("examples")}
                  className={`text-[11px] font-mono font-medium tracking-wider uppercase transition-colors ${activeTab === "examples" ? "text-[#FF7A1A] border-b-2 border-[#FF7A1A] py-2" : "text-white/40 hover:text-white"}`}
                >
                  Sample Cases
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("console")}
                  className={`text-[11px] font-mono font-medium tracking-wider uppercase flex items-center gap-1.5 transition-colors ${activeTab === "console" ? "text-[#FF7A1A] border-b-2 border-[#FF7A1A] py-2" : "text-white/40 hover:text-white"}`}
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
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
              {activeTab === "examples" && (
                <div className="space-y-2">
                  <div className="flex gap-2 mb-2">
                    {examples.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveSampleIndex(i)}
                        className={`px-2.5 py-1 rounded text-[11px] transition-colors ${activeSampleIndex === i ? "bg-white/10 text-white font-semibold" : "bg-white/5 text-white/40 hover:text-white"}`}
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
                  className="h-8 px-3 text-xs font-mono border-white/20 hover:bg-white/5"
                >
                  {isRunning ? <Spinner className="size-3.5 mr-1.5" /> : <Play className="size-3.5 mr-1.5 text-emerald-400 fill-emerald-400" />}
                  Run Code
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-8 px-4 text-xs font-mono font-bold bg-[#FF7A1A] hover:bg-[#FF9040] text-black border-0"
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
                className="w-full h-10 rounded-full bg-[#FF7A1A] hover:bg-[#FF9040] text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogIn className="size-4" /> Log In
              </Link>
              <Link
                href={`/signup?redirect=/problems/${encodeURIComponent(slug)}`}
                className="w-full h-10 rounded-full border border-white/20 hover:border-white/40 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <UserPlus className="size-4" /> Create Free Account
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-white/40 hover:text-white pt-1 transition-colors"
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

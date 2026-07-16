"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { 
  ArrowLeft, 
  Code, 
  BookOpen, 
  Settings, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { api } from "@/lib/api";
import { Button, Badge, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

// Custom markdown inline formatting helper
function renderInlineFormatting(text: string): React.ReactNode[] {
  if (!text) return [];
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

// Custom simple markdown block renderer
function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.replace(/\\n/g, "\n").split("\n");
  
  let inCodeBlock = false;
  let codeLines: string[] = [];
  const renderedElements: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
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
    else if (/^([*+-]\s+|[*+-]$)/.test(trimmed)) {
      const text = trimmed.replace(/^[*+-]\s*/, "");
      renderedElements.push(
        <li key={i} className="list-disc ml-5 text-text-muted text-[13px] leading-relaxed my-0.5">
          {renderInlineFormatting(text)}
        </li>
      );
    } 
    else if (trimmed.length === 0) {
      renderedElements.push(<div key={i} className="h-1.5" />);
    } 
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

export default function AdminReviewEditorPage() {
  const router = useRouter();
  const { questionId } = useParams<{ questionId: string }>();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const versionParam = searchParams.get("version"); // "before" | "after"

  const [selectedLang, setSelectedLang] = useState<string>("javascript");
  const [editorCode, setEditorCode] = useState<string>("");
  const [activeVersion, setActiveVersion] = useState<"before" | "after" | "current">(
    versionParam === "before" || versionParam === "after" ? versionParam : "current"
  );

  // Fetch report details if reportId is passed
  const reportQuery = useQuery({
    queryKey: ["admin", "report", reportId],
    queryFn: () => api<any>(`/admin/reports/${reportId}`),
    enabled: Boolean(reportId),
  });

  // Fetch standard question details if reportId is NOT passed
  const questionQuery = useQuery({
    queryKey: ["admin", "question", questionId],
    queryFn: () => api<any>(`/admin/questions/${questionId}`),
    enabled: !reportId,
  });

  const isLoading = reportId ? reportQuery.isLoading : questionQuery.isLoading;
  const isError = reportId ? reportQuery.isError : questionQuery.isError;

  // Resolve question details based on layout/version selected
  const getQuestionData = () => {
    if (reportId && reportQuery.data?.data) {
      const rep = reportQuery.data.data;
      if (activeVersion === "before" && rep.questionSnapshotBefore) {
        return rep.questionSnapshotBefore;
      }
      if (activeVersion === "after" && rep.questionSnapshotAfter) {
        return rep.questionSnapshotAfter;
      }
      // fallback to current if snapshots missing
      return rep.reportedQuestion || {};
    }
    return questionQuery.data?.data || {};
  };

  const questionData = getQuestionData();
  const supportedLanguages = ["javascript", "python", "cpp", "java", "typescript"];

  // Update editor templates on load or language changes
  useEffect(() => {
    if (questionData?.templates) {
      const codeTemplates = questionData.templates;
      if (typeof codeTemplates === "string") {
        setEditorCode(codeTemplates);
      } else {
        const matchingCode = codeTemplates[selectedLang] || codeTemplates[selectedLang === "javascript" ? "js" : selectedLang === "python" ? "py" : selectedLang] || "";
        setEditorCode(matchingCode);
      }
    } else {
      setEditorCode("// No template starter code provided for this challenge.");
    }
  }, [questionData, selectedLang]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0b0c10] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner />
          <p className="text-text-muted text-sm font-medium">Loading review workspace...</p>
        </div>
      </div>
    );
  }

  if (isError || !questionData) {
    return (
      <div className="h-screen w-screen bg-[#0b0c10] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <AlertTriangle className="size-12 text-danger mx-auto" />
          <h2 className="text-lg font-bold text-text">Workspace Loading Failed</h2>
          <p className="text-text-muted text-xs">
            Could not fetch the requested challenge details or the corresponding moderation snapshots.
          </p>
          <Button variant="secondary" size="sm" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const statement = questionData.statement || {};

  return (
    <div className="h-screen w-screen bg-[#0b0c10] flex flex-col overflow-hidden text-text select-none">
      
      {/* Top Header Workspace Navigation */}
      <header className="h-14 border-b border-border bg-surface-2/45 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-surface-3 rounded-lg text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono font-bold text-primary tracking-wider bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
              Admin Sandbox
            </span>
            <span className="text-text-faint font-mono text-xs">/</span>
            <span className="text-sm font-bold text-text truncate max-w-xs md:max-w-md">
              Review: {questionData.title || "Untitled Challenge"}
            </span>
          </div>
        </div>

        {/* Snapshots Toggle selector for resolved reports */}
        <div className="flex items-center gap-4">
          {reportId && reportQuery.data?.data?.questionSnapshotBefore && (
            <div className="flex items-center bg-surface border border-border p-1 rounded-lg text-xs">
              <span className="text-[10px] uppercase font-bold text-text-faint px-2 font-mono">Version:</span>
              <button
                onClick={() => setActiveVersion("before")}
                className={cn(
                  "px-3 py-1 rounded-md font-semibold transition-all cursor-pointer text-xs",
                  activeVersion === "before"
                    ? "bg-danger text-white font-bold"
                    : "text-text-muted hover:text-text"
                )}
              >
                Original (Before)
              </button>
              <button
                onClick={() => setActiveVersion("after")}
                className={cn(
                  "px-3 py-1 rounded-md font-semibold transition-all cursor-pointer text-xs",
                  activeVersion === "after"
                    ? "bg-win text-white font-bold"
                    : "text-text-muted hover:text-text"
                )}
              >
                Corrected (After)
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-lg text-xs font-mono">
            <Settings className="size-3.5 text-text-faint animate-spin-slow" />
            <span className="text-text-muted">Review Mode</span>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Left Side: Question Details Pane */}
        <div className="w-[42%] border-r border-border bg-[#0d0e14] flex flex-col overflow-hidden">
          {/* Header Panel */}
          <div className="h-10 px-4 border-b border-border bg-surface-2/30 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-primary" /> Challenge Description
            </span>
            <Badge className="bg-surface-3 border border-border text-[10px] text-text-muted">
              {questionData.difficulty || "Casual"}
            </Badge>
          </div>

          {/* Statement Markdown Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
            
            {/* Version Specific Warning Banner */}
            {reportId && activeVersion === "before" && (
              <div className="p-3 border border-danger/35 bg-loss-subtle text-danger rounded-lg text-xs flex items-start gap-2.5 leading-normal">
                <AlertTriangle className="size-4.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Displaying Snapshot: Original (Before Fix)</span>
                  <p className="opacity-90 text-[11px] mt-0.5">This represents the incorrect challenge details reported by the player.</p>
                </div>
              </div>
            )}

            {reportId && activeVersion === "after" && (
              <div className="p-3 border border-win/35 bg-win-subtle text-win rounded-lg text-xs flex items-start gap-2.5 leading-normal">
                <CheckCircle2 className="size-4.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Displaying Snapshot: Corrected (After Fix)</span>
                  <p className="opacity-90 text-[11px] mt-0.5">This is the verified challenge updated by the AI moderator.</p>
                </div>
              </div>
            )}

            {/* Markdown Body */}
            {statement.markdown ? (
              <SimpleMarkdown content={statement.markdown} />
            ) : (
              <p className="text-text-muted text-xs italic">No description statement uploaded for this coding challenge.</p>
            )}

            {/* Formats and Details */}
            {statement.inputFormat && (
              <div className="space-y-1.5 border-t border-border/40 pt-4">
                <h4 className="text-[10px] font-bold text-text-faint uppercase font-mono tracking-wider">Input Format</h4>
                <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">{statement.inputFormat.replace(/\\n/g, "\n")}</p>
              </div>
            )}

            {statement.outputFormat && (
              <div className="space-y-1.5 border-t border-border/40 pt-4">
                <h4 className="text-[10px] font-bold text-text-faint uppercase font-mono tracking-wider">Output Format</h4>
                <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">{statement.outputFormat.replace(/\\n/g, "\n")}</p>
              </div>
            )}

            {questionData.constraints && questionData.constraints.length > 0 && (
              <div className="space-y-2 border-t border-border/40 pt-4">
                <h4 className="text-[10px] font-bold text-text-faint uppercase font-mono tracking-wider">Constraints</h4>
                <ul className="space-y-1">
                  {questionData.constraints.map((c: string, idx: number) => (
                    <li key={idx} className="list-disc ml-4 text-xs text-text-muted leading-relaxed">{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Code Editor Pane Workspace */}
        <div className="flex-1 bg-[#0b0c10] flex flex-col overflow-hidden">
          
          {/* Editor Header Toolbar */}
          <div className="h-10 px-4 border-b border-border bg-[#0d0e14] flex items-center justify-between shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Code className="size-3.5 text-primary" /> Starter Code Template
            </span>

            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-faint uppercase">Language:</span>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="h-7 bg-surface-2 border border-border rounded px-2.5 text-xs text-text focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "javascript" ? "JavaScript" : lang === "typescript" ? "TypeScript" : lang === "cpp" ? "C++" : lang === "java" ? "Java" : "Python"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative w-full overflow-hidden bg-[#090a0f] p-1 select-text">
            <Editor
              height="100%"
              language={selectedLang === "javascript" ? "javascript" : selectedLang === "typescript" ? "typescript" : selectedLang === "cpp" ? "cpp" : selectedLang === "java" ? "java" : "python"}
              theme="vs-dark"
              value={editorCode}
              onChange={(val) => setEditorCode(val || "")}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                automaticLayout: true,
                fontFamily: "var(--font-mono)",
                cursorBlinking: "smooth",
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Static Review Shell/Console box for aesthetics */}
          <div className="h-44 border-t border-border bg-[#08090d] flex flex-col overflow-hidden shrink-0">
            <div className="h-9 px-4 border-b border-border/80 bg-surface-2/15 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-faint flex items-center gap-1.5">
                <Terminal className="size-3" /> Sandbox Output
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] text-text-muted leading-relaxed whitespace-pre bg-[#050608]">
              <span className="text-text-faint">// DevWar Sandbox Sandbox Environment loaded successfully.</span>{"\n"}
              <span className="text-primary font-bold">MODE: </span> Admin Challenge Review & Preview{"\n"}
              <span className="text-primary font-bold">STATUS: </span> Verified sandbox, compiler connection not active in review mode.
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}

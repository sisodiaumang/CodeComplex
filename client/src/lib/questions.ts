import fs from "fs";
import path from "path";
import { API_URL } from "./api";

export type ProblemMode = "DSA" | "BUG_FIX" | "FRONTEND" | "BACKEND" | "PROMPT_WAR";

const API_URL_CANDIDATES = Array.from(
  new Set(
    [
      process.env.INTERNAL_API_URL,
      "http://backend:8000/api/v1",
      API_URL,
      "https://codecomplex.site/api/v1",
      "http://localhost:8000/api/v1",
    ].filter(Boolean) as string[]
  )
);

async function fetchFromBackendApi(endpoint: string, init?: RequestInit): Promise<Response | null> {
  for (const base of API_URL_CANDIDATES) {
    try {
      const url = `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
      const res = await fetch(url, init);
      if (res.ok) {
        return res;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

export interface QuestionSummary {
  _id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  subCategory?: string;
  mode: ProblemMode;
  tags?: string[];
  topics?: string[];
  estimatedTime?: number;
  metadata?: {
    estimatedTime?: number;
    points?: number;
    topics?: string[];
    tags?: string[];
  };
}

export interface QuestionDetail extends QuestionSummary {
  statement: {
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
  starterCode: Record<string, string>;
  buggyStarterCode?: Record<string, string>;
  functionSignature?: Record<string, string>;
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

let cachedSummaries: QuestionSummary[] | null = null;
const cachedDetailsMap = new Map<string, QuestionDetail>();

const MODE_FOLDERS: Array<{ folder: string; mode: ProblemMode }> = [
  { folder: "dsa", mode: "DSA" },
  { folder: "bug-fix", mode: "BUG_FIX" },
  { folder: "frontend", mode: "FRONTEND" },
  { folder: "backend", mode: "BACKEND" },
  { folder: "prompt-war", mode: "PROMPT_WAR" },
];

function getDbRootDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "../backendServer/src/db"),
    path.resolve(process.cwd(), "backendServer/src/db"),
    path.resolve(process.cwd(), "../../backendServer/src/db"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

function scanJsonFiles(dir: string): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(scanJsonFiles(full));
      } else if (item.name.endsWith(".json")) {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

export async function getAllQuestionsSummary(filterMode?: string): Promise<QuestionSummary[]> {
  if (!cachedSummaries) {
    // 1. Try backend API first
    try {
      const res = await fetchFromBackendApi("/questions?all=true", {
        next: { revalidate: 3600 },
      });
      if (res && res.ok) {
        const data = await res.json();
        if (data?.data?.questions?.length > 0) {
          cachedSummaries = data.data.questions.map((q: any) => ({
            _id: q._id,
            slug: q.slug || q._id,
            title: q.title,
            difficulty: q.difficulty || "Medium",
            category: q.category || q.topics?.[0] || "General",
            subCategory: q.subCategory,
            mode: (q.mode?.toUpperCase() === "BUG_FIX"
              ? "BUG_FIX"
              : q.mode?.toUpperCase() === "FRONTEND"
              ? "FRONTEND"
              : q.mode?.toUpperCase() === "BACKEND"
              ? "BACKEND"
              : q.mode?.toUpperCase() === "PROMPT_WAR"
              ? "PROMPT_WAR"
              : "DSA") as ProblemMode,
            tags: q.metadata?.tags || q.tags || [],
            topics: q.metadata?.topics || q.topics || [],
            estimatedTime: q.metadata?.estimatedTime || 20,
          }));
        }
      }
    } catch {
      // Fallback to disk
    }

    // 2. Fall back to scanning local db folders for all 5 modes
    if (!cachedSummaries || cachedSummaries.length === 0) {
      try {
        const dbRoot = getDbRootDir();
        const list: QuestionSummary[] = [];

        for (const { folder, mode } of MODE_FOLDERS) {
          const folderPath = path.join(dbRoot, folder);
          const files = scanJsonFiles(folderPath);

          for (const file of files) {
            try {
              const raw = fs.readFileSync(file, "utf8");
              const json = JSON.parse(raw);
              if (json._id && json.title) {
                const topics = json.topics || json.metadata?.topics || [json.category || "General"];
                list.push({
                  _id: json._id,
                  slug: json.slug || json._id,
                  title: json.title,
                  difficulty: json.difficulty || "Medium",
                  category: json.category || topics[0] || mode,
                  subCategory: json.subCategory || "",
                  mode: mode,
                  tags: json.tags || json.metadata?.tags || [],
                  topics: topics,
                  estimatedTime: json.metadata?.estimatedTime || (mode === "FRONTEND" ? 30 : 20),
                });
              }
            } catch {}
          }
        }

        cachedSummaries = list;
      } catch (err) {
        console.error("Error reading all questions from local disk:", err);
        cachedSummaries = [];
      }
    }
  }

  if (filterMode && filterMode !== "ALL") {
    const target = filterMode.toUpperCase();
    return (cachedSummaries || []).filter((q) => q.mode.toUpperCase() === target);
  }

  return cachedSummaries || [];
}

export const getAllQuestions = getAllQuestionsSummary;

export async function getQuestionBySlug(slugOrId: string): Promise<QuestionDetail | null> {
  const norm = String(slugOrId || "").trim().toLowerCase();
  if (cachedDetailsMap.has(norm)) {
    return cachedDetailsMap.get(norm)!;
  }

  // 1. Try backend API
  try {
    const res = await fetchFromBackendApi(`/questions/${encodeURIComponent(norm)}`, {
      next: { revalidate: 3600 },
    });
    if (res && res.ok) {
      const json = await res.json();
      if (json?.data) {
        const d = json.data;
        const detail: QuestionDetail = {
          _id: d._id,
          slug: d.slug || d._id,
          title: d.title,
          difficulty: d.difficulty || "Medium",
          category: d.category || d.topics?.[0] || "General",
          subCategory: d.subCategory,
          mode: (d.mode?.toUpperCase() === "BUG_FIX"
            ? "BUG_FIX"
            : d.mode?.toUpperCase() === "FRONTEND"
            ? "FRONTEND"
            : d.mode?.toUpperCase() === "BACKEND"
            ? "BACKEND"
            : d.mode?.toUpperCase() === "PROMPT_WAR"
            ? "PROMPT_WAR"
            : "DSA") as ProblemMode,
          tags: d.metadata?.tags || d.tags || [],
          topics: d.metadata?.topics || d.topics || [],
          estimatedTime: d.metadata?.estimatedTime,
          statement: typeof d.statement === "string" ? { markdown: d.statement } : d.statement || { markdown: d.scenario || "" },
          hints: d.hints,
          starterCode: d.starterCode || {},
          buggyStarterCode: d.buggyStarterCode,
          functionSignature: d.functionSignature || {},
          testCases: d.testCases || [],
          endpoints: d.endpoints,
          evaluationCriteria: d.evaluationCriteria,
        };
        cachedDetailsMap.set(norm, detail);
        return detail;
      }
    }
  } catch {
    // API not accessible
  }

  // 2. Fall back to scanning all 5 mode folders on disk
  try {
    const dbRoot = getDbRootDir();

    for (const { folder, mode } of MODE_FOLDERS) {
      const folderPath = path.join(dbRoot, folder);
      const files = scanJsonFiles(folderPath);

      for (const file of files) {
        try {
          const raw = fs.readFileSync(file, "utf8");
          const json = JSON.parse(raw);
          const matchSlug = String(json.slug || "").toLowerCase() === norm;
          const matchId = String(json._id || "").toLowerCase() === norm;
          const matchTitle =
            String(json.title || "").toLowerCase().replace(/[^a-z0-9]/g, "-") === norm;

          if (matchSlug || matchId || matchTitle) {
            let markdown = "";
            if (typeof json.statement === "string") {
              markdown = json.statement;
            } else if (json.statement?.markdown) {
              markdown = json.statement.markdown;
            } else if (json.scenario) {
              markdown = json.scenario;
            }

            const starter: Record<string, string> =
              typeof json.starterCode === "object" && json.starterCode !== null
                ? json.starterCode
                : mode === "PROMPT_WAR"
                ? { prompt: "# Enter your system and user prompt here to satisfy all criteria:\n" }
                : {};

            const detail: QuestionDetail = {
              _id: json._id,
              slug: json.slug || json._id,
              title: json.title,
              difficulty: json.difficulty || "Medium",
              category: json.category || json.topics?.[0] || mode,
              subCategory: json.subCategory || "",
              mode: mode,
              tags: json.tags || json.metadata?.tags || [],
              topics: json.topics || json.metadata?.topics || [],
              estimatedTime: json.metadata?.estimatedTime || (mode === "FRONTEND" ? 30 : 20),
              statement: {
                markdown,
                inputFormat: json.statement?.inputFormat,
                outputFormat: json.statement?.outputFormat,
                notes: json.statement?.notes,
                constraints: json.constraints || json.statement?.constraints || [],
                examples: json.statement?.examples || (json.visibleApiTestCases ? json.visibleApiTestCases.map((tc: any) => ({ input: `${tc.method} ${tc.path}`, output: JSON.stringify(tc.expectedBody || {}), explanation: tc.description })) : []),
              },
              hints: json.hints || [],
              starterCode: starter,
              buggyStarterCode: json.buggyStarterCode,
              functionSignature: json.functionSignature || {},
              testCases: (json.testCases || [])
                .filter((tc: any) => tc.isVisible)
                .map((tc: any) => ({
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  explanation: tc.explanation,
                })),
              endpoints: json.endpoints,
              evaluationCriteria: json.evaluationCriteria,
            };

            cachedDetailsMap.set(norm, detail);
            return detail;
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error("Error finding question in all mode folders:", err);
  }

  return null;
}

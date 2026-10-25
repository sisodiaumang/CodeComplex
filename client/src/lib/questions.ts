import fs from "fs";
import path from "path";
import { API_URL } from "./api";

export interface QuestionSummary {
  _id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  subCategory?: string;
  mode?: string;
  tags?: string[];
  topics?: string[];
  estimatedTime?: number;
}

export interface QuestionDetail extends QuestionSummary {
  statement: {
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
  starterCode: {
    cpp?: string;
    java?: string;
    python?: string;
    javascript?: string;
    go?: string;
  };
  functionSignature?: {
    cpp?: string;
    java?: string;
    python?: string;
    javascript?: string;
    go?: string;
  };
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string;
  }>;
}

let cachedSummaries: QuestionSummary[] | null = null;
const cachedDetailsMap = new Map<string, QuestionDetail>();

function findJsonFiles(dir: string): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(findJsonFiles(full));
    } else if (item.name.endsWith(".json")) {
      files.push(full);
    }
  }
  return files;
}

function getLocalQuestionsDir(): string {
  // Check client-relative or repo-root paths
  const candidates = [
    path.resolve(process.cwd(), "../backendServer/src/db/dsa/questions"),
    path.resolve(process.cwd(), "backendServer/src/db/dsa/questions"),
    path.resolve(process.cwd(), "../../backendServer/src/db/dsa/questions"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

export async function getAllQuestionsSummary(): Promise<QuestionSummary[]> {
  if (cachedSummaries && cachedSummaries.length > 0) {
    return cachedSummaries;
  }

  // 1. Try fetching from backend API if available
  try {
    const res = await fetch(`${API_URL}/questions?all=true`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.questions?.length > 0) {
        cachedSummaries = data.data.questions.map((q: any) => ({
          _id: q._id,
          slug: q.slug || q._id,
          title: q.title,
          difficulty: q.difficulty,
          category: q.category,
          subCategory: q.subCategory,
          mode: q.mode || "solve",
          tags: q.metadata?.tags || [],
          topics: q.metadata?.topics || [],
          estimatedTime: q.metadata?.estimatedTime || 20,
        }));
        return cachedSummaries!;
      }
    }
  } catch {
    // API unavailable (e.g. build time), fall back to disk
  }

  // 2. Fall back to local question files
  try {
    const dir = getLocalQuestionsDir();
    const files = findJsonFiles(dir);
    const list: QuestionSummary[] = [];

    for (const file of files) {
      try {
        const raw = fs.readFileSync(file, "utf8");
        const json = JSON.parse(raw);
        if (json._id && json.title) {
          list.push({
            _id: json._id,
            slug: json.slug || json._id,
            title: json.title,
            difficulty: json.difficulty || "Medium",
            category: json.category || "DSA",
            subCategory: json.subCategory || "",
            mode: json.mode || "solve",
            tags: json.metadata?.tags || [],
            topics: json.metadata?.topics || [],
            estimatedTime: json.metadata?.estimatedTime || 20,
          });
        }
      } catch {
        // Skip corrupt file
      }
    }

    cachedSummaries = list;
    return list;
  } catch (err) {
    console.error("Error reading local questions summary:", err);
    return [];
  }
}

export async function getQuestionBySlug(slugOrId: string): Promise<QuestionDetail | null> {
  const norm = String(slugOrId || "").trim().toLowerCase();
  if (cachedDetailsMap.has(norm)) {
    return cachedDetailsMap.get(norm)!;
  }

  // 1. Try backend API
  try {
    const res = await fetch(`${API_URL}/questions/${encodeURIComponent(norm)}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) {
        const q: QuestionDetail = {
          _id: json.data._id,
          slug: json.data.slug || json.data._id,
          title: json.data.title,
          difficulty: json.data.difficulty,
          category: json.data.category,
          subCategory: json.data.subCategory,
          mode: json.data.mode,
          tags: json.data.metadata?.tags || [],
          topics: json.data.metadata?.topics || [],
          estimatedTime: json.data.metadata?.estimatedTime,
          statement: json.data.statement,
          hints: json.data.hints,
          starterCode: json.data.starterCode || {},
          functionSignature: json.data.functionSignature || {},
          testCases: json.data.testCases || [],
        };
        cachedDetailsMap.set(norm, q);
        return q;
      }
    }
  } catch {
    // API not accessible
  }

  // 2. Fall back to local file search
  try {
    const dir = getLocalQuestionsDir();
    const files = findJsonFiles(dir);

    for (const file of files) {
      try {
        const raw = fs.readFileSync(file, "utf8");
        const json = JSON.parse(raw);
        const matchSlug = String(json.slug || "").toLowerCase() === norm;
        const matchId = String(json._id || "").toLowerCase() === norm;
        const matchTitle =
          String(json.title || "").toLowerCase().replace(/[^a-z0-9]/g, "-") === norm;

        if (matchSlug || matchId || matchTitle) {
          const detail: QuestionDetail = {
            _id: json._id,
            slug: json.slug || json._id,
            title: json.title,
            difficulty: json.difficulty || "Medium",
            category: json.category || "DSA",
            subCategory: json.subCategory || "",
            mode: json.mode || "solve",
            tags: json.metadata?.tags || [],
            topics: json.metadata?.topics || [],
            estimatedTime: json.metadata?.estimatedTime || 20,
            statement: json.statement || { markdown: "" },
            hints: json.hints || [],
            starterCode: json.starterCode || {},
            functionSignature: json.functionSignature || {},
            testCases: (json.testCases || [])
              .filter((tc: any) => tc.isVisible)
              .map((tc: any) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                explanation: tc.explanation,
              })),
          };
          cachedDetailsMap.set(norm, detail);
          return detail;
        }
      } catch {
        // Skip
      }
    }
  } catch (err) {
    console.error("Error finding question locally:", err);
  }

  return null;
}

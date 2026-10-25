import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import Question from "../models/question.model.js";
import FrontendQuestion from "../models/frontendQuestion.model.js";
import BackendQuestion from "../models/backendQuestion.model.js";
import PromptWarScenario from "../models/promptWarScenerio.model.js";
import { runLocally, normalizeOutput } from "../services/localRunner.service.js";
import * as judgeService from "../services/judge.service.js";
import { ensureDriverCode } from "./submission.controller.js";

const MODE_FOLDERS: Array<{ folder: string; mode: string }> = [
    { folder: "dsa", mode: "DSA" },
    { folder: "bug-fix", mode: "BUG_FIX" },
    { folder: "frontend", mode: "FRONTEND" },
    { folder: "backend", mode: "BACKEND" },
    { folder: "prompt-war", mode: "PROMPT_WAR" },
];

function getDbRootDir(): string {
    const candidates = [
        path.resolve(process.cwd(), "src/db"),
        path.resolve(process.cwd(), "dist/db"),
        path.resolve(process.cwd(), "../backendServer/src/db"),
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

// ─────────────────────────────────────────────
// GET /api/v1/questions — Public Question Catalog Across All Modes
// ─────────────────────────────────────────────
export const getPublicQuestions = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const {
            difficulty,
            category,
            search,
            mode = "ALL",
            page = "1",
            limit = "50",
            all,
        } = req.query;

        const targetMode = String(mode).toUpperCase();
        const isAll = all === "true";
        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = isAll ? 10000 : Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);

        // Try querying from MongoDB first
        let questions: any[] = [];
        let total = 0;

        const filter: any = { isDeleted: { $ne: true } };
        if (difficulty && ["Easy", "Medium", "Hard"].includes(String(difficulty))) {
            filter.difficulty = String(difficulty);
        }

        try {
            if (targetMode === "FRONTEND") {
                [questions, total] = await Promise.all([
                    FrontendQuestion.find(filter)
                        .select("_id title slug difficulty topics statement starterCode")
                        .sort({ difficulty: 1, title: 1 })
                        .lean(),
                    FrontendQuestion.countDocuments(filter),
                ]);
                questions = questions.map(q => ({ ...q, mode: "FRONTEND", category: q.topics?.[0] || "Frontend" }));
            } else if (targetMode === "BACKEND") {
                [questions, total] = await Promise.all([
                    BackendQuestion.find(filter)
                        .select("_id title slug difficulty topics statement endpoints starterCode")
                        .sort({ difficulty: 1, title: 1 })
                        .lean(),
                    BackendQuestion.countDocuments(filter),
                ]);
                questions = questions.map(q => ({ ...q, mode: "BACKEND", category: q.topics?.[0] || "Backend" }));
            } else if (targetMode === "PROMPT_WAR") {
                [questions, total] = await Promise.all([
                    PromptWarScenario.find(filter)
                        .select("_id title slug difficulty topics scenario targetArtifactType tags")
                        .sort({ difficulty: 1, title: 1 })
                        .lean(),
                    PromptWarScenario.countDocuments(filter),
                ]);
                questions = questions.map(q => ({ ...q, mode: "PROMPT_WAR", category: q.topics?.[0] || "Prompt War" }));
            } else if (targetMode === "BUG_FIX") {
                const bugFilter = { ...filter, mode: "bug_fix" };
                [questions, total] = await Promise.all([
                    Question.find(bugFilter)
                        .select("_id title slug difficulty category subCategory mode metadata")
                        .sort({ difficulty: 1, title: 1 })
                        .lean(),
                    Question.countDocuments(bugFilter),
                ]);
                questions = questions.map(q => ({ ...q, mode: "BUG_FIX" }));
            } else if (targetMode === "DSA") {
                const dsaFilter = { ...filter, mode: { $ne: "bug_fix" } };
                [questions, total] = await Promise.all([
                    Question.find(dsaFilter)
                        .select("_id title slug difficulty category subCategory mode metadata")
                        .sort({ difficulty: 1, title: 1 })
                        .lean(),
                    Question.countDocuments(dsaFilter),
                ]);
                questions = questions.map(q => ({ ...q, mode: "DSA" }));
            }
        } catch {}

        // Fallback or ALL modes: scan local file repository across all modes
        if (questions.length === 0 || targetMode === "ALL") {
            const dbRoot = getDbRootDir();
            const diskQuestions: any[] = [];

            const activeFolders = targetMode === "ALL"
                ? MODE_FOLDERS
                : MODE_FOLDERS.filter(f => f.mode === targetMode);

            for (const { folder, mode: fMode } of activeFolders) {
                const folderPath = path.join(dbRoot, folder);
                const files = scanJsonFiles(folderPath);

                for (const file of files) {
                    try {
                        const raw = fs.readFileSync(file, "utf8");
                        const json = JSON.parse(raw);
                        if (json._id && json.title) {
                            const topics = json.topics || json.metadata?.topics || [json.category || "General"];
                            diskQuestions.push({
                                _id: json._id,
                                slug: json.slug || json._id,
                                title: json.title,
                                difficulty: json.difficulty || "Medium",
                                category: json.category || topics[0] || fMode,
                                subCategory: json.subCategory || "",
                                mode: fMode,
                                tags: json.tags || json.metadata?.tags || [],
                                topics: topics,
                                estimatedTime: json.metadata?.estimatedTime || (fMode === "FRONTEND" ? 30 : 20),
                            });
                        }
                    } catch {}
                }
            }

            let filtered = diskQuestions;
            if (difficulty && ["Easy", "Medium", "Hard"].includes(String(difficulty))) {
                filtered = filtered.filter(q => q.difficulty === String(difficulty));
            }
            if (category) {
                const catUpper = String(category).toUpperCase();
                filtered = filtered.filter(q => q.category?.toUpperCase() === catUpper || (q.topics || []).some((t: string) => t.toUpperCase() === catUpper));
            }
            if (search && typeof search === "string" && search.trim()) {
                const term = search.trim().toLowerCase();
                filtered = filtered.filter(q =>
                    q.title.toLowerCase().includes(term) ||
                    q.slug.toLowerCase().includes(term) ||
                    q.category.toLowerCase().includes(term)
                );
            }

            total = filtered.length;
            const skip = (pageNum - 1) * limitNum;
            questions = isAll ? filtered : filtered.slice(skip, skip + limitNum);
        }

        res.status(200).json({
            success: true,
            data: {
                questions,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/questions/:identifier — Public Question Details Across All Modes
// ─────────────────────────────────────────────
export const getPublicQuestionBySlugOrId = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { identifier } = req.params;
        const normalized = String(identifier || "").trim().toLowerCase();

        if (!normalized) {
            res.status(400).json({ success: false, message: "Question identifier is required" });
            return;
        }

        const query: any = {
            $or: [{ slug: normalized }, { _id: normalized }],
            isDeleted: { $ne: true },
        };

        // Check DSA/Bug Fix
        let question: any = await Question.findOne(query).select("-solutions -editorial").lean();
        if (question) {
            const visibleTestCases = (question.testCases || [])
                .filter((tc: any) => tc.isVisible)
                .map((tc: any) => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    explanation: tc.explanation,
                }));
            res.status(200).json({
                success: true,
                data: {
                    ...question,
                    mode: question.mode === "bug_fix" ? "BUG_FIX" : "DSA",
                    testCases: visibleTestCases,
                },
            });
            return;
        }

        // Check Frontend
        const frontendQ: any = await FrontendQuestion.findOne(query).lean();
        if (frontendQ) {
            res.status(200).json({
                success: true,
                data: {
                    ...frontendQ,
                    mode: "FRONTEND",
                    category: frontendQ.topics?.[0] || "Frontend",
                },
            });
            return;
        }

        // Check Backend
        const backendQ: any = await BackendQuestion.findOne(query).select("-hiddenApiTestCases").lean();
        if (backendQ) {
            res.status(200).json({
                success: true,
                data: {
                    ...backendQ,
                    mode: "BACKEND",
                    category: backendQ.topics?.[0] || "Backend",
                    statement: {
                        markdown: backendQ.statement,
                        constraints: backendQ.constraints,
                        examples: (backendQ.visibleApiTestCases || []).map((tc: any) => ({
                            input: `${tc.method} ${tc.path}`,
                            output: JSON.stringify(tc.expectedBody || {}),
                            explanation: tc.description,
                        })),
                    },
                },
            });
            return;
        }

        // Check Prompt War
        const promptQ: any = await PromptWarScenario.findOne(query).lean();
        if (promptQ) {
            res.status(200).json({
                success: true,
                data: {
                    ...promptQ,
                    mode: "PROMPT_WAR",
                    category: promptQ.topics?.[0] || "Prompt War",
                    statement: {
                        markdown: promptQ.scenario,
                        constraints: promptQ.constraints,
                    },
                    starterCode: {
                        prompt: "# Enter your prompt instructions here to satisfy all criteria:\n",
                    },
                },
            });
            return;
        }

        // Fallback: search disk folders across all 5 modes
        const dbRoot = getDbRootDir();
        for (const { folder, mode } of MODE_FOLDERS) {
            const folderPath = path.join(dbRoot, folder);
            const files = scanJsonFiles(folderPath);

            for (const file of files) {
                try {
                    const raw = fs.readFileSync(file, "utf8");
                    const json = JSON.parse(raw);
                    const matchSlug = String(json.slug || "").toLowerCase() === normalized;
                    const matchId = String(json._id || "").toLowerCase() === normalized;

                    if (matchSlug || matchId) {
                        const statementMd = typeof json.statement === "string"
                            ? json.statement
                            : json.statement?.markdown || json.scenario || "";

                        const visibleTestCases = (json.testCases || [])
                            .filter((tc: any) => tc.isVisible)
                            .map((tc: any) => ({
                                input: tc.input,
                                expectedOutput: tc.expectedOutput,
                                explanation: tc.explanation,
                            }));

                        res.status(200).json({
                            success: true,
                            data: {
                                ...json,
                                mode,
                                statement: {
                                    markdown: statementMd,
                                    inputFormat: json.statement?.inputFormat,
                                    outputFormat: json.statement?.outputFormat,
                                    constraints: json.constraints || json.statement?.constraints || [],
                                    examples: json.statement?.examples || (json.visibleApiTestCases ? json.visibleApiTestCases.map((tc: any) => ({ input: `${tc.method} ${tc.path}`, output: JSON.stringify(tc.expectedBody || {}), explanation: tc.description })) : []),
                                },
                                testCases: visibleTestCases,
                                starterCode: json.starterCode || (mode === "PROMPT_WAR" ? { prompt: "# Enter your prompt instructions here:\n" } : {}),
                            },
                        });
                        return;
                    }
                } catch {}
            }
        }

        res.status(404).json({ success: false, message: "Question not found" });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/questions/:identifier/run — Public Sample Test Runner
// ─────────────────────────────────────────────
export const runSampleCode = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { identifier } = req.params;
        const { code, language } = req.body;

        if (!code || typeof code !== "string" || !code.trim()) {
            res.status(400).json({ success: false, message: "Source code is required" });
            return;
        }

        if (!language || typeof language !== "string") {
            res.status(400).json({ success: false, message: "Programming language is required" });
            return;
        }

        const normalizedId = String(identifier || "").trim().toLowerCase();
        const query: any = {
            $or: [{ slug: normalizedId }, { _id: normalizedId }],
            isDeleted: { $ne: true },
        };
        const question: any = await Question.findOne(query).lean();

        let sampleTestCases = (question?.testCases || [])
            .filter((tc: any) => tc.isVisible)
            .map((tc: any) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
            }));

        if (sampleTestCases.length === 0 && question?.statement?.examples?.length) {
            sampleTestCases = question.statement.examples.map((ex: any) => ({
                input: ex.input,
                expectedOutput: ex.output,
            }));
        }

        if (sampleTestCases.length === 0) {
            sampleTestCases = [{ input: "", expectedOutput: "" }];
        }

        const normLang = language.trim().toLowerCase();
        const driverCombinedCode = await ensureDriverCode(normLang, code, question?.slug || question?._id || normalizedId);

        const forceLocal = process.env.JUDGE_MODE === "local" || !process.env.JUDGE0_URL;
        const results = [];
        let allPassed = true;
        let compileError: string | null = null;

        if (forceLocal) {
            try {
                for (let i = 0; i < sampleTestCases.length; i++) {
                    const tc = sampleTestCases[i];
                    const localRes = await runLocally(normLang, driverCombinedCode, [tc]);

                    if (localRes.lastResult.status.id === 6) {
                        compileError = localRes.lastResult.compile_output || "Compilation Error";
                        allPassed = false;
                        break;
                    }

                    const actual = normalizeOutput(localRes.lastResult.stdout || "");
                    const expected = normalizeOutput(tc.expectedOutput);
                    const passed = actual === expected;

                    if (!passed) allPassed = false;

                    results.push({
                        testCaseIndex: i + 1,
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        actualOutput: actual,
                        passed,
                        time: localRes.lastResult.time || "0.01s",
                        status: localRes.lastResult.status.description,
                        stderr: localRes.lastResult.stderr || null,
                    });
                }
            } catch (err: any) {
                compileError = err.message || String(err);
                allPassed = false;
            }
        } else {
            // Judge0 runner
            try {
                const submissionLang = (normLang === "c++" || normLang === "cpp")
                    ? "CPP"
                    : normLang === "python" || normLang === "python3"
                    ? "PYTHON"
                    : normLang === "java"
                    ? "JAVA"
                    : "JAVASCRIPT";

                for (let i = 0; i < sampleTestCases.length; i++) {
                    const tc = sampleTestCases[i];
                    const judgeRes = await judgeService.run(submissionLang as any, driverCombinedCode, tc.input);

                    if (judgeRes.status.id === 6) {
                        compileError = judgeRes.compile_output || "Compilation Error";
                        allPassed = false;
                        break;
                    }

                    const actual = normalizeOutput(judgeRes.stdout || "");
                    const expected = normalizeOutput(tc.expectedOutput);
                    const passed = actual === expected;

                    if (!passed) allPassed = false;

                    results.push({
                        testCaseIndex: i + 1,
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        actualOutput: actual,
                        passed,
                        time: judgeRes.time ? `${judgeRes.time}s` : "0.02s",
                        status: judgeRes.status.description,
                        stderr: judgeRes.stderr || null,
                    });
                }
            } catch (err: any) {
                compileError = err.message || String(err);
                allPassed = false;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                compiled: !compileError,
                error: compileError,
                allPassed,
                results,
            },
        });
    } catch (error) {
        next(error);
    }
};

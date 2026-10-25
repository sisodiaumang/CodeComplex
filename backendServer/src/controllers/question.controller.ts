import { Request, Response, NextFunction } from "express";
import Question from "../models/question.model.js";
import { runLocally, normalizeOutput } from "../services/localRunner.service.js";
import * as judgeService from "../services/judge.service.js";
import { ensureDriverCode } from "./submission.controller.js";

// ─────────────────────────────────────────────
// GET /api/v1/questions — Public Question Catalog / Sitemap Feed
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
            mode = "solve",
            page = "1",
            limit = "50",
            all
        } = req.query;

        const query: any = {
            isDeleted: { $ne: true },
            "metadata.isPublished": { $ne: false },
        };

        if (mode) {
            query.mode = mode;
        }

        if (difficulty && ["Easy", "Medium", "Hard"].includes(String(difficulty))) {
            query.difficulty = String(difficulty);
        }

        if (category) {
            query.category = String(category).toUpperCase();
        }

        if (search && typeof search === "string" && search.trim()) {
            const term = search.trim();
            query.$or = [
                { title: { $regex: term, $options: "i" } },
                { slug: { $regex: term, $options: "i" } },
                { "metadata.tags": { $in: [new RegExp(term, "i")] } },
                { "metadata.topics": { $in: [new RegExp(term, "i")] } },
            ];
        }

        const isAll = all === "true";
        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = isAll
            ? 1000
            : Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);

        const skip = (pageNum - 1) * limitNum;

        const [questions, total] = await Promise.all([
            Question.find(query as any)
                .select("_id title slug difficulty category subCategory mode metadata.estimatedTime metadata.points metadata.topics metadata.tags analytics.totalSubmissions analytics.acceptedSubmissions createdAt")
                .sort({ difficulty: 1, title: 1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Question.countDocuments(query as any),
        ]);

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
// GET /api/v1/questions/:identifier — Public Question Details
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

        const queryByIdOrSlug: any = {
            $or: [{ slug: normalized }, { _id: normalized }],
            isDeleted: { $ne: true },
        };

        let question = await Question.findOne(queryByIdOrSlug)
            .select("-solutions -editorial")
            .lean();

        if (!question) {
            const queryByTitle: any = {
                title: { $regex: `^${normalized.replace(/-/g, " ")}$`, $options: "i" },
                isDeleted: { $ne: true },
            };
            question = await Question.findOne(queryByTitle)
                .select("-solutions -editorial")
                .lean();
        }

        if (!question) {
            res.status(404).json({ success: false, message: "Question not found" });
            return;
        }

        // Filter test cases: expose ONLY visible test cases to public / unauthenticated users
        const visibleTestCases = ((question as any).testCases || [])
            .filter((tc: any) => tc.isVisible)
            .map((tc: any) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                explanation: tc.explanation,
            }));

        const safeQuestion = {
            ...question,
            testCases: visibleTestCases,
        };

        res.status(200).json({
            success: true,
            data: safeQuestion,
        });
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

        if (!question) {
            res.status(404).json({ success: false, message: "Question not found" });
            return;
        }

        // Gather sample test cases (from visible test cases or examples)
        let sampleTestCases = (question.testCases || [])
            .filter((tc: any) => tc.isVisible)
            .map((tc: any) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
            }));

        if (sampleTestCases.length === 0 && question.statement?.examples?.length) {
            sampleTestCases = question.statement.examples.map((ex: any) => ({
                input: ex.input,
                expectedOutput: ex.output,
            }));
        }

        if (sampleTestCases.length === 0) {
            sampleTestCases = [{ input: "", expectedOutput: "" }];
        }

        const normLang = language.trim().toLowerCase();
        const driverCombinedCode = await ensureDriverCode(normLang, code, question.slug || question._id);

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

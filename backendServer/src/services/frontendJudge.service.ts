// ─────────────────────────────────────────────────────────────────────────
// frontendJudge.service.ts
//
// Judging engine for FRONTEND and FULLSTACK battles. Fundamentally
// different from both judge.service.ts (DSA/BUG_FIX — stdin/stdout diff
// via Judge0) and backendJudge.service.ts (BACKEND — Docker container +
// HTTP test runner):
//
//   Here the submission IS visual/interactive UI code. To grade it we:
//
//   1. Fetch the FrontendQuestion doc (gradingCriteria, judgeConfig,
//      referenceAssets, statement, scoring) for the match's questionSlug.
//   2. Build a structured judge prompt that includes:
//      - the problem statement
//      - the full submission source (HTML/CSS/JS or component code)
//      - reference asset URLs (design mockups/screenshots) as image blocks
//      - each grading criterion with its id, description, and weight
//   3. Call the xAI Grok API (grok-2-vision-1212 by default — vision-
//      capable, free tier available). The xAI API is OpenAI-compatible, so
//      this uses a plain fetch call to https://api.x.ai/v1/chat/completions.
//   4. Parse the structured JSON verdict: per-criterion scores, overall
//      weighted score, pass/fail against scoring.passingScore, brief
//      per-criterion feedback, and a one-line overall summary.
//   5. Return a FrontendJudgeRunResult that submission.service.ts persists
//      the same way as the backend/DSA paths (status, score,
//      passedTestCases / totalTestCases → criterion counts).
//
// ─────────────────────────────────────────────────────────────────────────
// ASSUMPTIONS — please confirm before relying on this in production:
//
// 1. XAI_API_KEY: must be set in environment. The client is lazy-init so a
//    missing key won't crash startup — the first FRONTEND submission will
//    error clearly instead.
//
// 2. SOURCE CODE FORMAT: for FRONTEND battles, submission.sourceCode is
//    expected to be either:
//      a) A raw string — plain HTML, JSX, a single component file, etc.
//      b) A JSON-stringified file map { "index.html": "...", "style.css": "..." }
//         matching the same shape backendJudge.service.ts uses for BACKEND.
//    Both are detected and normalised into a labelled listing before being
//    sent to Grok. If your frontend posts something else, only
//    flattenSourceCode() needs changing.
//
// 3. REFERENCE ASSETS AS VISION IMAGES: referenceAssets are passed as
//    image_url content blocks in the Grok message. They must be publicly
//    reachable URLs (e.g. S3/CDN). If a URL is invalid the image block is
//    skipped with a warning — judging never hard-fails due to a missing
//    reference asset.
//
// 4. GRADING CRITERION WEIGHTS: normalised to sum to 1.0 before computing
//    the weighted score. The FrontendQuestion model already enforces at least
//    one criterion (validator on gradingCriteria). If all weights are 0 the
//    score defaults to 0.
//
// 5. TOKEN BUDGET: source code is capped at SOURCE_CODE_CHAR_LIMIT chars
//    before sending. max_tokens on the response is set to 1024 — the JSON
//    verdict is compact. Raise it if the model truncates on large rubrics.
//
// 6. MODEL: grok-2-vision-1212 supports vision (image_url blocks). If xAI
//    releases a newer preferred model, change JUDGE_MODEL. The question's
//    judgeConfig.judgeModel overrides this per-question if set.
//
// 7. PROMPT_WAR: intentionally not handled here. PROMPT_WAR has its own
//    domain and question model (PromptWarScenario) — it needs a separate
//    service with a different rubric.
// ─────────────────────────────────────────────────────────────────────────

import FrontendQuestion from "../models/frontendQuestion.model.js";
import type { IFrontendGradingCriterion } from "../interfaces/frontendQuestion.interface.js";

// ── Constants ─────────────────────────────────────────────────────────────

const JUDGE_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Source code truncated at this limit before sending to the LLM.
// ~40k chars ≈ ~10k tokens — leaves headroom for prompt + image blocks.
const SOURCE_CODE_CHAR_LIMIT = 40_000;

// A criterion "passes" if its individual raw score meets this threshold.
// Used only for passedCriteria count; the real pass gate is the overall
// weighted score vs scoring.passingScore.
const CRITERION_PASS_THRESHOLD = 60;

// ── Public result types ───────────────────────────────────────────────────

export interface FrontendCriterionResult {
    id: string;
    description: string;
    weight: number;
    /** Raw score awarded by the LLM for this criterion, 0–100. */
    rawScore: number;
    /** Brief LLM-generated explanation of the score (1–2 sentences). */
    feedback: string;
}

export interface FrontendJudgeRunResult {
    /** Weighted overall score, 0–100. */
    score: number;
    /** true if score >= scoring.passingScore. */
    passed: boolean;
    /** Number of criteria that individually scored >= CRITERION_PASS_THRESHOLD. */
    passedCriteria: number;
    /** Total number of grading criteria. */
    totalCriteria: number;
    /** Per-criterion breakdown. */
    criteriaResults: FrontendCriterionResult[];
    /** Short overall summary from the LLM (1–3 sentences). */
    summary: string;
    /** Set if the LLM call itself failed — criteriaResults will be empty. */
    judgeError?: string;
}

// ── Internal types for the raw LLM verdict ────────────────────────────────

interface RawCriterionScore {
    id: string;
    score: number;
    feedback: string;
}

interface RawVerdict {
    criteriaScores: RawCriterionScore[];
    summary: string;
}

// ── xAI API helpers ───────────────────────────────────────────────────────

import { env } from "../config/env.js";

function getApiKey(): string {
    const key = env.GROQ_API_KEY || env.XAI_API_KEY;
    if (!key) {
        throw new Error(
            "[FrontendJudge] GROQ_API_KEY or XAI_API_KEY is not set. " +
            "Add it to your environment to enable FRONTEND/FULLSTACK judging."
        );
    }
    return key;
}

// OpenAI-compatible content block types used in the Grok request
type TextContentBlock = { type: "text"; text: string };
type ImageUrlContentBlock = { type: "image_url"; image_url: { url: string } };
type ContentBlock = TextContentBlock | ImageUrlContentBlock;

interface GrokMessage {
    role: "system" | "user" | "assistant";
    content: string | ContentBlock[];
}

interface GrokRequest {
    model: string;
    max_tokens: number;
    messages: GrokMessage[];
    temperature: number;
}

interface GrokResponse {
    choices: {
        message: {
            content: string;
        };
        finish_reason: string;
    }[];
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    };
    model?: string;
    error?: { message: string };
}

async function callGrok(request: GrokRequest): Promise<string> {
    const apiKey = getApiKey();

    const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(request),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
            `[FrontendJudge] Groq API request failed: ${res.status} ${res.statusText}` +
            (body ? ` — ${body.slice(0, 300)}` : "")
        );
    }

    const data = (await res.json()) as GrokResponse;

    if (data.error) {
        throw new Error(`[FrontendJudge] xAI API error: ${data.error.message}`);
    }

    // Log token usage asynchronously in the background
    if (data.usage) {
        import("../models/tokenUsage.model.js")
            .then(({ default: TokenUsage }) => {
                const promptTokens = data.usage?.prompt_tokens ?? 0;
                const completionTokens = data.usage?.completion_tokens ?? 0;
                const totalTokens = data.usage?.total_tokens ?? 0;
                const cost = (promptTokens * 5 + completionTokens * 15) / 1_000_000;

                TokenUsage.create({
                    promptTokens,
                    completionTokens,
                    totalTokens,
                    model: data.model || "grok-2",
                    feature: "FRONTEND",
                    cost,
                }).catch((e) => console.error("[TokenUsage] Failed to create record:", e));
            })
            .catch((e) => console.error("[TokenUsage] Failed to load model:", e));
    }

    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
        throw new Error("[FrontendJudge] xAI API returned an empty response");
    }

    return text;
}

// ── Source code normalisation ─────────────────────────────────────────────

/**
 * Normalises submission.sourceCode to a labelled multi-file listing string.
 * Handles:
 *   - JSON object map  { "path": "contents" }  (same as BACKEND submissions)
 *   - Raw string (plain HTML, single-file component, JSX, etc.)
 */
function flattenSourceCode(rawSourceCode: string): string {
    let result: string;

    try {
        const parsed = JSON.parse(rawSourceCode);

        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            const entries = Object.entries(parsed as Record<string, string>);
            result = entries
                .map(([filePath, contents]) => `=== ${filePath} ===\n${contents}`)
                .join("\n\n");
        } else {
            result = rawSourceCode;
        }
    } catch {
        // Not JSON — treat as a raw source string
        result = rawSourceCode;
    }

    if (result.length > SOURCE_CODE_CHAR_LIMIT) {
        result =
            result.slice(0, SOURCE_CODE_CHAR_LIMIT) +
            `\n\n[... TRUNCATED — submission exceeded ${SOURCE_CODE_CHAR_LIMIT} character limit ...]`;
    }

    return result;
}

// ── Prompt builders ───────────────────────────────────────────────────────

function buildSystemPrompt(): string {
    return `You are an expert frontend engineer and UI/UX evaluator acting as an automated code judge for a competitive programming platform.

Your task is to evaluate a frontend code submission against a set of weighted grading criteria and return a structured JSON verdict.

Rules:
- Score each criterion from 0 to 100 (integers only).
- Base scores strictly on the submitted code and any reference assets (design mockups/screenshots) provided.
- Be fair but rigorous — a score of 100 means the criterion is fully and correctly met.
- Keep per-criterion feedback concise: 1–2 sentences only.
- Keep the overall summary concise: 1–3 sentences only.
- You MUST respond with ONLY a valid JSON object matching the schema below — no preamble, no markdown fences, no explanation outside the JSON.

Response schema:
{
  "criteriaScores": [
    { "id": "<criterion id>", "score": <0-100 integer>, "feedback": "<1-2 sentence explanation>" }
  ],
  "summary": "<1-3 sentence overall assessment>"
}`;
}

function buildUserPromptText(params: {
    statement: string;
    sourceCode: string;
    criteria: IFrontendGradingCriterion[];
}): string {
    const { statement, sourceCode, criteria } = params;

    const criteriaList = criteria
        .map(
            (c, i) =>
                `${i + 1}. [id: "${c.id}"] ${c.description} (weight: ${c.weight})`
        )
        .join("\n");

    return `## Problem Statement

${statement}

## Grading Criteria

${criteriaList}

## Submission Source Code

\`\`\`
${sourceCode}
\`\`\`

Evaluate the submission against every criterion listed above and return your verdict as JSON.`;
}

// ── Build image content blocks ────────────────────────────────────────────

/**
 * Converts each reference asset URL to an image_url content block for
 * Grok's vision capability. Invalid URLs are logged and skipped — a missing
 * reference image degrades quality but never fails the judge run.
 */
function buildReferenceImageBlocks(
    referenceAssets: { url: string; caption?: string }[]
): ImageUrlContentBlock[] {
    const blocks: ImageUrlContentBlock[] = [];

    for (const asset of referenceAssets) {
        try {
            new URL(asset.url); // validate URL — bad DB entries shouldn't crash the judge
            blocks.push({
                type: "image_url",
                image_url: { url: asset.url },
            });
        } catch (err) {
            console.warn(
                `[FrontendJudge] Skipping invalid reference asset URL "${asset.url}": ` +
                (err instanceof Error ? err.message : String(err))
            );
        }
    }

    return blocks;
}

// ── Verdict parsing ───────────────────────────────────────────────────────

function parseVerdict(rawText: string): RawVerdict {
    // Strip accidental markdown fences if the model misbehaves
    const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

    let parsed: unknown;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error(
            `[FrontendJudge] LLM returned non-JSON. First 500 chars: ${cleaned.slice(0, 500)}`
        );
    }

    if (
        typeof parsed !== "object" ||
        parsed === null ||
        !Array.isArray((parsed as any).criteriaScores) ||
        typeof (parsed as any).summary !== "string"
    ) {
        throw new Error(
            `[FrontendJudge] LLM verdict missing required fields. Got: ` +
            JSON.stringify(parsed).slice(0, 500)
        );
    }

    const verdict = parsed as RawVerdict;

    // Clamp all scores defensively to [0, 100]
    verdict.criteriaScores = verdict.criteriaScores.map((cs) => ({
        ...cs,
        score: Math.max(0, Math.min(100, Math.round(Number(cs.score) || 0))),
        feedback: typeof cs.feedback === "string" ? cs.feedback : "",
    }));

    return verdict;
}

// ── Weighted score computation ────────────────────────────────────────────

function computeWeightedScore(
    criteria: IFrontendGradingCriterion[],
    scoreById: Map<string, number>
): number {
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = criteria.reduce((sum, c) => {
        const score = scoreById.get(c.id) ?? 0;
        return sum + (score * c.weight) / totalWeight;
    }, 0);

    return Math.round(weightedSum);
}

// ── Public entrypoint ─────────────────────────────────────────────────────

/**
 * Judges one FRONTEND or FULLSTACK submission against its question's
 * grading rubric using Grok as the LLM evaluator.
 *
 * Mirrors the contract of judgeBackendSubmission() so submission.service.ts
 * can treat this as a drop-in judge-engine:
 *  - Never throws — all failure paths return FrontendJudgeRunResult with
 *    judgeError set and score = 0 / passed = false.
 *  - passedCriteria / totalCriteria map to Submission.passedTestCases /
 *    totalTestCases (criterion count is the correct analogue for this domain).
 *
 * @param questionSlug  Match.questionSlug — resolved against FrontendQuestion
 * @param rawSourceCode Submission.sourceCode — HTML, JSX, or JSON file map
 */
export async function judgeFrontendSubmission(
    questionSlug: string,
    rawSourceCode: string
): Promise<FrontendJudgeRunResult> {

    // ── 1. Fetch question ────────────────────────────────────────────────
    const question = await FrontendQuestion.findOne({ slug: questionSlug })
        .select("statement gradingCriteria referenceAssets judgeConfig scoring")
        .lean<{
            statement: string;
            gradingCriteria: IFrontendGradingCriterion[];
            referenceAssets: { url: string; caption?: string }[];
            judgeConfig: { judgeModel?: string };
            scoring: { maxScore: number; passingScore: number };
        }>();

    if (!question) {
        return {
            score: 0,
            passed: false,
            passedCriteria: 0,
            totalCriteria: 0,
            criteriaResults: [],
            summary: "",
            judgeError: `[FrontendJudge] No frontend question found for slug "${questionSlug}"`,
        };
    }

    const { gradingCriteria, referenceAssets, scoring } = question;
    const totalCriteria = gradingCriteria.length;

    if (totalCriteria === 0) {
        return {
            score: 0,
            passed: false,
            passedCriteria: 0,
            totalCriteria: 0,
            criteriaResults: [],
            summary: "",
            judgeError: `[FrontendJudge] Question "${questionSlug}" has no grading criteria configured`,
        };
    }

    // ── 2. Normalise source code ──────────────────────────────────────────
    const sourceCode = flattenSourceCode(rawSourceCode);

    // ── 3. Build message content ──────────────────────────────────────────
    const imageBlocks = buildReferenceImageBlocks(referenceAssets ?? []);

    const userPromptText = buildUserPromptText({
        statement: question.statement,
        sourceCode,
        criteria: gradingCriteria,
    });

    // Interleave reference images after the text prompt so the model can
    // visually compare the submission against the design mockups while
    // evaluating the code.
    const userContent: ContentBlock[] = [
        { type: "text", text: userPromptText },
        ...imageBlocks,
    ];

    // ── 4. Call Grok ──────────────────────────────────────────────────────
    let rawText: string;
    try {
        // judgeConfig.judgeModel lets a specific question opt into a different
        // Grok model (e.g. a harder question might want a smarter model).
        const model = question.judgeConfig?.judgeModel ?? JUDGE_MODEL;

        rawText = await callGrok({
            model,
            max_tokens: 1024,
            temperature: 0,   // zero temp for deterministic scoring
            messages: [
                { role: "system", content: buildSystemPrompt() },
                { role: "user", content: userContent },
            ],
        });
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.error(`[FrontendJudge] xAI API call failed for "${questionSlug}":`, err);

        return {
            score: 0,
            passed: false,
            passedCriteria: 0,
            totalCriteria,
            criteriaResults: [],
            summary: "",
            judgeError: `LLM judge call failed: ${reason}`,
        };
    }

    // ── 5. Parse verdict ──────────────────────────────────────────────────
    let verdict: RawVerdict;
    try {
        verdict = parseVerdict(rawText);
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.error(`[FrontendJudge] Failed to parse verdict for "${questionSlug}":`, reason);

        return {
            score: 0,
            passed: false,
            passedCriteria: 0,
            totalCriteria,
            criteriaResults: [],
            summary: "",
            judgeError: `Failed to parse LLM verdict: ${reason}`,
        };
    }

    // ── 6. Build per-criterion results ────────────────────────────────────
    const scoreById = new Map(verdict.criteriaScores.map((cs) => [cs.id, cs.score]));
    const feedbackById = new Map(verdict.criteriaScores.map((cs) => [cs.id, cs.feedback]));

    const criteriaResults: FrontendCriterionResult[] = gradingCriteria.map((c) => ({
        id: c.id,
        description: c.description,
        weight: c.weight,
        rawScore: scoreById.get(c.id) ?? 0,
        feedback: feedbackById.get(c.id) ?? "Not evaluated",
    }));

    // ── 7. Compute weighted overall score ─────────────────────────────────
    const score = computeWeightedScore(gradingCriteria, scoreById);
    const passedCriteria = criteriaResults.filter(
        (r) => r.rawScore >= CRITERION_PASS_THRESHOLD
    ).length;
    const passed = score >= (scoring?.passingScore ?? 70);

    console.log(
        `[FrontendJudge] Verdict for "${questionSlug}": ` +
        `score=${score} (${passed ? "PASS" : "FAIL"}), ` +
        `criteria ${passedCriteria}/${totalCriteria}`
    );

    return {
        score,
        passed,
        passedCriteria,
        totalCriteria,
        criteriaResults,
        summary: verdict.summary,
    };
}
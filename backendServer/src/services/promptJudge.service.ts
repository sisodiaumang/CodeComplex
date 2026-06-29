// ─────────────────────────────────────────────────────────────────────────
// promptJudge.service.ts
//
// Judging engine for PROMPT_WAR battles.
//
// Artifact: the player submission is the *prompt text* (stored in
// submission.sourceCode in this codebase).
//
// Approach:
//  - Fetch PromptWarScenario by slug (questionSlug).
//  - Build a rubric prompt using:
//      * scenario + targetArtifactType + constraints
//      * evaluationCriteria (id, description, weight)
//      * judgeConfig.judgeModel
//  - Call xAI Grok (OpenAI-compatible) and request ONLY JSON.
//  - Parse verdict into per-criterion results + weighted overall score.
//  - Never throw to callers; failures return judgeError.
//
// NOTE: PROMPT_WAR comparisonMode (head_to_head vs absolute_score)
// isn't fully represented here because this service evaluates a single
// submission in isolation. If you want true head-to-head evaluation,
// the judge must accept both players' prompts.
// ─────────────────────────────────────────────────────────────────────────

import PromptWarScenario from "../models/promptWarScenerio.model.js";
import type {
    IPromptWarEvaluationCriterion,
    IPromptWarScenario,
} from "../interfaces/promptWarScenario.interface.js";

const JUDGE_MODEL_DEFAULT = "grok-2-vision-1212";
const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

const SOURCE_PROMPT_CHAR_LIMIT = 20_000;

export interface PromptWarCriterionResult {
    id: string;
    description: string;
    weight: number;
    rawScore: number; // 0-100
    feedback: string; // 1-2 sentences
}

export interface PromptWarJudgeRunResult {
    score: number; // weighted 0-100
    passed: boolean; // score >= passingScore (derived from maxScore/scoring)
    passedCriteria: number;
    totalCriteria: number;
    criteriaResults: PromptWarCriterionResult[];
    summary: string;
    judgeError?: string;
}

interface RawCriterionScore {
    id: string;
    score: number;
    feedback: string;
}

interface RawVerdict {
    criteriaScores: RawCriterionScore[];
    summary: string;
    weightedScore?: number; // optional; we still compute ourselves if absent
}

function getApiKey(): string {
    const key = process.env.XAI_API_KEY;
    if (!key) {
        throw new Error(
            "[PromptJudge] XAI_API_KEY is not set. Add it to environment to enable PROMPT_WAR judging."
        );
    }
    return key;
}

// OpenAI-compatible message blocks
type TextContentBlock = { type: "text"; text: string };
type ContentBlock = TextContentBlock;

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
        message: { content: string };
        finish_reason: string;
    }[];
    error?: { message: string };
}

async function callGrok(request: GrokRequest): Promise<string> {
    const apiKey = getApiKey();

    const res = await fetch(XAI_API_URL, {
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
            `[PromptJudge] xAI API request failed: ${res.status} ${res.statusText}` +
                (body ? ` — ${body.slice(0, 300)}` : "")
        );
    }

    const data = (await res.json()) as GrokResponse;

    if (data.error) {
        throw new Error(`[PromptJudge] xAI API error: ${data.error.message}`);
    }

    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
        throw new Error("[PromptJudge] xAI API returned an empty response");
    }

    return text;
}

function truncatePrompt(raw: string): string {
    if (raw.length <= SOURCE_PROMPT_CHAR_LIMIT) return raw;
    return (
        raw.slice(0, SOURCE_PROMPT_CHAR_LIMIT) +
        `\n\n[... TRUNCATED — submission exceeded ${SOURCE_PROMPT_CHAR_LIMIT} character limit ...]`
    );
}

function buildSystemPrompt(): string {
    return `You are an expert prompt engineer and automated judge.

Evaluate a PROMPT_WAR submission prompt against a scenario and rubric.

Return ONLY valid JSON matching this schema (no markdown fences):
{
  "criteriaScores": [
    { "id": "<criterion id>", "score": <0-100 integer>, "feedback": "<1-2 sentence feedback>" }
  ],
  "summary": "<1-3 sentence overall assessment>"
}`;
}

function buildUserPrompt(params: {
    scenario: IPromptWarScenario;
    submissionPrompt: string;
    criteria: IPromptWarEvaluationCriterion[];
}): string {
    const { scenario, submissionPrompt, criteria } = params;

    const criteriaList = criteria
        .map((c, i) =>
            `${i + 1}. [id: "${c.id}"] ${c.description} (weight: ${c.weight})`
        )
        .join("\n");

    return `## PROMPT WAR Scenario

Title: ${scenario.title}
Difficulty: ${scenario.difficulty}
Target artifact type: ${scenario.targetArtifactType}

Scenario:
${scenario.scenario}

Constraints:
${(scenario.constraints ?? []).length ? scenario.constraints.map((x) => `- ${x}`).join("\n") : "(none)"}

## Grading Criteria

${criteriaList}

## Player Submission (the prompt to evaluate)

"""
${submissionPrompt}
"""

Evaluate the submission against every criterion and return the verdict JSON.`;
}

function parseVerdict(rawText: string): RawVerdict {
    const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

    let parsed: unknown;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error(
            `[PromptJudge] LLM returned non-JSON. First 500 chars: ${cleaned.slice(0, 500)}`
        );
    }

    if (
        typeof parsed !== "object" ||
        parsed === null ||
        !Array.isArray((parsed as any).criteriaScores) ||
        typeof (parsed as any).summary !== "string"
    ) {
        throw new Error(
            `[PromptJudge] LLM verdict missing required fields. Got: ${JSON.stringify(
                parsed
            ).slice(0, 500)}`
        );
    }

    const verdict = parsed as RawVerdict;

    verdict.criteriaScores = verdict.criteriaScores.map((cs) => ({
        ...cs,
        score: Math.max(0, Math.min(100, Math.round(Number(cs.score) || 0))),
        feedback: typeof cs.feedback === "string" ? cs.feedback : "",
    }));

    return verdict;
}

function computeWeightedScore(
    criteria: IPromptWarEvaluationCriterion[],
    scoreById: Map<string, number>
): number {
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = criteria.reduce((sum, c) => {
        const s = scoreById.get(c.id) ?? 0;
        return sum + (s * c.weight) / totalWeight;
    }, 0);

    return Math.round(weightedSum);
}

export async function judgePromptWarSubmission(
    questionSlug: string,
    rawPrompt: string
): Promise<PromptWarJudgeRunResult> {
    try {
        const scenario = await PromptWarScenario.findOne({ slug: questionSlug })
            .select(
                "title slug difficulty scenario targetArtifactType constraints evaluationCriteria judgeConfig scoring battleConfig"
            )
            .lean<{
                title: string;
                slug: string;
                difficulty: string;
                scenario: string;
                targetArtifactType: string;
                constraints: string[];
                evaluationCriteria: IPromptWarEvaluationCriterion[];
                judgeConfig: { judgeModel?: string; comparisonMode: "head_to_head" | "absolute_score" };
                scoring: { maxScore: number };
                battleConfig: { enabled: boolean; timeBonus: boolean; maxBattleScore: number };
            }>();

        if (!scenario) {
            return {
                score: 0,
                passed: false,
                passedCriteria: 0,
                totalCriteria: 0,
                criteriaResults: [],
                summary: "",
                judgeError: `[PromptJudge] No prompt war scenario found for slug "${questionSlug}"`,
            };
        }

        const criteria = scenario.evaluationCriteria ?? [];
        const totalCriteria = criteria.length;

        if (totalCriteria === 0) {
            return {
                score: 0,
                passed: false,
                passedCriteria: 0,
                totalCriteria: 0,
                criteriaResults: [],
                summary: "",
                judgeError: `[PromptJudge] Scenario "${questionSlug}" has no evaluation criteria configured`,
            };
        }

        const submissionPrompt = truncatePrompt(rawPrompt ?? "");

        const judgeModel = scenario.judgeConfig?.judgeModel ?? JUDGE_MODEL_DEFAULT;

        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt({
            scenario: scenario as any,
            submissionPrompt,
            criteria,
        });

        const rawText = await callGrok({
            model: judgeModel,
            max_tokens: 1024,
            temperature: 0,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: [{ type: "text", text: userPrompt }] as ContentBlock[] },
            ],
        });

        const verdict = parseVerdict(rawText);

        const scoreById = new Map(verdict.criteriaScores.map((cs) => [cs.id, cs.score]));
        const feedbackById = new Map(verdict.criteriaScores.map((cs) => [cs.id, cs.feedback]));

        const criteriaResults: PromptWarCriterionResult[] = criteria.map((c) => ({
            id: c.id,
            description: c.description,
            weight: c.weight,
            rawScore: scoreById.get(c.id) ?? 0,
            feedback: feedbackById.get(c.id) ?? "Not evaluated",
        }));

        const score = computeWeightedScore(criteria, scoreById);

        // Per-criterion pass heuristic; overall pass gate is derived from scoring.
        const CRITERION_PASS_THRESHOLD = 60;
        const passedCriteria = criteriaResults.filter((r) => r.rawScore >= CRITERION_PASS_THRESHOLD)
            .length;

        const passingScore = 70; // default for 0-100 scoring; scoring.maxScore is informational here.
        const passed = score >= passingScore;

        return {
            score,
            passed,
            passedCriteria,
            totalCriteria,
            criteriaResults,
            summary: verdict.summary,
        };
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.error(`[PromptJudge] judgePromptWarSubmission failed:`, err);
        return {
            score: 0,
            passed: false,
            passedCriteria: 0,
            totalCriteria: 0,
            criteriaResults: [],
            summary: "",
            judgeError: reason,
        };
    }
}


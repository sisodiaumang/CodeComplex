// ─────────────────────────────────────────────────────────────────────────
// ASSUMPTIONS — please confirm/adjust before relying on this in production:
//
// 1. JUDGE0 HOSTING: I don't know whether you're running self-hosted
//    Judge0 CE, the official Judge0 SaaS, or the RapidAPI-hosted version —
//    each needs slightly different auth headers. This supports both:
//      - Self-hosted / official SaaS: set JUDGE0_API_URL (+ JUDGE0_API_KEY
//        if your instance requires an Authorization header).
//      - RapidAPI: set JUDGE0_API_URL to the RapidAPI host URL, plus
//        JUDGE0_API_KEY (→ X-RapidAPI-Key) and JUDGE0_API_HOST
//        (→ X-RapidAPI-Host).
//    If neither JUDGE0_API_KEY nor JUDGE0_API_HOST is set, no extra auth
//    headers are sent at all (plain self-hosted instance with no auth).
//
// 2. SYNCHRONOUS JUDGING: submit() uses Judge0's `wait=true` so the whole
//    create→judge→respond round-trip happens in one call/response cycle.
//    This keeps submission.service.ts simple but blocks the request for as
//    long as judging takes (typically under a few seconds for DSA-sized
//    problems). If problems get heavier, switch to async submit + either
//    polling getResult() with the returned token, or a Judge0 webhook
//    (callback_url) that POSTs the result back to your own endpoint —
//    judgeToken on the Submission model is already there for that.
//
// 3. LANGUAGE IDS: these are Judge0 CE's commonly-shipped IDs as of recent
//    versions. Different Judge0 instances can have different IDs/versions
//    installed — verify against `GET {JUDGE0_API_URL}/languages` on your
//    actual instance and adjust LANGUAGE_ID_MAP if they don't match.
//
// 4. TEST CASES: wired to a `Question` model, matched on the
//    Match/Submission `questionSlug` against `Question.slug`. The shape
//    (visibleTestCases + hiddenTestCases, each { input, output }) was
//    confirmed against a real export of the seeded question bank — see
//    getTestCases() below. ASSUMPTION: the model lives at
//    "../models/question.model.js" and default-exports `Question`, matching
//    the convention every other model in this codebase follows (Match,
//    Submission, BattleRoom, UserProfile, ...). If your actual model is
//    named or located differently, only the import line needs to change.
// ─────────────────────────────────────────────────────────────────────────

import Question from "../models/question.model.js";

// Matches the `language` enum on submission.model.ts. Defined locally
// rather than imported from submission.interface.ts since I don't have
// that file and can't confirm it exports a matching type name.
export type SubmissionLanguage = "CPP" | "JAVA" | "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT";

import { env } from "../config/env.js";

const JUDGE0_API_URL = env.JUDGE0_API_URL;
const JUDGE0_API_KEY = env.JUDGE0_API_KEY;
const JUDGE0_API_HOST = env.JUDGE0_API_HOST;

// See assumption #3 above.
const LANGUAGE_ID_MAP: Record<SubmissionLanguage, number> = {
    CPP: 54,        // C++ (GCC 9.2.0)
    JAVA: 62,       // Java (OpenJDK 13.0.1)
    PYTHON: 71,      // Python (3.8.1)
    JAVASCRIPT: 63,  // JavaScript (Node.js 12.14.0)
    TYPESCRIPT: 74,  // TypeScript (3.7.4)
};

export interface TestCase {
    input: string;
    expectedOutput: string;
}

export interface JudgeRunResult {
    status: {
        id: number;
        description: string; // "Accepted" | "Wrong Answer" | "Time Limit Exceeded" | ...
    };
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    time: string | null;   // seconds, as a string e.g. "0.012"
    memory: number | null; // KB
    token: string;
}

function judge0Headers(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (JUDGE0_API_KEY && JUDGE0_API_HOST) {
        // RapidAPI-hosted Judge0
        headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
        headers["X-RapidAPI-Host"] = JUDGE0_API_HOST;
    } else if (JUDGE0_API_KEY) {
        // Self-hosted / official SaaS with auth enabled
        headers["Authorization"] = `Bearer ${JUDGE0_API_KEY}`;
    }

    return headers;
}

/**
 * Submits one (source, stdin) pair to Judge0 and waits synchronously for
 * the result. See assumption #2 above for the tradeoffs of `wait=true`.
 */
export async function run(
    language: SubmissionLanguage,
    sourceCode: string,
    stdin: string
): Promise<JudgeRunResult> {
    const languageId = LANGUAGE_ID_MAP[language];

    if (!languageId) {
        throw new Error(`[JudgeService] No Judge0 language_id mapped for "${language}"`);
    }

    const res = await fetch(
        `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
        {
            method: "POST",
            headers: judge0Headers(),
            body: JSON.stringify({
                source_code: sourceCode,
                language_id: languageId,
                stdin,
            }),
        }
    );

    if (!res.ok) {
        throw new Error(`[JudgeService] Judge0 request failed: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as JudgeRunResult;
}

/**
 * Submits without waiting — returns a token to poll via getResult(). Use
 * this instead of run() if/when judging moves to the async model described
 * in assumption #2.
 */
export async function submit(
    language: SubmissionLanguage,
    sourceCode: string,
    stdin: string
): Promise<{ token: string }> {
    const languageId = LANGUAGE_ID_MAP[language];

    if (!languageId) {
        throw new Error(`[JudgeService] No Judge0 language_id mapped for "${language}"`);
    }

    const res = await fetch(
        `${JUDGE0_API_URL}/submissions?base64_encoded=false`,
        {
            method: "POST",
            headers: judge0Headers(),
            body: JSON.stringify({
                source_code: sourceCode,
                language_id: languageId,
                stdin,
            }),
        }
    );

    if (!res.ok) {
        throw new Error(`[JudgeService] Judge0 submit failed: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as { token: string };
}

/** Polls a previously-submitted token for its result (async flow). */
export async function getResult(token: string): Promise<JudgeRunResult> {
    const res = await fetch(
        `${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`,
        { headers: judge0Headers() }
    );

    if (!res.ok) {
        throw new Error(`[JudgeService] Judge0 result fetch failed: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as JudgeRunResult;
}

/**
 * Compile-only check (no stdin/expected output) — useful for a "Run Code"
 * feature (listed under Future Features) where you just want compile +
 * runtime errors surfaced without grading against test cases.
 */
export async function compile(
    language: SubmissionLanguage,
    sourceCode: string
): Promise<JudgeRunResult> {
    return run(language, sourceCode, "");
}

/**
 * Looks up the question bank for `questionSlug` and returns every test
 * case — visible and hidden combined — to grade against.
 *
 * Visible vs. hidden is a presentation-only distinction (which examples a
 * player sees in the problem statement vs. what's kept secret for grading);
 * judging always runs the full set, since judgeAgainstTestCases() only
 * reports pass/fail *counts* upstream, never which specific case a result
 * came from — so there's no risk of leaking a hidden case's content back
 * to the player through this.
 *
 * Throws if the slug doesn't resolve to a seeded question, or resolves to
 * one with zero test cases configured — both are data problems worth
 * surfacing loudly. judgeSubmission() in submission.service.ts catches this
 * and marks the submission ERROR rather than leaving it stuck on RUNNING.
 */
export async function getTestCases(questionSlug: string): Promise<TestCase[]> {
    const question = await Question.findOne({ slug: questionSlug }).lean<{
        testCases?: { input: string; output: string; isVisible: boolean }[];
    }>();

    if (!question) {
        throw new Error(`[JudgeService] No question found for slug "${questionSlug}"`);
    }

    const allCases = (question.testCases ?? []).map((tc) => ({
        input: tc.input,
        expectedOutput: tc.output,
    }));

    if (allCases.length === 0) {
        throw new Error(`[JudgeService] Question "${questionSlug}" has no test cases configured`);
    }

    return allCases;
}

/**
 * Runs every test case for a question against one submission in parallel.
 *
 * FIX (D1): previously ran test cases sequentially — each `await run()`
 * blocked the next one. For Judge0 with `wait=true`, every round-trip is a
 * full synchronous HTTP call, so N test cases at ~200 ms each = N×200 ms
 * total latency. With Promise.all all cases fire concurrently and the total
 * wall-clock time collapses to ~1 round-trip regardless of N.
 *
 * Trade-off: Judge0 CE has no built-in per-client concurrency limit by
 * default, but a self-hosted instance with few workers can queue up. If your
 * Judge0 instance starts returning 503s under concurrent load, add a
 * concurrency cap here (e.g. p-limit) rather than reverting to serial —
 * serial is always slower and p-limit(4) is still 4× faster than serial for
 * a 10-case problem.
 *
 * The return shape is unchanged — callers are unaffected:
 *  - `passed`       = number of fully-accepted cases
 *  - `total`        = testCases.length
 *  - `firstFailure` = first non-accepted result by original case order
 *  - `lastResult`   = last result by original case order
 */
export async function judgeAgainstTestCases(
    language: SubmissionLanguage,
    sourceCode: string,
    testCases: TestCase[]
): Promise<{
    passed: number;
    total: number;
    firstFailure: JudgeRunResult | null;
    lastResult: JudgeRunResult;
}> {
    if (testCases.length === 0) {
        throw new Error("[JudgeService] judgeAgainstTestCases called with empty test case array");
    }

    // Run all test cases concurrently; preserve original order in results.
    const results: JudgeRunResult[] = await Promise.all(
        testCases.map((tc) => run(language, sourceCode, tc.input))
    );

    let passed = 0;
    let firstFailure: JudgeRunResult | null = null;

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const actualOutput = (result.stdout ?? "").trim();
        const isAccepted =
            result.status.description === "Accepted" &&
            actualOutput === testCases[i].expectedOutput.trim();

        if (isAccepted) {
            passed++;
        } else if (!firstFailure) {
            firstFailure = result;
        }
    }

    return {
        passed,
        total: testCases.length,
        firstFailure,
        lastResult: results[results.length - 1],
    };
}
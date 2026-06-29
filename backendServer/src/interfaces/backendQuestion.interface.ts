import { Document } from "mongoose";

// ─────────────────────────────────────────────────────────────────────────
// Backend battleType questions. Per the platform owner: the player is
// given a spec, builds/submits a backend, and grading happens by making
// real HTTP calls against the running submission and checking the
// responses — fundamentally different from DSA's stdin/stdout Judge0 flow,
// which is why this is a separate model rather than a field bolted onto
// question.model.ts.
//
// ASSUMPTION (flagging clearly — this wasn't fully specified): grading a
// backend submission means something has to actually *run* it as a live
// server before any apiTestCases can be fired at it. That's a runtime
// concern (a backendJudge.service.ts equivalent to judge.service.ts, likely
// needing containerized execution rather than Judge0, which only compiles
// + runs a single program against stdin/stdout) — out of scope here, this
// file is only the question-bank content shape. `judgeConfig` below
// carries the metadata that runtime would need (how to boot the
// submission, which port to hit, how long to wait).
// ─────────────────────────────────────────────────────────────────────────

export type BackendQuestionDifficulty = "Easy" | "Medium" | "Hard";

// Same reasoning as QuestionLanguageKey in question.interface.ts — open
// string, not a strict union, so the supported stack list can grow without
// a schema migration. Expect values like "nodejs" | "python" | "java" etc.
export type BackendStackKey = string;

export type BackendQuestionMode = "solve" | "bug_fix";

export type BackendHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Purely descriptive — documents what the player is expected to build, for
// rendering in the problem statement UI. Not used for grading; apiTestCases
// is what's actually graded against.
export interface IBackendEndpointSpec {
    method: BackendHttpMethod;
    path: string;
    description: string;
}

export interface IBackendApiTestCase {
    id: string;
    method: BackendHttpMethod;
    path: string; // e.g. "/api/users/42" — fully resolved, no path-param placeholders
    headers?: Record<string, string>;
    body?: unknown; // JSON-serializable request payload; omit for GET/DELETE etc.

    expectedStatus: number;

    // Exactly one of these should usually be set. expectedBody is a strict
    // deep-equality check; expectedBodySchema is for "structurally correct
    // but values are non-deterministic" cases (timestamps, generated ids).
    // ASSUMPTION: schema format itself (e.g. JSON Schema vs. something
    // simpler) isn't pinned down — left as `unknown` for the actual
    // grading runtime to interpret once that's built.
    expectedBody?: unknown;
    expectedBodySchema?: unknown;

    isVisible: boolean;
}

export interface IBackendJudgeConfig {
    // Per-request timeout once the server is up and a test case is fired.
    requestTimeoutMs: number;
    // How long to wait for the submission to boot before the first request
    // is attempted (e.g. "npm start" finishing, port becoming reachable).
    startupTimeoutMs: number;
    // Optional cheap endpoint to poll for "the server is actually ready"
    // before running apiTestCases — avoids racing the first real test case
    // against server startup.
    healthCheckPath?: string;
    // The port the harness will connect to. Submissions are expected to
    // read this from an env var (commonly PORT) rather than hardcoding it.
    port: number;
    stack: BackendStackKey[];
}

export interface IBackendScoring {
    type: "binary" | "partial";
    maxScore: number;
    partialScoring: boolean;
}

export interface IBackendBattleConfig {
    enabled: boolean;
    timeBonus: boolean;
    maxBattleScore: number;
}

export interface IBackendTestCaseDistribution {
    visible: number;
    hidden: number;
    total: number;
}

export interface IBackendQuestion extends Document<string> {
    title: string;
    slug: string;
    difficulty: BackendQuestionDifficulty;
    topics: string[];
    statement: string;
    constraints: string[];
    endpoints: IBackendEndpointSpec[];

    mode: BackendQuestionMode;

    starterCode: Record<BackendStackKey, string>;
    // Only meaningful when mode === "bug_fix" — see question.interface.ts's
    // QuestionMode comment for the equivalent DSA reasoning; same pattern
    // here. Enforced by the model's pre('validate') hook, not `required`.
    buggyStarterCode?: Record<BackendStackKey, string>;

    judgeConfig: IBackendJudgeConfig;
    scoring: IBackendScoring;
    battleConfig: IBackendBattleConfig;

    visibleApiTestCases: IBackendApiTestCase[];
    hiddenApiTestCases: IBackendApiTestCase[];

    // Derived/read-only — recomputed on every save from the actual array
    // lengths, same drift-guard pattern as question.model.ts.
    testCaseDistribution: IBackendTestCaseDistribution;

    tags: string[];

    createdAt: Date;
    updatedAt: Date;
}
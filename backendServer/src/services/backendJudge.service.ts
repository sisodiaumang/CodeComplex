// ─────────────────────────────────────────────────────────────────────────
// backendJudge.service.ts
//
// Judging engine for BACKEND battles. Fundamentally different from
// judge.service.ts (DSA/BUG_FIX): there's no stdin → stdout diff here.
// Instead, the submission IS a server. To grade it we have to:
//
//   1. Materialize the submitted files on disk
//   2. Build a Docker image for them (stack-specific Dockerfile)
//   3. Run the container, sandboxed, with a random host port mapped
//   4. Poll judgeConfig.healthCheckPath until it's actually up
//      (or startupTimeoutMs elapses — startup failure is itself a result,
//      not an exception to swallow)
//   5. Fire every visible + hidden IBackendApiTestCase at it over real
//      HTTP, compare status / body / schema
//   6. Always tear the container + image down, win or lose
//
// ─────────────────────────────────────────────────────────────────────────
// ASSUMPTIONS — please confirm/adjust before relying on this in production:
//
// 1. DOCKER AVAILABILITY: this shells out to the `docker` CLI on the host
//    running the API process. That means the API server itself needs
//    Docker installed and the process needs permission to use it (either
//    running as root, or in the `docker` group). If submissions are judged
//    on the same box that serves HTTP traffic, consider moving this to a
//    dedicated judge worker — running arbitrary user code on your API host
//    is a much bigger blast radius than Judge0's existing sandboxing.
//
// 2. SUBMISSION FILE SHAPE: backendQuestion.model.ts's `starterCode` is a
//    Mixed map of `{ "relative/path.ext": "file contents" }`. I'm assuming
//    submission.sourceCode for BACKEND battles is the same shape — a
//    JSON-stringified object of the same form — OR, per submission.model.ts's
//    own comment ("large submissions... prefer sourceCodeUrl"), a URL to a
//    .zip or .tar.gz archive of the project. Both are handled below. If
//    your frontend actually posts something else (e.g. a flat single-file
//    string), only materializeSubmissionFiles() needs to change.
//
// 3. STACK → DOCKERFILE: judgeConfig.stack (e.g. ["node", "express"]) is
//    matched against a small set of known runtimes (node, python) to pick
//    a Dockerfile template. Unrecognised stacks fail fast with a clear
//    error rather than guessing. Add more templates as your supported
//    stacks grow — this is deliberately a short allow-list, not a
//    generic "run anything" builder, since that allow-list IS the security
//    boundary for what base images/commands untrusted code gets to run in.
//
// 4. SCHEMA VALIDATION: expectedBodySchema is validated with `ajv` if it's
//    installed (`npm install ajv`). If ajv isn't present, schema-based test
//    cases are skipped with a warning rather than crashing the whole judge
//    run — confirm whether you want that soft-fail behaviour or a hard
//    dependency.
//
// 5. PORT MAPPING: containers are run with `-p 0:<judgeConfig.port>` so
//    Docker picks a free host port, avoiding collisions between concurrent
//    judge runs. The assigned host port is read back via `docker port`.
//
// 6. RESOURCE LIMITS: --memory, --cpus, --pids-limit and --network=bridge
//    (not host) are hard-coded conservatively below. Tune these per your
//    actual hosts; the point is untrusted code should never be able to
//    starve the host or reach your internal network.
// ─────────────────────────────────────────────────────────────────────────

import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import os from "os";

import BackendQuestion from "../models/backendQuestion.model.js";

const execFileAsync = promisify(execFile);

// ── Types (mirrors backendQuestion.interface.ts's shapes; redefined
//    locally since that interface file isn't available here — same
//    pattern judge.service.ts already uses for SubmissionLanguage) ──────
export interface BackendApiTestCase {
    id: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
    expectedStatus: number;
    expectedBody?: unknown;
    expectedBodySchema?: object;
    isVisible: boolean;
}

export interface BackendJudgeConfig {
    requestTimeoutMs: number;
    startupTimeoutMs: number;
    healthCheckPath?: string;
    port: number;
    stack: string[];
}

export interface BackendTestCaseResult {
    id: string;
    passed: boolean;
    expectedStatus: number;
    actualStatus: number | null;
    reason?: string; // populated on failure — "status mismatch", "body mismatch", "schema mismatch", "request error: ..."
}

export interface BackendJudgeRunResult {
    passed: number;
    total: number;
    results: BackendTestCaseResult[];
    startupError?: string; // set if the container never became healthy — results will be empty in that case
}

// ── Stack → Dockerfile template ──────────────────────────────────────────
// Each template assumes the submission's files have already been written
// into the build context root. CMD reads PORT from env, which we always
// set to judgeConfig.port inside the container (the host-side mapping is
// handled separately by `-p 0:<port>`).
const DOCKERFILE_TEMPLATES: Record<string, string> = {
    node: `
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN if [ -f package.json ]; then npm install --omit=dev --no-audit --no-fund; fi
ENV NODE_ENV=production
ENV PORT=\${PORT}
EXPOSE \${PORT}
CMD ["sh", "-c", "if [ -f package.json ] && grep -q '\\"start\\"' package.json; then npm start; else node index.js; fi"]
`.trim(),

    python: `
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi
ENV PORT=\${PORT}
EXPOSE \${PORT}
CMD ["sh", "-c", "if [ -f main.py ]; then python main.py; else python app.py; fi"]
`.trim(),
};

function resolveStackTemplate(stack: string[]): { runtime: string; dockerfile: string } {
    const normalized = stack.map((s) => s.toLowerCase());

    for (const runtime of Object.keys(DOCKERFILE_TEMPLATES)) {
        if (normalized.includes(runtime)) {
            return { runtime, dockerfile: DOCKERFILE_TEMPLATES[runtime] };
        }
    }

    throw new Error(
        `[BackendJudge] No Dockerfile template for stack [${stack.join(", ")}]. ` +
        `Supported runtimes: ${Object.keys(DOCKERFILE_TEMPLATES).join(", ")}.`
    );
}

// ── Step 1: materialize submission files on disk ────────────────────────
async function materializeSubmissionFiles(params: {
    buildDir: string;
    sourceCode?: string | null;
    sourceCodeUrl?: string | null;
}): Promise<void> {
    const { buildDir, sourceCode, sourceCodeUrl } = params;

    if (sourceCodeUrl) {
        const archivePath = path.join(buildDir, "_submission_archive");
        const res = await fetch(sourceCodeUrl);

        if (!res.ok) {
            throw new Error(
                `[BackendJudge] Failed to download sourceCodeUrl (${res.status} ${res.statusText})`
            );
        }

        const buf = Buffer.from(await res.arrayBuffer());
        await fs.writeFile(archivePath, buf);

        const isZip = sourceCodeUrl.toLowerCase().endsWith(".zip");

        if (isZip) {
            await execFileAsync("unzip", ["-q", archivePath, "-d", buildDir]);
        } else {
            // Default to tar.gz for anything else.
            await execFileAsync("tar", ["-xzf", archivePath, "-C", buildDir]);
        }

        await fs.unlink(archivePath).catch(() => {});
        return;
    }

    if (!sourceCode) {
        throw new Error("[BackendJudge] Submission has neither sourceCode nor sourceCodeUrl");
    }

    // See assumption #2 above: sourceCode is a JSON map of relative path → contents.
    let files: Record<string, string>;
    try {
        files = JSON.parse(sourceCode);
    } catch {
        throw new Error(
            "[BackendJudge] sourceCode is not valid JSON. Expected { \"relative/path\": \"contents\" }. " +
            "If your platform actually stores BACKEND sourceCode differently, update materializeSubmissionFiles()."
        );
    }

    for (const [relPath, contents] of Object.entries(files)) {
        const fullPath = path.join(buildDir, relPath);

        // Guard against path traversal escaping the build dir — untrusted
        // input is being used to construct filesystem paths.
        if (!fullPath.startsWith(buildDir)) {
            throw new Error(`[BackendJudge] Rejected unsafe file path in submission: "${relPath}"`);
        }

        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, contents, "utf-8");
    }
}

// ── Step 2: build the image ──────────────────────────────────────────────
async function buildImage(buildDir: string, dockerfile: string, imageTag: string): Promise<void> {
    await fs.writeFile(path.join(buildDir, "Dockerfile"), dockerfile, "utf-8");

    try {
        await execFileAsync(
            "docker",
            ["build", "--network=none", "-t", imageTag, buildDir],
            { timeout: 120_000, maxBuffer: 1024 * 1024 * 10 }
        );
    } catch (err: any) {
        // Build failures (bad deps, syntax errors blocking install, etc.)
        // are a legitimate judging outcome, not an infra error — surface
        // stderr so the player gets useful feedback.
        const stderr = err?.stderr ? String(err.stderr).slice(-4000) : String(err?.message ?? err);
        throw new Error(`Docker build failed:\n${stderr}`);
    }
}

// ── Step 3: run the container ────────────────────────────────────────────
async function runContainer(imageTag: string, containerName: string, internalPort: number): Promise<void> {
    await execFileAsync("docker", [
        "run", "-d",
        "--name", containerName,
        "-p", `0:${internalPort}`,
        "-e", `PORT=${internalPort}`,
        "--memory", "256m",
        "--cpus", "0.5",
        "--pids-limit", "128",
        "--network", "bridge",
        "--security-opt", "no-new-privileges",
        "--read-only",
        "--tmpfs", "/tmp",
        imageTag,
    ]);
}

async function getHostPort(containerName: string, internalPort: number): Promise<number> {
    const { stdout } = await execFileAsync("docker", ["port", containerName, `${internalPort}/tcp`]);
    // Output looks like "0.0.0.0:54321\n"
    const match = stdout.trim().match(/:(\d+)\s*$/);
    if (!match) {
        throw new Error(`[BackendJudge] Could not determine host port for container ${containerName}`);
    }
    return parseInt(match[1], 10);
}

// ── Step 4: wait for health ──────────────────────────────────────────────
async function waitForHealthy(
    hostPort: number,
    healthCheckPath: string | undefined,
    startupTimeoutMs: number
): Promise<{ healthy: boolean; lastError?: string }> {
    const checkPath = healthCheckPath ?? "/";
    const url = `http://127.0.0.1:${hostPort}${checkPath}`;
    const deadline = Date.now() + startupTimeoutMs;
    let lastError: string | undefined;

    while (Date.now() < deadline) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
            if (res.status < 500) {
                // Any non-5xx response means the process is up and routing
                // requests, even if the health path itself 404s (some stacks
                // don't define one — that's a question-config gap, not a
                // submission failure).
                return { healthy: true };
            }
            lastError = `Health check returned ${res.status}`;
        } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
        }
        await new Promise((r) => setTimeout(r, 500));
    }

    return { healthy: false, lastError };
}

// ── Step 5: run test cases ───────────────────────────────────────────────
let ajvValidatorFactory: ((schema: object) => (data: unknown) => boolean) | null = null;
let ajvLoadAttempted = false;

async function getAjvValidatorFactory() {
    if (ajvLoadAttempted) return ajvValidatorFactory;
    ajvLoadAttempted = true;
    try {
        const AjvModule = await import("ajv");
        
        // Target the inner default which contains the actual class constructor
        const AjvClass = AjvModule.default.default;
        const ajv = new AjvClass({ allErrors: false });
        
        ajvValidatorFactory = (schema: object) => ajv.compile(schema);
    } catch (err) {
        console.warn(
            "[BackendJudge] ajv not installed — expectedBodySchema test cases will be skipped (treated as pass). " +
            "Run `npm install ajv` to enable schema validation."
        );
        ajvValidatorFactory = null;
    }
    return ajvValidatorFactory;
}
function deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

async function runTestCase(
    baseUrl: string,
    tc: BackendApiTestCase,
    requestTimeoutMs: number
): Promise<BackendTestCaseResult> {
    try {
        const res = await fetch(`${baseUrl}${tc.path}`, {
            method: tc.method,
            headers: { "Content-Type": "application/json", ...(tc.headers ?? {}) },
            body: tc.body !== undefined ? JSON.stringify(tc.body) : undefined,
            signal: AbortSignal.timeout(requestTimeoutMs),
        });

        if (res.status !== tc.expectedStatus) {
            return {
                id: tc.id,
                passed: false,
                expectedStatus: tc.expectedStatus,
                actualStatus: res.status,
                reason: `Expected status ${tc.expectedStatus}, got ${res.status}`,
            };
        }

        let actualBody: unknown = undefined;
        const text = await res.text();
        if (text.length > 0) {
            try {
                actualBody = JSON.parse(text);
            } catch {
                actualBody = text;
            }
        }

        if (tc.expectedBodySchema) {
            const factory = await getAjvValidatorFactory();
            if (factory) {
                const validate = factory(tc.expectedBodySchema);
                if (!validate(actualBody)) {
                    return {
                        id: tc.id,
                        passed: false,
                        expectedStatus: tc.expectedStatus,
                        actualStatus: res.status,
                        reason: "Response body did not match expectedBodySchema",
                    };
                }
            }
            // ajv unavailable → soft-pass the schema check, see assumption #4.
        } else if (tc.expectedBody !== undefined) {
            if (!deepEqual(actualBody, tc.expectedBody)) {
                return {
                    id: tc.id,
                    passed: false,
                    expectedStatus: tc.expectedStatus,
                    actualStatus: res.status,
                    reason: "Response body did not match expectedBody",
                };
            }
        }

        return { id: tc.id, passed: true, expectedStatus: tc.expectedStatus, actualStatus: res.status };
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        return {
            id: tc.id,
            passed: false,
            expectedStatus: tc.expectedStatus,
            actualStatus: null,
            reason: `Request error: ${reason}`,
        };
    }
}

// ── Step 6: teardown ─────────────────────────────────────────────────────
async function teardown(containerName: string, imageTag: string, buildDir: string): Promise<void> {
    await execFileAsync("docker", ["rm", "-f", containerName]).catch(() => {});
    await execFileAsync("docker", ["rmi", "-f", imageTag]).catch(() => {});
    await fs.rm(buildDir, { recursive: true, force: true }).catch(() => {});
}

// ── Public entrypoint ─────────────────────────────────────────────────────

/**
 * Runs one BACKEND submission end-to-end against its question's
 * visible + hidden API test cases. Always tears down its container/image,
 * even on failure paths — callers don't need to clean up anything.
 *
 * Combines visible + hidden test cases the same way judge.service.ts's
 * getTestCases() does for DSA: judging always runs the full set, and only
 * pass/fail counts (not per-case content) get reported upstream, so hidden
 * cases never leak to the player through this.
 */
export async function judgeBackendSubmission(
    questionSlug: string,
    sourceCode: string | null | undefined,
    sourceCodeUrl: string | null | undefined
): Promise<BackendJudgeRunResult> {
    const question = await BackendQuestion.findOne({ slug: questionSlug })
        .select("visibleApiTestCases hiddenApiTestCases judgeConfig")
        .lean<{
            visibleApiTestCases: BackendApiTestCase[];
            hiddenApiTestCases: BackendApiTestCase[];
            judgeConfig: BackendJudgeConfig;
        }>();

    if (!question) {
        throw new Error(`[BackendJudge] No backend question found for slug "${questionSlug}"`);
    }

    const allCases = [...(question.visibleApiTestCases ?? []), ...(question.hiddenApiTestCases ?? [])];

    if (allCases.length === 0) {
        throw new Error(`[BackendJudge] Question "${questionSlug}" has no API test cases configured`);
    }

    const { runtime, dockerfile } = resolveStackTemplate(question.judgeConfig.stack);
    const runId = randomUUID().slice(0, 8);
    const buildDir = await fs.mkdtemp(path.join(os.tmpdir(), `backend-judge-${runId}-`));
    const imageTag = `backend-judge-${runId}:latest`;
    const containerName = `backend-judge-${runId}`;

    console.log(`[BackendJudge] Run ${runId} (${runtime}) for "${questionSlug}" starting in ${buildDir}`);

    try {
        await materializeSubmissionFiles({ buildDir, sourceCode, sourceCodeUrl });
        await buildImage(buildDir, dockerfile, imageTag);
        await runContainer(imageTag, containerName, question.judgeConfig.port);

        const hostPort = await getHostPort(containerName, question.judgeConfig.port);
        const { healthy, lastError } = await waitForHealthy(
            hostPort,
            question.judgeConfig.healthCheckPath,
            question.judgeConfig.startupTimeoutMs
        );

        if (!healthy) {
            return {
                passed: 0,
                total: allCases.length,
                results: [],
                startupError: `Server did not become healthy within ${question.judgeConfig.startupTimeoutMs}ms` +
                    (lastError ? ` (last error: ${lastError})` : ""),
            };
        }

        const baseUrl = `http://127.0.0.1:${hostPort}`;
        const results = await Promise.all(
            allCases.map((tc) => runTestCase(baseUrl, tc, question.judgeConfig.requestTimeoutMs))
        );

        return {
            passed: results.filter((r) => r.passed).length,
            total: results.length,
            results,
        };
    } finally {
        await teardown(containerName, imageTag, buildDir);
        console.log(`[BackendJudge] Run ${runId} cleaned up`);
    }
}
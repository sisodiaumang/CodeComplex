import Submission from "../models/submission.model.js";
import Match from "../models/match.model.js";
import BattleRoom from "../models/battleRoom.model.js";
import * as judgeService from "./judge.service.js";
import { judgeBackendSubmission } from "./backendJudge.service.js";
import { judgeFrontendSubmission } from "./frontendJudge.service.js";
import { judgePromptWarSubmission } from "./promptJudge.service.js";
import { applySubmissionScore } from "./score.service.js";
import { io } from "../index.js";
import { BattleType } from "../interfaces/battleRoom.interface.js";

export class SubmissionServiceError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = "SubmissionServiceError";
    }
}

type SubmissionStatus = "PENDING" | "RUNNING" | "ACCEPTED" | "REJECTED" | "PARTIAL" | "ERROR";
type JudgeResult =
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED"
    | "RUNTIME_ERROR"
    | "COMPILATION_ERROR";

const JUDGE0_BACKED_TYPES: BattleType[] = ["DSA", "BUG_FIX"];
const DOCKER_BACKED_TYPES: BattleType[] = ["BACKEND"];
const LLM_BACKED_TYPES: BattleType[]    = ["FRONTEND", "FULLSTACK"];

function isJudge0Backed(battleType: BattleType): boolean {
    return JUDGE0_BACKED_TYPES.includes(battleType);
}

function isDockerBacked(battleType: BattleType): boolean {
    return DOCKER_BACKED_TYPES.includes(battleType);
}

function isLLMBacked(battleType: BattleType): boolean {
    return LLM_BACKED_TYPES.includes(battleType);
}

// ASSUMPTION: this is my best-effort mapping of Judge0's plain-English
// status descriptions to your JudgeResult enum. Judge0's exact wording for
// memory-limit and some runtime variants differs slightly across versions
// — verify against `GET {JUDGE0_API_URL}/statuses` on your instance if
// results look misclassified.
function mapJudge0StatusToResult(description: string): JudgeResult {
    switch (description) {
        case "Accepted":
            return "ACCEPTED";
        case "Wrong Answer":
            return "WRONG_ANSWER";
        case "Time Limit Exceeded":
            return "TIME_LIMIT_EXCEEDED";
        case "Compilation Error":
            return "COMPILATION_ERROR";
        default:
            if (description.toLowerCase().includes("memory")) return "MEMORY_LIMIT_EXCEEDED";
            return "RUNTIME_ERROR";
    }
}

function mapJudgeResultToStatus(
    judgeResult: JudgeResult,
    passed: number,
    total: number
): SubmissionStatus {
    if (judgeResult === "COMPILATION_ERROR" || judgeResult === "RUNTIME_ERROR") {
        return "ERROR";
    }
    if (total > 0 && passed === total) {
        return "ACCEPTED";
    }
    if (passed > 0) {
        return "PARTIAL";
    }
    return "REJECTED";
}

async function getRoomCode(battleRoomId: unknown): Promise<string | null> {
    const room = await BattleRoom.findById(battleRoomId).select("roomCode");
    return room?.roomCode ?? null;
}

/**
 * Broadcasts to everyone in the match's room — used for events both sides
 * legitimately need to see (score changes, match ending).
 */
async function emitToRoom(battleRoomId: unknown, event: string, payload: unknown): Promise<void> {
    const roomCode = await getRoomCode(battleRoomId);
    if (roomCode) io.to(roomCode).emit(event, payload);
}

/**
 * ASSUMPTION: emits to a socket room named after the submitting user's own
 * id. This assumes user sockets join a room equal to their userId
 * somewhere in your connection setup (registerBattleChatHandlers /
 * registerBattleVoiceHandlers / socketAuthMiddleware — none of which I
 * have access to). Used for submission-result events that shouldn't be
 * broadcast to the opponent (you don't want to reveal "they just got
 * Wrong Answer" to the other team in a competitive match) — only
 * score:update and match:ended go to the whole room. If your sockets don't
 * actually join a per-user room, these specific events just won't reach
 * anyone; swap in whatever your real private-notification channel is.
 */
function emitToUser(userId: unknown, event: string, payload: unknown): void {
    io.to(String(userId)).emit(event, payload);
}

/**
 * Creates a PENDING submission and kicks off judging in the background.
 * Validation (match exists/live, player belongs to it, language supported,
 * code non-empty, not banned) is the controller's responsibility — this
 * assumes all of that already passed.
 */
export async function createAndJudge(params: {
    matchId: string;
    userId: string;
    team: "A" | "B";
    questionSlug: string;
    battleType: BattleType;
    battleRoomId: unknown;
    language: "CPP" | "JAVA" | "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT";
    sourceCode: string;
}) {
    const { matchId, userId, team, questionSlug, battleType, battleRoomId, language, sourceCode } = params;

    const submissionNumber = (await Submission.countDocuments({ matchId, userId })) + 1;

    const submission = await Submission.create({
        matchId,
        userId,
        team,
        questionSlug,
        battleType,
        language,
        sourceCode,
        status: "PENDING",
        submissionNumber,
    });

    await emitToRoom(battleRoomId, "submission:created", {
        submissionId: submission._id,
        matchId,
        userId,
        team,
        submissionNumber,
    });

    // Fire-and-forget — submitCode responds immediately with PENDING (per
    // the spec's response shape); judging result arrives via socket events
    // and is also fetchable via GET /:submissionId once done.
    judgeSubmission(submission._id.toString()).catch((err) => {
        console.error(`[SubmissionService] Judging failed for submission ${submission._id}:`, err);
    });

    return submission;
}

/**
 * Runs a BACKEND submission through backendJudge.service.ts (Docker-based
 * container + HTTP test runner) and writes the verdict back, mirroring the
 * shape of the DSA/Judge0 path below as closely as the two domains allow:
 * status/judgeResult/score/passedTestCases/totalTestCases all get set the
 * same way, so submission.controller.ts and the socket events need no
 * battleType-specific handling on the client side.
 */
async function judgeBackendTypeSubmission(
    submission: InstanceType<typeof Submission>,
    match: InstanceType<typeof Match>
): Promise<void> {
    try {
        const result = await judgeBackendSubmission(
            submission.questionSlug,
            submission.sourceCode,
            (submission as any).sourceCodeUrl
        );

        if (result.startupError) {
            submission.status = "ERROR";
            submission.judgeResult = "RUNTIME_ERROR";
            submission.passedTestCases = 0;
            submission.totalTestCases = result.total;
            submission.score = 0;
            submission.feedback = result.startupError;
            (submission as any).judgedAt = new Date();
            await submission.save();

            await emitToRoom(match.battleRoomId, "submission:judged", {
                submissionId: submission._id,
                matchId: submission.matchId,
                status: "ERROR",
                judgeResult: "RUNTIME_ERROR",
                score: 0,
                passedTestCases: 0,
                totalTestCases: result.total,
            });

            emitToUser(submission.userId, "submission:failed", {
                submissionId: submission._id,
                matchId: submission.matchId,
                status: "ERROR",
                judgeResult: "RUNTIME_ERROR",
                score: 0,
                passedTestCases: 0,
                totalTestCases: result.total,
                feedback: result.startupError,
            });
            return;
        }

        const { passed, total, results } = result;
        const score = total > 0 ? Math.round((passed / total) * 100) : 0;
        const judgeResult: JudgeResult = passed === total ? "ACCEPTED" : "WRONG_ANSWER";
        const status: SubmissionStatus =
            passed === total ? "ACCEPTED" : passed > 0 ? "PARTIAL" : "REJECTED";

        const firstFailure = results.find((r) => !r.passed);

        submission.status = status;
        submission.judgeResult = judgeResult;
        submission.passedTestCases = passed;
        submission.totalTestCases = total;
        submission.score = score;
        submission.feedback = firstFailure
            ? `Test case ${firstFailure.id} failed: ${firstFailure.reason ?? "unknown reason"}`
            : undefined;
        (submission as any).judgedAt = new Date();
        await submission.save();

        await emitToRoom(match.battleRoomId, "submission:judged", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status,
            judgeResult,
            score,
            passedTestCases: passed,
            totalTestCases: total,
        });

        emitToUser(submission.userId, status === "ACCEPTED" ? "submission:accepted" : "submission:failed", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status,
            judgeResult,
            score,
            passedTestCases: passed,
            totalTestCases: total,
            feedback: submission.feedback ?? null,
        });

        if (status === "ACCEPTED" || status === "PARTIAL") {
            await applySubmissionScore(submission.matchId.toString(), submission.team as "A" | "B", score);
        }
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);

        submission.status = "ERROR";
        submission.feedback = `Backend judging failed: ${reason}`;
        (submission as any).judgedAt = new Date();
        await submission.save();

        await emitToRoom(match.battleRoomId, "submission:judged", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status: "ERROR",
            judgeResult: null,
            score: 0,
            passedTestCases: 0,
            totalTestCases: 0,
        });

        emitToUser(submission.userId, "submission:failed", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status: "ERROR",
            judgeResult: null,
            score: 0,
            passedTestCases: 0,
            totalTestCases: 0,
            feedback: submission.feedback,
        });

        console.error(`[SubmissionService] Backend judging failed for submission ${submission._id}:`, err);
    }
}

/**
 * Runs a FRONTEND or FULLSTACK submission through frontendJudge.service.ts
 * (Grok LLM rubric evaluation against FrontendQuestion.gradingCriteria) and
 * writes the verdict back.
 *
 * passedTestCases / totalTestCases on Submission are repurposed to hold
 * passedCriteria / totalCriteria — the correct analogue for a rubric-graded
 * submission. The socket event shape is identical to DSA/BACKEND so the
 * client needs no battleType-specific handling.
 */
async function judgeFrontendTypeSubmission(
    submission: InstanceType<typeof Submission>,
    match: InstanceType<typeof Match>
): Promise<void> {
    // judgeFrontendSubmission never throws — failures come back as judgeError.
    const result = await judgeFrontendSubmission(
        submission.questionSlug,
        submission.sourceCode
    );

    if (result.judgeError) {
        submission.status = "ERROR";
        submission.judgeResult = "RUNTIME_ERROR";
        submission.passedTestCases = 0;
        submission.totalTestCases = result.totalCriteria;
        submission.score = 0;
        submission.feedback = result.judgeError;
        (submission as any).judgedAt = new Date();
        await submission.save();

        await emitToRoom(match.battleRoomId, "submission:judged", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status: "ERROR",
            judgeResult: "RUNTIME_ERROR",
            score: 0,
            passedTestCases: 0,
            totalTestCases: result.totalCriteria,
        });

        emitToUser(submission.userId, "submission:failed", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status: "ERROR",
            judgeResult: "RUNTIME_ERROR",
            score: 0,
            passedTestCases: 0,
            totalTestCases: result.totalCriteria,
            feedback: result.judgeError,
        });

        console.error(
            `[SubmissionService] Frontend judging error for submission ${submission._id}: ${result.judgeError}`
        );
        return;
    }

    const { score, passed, passedCriteria, totalCriteria, summary, criteriaResults } = result;

    // ACCEPTED = passed the overall score gate AND every single criterion
    // individually passed. PARTIAL = some criteria passed. REJECTED = nothing.
    const status: SubmissionStatus =
        passed && passedCriteria === totalCriteria ? "ACCEPTED"
        : score > 0 ? "PARTIAL"
        : "REJECTED";

    const judgeResult: JudgeResult = passed ? "ACCEPTED" : "WRONG_ANSWER";

    // Build feedback: overall summary + first failing criterion detail if any.
    const firstFailure = criteriaResults.find((r) => r.rawScore < 60);
    const feedback = firstFailure
        ? `${summary} Criterion "${firstFailure.description}": ${firstFailure.feedback}`
        : summary;

    submission.status = status;
    submission.judgeResult = judgeResult;
    submission.passedTestCases = passedCriteria;
    submission.totalTestCases = totalCriteria;
    submission.score = score;
    submission.feedback = feedback || undefined;
    (submission as any).judgedAt = new Date();
    await submission.save();

    await emitToRoom(match.battleRoomId, "submission:judged", {
        submissionId: submission._id,
        matchId: submission.matchId,
        status,
        judgeResult,
        score,
        passedTestCases: passedCriteria,
        totalTestCases: totalCriteria,
    });

    emitToUser(submission.userId, status === "ACCEPTED" ? "submission:accepted" : "submission:failed", {
        submissionId: submission._id,
        matchId: submission.matchId,
        status,
        judgeResult,
        score,
        passedTestCases: passedCriteria,
        totalTestCases: totalCriteria,
        feedback: feedback ?? null,
    });

    if (status === "ACCEPTED" || status === "PARTIAL") {
        await applySubmissionScore(submission.matchId.toString(), submission.team as "A" | "B", score);
    }
}

/**
 * Marks a submission ERROR with a clear, honest message for battle types
 * that have no judge implementation yet, and emits the same socket events
 * the real judging path would so the client doesn't hang waiting on
 * "submission:judged" forever.
 */
async function markUnsupportedBattleType(
    submission: InstanceType<typeof Submission>,
    match: InstanceType<typeof Match>
): Promise<void> {
    const feedback =
        `Judging for ${submission.battleType} submissions is not implemented yet. ` +
        `This match type is supported for play, but automated grading currently ` +
        `only covers DSA / BUG_FIX / BACKEND / FRONTEND / FULLSTACK. An admin can rejudge once support is added.`;

    submission.status = "ERROR";
    submission.feedback = feedback;
    (submission as any).judgedAt = new Date();
    await submission.save();

    await emitToRoom(match.battleRoomId, "submission:judged", {
        submissionId: submission._id,
        matchId: submission.matchId,
        status: "ERROR",
        judgeResult: null,
        score: 0,
        passedTestCases: 0,
        totalTestCases: 0,
    });

    emitToUser(submission.userId, "submission:failed", {
        submissionId: submission._id,
        matchId: submission.matchId,
        status: "ERROR",
        judgeResult: null,
        score: 0,
        passedTestCases: 0,
        totalTestCases: 0,
        feedback,
    });

    console.warn(
        `[SubmissionService] Submission ${submission._id} is battleType ` +
        `"${submission.battleType}" — no judge implementation exists yet, marked ERROR.`
    );
}

/**
 * Runs judging for an existing submission end-to-end: fetches test cases,
 * runs them through the appropriate judge engine, updates the Submission doc
 * with the verdict, and — if accepted/partial — feeds the score into
 * score.service.ts.
 *
 * Exported separately so rejudge() (admin-only controller endpoint) can
 * reuse it on an existing submission without duplicating this logic.
 *
 * Dispatch order:
 *   BACKEND          → backendJudge.service.ts  (Docker + HTTP test runner)
 *   FRONTEND/FULLSTACK → frontendJudge.service.ts (Grok LLM rubric grader)
 *   DSA/BUG_FIX      → judge.service.ts          (Judge0 stdin/stdout)
 *   anything else    → markUnsupportedBattleType  (PROMPT_WAR, future types)
 */
export async function judgeSubmission(submissionId: string): Promise<void> {
    const submission = await Submission.findById(submissionId);

    if (!submission) {
        throw new SubmissionServiceError(404, "Submission not found");
    }

    const match = await Match.findById(submission.matchId);

    if (!match) {
        console.error(`[SubmissionService] Match ${submission.matchId} not found for submission ${submissionId}`);
        return;
    }

    submission.status = "RUNNING";
    await submission.save();

    // ── Route by battleType ───────────────────────────────────────────────

    if (isDockerBacked(submission.battleType as BattleType)) {
        await judgeBackendTypeSubmission(submission, match);
        return;
    }

    if (submission.battleType === "FULLSTACK") {
        // FULLSTACK = combine FRONTEND rubric + BACKEND API rubric.
        // We treat the FULLSTACK submission as:
        //   - submission.sourceCode for frontend judging
        //   - submission.sourceCodeUrl (if present) / submission.sourceCode for backend judging
        // and then average the two rubric scores.

        const frontendResult = await judgeFrontendSubmission(
            submission.questionSlug,
            submission.sourceCode
        );

        // If frontend judging fails hard, mark ERROR immediately.
        if (frontendResult.judgeError) {
            submission.status = "ERROR";
            submission.judgeResult = "RUNTIME_ERROR";
            submission.passedTestCases = 0;
            submission.totalTestCases = frontendResult.totalCriteria;
            submission.score = 0;
            submission.feedback = frontendResult.judgeError;
            (submission as any).judgedAt = new Date();
            await submission.save();

            await emitToRoom(match.battleRoomId, "submission:judged", {
                submissionId: submission._id,
                matchId: submission.matchId,
                status: "ERROR",
                judgeResult: "RUNTIME_ERROR",
                score: 0,
                passedTestCases: 0,
                totalTestCases: frontendResult.totalCriteria,
            });

            emitToUser(submission.userId, "submission:failed", {
                submissionId: submission._id,
                matchId: submission.matchId,
                status: "ERROR",
                judgeResult: "RUNTIME_ERROR",
                score: 0,
                passedTestCases: 0,
                totalTestCases: frontendResult.totalCriteria,
                feedback: frontendResult.judgeError,
            });

            return;
        }

        const frontendScore = frontendResult.score;
        const frontendPassed = frontendResult.passed;
        const frontendPassedCriteria = frontendResult.passedCriteria;
        const frontendTotalCriteria = frontendResult.totalCriteria;
        const frontendSummary = frontendResult.summary;

        // Backend part: run Docker test cases.
        // Uses existing backend judge; it expects question config for BACKEND.
        const backendResult = await judgeBackendSubmission(
            submission.questionSlug,
            submission.sourceCode,
            (submission as any).sourceCodeUrl
        );

        if (backendResult.startupError) {
            submission.status = "ERROR";
            submission.judgeResult = "RUNTIME_ERROR";
            submission.passedTestCases = 0;
            submission.totalTestCases =
                frontendTotalCriteria;
            submission.score = 0;
            submission.feedback = backendResult.startupError;
            (submission as any).judgedAt = new Date();
            await submission.save();

            await emitToRoom(match.battleRoomId, "submission:judged", {
                submissionId: submission._id,
                matchId: submission.matchId,
                status: "ERROR",
                judgeResult: "RUNTIME_ERROR",
                score: 0,
                passedTestCases: 0,
                totalTestCases: frontendTotalCriteria,
            });

            emitToUser(submission.userId, "submission:failed", {
                submissionId: submission._id,
                matchId: submission.matchId,
                status: "ERROR",
                judgeResult: "RUNTIME_ERROR",
                score: 0,
                passedTestCases: 0,
                totalTestCases: frontendTotalCriteria,
                feedback: backendResult.startupError,
            });

            return;
        }

        const backendPassed = backendResult.passed;
        const backendTotal = backendResult.total;
        const backendScore = backendTotal > 0 ? Math.round((backendPassed / backendTotal) * 100) : 0;

        // Combine: average the two 0-100 scores.
        const combinedScore = Math.round((frontendScore + backendScore) / 2);

        // Gate: accept only if frontend passed and backend fully passed.
        // Otherwise partial/rejected based on combined score.
        const passed = frontendPassed && backendPassed === backendTotal;
        const passedCriteria = frontendPassedCriteria; // keep frontend rubric count for UI parity
        const totalCriteria = frontendTotalCriteria;

        const status: SubmissionStatus =
            passed && passedCriteria === totalCriteria ? "ACCEPTED"
            : combinedScore > 0 ? "PARTIAL"
            : "REJECTED";

        const judgeResult: JudgeResult = passed ? "ACCEPTED" : "WRONG_ANSWER";

        const firstFailure = frontendResult.criteriaResults.find((r) => r.rawScore < 60);
        const feedback = passed
            ? `${frontendSummary} Backend: ${backendPassed}/${backendTotal} test cases passed.`
            : firstFailure
                ? `${frontendSummary} Criterion "${firstFailure.description}": ${firstFailure.feedback}. Backend: ${backendPassed}/${backendTotal} test cases passed.`
                : `Backend: ${backendPassed}/${backendTotal} test cases passed. ${frontendSummary}`;

        submission.status = status;
        submission.judgeResult = judgeResult;
        submission.passedTestCases = passedCriteria;
        submission.totalTestCases = totalCriteria;
        submission.score = combinedScore;
        submission.feedback = feedback || undefined;
        (submission as any).judgedAt = new Date();
        await submission.save();

        await emitToRoom(match.battleRoomId, "submission:judged", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status,
            judgeResult,
            score: combinedScore,
            passedTestCases: passedCriteria,
            totalTestCases: totalCriteria,
        });

        emitToUser(submission.userId, status === "ACCEPTED" ? "submission:accepted" : "submission:failed", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status,
            judgeResult,
            score: combinedScore,
            passedTestCases: passedCriteria,
            totalTestCases: totalCriteria,
            feedback: feedback ?? null,
        });

        if (status === "ACCEPTED" || status === "PARTIAL") {
            await applySubmissionScore(
                submission.matchId.toString(),
                submission.team as "A" | "B",
                combinedScore
            );
        }

        return;
    }

    if (submission.battleType === "PROMPT_WAR") {
        const result = await judgePromptWarSubmission(
            submission.questionSlug,
            submission.sourceCode
        );

        if (result.judgeError) {
            submission.status = "ERROR";
            submission.judgeResult = "RUNTIME_ERROR";
            submission.passedTestCases = 0;
            submission.totalTestCases = result.totalCriteria;
            submission.score = 0;
            submission.feedback = result.judgeError;
            (submission as any).judgedAt = new Date();
            await submission.save();

            await emitToRoom(match.battleRoomId, "submission:judged", {
                submissionId: submission._id,
                matchId: submission.matchId,
                status: "ERROR",
                judgeResult: "RUNTIME_ERROR",
                score: 0,
                passedTestCases: 0,
                totalTestCases: result.totalCriteria,
            });

            emitToUser(submission.userId, "submission:failed", {
                submissionId: submission._id,
                matchId: submission.matchId,
                status: "ERROR",
                judgeResult: "RUNTIME_ERROR",
                score: 0,
                passedTestCases: 0,
                totalTestCases: result.totalCriteria,
                feedback: result.judgeError,
            });

            return;
        }

        const { score, passed, passedCriteria, totalCriteria, summary, criteriaResults } = result;

        const status: SubmissionStatus =
            passed && passedCriteria === totalCriteria ? "ACCEPTED"
            : score > 0 ? "PARTIAL"
            : "REJECTED";

        const judgeResult: JudgeResult = passed ? "ACCEPTED" : "WRONG_ANSWER";

        const firstFailure = criteriaResults.find((r) => r.rawScore < 60);
        const feedback = firstFailure
            ? `${summary} Criterion "${firstFailure.description}": ${firstFailure.feedback}`
            : summary;

        submission.status = status;
        submission.judgeResult = judgeResult;
        submission.passedTestCases = passedCriteria;
        submission.totalTestCases = totalCriteria;
        submission.score = score;
        submission.feedback = feedback || undefined;
        (submission as any).judgedAt = new Date();
        await submission.save();

        await emitToRoom(match.battleRoomId, "submission:judged", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status,
            judgeResult,
            score,
            passedTestCases: passedCriteria,
            totalTestCases: totalCriteria,
        });

        emitToUser(submission.userId, status === "ACCEPTED" ? "submission:accepted" : "submission:failed", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status,
            judgeResult,
            score,
            passedTestCases: passedCriteria,
            totalTestCases: totalCriteria,
            feedback: feedback ?? null,
        });

        if (status === "ACCEPTED" || status === "PARTIAL") {
            await applySubmissionScore(
                submission.matchId.toString(),
                submission.team as "A" | "B",
                score
            );
        }

        return;
    }

    if (isLLMBacked(submission.battleType as BattleType)) {
        await judgeFrontendTypeSubmission(submission, match);
        return;
    }

    if (!isJudge0Backed(submission.battleType as BattleType)) {
        // PROMPT_WAR and any future unimplemented types land here.
        await markUnsupportedBattleType(submission, match);
        return;
    }

    // ── DSA / BUG_FIX — Judge0 path ──────────────────────────────────────

    // getTestCases() now hits a real Question collection and can genuinely
    // throw (unseeded/typo'd slug, question with no test cases configured).
    // An uncaught throw here would leave the submission stuck on RUNNING
    // forever — resolve to ERROR instead, same as a compile/runtime failure.
    let judged: Awaited<ReturnType<typeof judgeService.judgeAgainstTestCases>>;
    try {
        const testCases = await judgeService.getTestCases(submission.questionSlug);
        judged = await judgeService.judgeAgainstTestCases(
            submission.language as judgeService.SubmissionLanguage,
            submission.sourceCode,
            testCases
        );
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);

        submission.status = "ERROR";
        submission.feedback = `Judging failed: ${reason}`;
        (submission as any).judgedAt = new Date();
        await submission.save();

        await emitToRoom(match.battleRoomId, "submission:judged", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status: "ERROR",
            judgeResult: null,
            score: 0,
            passedTestCases: 0,
            totalTestCases: 0,
        });

        emitToUser(submission.userId, "submission:failed", {
            submissionId: submission._id,
            matchId: submission.matchId,
            status: "ERROR",
            judgeResult: null,
            score: 0,
            passedTestCases: 0,
            totalTestCases: 0,
            feedback: submission.feedback,
        });

        console.error(`[SubmissionService] Judging setup failed for submission ${submissionId}:`, err);
        return;
    }

    const { passed, total, firstFailure, lastResult } = judged;

    const representativeResult = passed === total ? lastResult : (firstFailure ?? lastResult);
    const judgeResult = mapJudge0StatusToResult(representativeResult.status.description);
    const status = mapJudgeResultToStatus(judgeResult, passed, total);
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    submission.status = status;
    submission.judgeResult = judgeResult;
    submission.passedTestCases = passed;
    submission.totalTestCases = total;
    submission.score = score;
    submission.executionTime = representativeResult.time ? parseFloat(representativeResult.time) : undefined;
    submission.memoryUsage = representativeResult.memory ?? undefined;
    submission.feedback = representativeResult.compile_output || representativeResult.stderr || undefined;
    (submission as any).judgedAt = new Date();

    await submission.save();

    await emitToRoom(match.battleRoomId, "submission:judged", {
        submissionId: submission._id,
        matchId: submission.matchId,
        status,
        judgeResult,
        score,
        passedTestCases: passed,
        totalTestCases: total,
    });

    emitToUser(submission.userId, status === "ACCEPTED" ? "submission:accepted" : "submission:failed", {
        submissionId: submission._id,
        matchId: submission.matchId,
        status,
        judgeResult,
        score,
        passedTestCases: passed,
        totalTestCases: total,
        feedback: submission.feedback ?? null,
    });

    if (status === "ACCEPTED" || status === "PARTIAL") {
        await applySubmissionScore(submission.matchId.toString(), submission.team as "A" | "B", score);
    }
}
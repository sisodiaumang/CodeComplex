import { Request, Response, NextFunction } from "express";

import Match from "../models/match.model.js";
import Submission from "../models/submission.model.js";
import { computeEndsAt } from "../services/match.service.js";
import {
    createAndJudge,
    judgeSubmission,
    SubmissionServiceError,
} from "../services/submission.service.js";

const SUPPORTED_LANGUAGES = ["CPP", "JAVA", "PYTHON", "JAVASCRIPT", "TYPESCRIPT"];

function normalizeLanguage(language: string): string {
    return language.trim().toUpperCase();
}

// ─────────────────────────────────────────────
// POST /api/v1/submission
// ─────────────────────────────────────────────
export const submitCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const userIdStr = userId.toString();
        const { matchId, language, code } = req.body;

        if (!matchId || !language || typeof code !== "string") {
            res.status(400).json({
                success: false,
                message: "matchId, language, and code are required"
            });
            return;
        }

        // ✓ User not banned
        if (req.user.isBanned) {
            res.status(403).json({
                success: false,
                message: "Banned accounts cannot submit code"
            });
            return;
        }

        // ✓ Code not empty
        if (code.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "Code cannot be empty"
            });
            return;
        }

        // ✓ Language supported
        const normalizedLanguage = normalizeLanguage(language);

        if (!SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
            res.status(400).json({
                success: false,
                message: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`
            });
            return;
        }

        // ✓ Match exists
        const match = await Match.findById(matchId);

        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }

        // Allow submissions if match is ONGOING or COMPLETED (for optimization / continue editing)
        if (match.status !== "ONGOING" && match.status !== "COMPLETED") {
            res.status(400).json({
                success: false,
                message: `Cannot submit — match is ${match.status.toLowerCase()}`
            });
            return;
        }

        // Bypassed if already COMPLETED (practicing/optimizing post-match).
        if (match.status === "ONGOING" && Date.now() >= computeEndsAt(match).getTime()) {
            res.status(400).json({
                success: false,
                message: "Match time has already elapsed"
            });
            return;
        }

        // ✓ User belongs to Team A/B
        const inTeamA = match.teamA.map((id) => id.toString()).includes(userIdStr);
        const inTeamB = match.teamB.map((id) => id.toString()).includes(userIdStr);

        if (!inTeamA && !inTeamB) {
            res.status(403).json({
                success: false,
                message: "You are not a player in this match"
            });
            return;
        }

        // ✓ Problem exists — schema already enforces questionSlug is
        // required on Match; this is a defensive backstop, not expected to
        // ever actually trip.
        if (!match.questionSlug) {
            res.status(500).json({
                success: false,
                message: "Match has no associated problem"
            });
            return;
        }

        const submission = await createAndJudge({
            matchId: match._id.toString(),
            userId: userIdStr,
            team: inTeamA ? "A" : "B",
            questionSlug: match.questionSlug,
            battleType: match.battleType,
            battleRoomId: match.battleRoomId,
            language: normalizedLanguage as "CPP" | "JAVA" | "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT",
            sourceCode: code,
        });

        res.status(201).json({
            success: true,
            message: "Submission received",
            data: {
                submissionId: submission._id,
                status: submission.status
            }
        });
    } catch (err) {
        if (err instanceof SubmissionServiceError) {
            res.status(err.statusCode).json({ success: false, message: err.message });
            return;
        }
        next(err);
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/submission/:submissionId
// ─────────────────────────────────────────────
export const getSubmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id.toString();
        const { submissionId } = req.params;

        const submission = await Submission.findById(submissionId);

        if (!submission) {
            res.status(404).json({ success: false, message: "Submission not found" });
            return;
        }

        const isOwner = submission.userId.toString() === userId;
        const isAdmin = req.user.role === "ADMIN";

        // Only the author or an admin sees the full submission (incl.
        // source code) — opponents/teammates get the verdict only, via
        // getMatchSubmissions below.
        if (!isOwner && !isAdmin) {
            res.status(403).json({ success: false, message: "Not authorised to view this submission" });
            return;
        }

        res.status(200).json({ success: true, data: submission });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/submission/me
// ─────────────────────────────────────────────
export const getMySubmissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;

        const [submissions, total] = await Promise.all([
            Submission.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Submission.countDocuments({ userId })
        ]);

        res.status(200).json({
            success: true,
            data: {
                submissions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/submission/match/:matchId
// (only players in that match)
// ─────────────────────────────────────────────
export const getMatchSubmissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id.toString();
        const { matchId } = req.params;

        const match = await Match.findById(matchId).select("teamA teamB");

        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }

        const isPlayer = [...match.teamA, ...match.teamB]
            .map((id) => id.toString())
            .includes(userId);
        const isAdmin = req.user.role === "ADMIN";

        if (!isPlayer && !isAdmin) {
            res.status(403).json({
                success: false,
                message: "Only players in this match can view its submissions"
            });
            return;
        }

        // Verdicts only, not source code — keeps strategy hidden mid-match
        // for the other team. The author can still get their own full
        // submission (incl. code) via GET /:submissionId.
        const submissions = await Submission.find({ matchId })
            .select("-sourceCode")
            .populate("userId", "username avatar")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: submissions });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/submission/:submissionId/rejudge
// Admin only.
// ─────────────────────────────────────────────
export const rejudgeSubmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.user.role !== "ADMIN") {
            res.status(403).json({ success: false, message: "Admin only" });
            return;
        }

        const submissionId = Array.isArray(req.params.submissionId)
            ? req.params.submissionId[0]
            : req.params.submissionId;
        const submission = await Submission.findById(submissionId);

        if (!submission) {
            res.status(404).json({ success: false, message: "Submission not found" });
            return;
        }

        submission.status = "PENDING";
        await submission.save();

        // Fire-and-forget — same async pattern as the initial submit; the
        // new verdict arrives via socket events / a follow-up GET.
        judgeSubmission(submissionId).catch((err) =>
            console.error(`[SubmissionController] Rejudge failed for ${submissionId}:`, err)
        );

        res.status(200).json({
            success: true,
            message: "Rejudge started",
            data: { submissionId, status: "PENDING" }
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// DELETE /api/v1/submission/:submissionId
// Admin only.
// ─────────────────────────────────────────────
export const deleteSubmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.user.role !== "ADMIN") {
            res.status(403).json({ success: false, message: "Admin only" });
            return;
        }

        const { submissionId } = req.params;

        const submission = await Submission.findById(submissionId)
            .select("matchId status score team");

        if (!submission) {
            res.status(404).json({ success: false, message: "Submission not found" });
            return;
        }

        // FIX (D4): previously the delete was unconditional with a comment
        // acknowledging the score-rollback problem but doing nothing about
        // it. This caused a silent footgun: deleting an ACCEPTED submission
        // that triggered a sudden-death match end left the match completed
        // and ratings applied with no way to reverse either.
        //
        // Strategy:
        //  1. If the match is already COMPLETED/ABANDONED, block the delete
        //     entirely — the submission is part of the permanent match record
        //     and deleting it would create an inconsistency (final scores /
        //     rating history reference a submission that no longer exists).
        //     Admins who need to invalidate a result should void the match,
        //     not delete individual submissions.
        //  2. If the match is still ONGOING (or not found — orphan), allow
        //     the delete but recalculate and persist the team's score from
        //     the remaining submissions so the $max value stays accurate.
        const match = await Match.findById(submission.matchId)
            .select("status teamAScore teamBScore");

        if (match && (match.status === "COMPLETED" || match.status === "ABANDONED")) {
            res.status(409).json({
                success: false,
                message:
                    "Cannot delete a submission from a completed or abandoned match. " +
                    "The submission is part of the permanent match record. " +
                    "Void the match instead if the result needs to be invalidated.",
            });
            return;
        }

        await Submission.findByIdAndDelete(submissionId);

        // Recalculate team score from remaining submissions so the stored
        // $max value stays accurate after removing this one.
        if (match && match.status === "ONGOING") {
            const scoreField = submission.team === "A" ? "teamAScore" : "teamBScore";

            const best = await Submission.findOne({
                matchId: submission.matchId,
                team: submission.team,
                status: { $in: ["ACCEPTED", "PARTIAL"] },
            })
                .sort({ score: -1 })
                .select("score");

            await Match.findByIdAndUpdate(submission.matchId, {
                [scoreField]: best?.score ?? 0,
            });
        }

        res.status(200).json({ success: true, message: "Submission deleted" });
    } catch (err) {
        next(err);
    }
};
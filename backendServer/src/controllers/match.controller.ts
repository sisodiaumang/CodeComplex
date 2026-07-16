import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Match from "../models/match.model.js";
import BattleRoom from "../models/battleRoom.model.js";
import Submission from "../models/submission.model.js";
import RatingHistory from "../models/ratingHistory.model.js";
import User from "../models/user.model.js";
import { io } from "../index.js";
import {
    createMatchForRoom,
    MatchServiceError,
    applyRankedRatings,
} from "../services/match.service.js";


// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/** All players in a match as a flat array of ObjectId strings */
function allPlayerIds(match: any): string[] {
    return [
        ...match.teamA.map((id: any) => (id._id ? id._id.toString() : id.toString())),
        ...match.teamB.map((id: any) => (id._id ? id._id.toString() : id.toString())),
    ];
}

/**
 * Resolve winner from teamAScore / teamBScore.
 * winnerTeam matches the schema enum: "A" | "B" | "DRAW"
 */
function resolveWinner(match: any): {
    winnerTeam: "A" | "B" | "DRAW";
    winnerId: mongoose.Types.ObjectId | null;
    loserId: mongoose.Types.ObjectId | null;
} {
    const scoreA: number = match.teamAScore ?? 0;
    const scoreB: number = match.teamBScore ?? 0;

    if (scoreA === scoreB) {
        return { winnerTeam: "DRAW", winnerId: null, loserId: null };
    }

    if (scoreA > scoreB) {
        return {
            winnerTeam: "A",
            winnerId: match.teamA[0] ?? null,
            loserId: match.teamB[0] ?? null,
        };
    }

    return {
        winnerTeam: "B",
        winnerId: match.teamB[0] ?? null,
        loserId: match.teamA[0] ?? null,
    };
}

/**
 * Compute planned end timestamp from startedAt + durationInMinutes.
 * Match model has no stored endsAt field — always derive it.
 */
function computeEndsAt(match: any): Date {
    return new Date(
        match.startedAt.getTime() + match.durationInMinutes * 60 * 1000
    );
}

/**
 * Compute actual elapsed seconds between startedAt and endedAt (or now).
 * Match model has no stored duration field — always derive it.
 */
function computeDurationSeconds(match: any): number {
    const end = match.endedAt ?? new Date();
    return Math.floor((end.getTime() - match.startedAt.getTime()) / 1000);
}


// ─────────────────────────────────────────────
// 1. POST /match/start — Start Match
// ─────────────────────────────────────────────

/**
 * HOST ONLY.
 * Verifies room, creates Match doc, flips BattleRoom → STARTED,
 * emits match:start + match:countdown.
 *
 * Body: { roomCode, questionSlug, durationInMinutes? }
 */
export const startMatch = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const {
            roomCode,
            questionSlug,
            durationInMinutes = 30
        } = req.body;

        if (!roomCode) {
            res.status(400).json({ success: false, message: "roomCode is required" });
            return;
        }

        if (!questionSlug) {
            res.status(400).json({ success: false, message: "questionSlug is required" });
            return;
        }

        const room = await BattleRoom.findOne({ roomCode });

        if (!room) {
            res.status(404).json({ success: false, message: "Room not found" });
            return;
        }

        if (room.host.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "Only the host can start the match"
            });
            return;
        }

        // FIX (B3): previously this endpoint duplicated the ~25-line
        // Match.create + room.save block that also exists in
        // battle_controller.ts::startBattle, with its own slightly different
        // double-start guard. Two callers that can race against the same room
        // means a host hitting both endpoints simultaneously could create two
        // Match docs. Delegating to createMatchForRoom() (which battle_controller
        // already uses) gives a single atomic implementation with a shared
        // ongoing-match guard.
        let match;
        try {
            match = await createMatchForRoom(room, { questionSlug, durationInMinutes });
        } catch (serviceErr) {
            if (serviceErr instanceof MatchServiceError) {
                res.status(serviceErr.statusCode).json({
                    success: false,
                    message: serviceErr.message
                });
                return;
            }
            throw serviceErr;
        }

        const endsAt = computeEndsAt(match);

        io.to(roomCode).emit("match:start", {
            matchId: match._id,
            questionSlug,
            durationInMinutes,
            startedAt: match.startedAt,
            endsAt,
        });

        io.to(roomCode).emit("match:countdown", {
            matchId: match._id,
            endsAt,
        });

        res.status(201).json({
            success: true,
            message: "Match started",
            data: { match }
        });
    } catch (err) {
        next(err);
    }
};


// ─────────────────────────────────────────────
// 2. GET /match/:matchId — Get Match
// ─────────────────────────────────────────────

export const getMatch = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { matchId } = req.params;

        if (!mongoose.isValidObjectId(matchId)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        const match = await Match.findById(matchId)
            .populate("teamA", "username fullName avatar")
            .populate("teamB", "username fullName avatar")
            .populate("battleRoomId", "roomCode battleType difficulty");

        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }

        res.status(200).json({
            success: true,
            data: { match }
        });
    } catch (err) {
        next(err);
    }
};


// ─────────────────────────────────────────────
// 3. GET /match/current — Current Match
// ─────────────────────────────────────────────

export const getCurrentMatch = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;

        const match = await Match.findOne({
            status: "ONGOING",
            $or: [{ teamA: userId }, { teamB: userId }]
        })
            .populate("teamA", "username fullName avatar")
            .populate("teamB", "username fullName avatar")
            .populate("battleRoomId", "roomCode");

        if (!match) {
            res.status(404).json({
                success: false,
                message: "You are not in any active match"
            });
            return;
        }

        const endsAt = computeEndsAt(match);
        const remainingMs = Math.max(0, endsAt.getTime() - Date.now());

        res.status(200).json({
            success: true,
            data: {
                match,
                endsAt,
                remainingSeconds: Math.floor(remainingMs / 1000),
            }
        });
    } catch (err) {
        next(err);
    }
};


// ─────────────────────────────────────────────
// 4. POST /match/:matchId/end — End Match
// ─────────────────────────────────────────────

/**
 * Resolves winner by teamAScore / teamBScore.
 * Sets status → COMPLETED (not "FINISHED" — that's BattleRoom's enum).
 * Stores endedAt (required by pre-save hook).
 * Emits match:ended + match:winner, then fires rating + achievement services.
 */
export const endMatch = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { matchId } = req.params;

        if (!mongoose.isValidObjectId(matchId)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        const match = await Match.findById(matchId);

        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }

        if (match.status !== "ONGOING") {
            res.status(400).json({
                success: false,
                message: `Match is already ${match.status.toLowerCase()}`
            });
            return;
        }

        const userId = req.user._id.toString();
        const players = allPlayerIds(match);
        const isAdmin = req.user.role === "ADMIN";

        if (!players.includes(userId) && !isAdmin) {
            res.status(403).json({
                success: false,
                message: "Not authorised to end this match"
            });
            return;
        }

        // FIX (W1): previously any participant could end the match at any
        // time regardless of score — letting a losing player cut the match
        // short to limit their rating loss. Participants may only end the
        // match once its scheduled timer has actually elapsed; ending early
        // is restricted to ADMIN (e.g. for moderation).
        const endsAt = computeEndsAt(match);

        if (!isAdmin && Date.now() < endsAt.getTime()) {
            res.status(403).json({
                success: false,
                message: "Match cannot be ended before its scheduled end time"
            });
            return;
        }

        const endedAt = new Date();
        const { winnerTeam, winnerId, loserId } = resolveWinner(match);

        // "COMPLETED" is the Match schema enum — NOT "FINISHED"
        // endedAt is required by the pre-save hook for terminal statuses
        match.status = "COMPLETED";
        match.endedAt = endedAt;
        match.winnerTeam = winnerTeam;

        await match.save();

        // BattleRoom uses "FINISHED" (different enum from Match)
        await BattleRoom.findByIdAndUpdate(match.battleRoomId, {
            status: "FINISHED"
        });

        const room = await BattleRoom
            .findById(match.battleRoomId)
            .select("roomCode");

        const duration = computeDurationSeconds(match);

        const resultPayload = {
            matchId: match._id,
            winnerTeam,
            winnerId: winnerId ?? null,
            loserId: loserId ?? null,
            duration,
            teamAScore: match.teamAScore,
            teamBScore: match.teamBScore,
        };

        if (room) {
            io.to(room.roomCode).emit("match:ended", resultPayload);

            if (winnerId) {
                io.to(room.roomCode).emit("match:winner", {
                    matchId: match._id,
                    winnerId,
                    winnerTeam,
                });
            }
        }

        // FIX (B1): the previous inline fire-and-forget imported updateRatings /
        // updateRatingsForDraw directly and only ever passed teamA[0] / teamB[0],
        // leaving every other player on a teamSize > 1 match unrated.
        // applyRankedRatings() in match.service.ts loops every winner/loser
        // pairing and is the single correct implementation shared with the
        // sudden-death path in score.service.ts.  It is also a no-op for
        // CASUAL matches, so the matchType guard below is no longer needed.
        applyRankedRatings(match).catch((err) =>
            console.error("[RatingService] Failed to update ratings for match", match._id, err)
        );

        import("../services/achievement.service.js")
            .then(({ checkAchievements }) =>
                checkAchievements(players, match._id.toString())
            )
            .catch((err) =>
                console.error("[AchievementService] Failed to check achievements:", err)
            );

        res.status(200).json({
            success: true,
            message: "Match ended",
            data: resultPayload
        });
    } catch (err) {
        next(err);
    }
};


// ─────────────────────────────────────────────
// 5. POST /match/:matchId/abandon — Abandon Match
// ─────────────────────────────────────────────

/**
 * Player quits mid-match. Opponent wins by default.
 * Match model has abandonReason: String (no abandonedBy ObjectId field).
 * We encode who quit inside the abandonReason string for audit.
 */
export const abandonMatch = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const { matchId } = req.params;
        const { reason } = req.body; // optional client reason

        if (!mongoose.isValidObjectId(matchId)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        const match = await Match.findById(matchId);

        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }

        if (match.status !== "ONGOING") {
            res.status(400).json({
                success: false,
                message: `Cannot abandon — match is already ${match.status.toLowerCase()}`
            });
            return;
        }

        const userIdStr = userId.toString();
        const inTeamA = match.teamA.map((id: any) => id.toString()).includes(userIdStr);
        const inTeamB = match.teamB.map((id: any) => id.toString()).includes(userIdStr);

        if (!inTeamA && !inTeamB) {
            res.status(403).json({
                success: false,
                message: "You are not a player in this match"
            });
            return;
        }

        const winnerTeam: "A" | "B" = inTeamA ? "B" : "A";
        const winningTeam = inTeamA ? match.teamB : match.teamA;
        const losingTeam = inTeamA ? match.teamA : match.teamB;

        // Used for the response/socket payload only ("the winner" for a
        // single-result display) — actual rating updates below cover every
        // player on both teams, not just this one.
        const winnerId: mongoose.Types.ObjectId = winningTeam[0];

        const endedAt = new Date();

        // abandonReason stores who quit — model has no abandonedBy ObjectId field
        match.status = "ABANDONED";
        match.endedAt = endedAt;       // required by pre-save hook
        match.winnerTeam = winnerTeam;
        match.abandonReason = reason
            ? `userId:${userIdStr} — ${reason}`
            : `userId:${userIdStr}`;

        await match.save();

        await BattleRoom.findByIdAndUpdate(match.battleRoomId, {
            status: "FINISHED"
        });

        const room = await BattleRoom
            .findById(match.battleRoomId)
            .select("roomCode");

        const duration = computeDurationSeconds(match);

        const abandonPayload = {
            matchId: match._id,
            abandonedBy: userIdStr,
            winnerTeam,
            winnerId,
            duration,
        };

        if (room) {
            io.to(room.roomCode).emit("match:ended", {
                ...abandonPayload,
                reason: "ABANDONED",
            });

            io.to(room.roomCode).emit("match:winner", {
                matchId: match._id,
                winnerId,
                winnerTeam,
            });
        }

        if (match.matchType === "RANKED") {
            // FIX (W5): previously only winningTeam[0]'s rating was credited
            // and only the user who actually called this endpoint
            // (userIdStr) was penalised — for a teamSize > 1 match every
            // other player on both sides was left untouched. Pair up every
            // winner with every loser (falling back to index 0 for an
            // uneven team) and run each pairing through applyAbandonRating,
            // which carries the abandon penalty multiplier.
            import("../services/match.service.js")
                .then(async ({ applyAbandonRating }) => {
                    const pairs = Math.max(winningTeam.length, losingTeam.length);

                    for (let i = 0; i < pairs; i++) {
                        const winner = (winningTeam[i] ?? winningTeam[0])?.toString();
                        const loser = (losingTeam[i] ?? losingTeam[0])?.toString();

                        if (winner && loser) {
                            await applyAbandonRating(match, winner, loser);
                        }
                    }
                })
                .catch((err) =>
                    console.error("[RatingService] Failed to update ratings on abandon:", err)
                );
        }

        res.status(200).json({
            success: true,
            message: "Match abandoned",
            data: abandonPayload
        });
    } catch (err) {
        next(err);
    }
};


// ─────────────────────────────────────────────
// 6. GET /match/:matchId/result — Match Result
// ─────────────────────────────────────────────

/**
 * Rating changes come from RatingHistory collection —
 * Match model has no ratingChange field.
 */
export const getMatchResult = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { matchId } = req.params;

        if (!mongoose.isValidObjectId(matchId)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        const match = await Match.findById(matchId)
            .populate("teamA", "username fullName avatar")
            .populate("teamB", "username fullName avatar");

        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }

        if (match.status === "ONGOING") {
            res.status(400).json({
                success: false,
                message: "Match is still ongoing"
            });
            return;
        }

        // Only participants (or an admin) may view a match's full result —
        // winner/loser, scores and rating changes shouldn't be enumerable by
        // arbitrary authenticated users. teamA/teamB are populated here, so
        // pull the id whether each entry is a raw ObjectId or a populated doc.
        const requesterId = req.user._id.toString();
        const participantIds = [...match.teamA, ...match.teamB].map(
            (p: any) => (p?._id ?? p).toString()
        );

        if (!participantIds.includes(requesterId) && req.user.role !== "ADMIN") {
            res.status(403).json({
                success: false,
                message: "Not authorised to view this match result"
            });
            return;
        }

        const winner = match.winnerTeam === "A"
            ? match.teamA[0]
            : match.winnerTeam === "B"
                ? match.teamB[0]
                : null;

        const loser = match.winnerTeam === "A"
            ? match.teamB[0]
            : match.winnerTeam === "B"
                ? match.teamA[0]
                : null;

        // Fetch from RatingHistory — NOT from Match doc
        const ratingChanges = await RatingHistory.find({ matchId: match._id })
            .select("userId ratingChange oldRating newRating category");

        const duration = computeDurationSeconds(match);

        res.status(200).json({
            success: true,
            data: {
                winner,
                loser,
                winnerTeam: match.winnerTeam ?? null,
                teamAScore: match.teamAScore,
                teamBScore: match.teamBScore,
                duration,
                matchType: match.matchType,
                status: match.status,
                ratingChanges,
            }
        });
    } catch (err) {
        next(err);
    }
};


// ─────────────────────────────────────────────
// 7. GET /match/history — Match History
// ─────────────────────────────────────────────

export const getMatchHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let userId = req.user._id;
        const queryUsername = req.query.username as string;
        if (queryUsername) {
            const foundUser = await User.findOne({ username: queryUsername });
            if (foundUser) {
                userId = foundUser._id;
            }
        }

        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;

        // Match uses "COMPLETED" and "ABANDONED" — NOT "FINISHED"
        const filter = {
            $or: [
                { teamA: userId },
                { teamB: userId }
            ],
            status: {
                $in: ["COMPLETED", "ABANDONED"] as const
            }
        };

        const [matches, total] = await Promise.all([
            Match.find(filter)
                // FIX (I2): endedAt isn't required by the schema — only
                // enforced by the pre-save hook for terminal statuses. If a
                // match ever slips through without it, MongoDB sorts nulls
                // first in descending order, pushing unresolved matches to
                // the top. createdAt as a secondary key keeps the list
                // stable and recency-ordered even in that edge case.
                .sort({ endedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("teamA", "username fullName avatar")
                .populate("teamB", "username fullName avatar")
                .select("-__v"),
            Match.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: {
                matches,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1,
                }
            }
        });
    } catch (err) {
        next(err);
    }
};


// ─────────────────────────────────────────────
// 8. GET /match/:matchId/details — Match Details
// ─────────────────────────────────────────────

/**
 * Submissions are NOT embedded on Match — queried from Submission collection.
 * Statistics are computed in-memory from submissions — no statistics field on Match.
 * Players and admins only.
 */
export const getMatchDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { matchId } = req.params;

        if (!mongoose.isValidObjectId(matchId)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        const match = await Match.findById(matchId)
            .populate("teamA", "username fullName avatar country")
            .populate("teamB", "username fullName avatar country")
            .populate("battleRoomId", "roomCode battleType difficulty isRanked");

        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }

        const userId = req.user._id.toString();
        const players = allPlayerIds(match);

        if (!players.includes(userId) && req.user.role !== "ADMIN") {
            res.status(403).json({
                success: false,
                message: "Not authorised to view this match"
            });
            return;
        }

        // Submissions live in their own collection
        const submissions = await Submission.find({ matchId: match._id })
            .sort({ createdAt: 1 })
            .populate("userId", "username fullName avatar")
            .select("-sourceCode -__v"); // omit raw code from listing

        // Compute per-player stats in-memory
        const statsMap: Record<string, {
            totalSubmissions: number;
            accepted: number;
            bestScore: number;
        }> = {};

        for (const sub of submissions) {
            const uid = (sub.userId as any)?._id?.toString() ?? sub.userId.toString();

            if (!statsMap[uid]) {
                statsMap[uid] = { totalSubmissions: 0, accepted: 0, bestScore: 0 };
            }

            statsMap[uid].totalSubmissions++;

            if (sub.status === "ACCEPTED") statsMap[uid].accepted++;

            if ((sub.score ?? 0) > statsMap[uid].bestScore) {
                statsMap[uid].bestScore = sub.score ?? 0;
            }
        }

        const duration = computeDurationSeconds(match);

        res.status(200).json({
            success: true,
            data: {
                match: {
                    _id: match._id,
                    status: match.status,
                    matchType: match.matchType,
                    battleType: match.battleType,
                    difficulty: match.difficulty,
                    questionSlug: match.questionSlug,
                    startedAt: match.startedAt,
                    endedAt: match.endedAt ?? null,
                    duration,
                    durationInMinutes: match.durationInMinutes,
                    room: match.battleRoomId,
                },
                players: {
                    teamA: match.teamA,
                    teamB: match.teamB,
                },
                result: {
                    winnerTeam: match.winnerTeam ?? null,
                    teamAScore: match.teamAScore,
                    teamBScore: match.teamBScore,
                },
                submissions,
                statistics: statsMap,
            }
        });
    } catch (err) {
        next(err);
    }
};


// ─────────────────────────────────────────────
// 9. GET /match/:matchId/live — Live Match State
// ─────────────────────────────────────────────

/**
 * Snapshot for a player who refreshed mid-game.
 * endsAt computed from startedAt + durationInMinutes (no stored endsAt on model).
 * Recent submissions fetched from Submission collection (not embedded on Match).
 */
export const getLiveMatch = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { matchId } = req.params;

        if (!mongoose.isValidObjectId(matchId)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        const match = await Match.findById(matchId)
            .populate("teamA", "username fullName avatar")
            .populate("teamB", "username fullName avatar");

        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }

        if (match.status !== "ONGOING") {
            res.status(400).json({
                success: false,
                message: "Match is not live"
            });
            return;
        }

        const userId = req.user._id.toString();
        const players = allPlayerIds(match);

        if (!players.includes(userId)) {
            res.status(403).json({
                success: false,
                message: "You are not a player in this match"
            });
            return;
        }

        const recentSubmissions = await Submission.find({ matchId: match._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("userId", "username fullName avatar")
            .select("userId status score judgeResult language submissionNumber createdAt");

        const endsAt = computeEndsAt(match);
        const remainingMs = Math.max(0, endsAt.getTime() - Date.now());

        res.status(200).json({
            success: true,
            data: {
                matchId: match._id,
                status: match.status,
                questionSlug: match.questionSlug,
                players: {
                    teamA: match.teamA,
                    teamB: match.teamB,
                },
                score: {
                    teamA: match.teamAScore,
                    teamB: match.teamBScore,
                },
                timer: {
                    startedAt: match.startedAt,
                    endsAt,
                    remainingMs,
                    remainingSeconds: Math.floor(remainingMs / 1000),
                },
                recentSubmissions,
            }
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 10. GET /match/:matchId/question — Get Match Question
// ─────────────────────────────────────────────
export const getMatchQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { matchId } = req.params;

        if (!mongoose.isValidObjectId(matchId)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        const match = await Match.findById(matchId);
        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }

        const userId = req.user._id.toString();
        const players = allPlayerIds(match);

        if (!players.includes(userId) && req.user.role !== "ADMIN") {
            res.status(403).json({
                success: false,
                message: "Not authorised to view this match"
            });
            return;
        }

        const FRONTEND_TYPES = ["FRONTEND", "PROJECTS"];
        const BACKEND_TYPES  = ["BACKEND"];
        const PROMPT_TYPES   = ["PROMPT_WAR"];

        let question;
        if (FRONTEND_TYPES.includes(match.battleType)) {
            const { default: FrontendQuestion } = await import("../models/frontendQuestion.model.js");
            question = await FrontendQuestion.findOne({ slug: match.questionSlug });
        } else if (BACKEND_TYPES.includes(match.battleType)) {
            const { default: BackendQuestion } = await import("../models/backendQuestion.model.js");
            question = await BackendQuestion.findOne({ slug: match.questionSlug });
        } else if (PROMPT_TYPES.includes(match.battleType)) {
            const { default: PromptWarScenario } = await import("../models/promptWarScenerio.model.js");
            question = await PromptWarScenario.findOne({ slug: match.questionSlug });
        } else {
            const { default: Question } = await import("../models/question.model.js");
            question = await Question.findOne({ slug: match.questionSlug });
        }

        if (!question) {
            res.status(404).json({ success: false, message: "Question not found" });
            return;
        }

        res.status(200).json({
            success: true,
            data: { question }
        });
    } catch (err) {
        next(err);
    }
};
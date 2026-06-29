import Match from "../models/match.model.js";
import BattleRoom from "../models/battleRoom.model.js";
import { settleMatchAsWon } from "./match.service.js";
import { io } from "../index.js";

// ─────────────────────────────────────────────────────────────────────────
// ASSUMPTION (see judge.service.ts assumption #4 — no Question/Problem
// model available): each Match has exactly one questionSlug, and
// Submission.score is a 0–100 percentage of test cases passed for that one
// question. Team score = the BEST score any teammate has achieved on it so
// far ($max-style, not cumulative) — so a teammate's earlier weak attempt
// doesn't drag down a later strong one. Hitting 100 ends the match
// immediately for that team ("sudden death on full AC").
//
// If your actual rules are cumulative points across multiple problems per
// match instead, this whole function needs to change: the score update
// becomes additive instead of a max, and the win condition needs a
// different trigger than "one submission hit 100" (e.g. "all problems in
// the set have been attempted, compare totals when time runs out" — which
// is exactly what endMatch in match_controller.ts already does for the
// timer-based case).
// ─────────────────────────────────────────────────────────────────────────

/**
 * Called by submission.service.ts after a submission is judged as ACCEPTED
 * or PARTIAL. No-ops safely if the match has already ended by the time
 * judging finishes (timer ran out mid-judge, or another submission already
 * settled it).
 */
export async function applySubmissionScore(
    matchId: string,
    team: "A" | "B",
    submissionScore: number
): Promise<void> {
    const match = await Match.findById(matchId);

    if (!match || match.status !== "ONGOING") {
        return;
    }

    const scoreField = team === "A" ? "teamAScore" : "teamBScore";
    const currentScore = (match as any)[scoreField] ?? 0;
    const updatedScore = Math.max(currentScore, submissionScore);

    if (updatedScore !== currentScore) {
        (match as any)[scoreField] = updatedScore;
        await match.save();
    }

    const room = await BattleRoom.findById(match.battleRoomId).select("roomCode");

    if (room) {
        io.to(room.roomCode).emit("score:update", {
            matchId: match._id,
            team,
            score: updatedScore,
            teamAScore: match.teamAScore,
            teamBScore: match.teamBScore,
        });
    }

    // Sudden death: full marks ends the match right now, no need to wait
    // for the timer.
    if (updatedScore >= 100 && match.status === "ONGOING") {
        await settleMatchAsWon(match, team);

        if (room) {
            // FIX (B2-score): settleMatchAsWon mutates `match` in-memory
            // (status, endedAt) but score fields on the same doc were updated
            // by the save() above. Re-read from DB so the socket payload
            // reflects the definitive persisted state rather than a mix of
            // two in-memory mutation passes.
            const freshMatch = await Match.findById(match._id)
                .select("teamAScore teamBScore startedAt endedAt");

            const duration = freshMatch?.endedAt && freshMatch?.startedAt
                ? Math.floor((freshMatch.endedAt.getTime() - freshMatch.startedAt.getTime()) / 1000)
                : null;

            io.to(room.roomCode).emit("match:ended", {
                matchId: match._id,
                winnerTeam: team,
                duration,
                teamAScore: freshMatch?.teamAScore ?? match.teamAScore,
                teamBScore: freshMatch?.teamBScore ?? match.teamBScore,
            });

            io.to(room.roomCode).emit("match:winner", {
                matchId: match._id,
                winnerTeam: team,
            });
        }
    }
}
import mongoose from "mongoose";
import BattleRoom from "../models/battleRoom.model.js";
import Match from "../models/match.model.js";

// ─────────────────────────────────────────────────────────────────────────
// Lets this service signal a specific HTTP status back to whichever
// controller called it, without forcing battle.controller.ts or
// match.controller.ts to change their existing
// try/catch + res.json({ success, message }) error style.
// ─────────────────────────────────────────────────────────────────────────
export class MatchServiceError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = "MatchServiceError";
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Shared read-only helpers — previously duplicated (with a slightly
// different signature) between battle_controller.ts and match_controller.ts.
// ─────────────────────────────────────────────────────────────────────────

export function allPlayerIds(match: any): string[] {
    return [
        ...match.teamA.map((id: any) => id.toString()),
        ...match.teamB.map((id: any) => id.toString()),
    ];
}

/**
 * Returns the winning side plus EVERY player on each side (not just one
 * representative). Callers that want a single "the winner" id for display
 * (e.g. a 1v1 result screen) should take winningTeamIds[0] — that's exactly
 * correct for teamSize === 1, and is what the controllers below do to stay
 * compatible with the existing socket payload shape.
 */
export function resolveWinner(match: any): {
    winnerTeam: "A" | "B" | "DRAW";
    winningTeamIds: string[];
    losingTeamIds: string[];
} {
    const scoreA: number = match.teamAScore ?? 0;
    const scoreB: number = match.teamBScore ?? 0;

    if (scoreA === scoreB) {
        return { winnerTeam: "DRAW", winningTeamIds: [], losingTeamIds: [] };
    }

    const aWins = scoreA > scoreB;

    return {
        winnerTeam: aWins ? "A" : "B",
        winningTeamIds: (aWins ? match.teamA : match.teamB).map((id: any) => id.toString()),
        losingTeamIds: (aWins ? match.teamB : match.teamA).map((id: any) => id.toString()),
    };
}

export function computeEndsAt(match: any): Date {
    return new Date(match.startedAt.getTime() + match.durationInMinutes * 60 * 1000);
}

export function computeDurationSeconds(match: any): number {
    const end = match.endedAt ?? new Date();
    return Math.floor((end.getTime() - match.startedAt.getTime()) / 1000);
}

// ─────────────────────────────────────────────────────────────────────────
// createMatchForRoom — single source of truth for "turn a ready BattleRoom
// into an ONGOING Match".
//
// Before this fix, battle_controller.ts's startBattle() and
// match_controller.ts's startMatch() each had their own ~25-line copy of
// this exact operation: build the Match doc, link matchId back onto the
// room, flip room.status to STARTED, with slightly different double-start
// guards. Two copies of the same operation will drift the moment either
// route gets a fix the other doesn't (e.g. the questionSlug TODO below).
// Both controllers now call this instead.
// ─────────────────────────────────────────────────────────────────────────
export async function createMatchForRoom(
    room: InstanceType<typeof BattleRoom>,
    options: { questionSlug: string; durationInMinutes: number }
) {
    const { questionSlug, durationInMinutes } = options;

    if (room.status !== "WAITING") {
        throw new MatchServiceError(400, `Match cannot be started — room is ${room.status.toLowerCase()}`);
    }

    const teamAFull = room.teams.teamA.length === room.teamSize;
    const teamBFull = room.teams.teamB.length === room.teamSize;

    if (!teamAFull || !teamBFull) {
        throw new MatchServiceError(400, "Both teams must be full before starting");
    }

    // Guard against double-start (duplicate client request, or the host
    // hitting both /battle/:roomCode/start and /match/start).
    if (room.matchId) {
        const existing = await Match.findById(room.matchId).select("status");
        if (existing && existing.status === "ONGOING") {
            throw new MatchServiceError(409, "A match is already ongoing for this room");
        }
    }

    // Validate questionSlug exists in the appropriate question bank for this battleType.
    const FRONTEND_TYPES = ["FRONTEND", "FULLSTACK"];
    const BACKEND_TYPES  = ["BACKEND"];
    const PROMPT_TYPES   = ["PROMPT_WAR"];

    if (FRONTEND_TYPES.includes(room.battleType)) {
        const { default: FrontendQuestion } = await import("../models/frontendQuestion.model.js");
        const q = await FrontendQuestion.findOne({ slug: questionSlug }).select("_id").lean();
        if (!q) throw new MatchServiceError(400, `No frontend question found for slug "${questionSlug}"`);
    } else if (BACKEND_TYPES.includes(room.battleType)) {
        const { default: BackendQuestion } = await import("../models/backendQuestion.model.js");
        const q = await BackendQuestion.findOne({ slug: questionSlug }).select("_id").lean();
        if (!q) throw new MatchServiceError(400, `No backend question found for slug "${questionSlug}"`);
    } else if (PROMPT_TYPES.includes(room.battleType)) {
        const { default: PromptWarScenario } = await import("../models/promptWarScenerio.model.js");
        const q = await PromptWarScenario.findOne({ slug: questionSlug }).select("_id").lean();
        if (!q) throw new MatchServiceError(400, `No prompt war scenario found for slug "${questionSlug}"`);
    } else {
        // DSA / BUG_FIX
        const { default: Question } = await import("../models/question.model.js");
        const q = await Question.findOne({ slug: questionSlug }).select("_id battleType difficulty").lean<{ battleType?: string; difficulty?: string }>();
        if (!q) throw new MatchServiceError(400, `No question found for slug "${questionSlug}"`);
    }

    const startedAt = new Date();

    const match = await Match.create({
        battleRoomId: room._id,
        questionSlug,
        battleType: room.battleType,
        teamA: room.teams.teamA,
        teamB: room.teams.teamB,
        durationInMinutes,
        difficulty: room.difficulty,
        matchType: room.isRanked ? "RANKED" : "CASUAL",
        status: "ONGOING",
        startedAt,
    });

    room.matchId = match._id as mongoose.Types.ObjectId;
    room.questionSlug = questionSlug;
    room.status = "STARTED";
    await room.save();

    return match;
}

// ─────────────────────────────────────────────────────────────────────────
// Rating updates — fixes two real bugs found in match_controller.ts:
//
// 1. endMatch fired `import("../services/rating.service.js").then(...)`
//    with NO `.catch()` on the DRAW and WIN/LOSS branches. A rejection there
//    became an unhandled promise rejection — either a process crash or a
//    completely silent failure with zero log trace, depending on Node's
//    config. `ratingProcessed` was also never set to `true` anywhere, so
//    there's no way to even detect a match whose rating update silently
//    failed.
//
// 2. resolveWinner (old version) only ever returned teamA[0]/teamB[0] as
//    "the" winner/loser, so for any match with teamSize > 1 every other
//    player's rating was never touched. The loops below cover every player
//    on both sides.
//
//    CAVEAT: I don't have rating.service.ts, so this assumes
//    updateRatings(winnerId, loserId, matchId) can be called once per
//    winner/loser pairing. If team battles are meant to move one shared
//    "team" rating instead (you already have userProfile.ratings.team for
//    this), rating.service.ts needs a team-aware function and this should
//    call that instead — worth confirming once teamSize > 1 modes go live.
// ─────────────────────────────────────────────────────────────────────────

export async function applyRankedRatings(match: InstanceType<typeof Match>): Promise<void> {
    if (match.matchType !== "RANKED") return;

    // FIX (B2): idempotency guard lives here — at the loop level — so it
    // fires once per match rather than once per winner/loser pairing.
    // Previously the guard was inside updateRatings() / updateRatingsForDraw(),
    // which meant the first pair set ratingProcessed: true and every subsequent
    // pair hit the early-return, silently skipping all players beyond index 0.
    if (match.ratingProcessed) {
        console.warn(`[RatingService] Match ${match._id} already processed — skipping`);
        return;
    }

    try {
        const { updateRatings, updateRatingsForDraw } = await import("./rating.service.js");

        if (match.winnerTeam === "DRAW") {
            const pairs = Math.max(match.teamA.length, match.teamB.length);
            for (let i = 0; i < pairs; i++) {
                const a = match.teamA[i]?.toString();
                const b = match.teamB[i]?.toString();
                if (a && b) await updateRatingsForDraw(a, b, match._id.toString());
            }
        } else {
            const winners = match.winnerTeam === "A" ? match.teamA : match.teamB;
            const losers = match.winnerTeam === "A" ? match.teamB : match.teamA;
            const pairs = Math.max(winners.length, losers.length);

            for (let i = 0; i < pairs; i++) {
                const winnerId = (winners[i] ?? winners[0])?.toString();
                const loserId = (losers[i] ?? losers[0])?.toString();
                if (winnerId && loserId) await updateRatings(winnerId, loserId, match._id.toString());
            }
        }

        match.ratingProcessed = true;
        await match.save();
    } catch (err) {
        // A rating failure should never undo the response already sent to
        // the players — but it must be logged, not swallowed.
        console.error(`[RatingService] Failed to update ratings for match ${match._id}:`, err);
    }
}

export async function applyAbandonRating(
    match: InstanceType<typeof Match>,
    winnerId: string,
    abandonerId: string
): Promise<void> {
    if (match.matchType !== "RANKED") return;

    try {
        const { updateRatings } = await import("./rating.service.js");
        await updateRatings(winnerId, abandonerId, match._id.toString(), true);
        match.ratingProcessed = true;
        await match.save();
    } catch (err) {
        console.error(`[RatingService] Failed to update ratings on abandon for match ${match._id}:`, err);
    }
}

// ─────────────────────────────────────────────────────────────────────────
// settleMatchAsWon — used by the new submission/score pipeline
// (score.service.ts) for a "sudden death" finish: one side hits the win
// condition (full marks on the match's single question) before the
// scheduled timer runs out.
//
// Deliberately NOT shared with match_controller.ts's endMatch, which has
// its own (already fixed, W1-gated) timer-based ending logic with its own
// local resolveWinner/winnerId-on-index[0] pattern. Reusing applyRankedRatings
// here instead — it pairs every player on the winning team with every
// player on the losing team, which is the more correct behaviour for
// teamSize > 1 and there's no existing call site depending on the simpler
// pattern for this new path.
// ─────────────────────────────────────────────────────────────────────────
export async function settleMatchAsWon(
    match: InstanceType<typeof Match>,
    winnerTeam: "A" | "B"
): Promise<void> {
    // Idempotent guard: if the match already ended (raced with endMatch,
    // or a duplicate judge callback re-triggered this), do nothing.
    if (match.status !== "ONGOING") return;

    match.winnerTeam = winnerTeam;
    match.status = "COMPLETED";
    match.endedAt = new Date();
    await match.save();

    // applyRankedRatings already no-ops for non-RANKED matches and never
    // throws (it catches and logs internally) — safe to await directly.
    await applyRankedRatings(match);

    import("./achievement.service.js")
        .then(({ checkAchievements }) =>
            checkAchievements(allPlayerIds(match), match._id.toString())
        )
        .catch((err) =>
            console.error(
                `[MatchService] Failed to check achievements after sudden-death settle for match ${match._id}:`,
                err
            )
        );
}
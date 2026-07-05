import mongoose from "mongoose";

import Match from "../models/match.model.js";
import UserProfile from "../models/userProfile.model.js";
import RatingHistory from "../models/ratingHistory.model.js";
import Notification from "../models/notification.model.js";
import { BattleType } from "../interfaces/battleRoom.interface.js";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type RatingCategory =
    | "dsa"
    | "frontend"
    | "backend"
    | "fullstack"
    | "promptWar"
    | "team";

// Maps Match.battleType → UserProfile.ratings key
const BATTLE_TYPE_TO_CATEGORY: Record<string, RatingCategory> = {
    DSA:        "dsa",
    FRONTEND:   "frontend",
    BACKEND:    "backend",
    FULLSTACK:  "fullstack",
    PROMPT_WAR: "promptWar",
    BUG_FIX:    "dsa",    // BUG_FIX uses the DSA rating pool
    TEAM:       "team",
};

// Maps RatingCategory → RatingHistory.category enum value
const CATEGORY_TO_HISTORY_ENUM: Record<RatingCategory, BattleType> = {
    dsa:        "DSA",
    frontend:   "FRONTEND",
    backend:    "BACKEND",
    fullstack:  "FULLSTACK",
    promptWar:  "PROMPT_WAR",
    team:       "TEAM",
};


// ─────────────────────────────────────────────
// Elo calculation
// ─────────────────────────────────────────────

const K_NORMAL   = 32;   // standard K-factor
const K_ABANDON  = 48;   // higher penalty for abandoning
const MIN_RATING = 100;  // floor — rating can never go below this

/**
 * Standard Elo expected score for playerA vs playerB.
 */
function expectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Compute new Elo ratings after a match.
 *
 * @param winnerRating  Current rating of the winner
 * @param loserRating   Current rating of the loser
 * @param isAbandon     If true, uses a higher K-factor to penalise abandonment
 * @returns             { winnerDelta, loserDelta } — signed integer deltas
 */
function computeEloDelta(
    winnerRating: number,
    loserRating: number,
    isAbandon = false
): { winnerDelta: number; loserDelta: number } {
    const K = isAbandon ? K_ABANDON : K_NORMAL;

    const expectedWinner = expectedScore(winnerRating, loserRating);
    const expectedLoser  = expectedScore(loserRating, winnerRating);

    // Actual scores: winner = 1, loser = 0
    const winnerDelta = Math.round(K * (1 - expectedWinner));
    const loserDelta  = Math.round(K * (0 - expectedLoser));

    return { winnerDelta, loserDelta };
}


// ─────────────────────────────────────────────
// Ensure UserProfile exists (upsert helper)
// ─────────────────────────────────────────────

async function getOrCreateProfile(userId: string) {
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
        profile = await UserProfile.create({ userId });
    }

    return profile;
}


// ─────────────────────────────────────────────
// Main export: updateRatings
// ─────────────────────────────────────────────

/**
 * Called by match.controller (fire-and-forget) after a match ends.
 *
 * Responsibilities:
 *  1. Fetch Match doc to get battleType, matchType, teamA, teamB
 *  2. Map battleType → rating category
 *  3. Compute Elo deltas
 *  4. Update UserProfile.ratings[category] for both players atomically
 *  5. Update UserProfile.stats (wins / losses / draws / totalMatches)
 *  6. Write two RatingHistory docs (one per player)
 *  7. Mark match.ratingProcessed = true (idempotency guard)
 *  8. Send MATCH_RESULT notifications to both players
 *
 * @param winnerId   ObjectId string of the winning player
 * @param loserId    ObjectId string of the losing player
 * @param matchId    ObjectId string of the Match doc
 * @param isAbandon  true if the loser abandoned mid-match
 */
export async function updateRatings(
    winnerId: string,
    loserId: string,
    matchId: string,
    isAbandon = false
): Promise<void> {

    const match = await Match.findById(matchId);

    if (!match) {
        console.error(`[RatingService] Match not found: ${matchId}`);
        return;
    }

    // FIX (B2): the idempotency guard (ratingProcessed) has been moved to
    // applyRankedRatings() in match.service.ts, which is the only caller of
    // this function. Keeping it here caused the guard to fire on the *second*
    // pairing in a teamSize > 1 match — the first pair set ratingProcessed:
    // true, then every subsequent pair hit this early-return and was silently
    // skipped. The guard now fires once at the loop level, not per-pair.
    const category = BATTLE_TYPE_TO_CATEGORY[match.battleType];

    if (!category) {
        console.error(`[RatingService] Unknown battleType: ${match.battleType}`);
        return;
    }

    const historyCategory : BattleType = CATEGORY_TO_HISTORY_ENUM[category];

    // Fetch / create profiles for both players
    const [winnerProfile, loserProfile] = await Promise.all([
        getOrCreateProfile(winnerId),
        getOrCreateProfile(loserId),
    ]);

    const winnerOldRating = winnerProfile.ratings[category] ?? 1200;
    const loserOldRating  = loserProfile.ratings[category]  ?? 1200;

    const { winnerDelta, loserDelta } = computeEloDelta(
        winnerOldRating,
        loserOldRating,
        isAbandon
    );

    const winnerNewRating = Math.max(MIN_RATING, winnerOldRating + winnerDelta);
    const loserNewRating  = Math.max(MIN_RATING, loserOldRating  + loserDelta);

    // ── Update winner profile ──────────────────────────────────────────────────
    await UserProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(winnerId) },
        {
            $set:  { [`ratings.${category}`]: winnerNewRating },
            // peakRatings must only ever ratchet upward — $max never lowers it
            // and needs no fetch-then-compare round trip.
            $max:  { [`peakRatings.${category}`]: winnerNewRating },
            $inc:  {
                "stats.wins":         1,
                "stats.totalMatches": 1,
                streak:               1,   // increment win streak
            }
        }
    );

    // ── Update loser profile ───────────────────────────────────────────────────
    // FIX (W6): $set and $inc CAN target different paths in the same update
    // document — the earlier split into two findOneAndUpdate calls (with a
    // misleading no-op $max: {} placeholder) was unnecessary. One round-trip
    // now handles the rating set, stats increment, and streak reset together.
    await UserProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(loserId) },
        {
            $set:  { [`ratings.${category}`]: loserNewRating, streak: 0 },
            // A loss can't raise peak, but keep the write symmetric so a
            // brand-new profile's peak is initialised alongside its rating.
            $max:  { [`peakRatings.${category}`]: loserNewRating },
            $inc:  {
                "stats.losses":       1,
                "stats.totalMatches": 1,
            }
        }
    );

    // ── Write RatingHistory for winner ────────────────────────────────────────
    await RatingHistory.create({
        userId:       new mongoose.Types.ObjectId(winnerId),
        matchId:      match._id,
        category:     historyCategory,
        oldRating:    winnerOldRating,
        newRating:    winnerNewRating,
        ratingChange: winnerDelta,
        reason:       isAbandon ? "WIN_BY_ABANDON" : "WIN",
        matchType:    match.matchType,
    });

    // ── Write RatingHistory for loser ─────────────────────────────────────────
    await RatingHistory.create({
        userId:       new mongoose.Types.ObjectId(loserId),
        matchId:      match._id,
        category:     historyCategory,
        oldRating:    loserOldRating,
        newRating:    loserNewRating,
        ratingChange: loserDelta,
        reason:       isAbandon ? "LOSS_BY_ABANDON" : "LOSS",
        matchType:    match.matchType,
    });

    // FIX (D3): ratingProcessed is now set by the caller (applyRankedRatings)
    // after ALL pairings complete, not here. Writing it per-pair meant a
    // multi-player match would mark itself processed after the first pair
    // and block the remaining pairs via the guard in applyRankedRatings.
    // applyAbandonRating still sets it directly (it has no loop), so that
    // path is unaffected.

    // ── Send notifications to both players ────────────────────────────────────
    const winnerChange = winnerDelta >= 0 ? `+${winnerDelta}` : `${winnerDelta}`;
    const loserChange  = loserDelta  >= 0 ? `+${loserDelta}`  : `${loserDelta}`;

    await Notification.insertMany([
        {
            recipient:       new mongoose.Types.ObjectId(winnerId),
            type:            "MATCH_RESULT",
            title:           "Match Result — Victory 🏆",
            message:         `You won! Rating: ${winnerOldRating} → ${winnerNewRating} (${winnerChange})`,
            relatedEntityId: match._id,
        },
        {
            recipient:       new mongoose.Types.ObjectId(loserId),
            type:            "MATCH_RESULT",
            title:           isAbandon ? "Match Abandoned" : "Match Result — Defeat",
            message:         `You ${isAbandon ? "abandoned" : "lost"}. Rating: ${loserOldRating} → ${loserNewRating} (${loserChange})`,
            relatedEntityId: match._id,
        },
    ]);

    console.log(
        `[RatingService] Match ${matchId} processed. ` +
        `Winner ${winnerId}: ${winnerOldRating} → ${winnerNewRating} (${winnerChange}). ` +
        `Loser ${loserId}: ${loserOldRating} → ${loserNewRating} (${loserChange}).`
    );
}


// ─────────────────────────────────────────────
// Export: updateRatingsForDraw
// ─────────────────────────────────────────────

/**
 * Called when a match ends as a DRAW.
 * Both players get a smaller rating nudge toward each other.
 * Stats: both get +1 draw, +1 totalMatches, streak resets to 0.
 */
export async function updateRatingsForDraw(
    playerAId: string,
    playerBId: string,
    matchId: string
): Promise<void> {

    const match = await Match.findById(matchId);

    if (!match) {
        console.error(`[RatingService] Match not found: ${matchId}`);
        return;
    }

    // FIX (B2): guard moved to applyRankedRatings() — see updateRatings() comment.
    const category        = BATTLE_TYPE_TO_CATEGORY[match.battleType];

    // Mirror the guard in updateRatings(): an unrecognised battleType would
    // otherwise write to ratings.undefined and throw on the required history
    // enum (CATEGORY_TO_HISTORY_ENUM[undefined]).
    if (!category) {
        console.error(`[RatingService] Unknown battleType: ${match.battleType}`);
        return;
    }

    const historyCategory = CATEGORY_TO_HISTORY_ENUM[category];

    const [profileA, profileB] = await Promise.all([
        getOrCreateProfile(playerAId),
        getOrCreateProfile(playerBId),
    ]);

    const ratingA = profileA.ratings[category] ?? 1200;
    const ratingB = profileB.ratings[category] ?? 1200;

    // Draw: both get 0.5 actual score
    const K = K_NORMAL;
    const expectedA = expectedScore(ratingA, ratingB);
    const expectedB = expectedScore(ratingB, ratingA);

    const deltaA = Math.round(K * (0.5 - expectedA));
    const deltaB = Math.round(K * (0.5 - expectedB));

    const newRatingA = Math.max(MIN_RATING, ratingA + deltaA);
    const newRatingB = Math.max(MIN_RATING, ratingB + deltaB);

    await Promise.all([
        UserProfile.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(playerAId) },
            {
                $set: { [`ratings.${category}`]: newRatingA, streak: 0 },
                $max: { [`peakRatings.${category}`]: newRatingA },
                $inc: { "stats.draws": 1, "stats.totalMatches": 1 },
            }
        ),
        UserProfile.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(playerBId) },
            {
                $set: { [`ratings.${category}`]: newRatingB, streak: 0 },
                $max: { [`peakRatings.${category}`]: newRatingB },
                $inc: { "stats.draws": 1, "stats.totalMatches": 1 },
            }
        ),
    ]);

    await RatingHistory.insertMany([
        {
            userId:       new mongoose.Types.ObjectId(playerAId),
            matchId:      match._id,
            category:     historyCategory,
            oldRating:    ratingA,
            newRating:    newRatingA,
            ratingChange: deltaA,
            reason:       "DRAW",
            matchType:    match.matchType,
        },
        {
            userId:       new mongoose.Types.ObjectId(playerBId),
            matchId:      match._id,
            category:     historyCategory,
            oldRating:    ratingB,
            newRating:    newRatingB,
            ratingChange: deltaB,
            reason:       "DRAW",
            matchType:    match.matchType,
        },
    ]);

    // FIX (D3): ratingProcessed removed here — owned by applyRankedRatings caller.

    console.log(`[RatingService] Draw processed for match ${matchId}.`);
}
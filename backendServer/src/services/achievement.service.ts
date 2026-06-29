import mongoose from "mongoose";

import Match from "../models/match.model.js";
import UserProfile from "../models/userProfile.model.js";
import Achievement from "../models/achievement.model.js";
import Notification from "../models/notification.model.js";

// ─────────────────────────────────────────────
// Achievement definitions
// ─────────────────────────────────────────────
//
// These mirror what should be seeded into the Achievement collection.
// Each checker is a pure function that returns true when the player
// has met the requirement, given their current UserProfile stats/ratings.
//
// Achievement.category enum: "RATING" | "MATCHES" | "STREAK" | "DSA" | "PROMPT_WAR" | "SPECIAL"
// Achievement.requirement: the numeric threshold (e.g. 10 wins, 1500 rating)
//
// The name string must exactly match Achievement.name in the DB.

interface AchievementChecker {
    name: string;
    check: (profile: any) => boolean;
}

const ACHIEVEMENT_CHECKERS: AchievementChecker[] = [

    // ── MATCHES ──────────────────────────────────────────────────────────────
    {
        name: "First Blood",
        check: (p) => p.stats.totalMatches >= 1,
    },
    {
        name: "Battle Hardened",
        check: (p) => p.stats.totalMatches >= 10,
    },
    {
        name: "Veteran",
        check: (p) => p.stats.totalMatches >= 50,
    },
    {
        name: "Legend",
        check: (p) => p.stats.totalMatches >= 100,
    },

    // ── WINS ─────────────────────────────────────────────────────────────────
    {
        name: "First Win",
        check: (p) => p.stats.wins >= 1,
    },
    {
        name: "10 Victories",
        check: (p) => p.stats.wins >= 10,
    },
    {
        name: "50 Victories",
        check: (p) => p.stats.wins >= 50,
    },

    // ── STREAK ───────────────────────────────────────────────────────────────
    {
        name: "Hot Streak",
        check: (p) => p.streak >= 3,
    },
    {
        name: "On Fire",
        check: (p) => p.streak >= 5,
    },
    {
        name: "Unstoppable",
        check: (p) => p.streak >= 10,
    },

    // ── RATING ───────────────────────────────────────────────────────────────
    {
        name: "Rising Star",
        check: (p) =>
            Object.values(p.ratings as Record<string, number>)
                .some((r) => r >= 1400),
    },
    {
        name: "Expert",
        check: (p) =>
            Object.values(p.ratings as Record<string, number>)
                .some((r) => r >= 1600),
    },
    {
        name: "Master",
        check: (p) =>
            Object.values(p.ratings as Record<string, number>)
                .some((r) => r >= 1800),
    },
    {
        name: "Grandmaster",
        check: (p) =>
            Object.values(p.ratings as Record<string, number>)
                .some((r) => r >= 2000),
    },

    // ── DSA ───────────────────────────────────────────────────────────────────
    {
        name: "Problem Solver",
        check: (p) => p.stats.dsaSolved >= 10,
    },
    {
        name: "Algorithm Ace",
        check: (p) => p.stats.dsaSolved >= 50,
    },

    // ── PROMPT_WAR ────────────────────────────────────────────────────────────
    {
        name: "Prompt Warrior",
        check: (p) => (p.ratings.promptWar ?? 0) >= 1400,
    },
];


// ─────────────────────────────────────────────
// Internal: unlock a single achievement for a user
// ─────────────────────────────────────────────

async function unlockAchievement(
    userId: string,
    achievement: any,
    profile: any
): Promise<void> {

    const alreadyUnlocked = (profile.achievements as mongoose.Types.ObjectId[])
        .some((id) => id.toString() === achievement._id.toString());

    if (alreadyUnlocked) return;

    // Push achievement + badge reference atomically
    await UserProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
            $addToSet: {
                achievements: achievement._id,
                badges:       achievement._id,
            }
        }
    );

    // Notify the player
    await Notification.create({
        recipient:       new mongoose.Types.ObjectId(userId),
        type:            "ACHIEVEMENT_UNLOCKED",
        title:           "Achievement Unlocked 🏅",
        message:         `You unlocked "${achievement.name}" — ${achievement.description}`,
        relatedEntityId: achievement._id,
    });

    console.log(
        `[AchievementService] User ${userId} unlocked "${achievement.name}"`
    );
}


// ─────────────────────────────────────────────
// Main export: checkAchievements
// ─────────────────────────────────────────────

/**
 * Called by match.controller (fire-and-forget) after a match ends.
 * Runs every registered checker against each player's current profile
 * and unlocks any newly-met achievements.
 *
 * @param playerIds  Array of userId strings (all players in the match)
 * @param matchId    ObjectId string of the completed Match (for logging)
 */
export async function checkAchievements(
    playerIds: string[],
    matchId: string
): Promise<void> {

    // Load all Achievement docs once — shared across all players
    const allAchievements = await Achievement.find({});

    if (allAchievements.length === 0) {
        console.warn("[AchievementService] No achievements seeded in DB — skipping");
        return;
    }

    // Build a quick lookup: name → Achievement doc
    const achievementByName = new Map(
        allAchievements.map((a) => [a.name, a])
    );

    // FIX (I4): previously did one `UserProfile.findOne` per player inside
    // the loop below (2 reads for a 1v1, 8 for a 4v4). Batched into a
    // single query upfront, looked up in-memory per player instead.
    const playerObjectIds = playerIds.map((id) => new mongoose.Types.ObjectId(id));
    const profiles = await UserProfile.find({ userId: { $in: playerObjectIds } });
    const profileByUserId = new Map(
        profiles.map((p) => [p.userId.toString(), p])
    );

    for (const userId of playerIds) {
        try {
            const profile = profileByUserId.get(userId);

            if (!profile) {
                console.warn(`[AchievementService] No profile for user ${userId} — skipping`);
                continue;
            }

            for (const checker of ACHIEVEMENT_CHECKERS) {
                const achievement = achievementByName.get(checker.name);

                if (!achievement) {
                    // Achievement not seeded yet — skip silently
                    continue;
                }

                if (checker.check(profile)) {
                    await unlockAchievement(userId, achievement, profile);
                }
            }
        } catch (err) {
            // Never let one player's failure block the rest
            console.error(
                `[AchievementService] Error checking achievements for user ${userId}:`,
                err
            );
        }
    }

    console.log(
        `[AchievementService] Achievement check complete for match ${matchId} ` +
        `(${playerIds.length} player(s))`
    );
}


// ─────────────────────────────────────────────
// Export: checkAchievementsForUser
// ─────────────────────────────────────────────

/**
 * Single-user variant — useful for manual triggers or profile updates
 * that happen outside of a match (e.g. DSA solve count incremented).
 */
export async function checkAchievementsForUser(userId: string): Promise<void> {
    await checkAchievements([userId], "manual");
}
import mongoose from "mongoose";
import RevisionTracker from "../models/revision.model.js";
import Submission from "../models/submission.model.js";
import Question from "../models/question.model.js";

/**
 * Calculates adaptive spaced repetition next due date and mastery score.
 */
export function calculateAdaptiveInterval(
    difficulty: "EASY" | "MEDIUM" | "HARD",
    solveCount: number,
    topicSolvedCount: number
): { intervalDays: number; topicMultiplier: number; masteryScore: number } {
    // 1. Base interval by difficulty
    const BASE_INTERVALS: Record<string, number> = {
        EASY: 10,
        MEDIUM: 5,
        HARD: 3
    };
    const baseDays = BASE_INTERVALS[difficulty] ?? 5;

    // 2. User topic mastery multiplier
    // Higher solve count in topic = user is comfortable = delay reminder (up to 1.8x)
    // Low solve count = topic needs extra practice = remind sooner (down to 0.6x)
    let topicMultiplier = 1.0;
    if (topicSolvedCount >= 10) {
        topicMultiplier = 1.8;
    } else if (topicSolvedCount >= 5) {
        topicMultiplier = 1.4;
    } else if (topicSolvedCount >= 2) {
        topicMultiplier = 1.1;
    } else {
        topicMultiplier = 0.6;
    }

    // 3. Repeat solve factor
    const repeatFactor = Math.pow(1.4, Math.max(0, solveCount - 1));

    const intervalDays = Math.round(baseDays * topicMultiplier * repeatFactor);
    const masteryScore = Math.min(100, Math.round(35 * topicMultiplier + solveCount * 15));

    return { intervalDays, topicMultiplier, masteryScore };
}

/**
 * Scans accepted submissions for a user and creates/updates RevisionTracker docs.
 */
export async function syncUserRevisionRecords(userId: string | mongoose.Types.ObjectId): Promise<number> {
    const userObjectId = new mongoose.Types.ObjectId(String(userId));

    // Get all accepted submissions for this user
    const submissions = await Submission.find({
        userId: userObjectId,
        $or: [{ status: "ACCEPTED" }, { judgeResult: "ACCEPTED" }]
    }).sort({ createdAt: 1 }).lean();

    if (submissions.length === 0) {
        return 0;
    }

    // Group by questionSlug
    const mapBySlug = new Map<string, {
        questionSlug: string;
        battleType: string;
        lastSolvedAt: Date;
        solveCount: number;
    }>();

    for (const sub of submissions) {
        const slug = sub.questionSlug;
        const existing = mapBySlug.get(slug);
        const subDate = sub.createdAt ? new Date(sub.createdAt) : new Date();

        if (!existing) {
            mapBySlug.set(slug, {
                questionSlug: slug,
                battleType: sub.battleType || "DSA",
                lastSolvedAt: subDate,
                solveCount: 1
            });
        } else {
            existing.solveCount += 1;
            if (subDate > existing.lastSolvedAt) {
                existing.lastSolvedAt = subDate;
            }
        }
    }

    // Count user's total solved per topic/category for adaptive math
    const questionSlugs = Array.from(mapBySlug.keys());
    const questions = await Question.find({ slug: { $in: questionSlugs } })
        .select("title slug difficulty category subCategory topics")
        .lean();

    const qInfoMap = new Map<string, { title: string; difficulty: "EASY" | "MEDIUM" | "HARD"; category: string; topics: string[] }>();
    for (const q of questions as any[]) {
        const rawDiff = String(q.difficulty || "MEDIUM").toUpperCase();
        const normDiff: "EASY" | "MEDIUM" | "HARD" = rawDiff.includes("EASY") ? "EASY" : rawDiff.includes("HARD") ? "HARD" : "MEDIUM";
        if (q.slug) {
            qInfoMap.set(q.slug, {
                title: q.title || q.slug,
                difficulty: normDiff,
                category: q.category || q.subCategory || "General",
                topics: q.topics || q.metadata?.topics || []
            });
        }
    }

    // Count solves per category
    const categoryCounts = new Map<string, number>();
    for (const item of mapBySlug.values()) {
        const info = qInfoMap.get(item.questionSlug);
        const cat = info?.category || "General";
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    }

    let updatedCount = 0;

    for (const item of mapBySlug.values()) {
        const info = qInfoMap.get(item.questionSlug) || {
            title: item.questionSlug,
            difficulty: "MEDIUM" as const,
            category: "General",
            topics: []
        };

        const topicCount = categoryCounts.get(info.category) || 1;
        const { intervalDays, masteryScore } = calculateAdaptiveInterval(info.difficulty, item.solveCount, topicCount);

        const nextDue = new Date(item.lastSolvedAt.getTime() + intervalDays * 24 * 60 * 60 * 1000);

        await RevisionTracker.findOneAndUpdate(
            { userId: userObjectId, questionSlug: item.questionSlug },
            {
                $set: {
                    battleType: item.battleType,
                    title: info.title,
                    difficulty: info.difficulty,
                    topics: info.topics,
                    category: info.category,
                    lastSolvedAt: item.lastSolvedAt,
                    solveCount: item.solveCount,
                    nextRevisionDue: nextDue,
                    masteryScore
                }
            },
            { upsert: true, new: true }
        );

        updatedCount++;
    }

    return updatedCount;
}

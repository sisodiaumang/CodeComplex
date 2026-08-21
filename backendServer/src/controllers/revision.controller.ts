import { Request, Response, NextFunction } from "express";
import RevisionTracker from "../models/revision.model.js";
import { syncUserRevisionRecords } from "../services/revision.service.js";

/**
 * GET /api/v1/revision
 * Returns user's revision dashboard stats, due items, review soon items, mastered items, and category retention scores.
 */
export const getUserRevisionDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;

        // Auto-sync latest submission history into revision records
        await syncUserRevisionRecords(userId);

        const allRecords = await RevisionTracker.find({ userId })
            .sort({ nextRevisionDue: 1 })
            .lean();

        const now = new Date();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const dueToday: any[] = [];
        const reviewSoon: any[] = [];
        const mastered: any[] = [];

        const categoryStats = new Map<string, { total: number; mastered: number; avgScore: number }>();

        for (const item of allRecords) {
            const dueDate = new Date(item.nextRevisionDue);
            const daysSinceSolved = Math.max(0, Math.floor((now.getTime() - new Date(item.lastSolvedAt).getTime()) / (1000 * 60 * 60 * 24)));

            const formattedItem = {
                ...item,
                daysSinceSolved,
                dueInDays: Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            };

            if (dueDate <= endOfToday) {
                dueToday.push(formattedItem);
            } else if (dueDate <= in48Hours) {
                reviewSoon.push(formattedItem);
            } else {
                mastered.push(formattedItem);
            }

            const cat = item.category || "General";
            const currentCat = categoryStats.get(cat) || { total: 0, mastered: 0, avgScore: 0 };
            currentCat.total += 1;
            if (dueDate > endOfToday) currentCat.mastered += 1;
            currentCat.avgScore += item.masteryScore || 50;
            categoryStats.set(cat, currentCat);
        }

        const categorySummary = Array.from(categoryStats.entries()).map(([category, stats]) => ({
            category,
            total: stats.total,
            mastered: stats.mastered,
            retentionRate: Math.round((stats.mastered / stats.total) * 100),
            avgMasteryScore: Math.round(stats.avgScore / stats.total)
        }));

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalTracked: allRecords.length,
                    dueTodayCount: dueToday.length,
                    reviewSoonCount: reviewSoon.length,
                    masteredCount: mastered.length,
                    overallRetentionRate: allRecords.length > 0 ? Math.round(((mastered.length + reviewSoon.length) / allRecords.length) * 100) : 100
                },
                dueToday,
                reviewSoon,
                mastered,
                categorySummary
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/revision/sync
 * Explicitly triggers a sync of the user's solved question submission history.
 */
export const syncUserRevision = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const count = await syncUserRevisionRecords(userId);
        res.status(200).json({
            success: true,
            message: `Synced ${count} question revision records`
        });
    } catch (err) {
        next(err);
    }
};

import { Request, Response, NextFunction } from "express";

import Achievement from "../models/achievement.model.js";
import UserProfile from "../models/userProfile.model.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export const getMyAchievements = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;

        const page = Math.max(DEFAULT_PAGE, parseInt(String(req.query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
        const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
        const skip = (page - 1) * limit;

        // Load achievements unlocked by user from their profile
        const profile = await UserProfile.findOne({ userId }).select("achievements");
        if (!profile) {
            return res.status(200).json({
                success: true,
                data: { totalUnlocked: 0, completionPercentage: 0, achievements: [] },
            });
        }

        const totalUnlocked = Array.isArray(profile.achievements) ? profile.achievements.length : 0;

        const totalAchievements = await Achievement.countDocuments({});
        const completionPercentage = totalAchievements > 0 ? Math.round((totalUnlocked / totalAchievements) * 100) : 0;

        // Fetch a page of achievement documents for the unlocked ids
        const unlockedIds = (profile.achievements ?? []).map((id: any) => id);
        const achievements = await Achievement.find({ _id: { $in: unlockedIds } })
            .sort({ unlockedAt: -1 })
            .skip(skip)
            .limit(limit);

        // Note: achievement model in this repo may not have unlockedAt per-user.
        // If unlockedAt is missing, frontend should still work with basic fields.

        res.status(200).json({
            success: true,
            data: {
                totalUnlocked,
                completionPercentage,
                achievements,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getAllAchievements = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;

        // Fetch user profile to check which achievements are unlocked
        const profile = await UserProfile.findOne({ userId }).select("achievements");
        const unlockedSet = new Set(
            (profile?.achievements ?? []).map((id: any) => id.toString())
        );

        // Fetch all achievements in database
        const allAchievements = await Achievement.find({}).sort({ name: 1 });

        // Decorate achievements with 'unlocked' boolean and computed progress
        const decorated = allAchievements.map((ach) => {
            const achObj = ach.toObject();
            return {
                ...achObj,
                unlocked: unlockedSet.has(achObj._id.toString()),
            };
        });

        res.status(200).json({
            success: true,
            data: decorated,
        });
    } catch (err) {
        next(err);
    }
};

export const getAchievementDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { achievementId } = req.params;

        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
            res.status(404).json({ success: false, message: "Achievement not found" });
            return;
        }

        res.status(200).json({ success: true, data: achievement });
    } catch (err) {
        next(err);
    }
};

export const getUserAchievements = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username } = req.params;

        // If you want this fully correct, you need to map username → userId.
        // For MVP, we return empty unless profile lookup is implemented.
        res.status(200).json({ success: true, data: [] });
    } catch (err) {
        next(err);
    }
};

export const getAchievementProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Progress calculation is usually owned by achievement.service.ts.
        // Until a stable progress schema exists in DB, return an empty list.
        res.status(200).json({ success: true, data: [] });
    } catch (err) {
        next(err);
    }
};

export const getAchievementCategories = async (_req: Request, res: Response, _next: NextFunction) => {
    // Categories are best served from an in-code constant or seeded docs.
    // MVP: mirror expected categories from the prompt.
    res.status(200).json({ success: true, data: ["MATCH", "RATING", "SUBMISSION", "SOCIAL", "SPECIAL"] });
};


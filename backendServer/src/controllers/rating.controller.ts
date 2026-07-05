import { Request, Response, NextFunction } from "express";

import UserProfile from "../models/userProfile.model.js";
import RatingHistory from "../models/ratingHistory.model.js";
import User from "../models/user.model.js";

import { BattleType } from "../interfaces/battleRoom.interface.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

// Maps a raw battleType to the category enum actually stored on RatingHistory
// (see rating.service.ts CATEGORY_TO_HISTORY_ENUM). BUG_FIX shares the DSA
// pool, so its history is written — and must be queried — as "DSA".
const HISTORY_ENUM_BY_BATTLE_TYPE: Record<string, string> = {
    DSA: "DSA",
    BUG_FIX: "DSA",
    FRONTEND: "FRONTEND",
    BACKEND: "BACKEND",
    FULLSTACK: "FULLSTACK",
    PROMPT_WAR: "PROMPT_WAR",
    TEAM: "TEAM",
};

function normalizeBattleType(battleType: unknown): BattleType | null {
    if (!battleType) return null;
    const v = Array.isArray(battleType) ? battleType[0] : (battleType as any);
    if (typeof v !== "string") return null;
    const norm = v.trim().toUpperCase();


    const allowed: BattleType[] = [
        "DSA",
        "FRONTEND",
        "BACKEND",
        "FULLSTACK",
        "PROMPT_WAR",
        "BUG_FIX",
        "TEAM",
    ];

    return (allowed as string[]).includes(norm) ? (norm as BattleType) : null;
}

function getRatingCategory(battleType: BattleType):
    | "dsa"
    | "frontend"
    | "backend"
    | "fullstack"
    | "promptWar"
    | "team" {
    switch (battleType) {
        case "DSA":
        case "BUG_FIX":
            return "dsa";
        case "FRONTEND":
            return "frontend";
        case "BACKEND":
            return "backend";
        case "FULLSTACK":
            return "fullstack";
        case "PROMPT_WAR":
            return "promptWar";
        case "TEAM":
            return "team";
        default:
            return "dsa";
    }
}

export const getMyRating = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id.toString();

        const battleType = normalizeBattleType(req.query.battleType);
        if (!battleType) {
            return res.status(400).json({ success: false, message: "battleType is required and must be valid" });
        }

        const category = getRatingCategory(battleType);

        const profile = await UserProfile.findOne({ userId });

        // ratings/peakRatings are nested numeric maps.
        const rating = (profile?.ratings as any)?.[category] ?? 1200;
        const peakRating = (profile?.peakRatings as any)?.[category] ?? 1200;

        const wins = (profile?.stats as any)?.wins ?? 0;
        const losses = (profile?.stats as any)?.losses ?? 0;
        const draws = (profile?.stats as any)?.draws ?? 0;
        const totalMatches = (profile?.stats as any)?.totalMatches ?? 0;

        const winRate = totalMatches > 0 ? Number(((wins / totalMatches) * 100).toFixed(2)) : 0;

        const higherCount = await UserProfile.countDocuments({
            [`ratings.${category}`]: { $gt: rating },
        } as any);

        const currentRank = higherCount + 1;

        return res.status(200).json({
            success: true,
            message: "Rating fetched successfully",
            data: {
                battleType,
                rating,
                peakRating,
                wins,
                losses,
                draws,
                totalMatches,
                winRate,
                currentRank,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getMyRatingHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id.toString();

        const battleType = normalizeBattleType(req.query.battleType);
        if (!battleType) {
            return res.status(400).json({ success: false, message: "battleType is required and must be valid" });
        }

        const page = Math.max(DEFAULT_PAGE, parseInt(req.query.page as string) || DEFAULT_PAGE);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));
        const skip = (page - 1) * limit;

        // RatingHistory stores the *mapped* category enum, not the raw
        // battleType (e.g. BUG_FIX matches are written as "DSA"). Querying by
        // the raw battleType returned zero rows for BUG_FIX. Map through the
        // rating category → history enum before querying.
        const historyCategory = HISTORY_ENUM_BY_BATTLE_TYPE[battleType];

        const total = await RatingHistory.countDocuments({
            userId,
            category: historyCategory,
        } as any);

        const totalPages = Math.ceil(total / limit);

        const history = await RatingHistory.find({
            userId,
            category: historyCategory,
        } as any)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            data: {
                page,
                totalPages,
                history: history.map((h: any) => ({
                    matchId: h.matchId,
                    oldRating: h.oldRating,
                    newRating: h.newRating,
                    ratingChange: h.ratingChange,
                    reason: h.reason,
                    createdAt: h.createdAt,
                })),
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const battleType = normalizeBattleType(req.query.battleType);
        if (!battleType) {
            return res.status(400).json({ success: false, message: "battleType is required and must be valid" });
        }

        const page = Math.max(DEFAULT_PAGE, parseInt(req.query.page as string) || DEFAULT_PAGE);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));
        const skip = (page - 1) * limit;

        const category = getRatingCategory(battleType);

        const total = await UserProfile.countDocuments();
        const totalPages = Math.ceil(total / limit);

        const top = await UserProfile.find({})
            .sort({ [`ratings.${category}`]: -1 } as any)
            .skip(skip)
            .limit(limit)
            .select("userId ratings");

        const users = await User.find({ _id: { $in: top.map((t: any) => t.userId) } }).select(
            "username avatar country"
        );

        const userById = new Map(users.map((u: any) => [u._id.toString(), u]));

        const data = top.map((row: any, idx: number) => {
            const user = userById.get(row.userId.toString());
            return {
                rank: skip + idx + 1,
                username: user?.username,
                avatar: user?.avatar?.profileImageURL,
                country: user?.country,
                rating: row.ratings?.[category] ?? 1200,
            };
        });

        return res.status(200).json({
            success: true,
            message: "Leaderboard fetched successfully",
            data,
            pagination: { page, limit, totalPages, total },
        });
    } catch (err) {
        next(err);
    }
};

export const getUserRating = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username } = req.params;
        const battleType = normalizeBattleType(req.query.battleType);
        if (!battleType) {
            return res.status(400).json({ success: false, message: "battleType is required and must be valid" });
        }

        const user = await User.findOne({ username: String(username).toLowerCase() }).select(
            "_id username avatar country"
        );
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const category = getRatingCategory(battleType);
        const profile = await UserProfile.findOne({ userId: user._id.toString() });

        return res.status(200).json({
            success: true,
            data: {
                username: user.username,
                rating: (profile?.ratings as any)?.[category] ?? 1200,
                peakRating: (profile?.peakRatings as any)?.[category] ?? 1200,
                wins: (profile?.stats as any)?.wins ?? 0,
                losses: (profile?.stats as any)?.losses ?? 0,
                draws: (profile?.stats as any)?.draws ?? 0,
                country: user.country,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getMatchRatingChanges = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { matchId } = req.params;
        const userId = req.user._id.toString();

        const history = await RatingHistory.find({ matchId, userId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: history.map((h: any) => ({
                user: h.userId,
                oldRating: h.oldRating,
                newRating: h.newRating,
                change: h.ratingChange,
                category: h.category,
                result: h.reason,
                createdAt: h.createdAt,
            })),
        });
    } catch (err) {
        next(err);
    }
};


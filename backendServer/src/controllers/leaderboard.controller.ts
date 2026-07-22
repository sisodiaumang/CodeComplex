import { Request, Response, NextFunction } from "express";

import UserProfile from "../models/userProfile.model.js";
import User from "../models/user.model.js";
import Friendship from "../models/friendship.model.js";

import { BattleType } from "../interfaces/battleRoom.interface.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function normalizeBattleType(battleType: unknown): BattleType | null {
    if (!battleType) return null;
    const v = Array.isArray(battleType) ? battleType[0] : (battleType as any);
    if (typeof v !== "string") return null;
    const norm = v.trim().toUpperCase();

    const allowed: BattleType[] = [
        "DSA",
        "FRONTEND",
        "BACKEND",
        "PROJECTS",
        "PROMPT_WAR",
        "BUG_FIX",
        "TEAM",
    ];

    return (allowed as string[]).includes(norm) ? (norm as BattleType) : null;
}

function getCategory(battleType: BattleType):
    | "dsa"
    | "frontend"
    | "backend"
    | "projects"
    | "promptWar"
    | "team"
    | "bugFix" {
    switch (battleType) {
        case "DSA":
            return "dsa";
        case "BUG_FIX":
            return "bugFix";
        case "FRONTEND":
            return "frontend";
        case "BACKEND":
            return "backend";
        case "PROJECTS":
            return "projects";
        case "PROMPT_WAR":
            return "promptWar";
        case "TEAM":
            return "team";
        default:
            return "dsa";
    }
}

async function fetchLeaderboardPage(params: {
    category: ReturnType<typeof getCategory>;
    page: number;
    limit: number;
    country?: string;
    college?: string;
    usernameUserId?: string; // optional for /me and /search
}): Promise<{ players: any[]; page: number; totalPages: number; total: number }> {
    const { category, page, limit, country, college } = params;

    // Get system bot user IDs to exclude from public leaderboards
    const botUsers = await User.find({ username: "devbot_v1" }).select("_id");
    const botUserIds = botUsers.map(b => b._id);

    const query: any = { userId: { $nin: botUserIds } };
    if (country) query.country = country;
    if (college) query.college = college;

    const total = await UserProfile.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get top profiles, sorted by current rating.
    const top = await UserProfile.find(query)
        .sort({ [`ratings.${category}`]: -1 } as any)
        .skip(skip)
        .limit(limit)
        .select("userId ratings");

    const userIds = top.map((t: any) => t.userId);
    const users = await User.find({ _id: { $in: userIds } }).select(
        "username avatar country"
    );

    const userById = new Map(users.map((u: any) => [u._id.toString(), u]));

    const players: any[] = [];
    let rank = skip;
    for (const row of top) {
        const user = userById.get(row.userId.toString());
        if (!user) continue;
        rank++;
        players.push({
            rank,
            username: user.username,
            avatar: user.avatar?.profileImageURL,
            country: user.country,
            rating: (row.ratings as any)?.[category] ?? 1200,
            wins: 0,
            losses: 0,
        });
    }

    return { players, page, totalPages, total };
}

export const getGlobalLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const battleType = normalizeBattleType(req.query.battleType);
        if (!battleType) {
            return res.status(400).json({ success: false, message: "battleType is required" });
        }

        const category = getCategory(battleType);

        const page = Math.max(DEFAULT_PAGE, parseInt(String(req.query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
        const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

        const { players, totalPages, total } = await fetchLeaderboardPage({ category, page, limit });

        return res.status(200).json({
            success: true,
            data: {
                page,
                totalPages,
                players,
                total,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getCountryLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const battleType = normalizeBattleType(req.query.battleType);
        if (!battleType) {
            return res.status(400).json({ success: false, message: "battleType is required" });
        }

        const country = String(req.query.country ?? "").trim().toUpperCase();
        if (!country) {
            return res.status(400).json({ success: false, message: "country is required" });
        }

        const category = getCategory(battleType);
        const page = Math.max(DEFAULT_PAGE, parseInt(String(req.query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
        const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
        const skip = (page - 1) * limit;

        // `country` lives on User, not UserProfile — so the previous approach
        // (global page, then in-memory filter, with global totals) returned
        // near-empty pages and meaningless pagination. Resolve the country's
        // users first, then rank *their* profiles with a real DB query.
        const countryUsers = await User.find({ country, username: { $ne: "devbot_v1" } }).select("_id username avatar country");
        const userIds = countryUsers.map((u: any) => u._id);
        const userById = new Map(countryUsers.map((u: any) => [u._id.toString(), u]));

        const total = await UserProfile.countDocuments({ userId: { $in: userIds } });
        const totalPages = Math.ceil(total / limit);

        const top = await UserProfile.find({ userId: { $in: userIds } })
            .sort({ [`ratings.${category}`]: -1 } as any)
            .skip(skip)
            .limit(limit)
            .select("userId ratings");

        const players = top.map((row: any, idx: number) => {
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
            data: {
                page,
                totalPages,
                total,
                players,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getCollegeLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    // MVP stub: we don't have college field on UserProfile.
    return res.status(501).json({ success: false, message: "College leaderboard is not implemented yet." });
};

export const getFriendsLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const battleType = normalizeBattleType(req.query.battleType);
        if (!battleType) {
            return res.status(400).json({ success: false, message: "battleType is required" });
        }

        const category = getCategory(battleType);
        const userId = req.user._id.toString();

        const friendships = await Friendship.find({
            status: "ACCEPTED",
            $or: [{ sender: req.user._id }, { receiver: req.user._id }],
        }).select("sender receiver");

        const friendIds = friendships.map((f: any) => {
            const s = f.sender.toString();
            const r = f.receiver.toString();
            return s === userId ? f.receiver : f.sender;
        });

        friendIds.push(req.user._id);

        const page = Math.max(DEFAULT_PAGE, parseInt(String(req.query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
        const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
        const skip = (page - 1) * limit;

        const total = await UserProfile.countDocuments({ userId: { $in: friendIds } });
        const totalPages = Math.ceil(total / limit);

        const top = await UserProfile.find({ userId: { $in: friendIds } })
            .sort({ [`ratings.${category}`]: -1 } as any)
            .skip(skip)
            .limit(limit)
            .select("userId ratings");

        const userIds = top.map((t: any) => t.userId);
        const users = await User.find({ _id: { $in: userIds } }).select("username avatar country");
        const userById = new Map(users.map((u: any) => [u._id.toString(), u]));

        const players = top.map((row: any, idx: number) => {
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
            data: { page, totalPages, total, players },
        });
    } catch (err) {
        next(err);
    }
};

export const getWeeklyLeaderboard = async (_req: Request, res: Response) => {
    return res.status(501).json({
        success: false,
        message: "Weekly leaderboard is not implemented yet.",
    });
};

export const getMonthlyLeaderboard = async (_req: Request, res: Response) => {
    return res.status(501).json({
        success: false,
        message: "Monthly leaderboard is not implemented yet.",
    });
};

export const getMeLeaderboardPosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const battleType = normalizeBattleType(req.query.battleType);
        if (!battleType) {
            return res.status(400).json({ success: false, message: "battleType is required" });
        }

        const category = getCategory(battleType);
        const userId = req.user._id.toString();

        const botUsers = await User.find({ username: "devbot_v1" }).select("_id");
        const botUserIds = botUsers.map(b => b._id);

        // rank = 1 + count of real users with rating strictly greater
        const myProfile = await UserProfile.findOne({ userId }).select(`ratings.${category}`);
        const myRating = (myProfile?.ratings as any)?.[category] ?? 1200;

        const higherCount = await UserProfile.countDocuments({ userId: { $nin: botUserIds }, [`ratings.${category}`]: { $gt: myRating } } as any);
        const myRank = higherCount + 1;

        // show window around user (MVP): grab top 100 and slice by rank
        const windowStart = Math.max(1, myRank - 3);
        const windowEnd = myRank + 3;

        const top = await UserProfile.find({ userId: { $nin: botUserIds } })
            .sort({ [`ratings.${category}`]: -1 } as any)
            .select("userId ratings")
            .limit(windowEnd);

        const userIds = top.map((t: any) => t.userId);
        const users = await User.find({ _id: { $in: userIds } }).select("username avatar country");
        const userById = new Map(users.map((u: any) => [u._id.toString(), u]));

        const slice = top
            .map((row: any, idx: number) => ({
                rank: idx + 1,
                username: userById.get(row.userId.toString())?.username,
                avatar: userById.get(row.userId.toString())?.avatar?.profileImageURL,
                country: userById.get(row.userId.toString())?.country,
                rating: row.ratings?.[category] ?? 1200,
            }))
            .filter((p) => p.rank >= windowStart && p.rank <= windowEnd);

        return res.status(200).json({
            success: true,
            data: {
                myRank,
                players: slice,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const searchLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const battleType = normalizeBattleType(req.query.battleType);
        if (!battleType) {
            return res.status(400).json({ success: false, message: "battleType is required" });
        }
        const category = getCategory(battleType);

        const username = String(req.query.username ?? "").trim().toLowerCase();
        if (!username) {
            return res.status(400).json({ success: false, message: "username is required" });
        }

        const user = await User.findOne({ username }).select("_id");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const profile = await UserProfile.findOne({ userId: user._id.toString() }).select(`ratings.${category}`);
        const rating = (profile?.ratings as any)?.[category] ?? 1200;

        const higherCount = await UserProfile.countDocuments({ [`ratings.${category}`]: { $gt: rating } } as any);
        const rank = higherCount + 1;

        return res.status(200).json({
            success: true,
            data: { rank, rating },
        });
    } catch (err) {
        next(err);
    }
};


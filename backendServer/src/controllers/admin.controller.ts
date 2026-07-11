import { NextFunction, Request, Response } from "express";
import User from "../models/user.model.js";
import BattleRoom from "../models/battleRoom.model.js";
import Match from "../models/match.model.js";
import TokenUsage from "../models/tokenUsage.model.js";
import Report from "../models/report.model.js";
import Question from "../models/question.model.js";
import FrontendQuestion from "../models/frontendQuestion.model.js";
import BackendQuestion from "../models/backendQuestion.model.js";
import PromptWarScenario from "../models/promptWarScenerio.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { runAIModeratorAgent } from "../services/aiModerator.service.js";

/**
 * GET /api/v1/admin/stats
 * Returns dashboard telemetry statistics, site performance metrics, and AI token usages.
 */
export const getAdminStats = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const [
            totalUsers,
            totalMatches,
            activeRooms,
            totalRooms,
            bannedUsers,
            dsaMatches,
            frontendMatches
        ] = await Promise.all([
            User.countDocuments(),
            Match.countDocuments(),
            BattleRoom.countDocuments({ status: { $in: ["WAITING", "STARTED"] } }),
            BattleRoom.countDocuments(),
            User.countDocuments({ isBanned: true }),
            Match.countDocuments({ battleType: "DSA" }),
            Match.countDocuments({ battleType: "FRONTEND" })
        ]);

        // Aggregate AI Token usages
        const tokenStats = await TokenUsage.aggregate([
            {
                $group: {
                    _id: null,
                    promptTokens: { $sum: "$promptTokens" },
                    completionTokens: { $sum: "$completionTokens" },
                    totalTokens: { $sum: "$totalTokens" },
                    cost: { $sum: "$cost" }
                }
            }
        ]);
        const tokens = tokenStats[0] || { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 };

        // Aggregate total unresolved reports
        const openReports = await Report.countDocuments({ status: "PENDING" });

        // Aggregate counts of questions per war/battle type
        const [
            dsaQuestionsCount,
            frontendQuestionsCount,
            backendQuestionsCount,
            promptQuestionsCount
        ] = await Promise.all([
            Question.countDocuments(),
            FrontendQuestion.countDocuments(),
            BackendQuestion.countDocuments(),
            PromptWarScenario.countDocuments()
        ]);

        // Aggregate topic wise question count
        const [
            dsaTopicsAgg,
            frontendTopicsAgg,
            backendTopicsAgg,
            promptTopicsAgg
        ] = await Promise.all([
            Question.aggregate([
                { $unwind: "$metadata.topics" },
                { $group: { _id: "$metadata.topics", count: { $sum: 1 } } }
            ]),
            FrontendQuestion.aggregate([
                { $unwind: "$topics" },
                { $group: { _id: "$topics", count: { $sum: 1 } } }
            ]),
            BackendQuestion.aggregate([
                { $unwind: "$topics" },
                { $group: { _id: "$topics", count: { $sum: 1 } } }
            ]),
            PromptWarScenario.aggregate([
                { $unwind: "$topics" },
                { $group: { _id: "$topics", count: { $sum: 1 } } }
            ])
        ]);

        const topicCounts: Record<string, number> = {};
        const addCounts = (agg: { _id: string; count: number }[]) => {
            for (const item of agg) {
                if (item._id) {
                    const topic = item._id.trim();
                    topicCounts[topic] = (topicCounts[topic] || 0) + item.count;
                }
            }
        };
        addCounts(dsaTopicsAgg);
        addCounts(frontendTopicsAgg);
        addCounts(backendTopicsAgg);
        addCounts(promptTopicsAgg);

        // Sort topics alphabetically
        const topicStats = Object.entries(topicCounts)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));

        // Mock telemetry performance indicators (simulated metrics)
        const performance = {
            apiLatency: "42ms",
            dbQueryTime: "11ms",
            judgeQueueLoad: "1.4s",
            cpuLoad: "14%",
            memoryUsage: "412MB"
        };

        res.status(200).json({
            success: true,
            message: "Admin telemetry statistics fetched successfully",
            data: {
                totalUsers,
                totalMatches,
                activeRooms,
                totalRooms,
                bannedUsers,
                dsaMatches,
                frontendMatches,
                openReports,
                tokens,
                performance,
                questionStats: {
                    DSA: dsaQuestionsCount,
                    FRONTEND: frontendQuestionsCount,
                    BACKEND: backendQuestionsCount,
                    PROMPT_WAR: promptQuestionsCount
                },
                topicStats
            }
        });
    }
);

/**
 * GET /api/v1/admin/users
 * Returns a paginated, searchable, and filterable list of all users.
 */
export const getAdminUsers = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string || "").trim();
        const bannedOnly = req.query.bannedOnly === "true";

        const query: any = {};
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { fullName: { $regex: search, $options: "i" } }
            ];
        }

        if (bannedOnly) {
            query.isBanned = true;
        }

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find(query)
                .select("username email fullName role isBanned createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            message: "Users list fetched",
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    }
);

/**
 * PATCH /api/v1/admin/users/:userId/role
 * Updates a user's role.
 */
export const updateUserRole = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;
        const { role } = req.body;

        const allowedRoles = ["USER", "ADMIN", "MODERATOR", "OWNER"];
        if (!allowedRoles.includes(role)) {
            throw new ApiError(400, `Invalid role. Must be one of: ${allowedRoles.join(", ")}`);
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (user._id.toString() === req.user._id.toString()) {
            throw new ApiError(400, "You cannot modify your own role");
        }

        if (user.role === "OWNER" && req.user.role !== "OWNER") {
            throw new ApiError(403, "Only the OWNER can modify another OWNER's role");
        }

        user.role = role as any;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User role updated to ${role} successfully`,
            data: {
                userId: user._id,
                role: user.role
            }
        });
    }
);

/**
 * PATCH /api/v1/admin/users/:userId/ban
 * Toggles user ban status.
 */
export const toggleUserBan = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (user._id.toString() === req.user._id.toString()) {
            throw new ApiError(400, "You cannot ban yourself");
        }

        if (user.role === "OWNER" || (user.role === "ADMIN" && req.user.role !== "OWNER")) {
            throw new ApiError(403, "You do not have permission to ban this administrator");
        }

        user.isBanned = !user.isBanned;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User account has been ${user.isBanned ? "banned" : "unbanned"} successfully`,
            data: {
                userId: user._id,
                isBanned: user.isBanned
            }
        });
    }
);

/**
 * GET /api/v1/admin/rooms
 * List battle rooms.
 */
export const getAdminRooms = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;

        const [rooms, total] = await Promise.all([
            BattleRoom.find()
                .populate("host", "username email fullName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            BattleRoom.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            message: "Battle rooms fetched",
            data: {
                rooms,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    }
);

/**
 * DELETE /api/v1/admin/rooms/:roomId
 * Forces termination of a battle room.
 */
export const cancelRoomAdmin = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { roomId } = req.params;

        const room = await BattleRoom.findById(roomId);
        if (!room) {
            throw new ApiError(404, "Battle room not found");
        }

        room.status = "CANCELLED";
        await room.save();

        res.status(200).json({
            success: true,
            message: "Battle room terminated successfully"
        });
    }
);

/**
 * GET /api/v1/admin/reports
 * Returns all user moderation reports.
 */
export const getAdminReports = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            Report.find()
                .populate("reporter", "username email")
                .populate("reportedUser", "username email isBanned role")
                .populate("reportedQuestion", "title category difficulty")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Report.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            message: "Reports fetched",
            data: {
                reports,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    }
);

/**
 * PATCH /api/v1/admin/reports/:reportId/status
 * Updates a user report status (PENDING, RESOLVED, DISMISSED).
 */
export const updateReportStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { reportId } = req.params;
        const { status } = req.body;

        const allowedStatus = ["PENDING", "RESOLVED", "DISMISSED"];
        if (!allowedStatus.includes(status)) {
            throw new ApiError(400, `Invalid status. Must be one of: ${allowedStatus.join(", ")}`);
        }

        const report = await Report.findById(reportId);
        if (!report) {
            throw new ApiError(404, "Report not found");
        }

        report.status = status as any;
        await report.save();

        res.status(200).json({
            success: true,
            message: `Report status updated to ${status} successfully`,
            data: report
        });
    }
);

/**
 * POST /api/v1/user/report
 * User-level submission route to flag/report cheaters or toxic players.
 */
export const createReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const reporterId = req.user._id;
        const { targetType, reportedUsername, reportedQuestionId, reason, details, matchId } = req.body;

        if (!targetType || !reason || !details) {
            throw new ApiError(400, "targetType, reason, and details are required");
        }

        if (targetType !== "USER" && targetType !== "QUESTION") {
            throw new ApiError(400, "targetType must be USER or QUESTION");
        }

        let reportedUserId: any = undefined;
        let reportedQId: any = undefined;

        if (targetType === "USER") {
            if (!reportedUsername) {
                throw new ApiError(400, "reportedUsername is required for USER reports");
            }
            const reportedUser = await User.findOne({ username: reportedUsername });
            if (!reportedUser) {
                throw new ApiError(404, "Reported user not found");
            }
            if (reportedUser._id.toString() === reporterId.toString()) {
                throw new ApiError(400, "You cannot report yourself");
            }
            reportedUserId = reportedUser._id;
        } else {
            if (!reportedQuestionId) {
                throw new ApiError(400, "reportedQuestionId is required for QUESTION reports");
            }
            reportedQId = reportedQuestionId;
        }

        const report = await Report.create({
            reporter: reporterId,
            targetType,
            reportedUser: reportedUserId,
            reportedQuestion: reportedQId,
            reason,
            details,
            matchId: matchId || undefined,
            status: "PENDING"
        });

        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            data: report
        });
    }
);

/**
 * POST /api/v1/admin/moderator/run
 * Triggers the AI Moderator Agent to audit and resolve all pending question reports.
 */
export const runModeratorAgent = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const auditLogs = await runAIModeratorAgent();

        res.status(200).json({
            success: true,
            message: `AI Moderator Agent ran successfully. Audited ${auditLogs.length} reports.`,
            data: {
                auditLogs
            }
        });
    }
);

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
import ModelConfig from "../models/modelConfig.model.js";
import ApiKey from "../models/apiKey.model.js";
import { getEnvApiKeys, decrypt, encrypt } from "../services/aiGateway.service.js";
import mongoose from "mongoose";
import os from "os";
import { getAverageApiLatency } from "../utils/telemetry.js";
import { env } from "../config/env.js";
import { sendSiteReportMail } from "../services/emailSend.service.js";

// Global variables for CPU usage tracking
let lastCpuUsage = process.cpuUsage();
let lastCpuTime = process.hrtime();

function getRealtimeCpu(): number {
    const currentUsage = process.cpuUsage();
    const currentTime = process.hrtime();
    
    // Elapsed time in ms
    const elapTime = (currentTime[0] - lastCpuTime[0]) * 1000 + (currentTime[1] - lastCpuTime[1]) / 1000000;
    // CPU user + system times in ms
    const elapUser = (currentUsage.user - lastCpuUsage.user) / 1000;
    const elapSyst = (currentUsage.system - lastCpuUsage.system) / 1000;
    
    lastCpuUsage = currentUsage;
    lastCpuTime = currentTime;
    
    if (elapTime <= 0) return 0;
    const cpuPercent = Math.round(((elapUser + elapSyst) / elapTime) * 100);
    return Math.min(100, Math.max(1, cpuPercent));
}

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
            bugFixQuestionsCount,
            frontendQuestionsCount,
            backendQuestionsCount,
            promptQuestionsCount
        ] = await Promise.all([
            Question.countDocuments({ mode: "solve" }),
            Question.countDocuments({ mode: "bug_fix" }),
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

        // Measure database query time (Ping)
        let dbQueryTime = "0ms";
        try {
            const dbStart = Date.now();
            if (mongoose.connection.db) {
                await mongoose.connection.db.admin().ping();
                dbQueryTime = `${Date.now() - dbStart}ms`;
            }
        } catch (error) {
            console.error("[Telemetry] Failed to ping database:", error);
            dbQueryTime = "Offline";
        }

        // Measure Judge0 queue load / response latency
        let judgeQueueLoad = "Offline";
        try {
            const jStart = Date.now();
            const res = await fetch(`${env.JUDGE0_API_URL}/languages`).catch(() => null);
            if (res && res.ok) {
                const diffS = (Date.now() - jStart) / 1000;
                judgeQueueLoad = `${diffS.toFixed(2)}s`;
            }
        } catch (error) {
            console.error("[Telemetry] Failed to check Judge0 load:", error);
        }

        const apiLatency = getAverageApiLatency();
        const memoryUsage = `${Math.round(process.memoryUsage().rss / (1024 * 1024))}MB`;
        const cpuLoadPercent = getRealtimeCpu();

        const performance = {
            apiLatency,
            dbQueryTime,
            judgeQueueLoad,
            cpuLoad: `${cpuLoadPercent}%`,
            memoryUsage,
            systemCpuLoad: `${os.loadavg()[0].toFixed(2)} / ${os.loadavg()[1].toFixed(2)} / ${os.loadavg()[2].toFixed(2)}`,
            systemTotalMem: `${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(1)}GB`,
            systemFreeMem: `${(os.freemem() / (1024 * 1024 * 1024)).toFixed(1)}GB`,
            systemMemUsed: `${((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024)).toFixed(1)}GB`,
            cpuCores: `${os.cpus().length} Cores`,
            systemUptime: `${(os.uptime() / 3600).toFixed(1)} hours`
        };

        // Aggregate token usage per key
        const usagePerKey = await TokenUsage.aggregate([
            {
                $group: {
                    _id: "$apiKeyId",
                    totalCost: { $sum: "$cost" },
                    requestCount: { $sum: 1 }
                }
            }
        ]);
        const usageMap = new Map<string, { totalCost: number; requestCount: number }>();
        usagePerKey.forEach((item) => {
            if (item._id) {
                usageMap.set(item._id, {
                    totalCost: item.totalCost || 0,
                    requestCount: item.requestCount || 0
                });
            }
        });

        // Get masked api keys and model configurations
        const rawEnvKeys = getEnvApiKeys();
        const envKeysMapped = rawEnvKeys.map((k, index) => {
            const keyId = `env-${index}`;
            const usage = usageMap.get(keyId) || { totalCost: 0, requestCount: 0 };
            return {
                _id: keyId,
                label: `Env API ${index + 1}`,
                masked: k.length > 12 ? `${k.slice(0, 7)}...${k.slice(-5)}` : "Masked Key",
                isActive: true,
                isEnv: true,
                totalCost: usage.totalCost,
                requestCount: usage.requestCount
            };
        });

        const dbKeys = await ApiKey.find();
        const dbKeysMapped = dbKeys.map((dbKey) => {
            let decrypted = "";
            try {
                decrypted = decrypt(dbKey.keyHash, dbKey.iv);
            } catch {}
            const masked = decrypted.length > 12 
                ? `${decrypted.slice(0, 7)}...${decrypted.slice(-5)}` 
                : "Masked Key";
            const usage = usageMap.get(dbKey._id.toString()) || { totalCost: 0, requestCount: 0 };
            return {
                _id: dbKey._id,
                label: dbKey.label,
                masked,
                isActive: dbKey.isActive,
                isEnv: false,
                totalCost: usage.totalCost,
                requestCount: usage.requestCount
            };
        });

        const apiKeys = [...envKeysMapped, ...dbKeysMapped];

        const modelConfigs = await ModelConfig.find().sort({ priority: 1 });

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
                    BUG_FIX: bugFixQuestionsCount,
                    FRONTEND: frontendQuestionsCount,
                    BACKEND: backendQuestionsCount,
                    PROMPT_WAR: promptQuestionsCount
                },
                topicStats,
                apiKeys,
                modelConfigs
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

        if (targetType !== "USER" && targetType !== "QUESTION" && targetType !== "SITE") {
            throw new ApiError(400, "targetType must be USER, QUESTION, or SITE");
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
        } else if (targetType === "QUESTION") {
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

        if (targetType === "SITE") {
            // Trigger report email to the owner of the platform
            await sendSiteReportMail(req.user.username, req.user.email, reason, details);
        }

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

/**
 * POST /api/v1/admin/trigger-reminders
 * Admin trigger to immediately send grind reminder emails to inactive users.
 */
export const triggerGrindRemindersAdmin = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { triggerGrindReminders } = await import("../jobs/grindReminder.js");
        const sent = await triggerGrindReminders();

        res.status(200).json({
            success: true,
            message: `Grind reminder emails triggered successfully. Sent to ${sent} users.`,
            data: {
                sentCount: sent
            }
        });
    }
);

/**
 * PATCH /api/v1/admin/llm-models/:modelId
 * Updates LLM Model settings: spend limit, priority rank, isActive status.
 */
export const updateModelConfig = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { modelId } = req.params;
        const { spendLimit, priority, isActive } = req.body;

        const config = await ModelConfig.findOne({ modelId });
        if (!config) {
            throw new ApiError(404, `Model configuration not found for modelId: ${modelId}`);
        }

        if (typeof spendLimit === "number") config.spendLimit = spendLimit;
        if (typeof priority === "number") config.priority = priority;
        if (typeof isActive === "boolean") config.isActive = isActive;

        await config.save();

        res.status(200).json({
            success: true,
            message: `LLM model config updated for ${modelId}`,
            data: config
        });
    }
);

/**
 * POST /api/v1/admin/llm-models/reset
 * Resets all models' spend totals to zero.
 */
export const resetAllModelsSpent = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        await ModelConfig.updateMany({}, { $set: { limitSpent: 0, lastResetTime: new Date() } });

        res.status(200).json({
            success: true,
            message: "All models spend limits reset successfully"
        });
    }
);

/**
 * POST /api/v1/admin/api-keys
 * Adds a new encrypted Groq API key to the pool.
 */
export const createApiKey = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { key, label } = req.body;
        if (!key) {
            throw new ApiError(400, "API key value is required");
        }

        const cleanKey = key.trim();
        const count = await ApiKey.countDocuments();
        const finalLabel = label?.trim() || `API ${count + 1}`;

        const { iv, encryptedData } = encrypt(cleanKey);

        const newApiKey = await ApiKey.create({
            label: finalLabel,
            keyHash: encryptedData,
            iv,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: "New API key added and encrypted successfully",
            data: {
                _id: newApiKey._id,
                label: newApiKey.label,
                isActive: newApiKey.isActive
            }
        });
    }
);

/**
 * PATCH /api/v1/admin/api-keys/:keyId
 * Toggles an API key's active status.
 */
export const toggleApiKey = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { keyId } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            throw new ApiError(400, "isActive boolean status is required");
        }

        const apiKey = await ApiKey.findById(keyId);
        if (!apiKey) {
            throw new ApiError(404, "API key not found");
        }

        apiKey.isActive = isActive;
        await apiKey.save();

        res.status(200).json({
            success: true,
            message: `API key has been ${isActive ? "activated" : "deactivated"} successfully`,
            data: {
                _id: apiKey._id,
                isActive: apiKey.isActive
            }
        });
    }
);

/**
 * DELETE /api/v1/admin/api-keys/:keyId
 * Deletes an API key from the database.
 */
export const deleteApiKey = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { keyId } = req.params;

        const apiKey = await ApiKey.findById(keyId);
        if (!apiKey) {
            throw new ApiError(404, "API key not found");
        }

        await ApiKey.deleteOne({ _id: keyId });

        res.status(200).json({
            success: true,
            message: "API key deleted successfully from the pool"
        });
    }
);

/**
 * GET /api/v1/admin/questions/:questionId
 * Fetches the full statement and template code of a question.
 */
export const getAdminQuestionDetails = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { questionId } = req.params;
        let questionDoc = await Question.findById(questionId);
        if (!questionDoc) {
            questionDoc = await FrontendQuestion.findById(questionId);
            if (!questionDoc) {
                questionDoc = await BackendQuestion.findById(questionId);
                if (!questionDoc) {
                    questionDoc = await PromptWarScenario.findById(questionId);
                }
            }
        }

        if (!questionDoc) {
            throw new ApiError(404, "Question not found");
        }

        const q: any = questionDoc;
        res.status(200).json({
            success: true,
            message: "Question fetched successfully",
            data: {
                title: q.title || q.scenarioName || "Untitled",
                statement: q.statement || {},
                templates: q.templates || q.starterCode || {},
            }
        });
    }
);

/**
 * GET /api/v1/admin/reports/:reportId
 * Returns a single moderation report details.
 */
export const getAdminReportDetails = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { reportId } = req.params;
        const report = await Report.findById(reportId)
            .populate("reporter", "username email")
            .populate("reportedUser", "username email isBanned role")
            .populate("reportedQuestion", "title category difficulty");

        if (!report) {
            throw new ApiError(404, "Report not found");
        }

        res.status(200).json({
            success: true,
            message: "Report details fetched successfully",
            data: report
        });
    }
);



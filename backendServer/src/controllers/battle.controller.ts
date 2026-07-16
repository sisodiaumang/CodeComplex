import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { nanoid } from "nanoid";

import BattleRoom from "../models/battleRoom.model.js";
import Question from "../models/question.model.js";
import Friendship from "../models/friendship.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import UserProfile from "../models/userProfile.model.js";
import { io } from "../index.js";
import { createMatchForRoom, MatchServiceError } from "../services/match.service.js";
import { IBattleRoom } from "../interfaces/battleRoom.interface.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Generate a readable 6-char uppercase room code, e.g. "AB3X7Q" */
const generateRoomCode = (): string =>
    nanoid(6).toUpperCase();

/** Total player slots = teamSize * 2 (team A + team B) */
const maxPlayers = (teamSize: number): number => teamSize * 2;

/** Map room difficulty (uppercase) → question difficulty (title-case) */
const DIFFICULTY_MAP: Record<string, string> = {
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
};

/**
 * Randomly pick a question matching the room's topics and difficulty.
 * Picks one of the selected topics at random, queries for a battle-enabled
 * question of that category + difficulty, and returns the slug.
 * Falls back: if the first topic has no questions, tries others.
 */
async function pickRandomQuestion(
    room: InstanceType<typeof BattleRoom>
): Promise<string | null> {
    const topics = room.topics ?? [];
    const difficulty = DIFFICULTY_MAP[room.difficulty ?? ""] ?? room.difficulty;

    if (topics.length === 0) return null;

    // Shuffle topics so we try in random order
    const shuffled = [...topics].sort(() => Math.random() - 0.5);

    const FRONTEND_TYPES = ["FRONTEND", "PROJECTS"];
    const BACKEND_TYPES  = ["BACKEND"];
    const PROMPT_TYPES   = ["PROMPT_WAR"];

    let Model: any = Question;
    let queryField = "category";
    let isQuestionModel = true;

    if (FRONTEND_TYPES.includes(room.battleType)) {
        const { default: FrontendQuestion } = await import("../models/frontendQuestion.model.js");
        Model = FrontendQuestion;
        queryField = "topics";
        isQuestionModel = false;
    } else if (BACKEND_TYPES.includes(room.battleType)) {
        const { default: BackendQuestion } = await import("../models/backendQuestion.model.js");
        Model = BackendQuestion;
        queryField = "topics";
        isQuestionModel = false;
    } else if (PROMPT_TYPES.includes(room.battleType)) {
        const { default: PromptWarScenario } = await import("../models/promptWarScenerio.model.js");
        Model = PromptWarScenario;
        queryField = "topics";
        isQuestionModel = false;
    }

    for (const topic of shuffled) {
        const query: any = {
            difficulty: difficulty as any,
            "battleConfig.enabled": true,
        };
        query[queryField] = topic;
        if (isQuestionModel) {
            query.isDeleted = { $ne: true };
            if (room.battleType === "DSA") {
                query.mode = "solve";
            } else if (room.battleType === "BUG_FIX") {
                query.mode = "bug_fix";
            }
        }

        const questions = await Model.find(query)
            .select("slug")
            .lean();

        if (questions.length > 0) {
            const pick = questions[Math.floor(Math.random() * questions.length)];
            return pick.slug ?? null;
        }
    }

    return null;
}

// ─────────────────────────────────────────────
// FIX (D2): the previous implementation stored one entry per user forever —
// a Map that grows without bound across the server's lifetime. Replaced with
// a minimal TTL-evicting wrapper: entries are removed as soon as they expire,
// so the map stays bounded to however many users are actively hitting room
// endpoints right now rather than everyone who ever called one.
//
// Still in-process / single-node — the Redis-backed replacement note from
// the original comment still applies for multi-instance deployments.
// ─────────────────────────────────────────────
const ROOM_ACTION_COOLDOWN_MS = 1500;

class TtlMap {
    private readonly store = new Map<string, ReturnType<typeof setTimeout>>();

    has(key: string): boolean {
        return this.store.has(key);
    }

    set(key: string, ttlMs: number): void {
        const existing = this.store.get(key);
        if (existing !== undefined) clearTimeout(existing);
        const timer = setTimeout(() => this.store.delete(key), ttlMs);
        // Prevent the timer from keeping the Node process alive during tests
        if (typeof timer === "object" && "unref" in timer) (timer as any).unref();
        this.store.set(key, timer);
    }

    delete(key: string): void {
        const existing = this.store.get(key);
        if (existing !== undefined) {
            clearTimeout(existing);
            this.store.delete(key);
        }
    }

    get size(): number {
        return this.store.size;
    }
}

const roomActionCooldown = new TtlMap();

function isOnCooldown(userId: string): boolean {
    return roomActionCooldown.has(userId);
}

function markRoomAction(userId: string): void {
    roomActionCooldown.set(userId, ROOM_ACTION_COOLDOWN_MS);
}

// ─────────────────────────────────────────────
// 0. GET /battle/me/active — Get user's active room
// ─────────────────────────────────────────────

export const getActiveRoom = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const room = await BattleRoom.findOne({
            status: { $in: ["WAITING", "STARTED"] },
            $or: [
                { "teams.teamA": userId },
                { "teams.teamB": userId },
                { host: userId }
            ]
        }).populate("host teams.teamA teams.teamB", "username avatar mascot");

        if (!room) {
            res.status(200).json({ success: true, room: null });
            return;
        }

        res.status(200).json({ success: true, room });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 1. POST /battle  — Create Room
// ─────────────────────────────────────────────

/**
 * Creates a new battle room and places the host in Team A.
 *
 * Body: { battleType, teamSize, difficulty, isRanked, topic? }
 */
export const createRoom = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const hostId = req.user._id;

        const {
            battleType,
            maxTeamSize: teamSize = 1,
            difficulty,
            isRanked = true,
            isSolo = false,
            isPrivate = true,
            topics
        } = req.body;

        // Validate required fields
        if (!battleType || !difficulty) {
            res.status(400).json({
                success: false,
                message: "battleType and difficulty are required"
            });
            return;
        }

        const actualIsRanked = isSolo ? false : isRanked;
        const actualTeamSize = isSolo ? 1 : teamSize;
        const actualIsPrivate = isSolo ? true : isPrivate;

        const minTopics = actualIsRanked !== false ? 3 : 1;
        if (!topics || !Array.isArray(topics) || topics.length < minTopics) {
            res.status(400).json({
                success: false,
                message: `Select at least ${minTopics} topic${minTopics > 1 ? "s" : ""}`
            });
            return;
        }

        // Prevent host from being in multiple active rooms
        const existingRoom = await BattleRoom.findOne({
            status: "WAITING",
            $or: [
                { "teams.teamA": hostId },
                { "teams.teamB": hostId },
                { host: hostId }
            ]
        });

        if (existingRoom) {
            res.status(409).json({
                success: false,
                message: "You are already in an active room",
                roomCode: existingRoom.roomCode
            });
            return;
        }

        // Generate a unique room code (retry on collision).
        let roomCode = "";

        for (let i = 0; i < 5; i++) {
            const candidate = generateRoomCode();
            const collision = await BattleRoom.findOne({ roomCode: candidate });
            if (!collision) {
                roomCode = candidate;
                break;
            }
        }

        if (!roomCode) {
            res.status(503).json({
                success: false,
                message: "Could not generate a unique room code, try again."
            });
            return;
        }

        const room = await BattleRoom.create({
            roomCode,
            host: hostId,
            battleType,
            difficulty,
            teamSize: actualTeamSize,
            isRanked: actualIsRanked,
            isSolo,
            isPrivate: actualIsPrivate,
            topics: topics ?? [],
            status: "WAITING",
            teams: {
                teamA: [hostId],
                teamB: []
            }
        });

        const populated = await BattleRoom.findById(room._id)
            .populate("host", "username fullName avatar mascot")
            .populate("teams.teamA", "username fullName avatar mascot")
            .populate("teams.teamB", "username fullName avatar mascot");

        res.status(201).json({
            success: true,
            message: "Battle room created",
            data: populated
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 2. POST /battle/:roomCode/join — Join Room
// ─────────────────────────────────────────────

/**
 * Joins any available slot in the room (auto-fills Team A first, then Team B).
 * Emits `battle:update` to the room socket channel.
 */
export const joinRoom = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const { roomCode } = req.params;
        const userIdStr = userId.toString();

        if (isOnCooldown(userIdStr)) {
            res.status(429).json({
                success: false,
                message: "You're doing that too fast — slow down a little"
            });
            return;
        }

        const room = await BattleRoom.findOne({ roomCode });

        if (!room) {
            res.status(404).json({
                success: false,
                message: "Room not found"
            });
            return;
        }

        if (room.status !== "WAITING") {
            res.status(400).json({
                success: false,
                message: `Cannot join — room is ${room.status.toLowerCase()}`
            });
            return;
        }

        const inTeamA = room.teams.teamA.map((id) => id.toString()).includes(userIdStr);
        const inTeamB = room.teams.teamB.map((id) => id.toString()).includes(userIdStr);

        if (inTeamA || inTeamB) {
            res.status(409).json({
                success: false,
                message: "You are already in this room"
            });
            return;
        }

        const total =
            room.teams.teamA.length + room.teams.teamB.length;

        if (total >= maxPlayers(room.teamSize)) {
            res.status(400).json({
                success: false,
                message: "Room is full"
            });
            return;
        }

        // Fill Team A first, then Team B — atomically. The read-based checks
        // above give friendly error messages for the common case; these
        // conditional updates close the race where two concurrent joins both
        // pass the capacity check and overfill a team.
        let joined = await BattleRoom.findOneAndUpdate(
            {
                roomCode,
                status: "WAITING",
                "teams.teamA": { $ne: userId },
                "teams.teamB": { $ne: userId },
                $expr: { $lt: [{ $size: "$teams.teamA" }, "$teamSize"] },
            },
            { $push: { "teams.teamA": userId } },
            { new: true }
        );

        if (!joined) {
            // Team A was full (or filled up under us) — try Team B.
            joined = await BattleRoom.findOneAndUpdate(
                {
                    roomCode,
                    status: "WAITING",
                    "teams.teamA": { $ne: userId },
                    "teams.teamB": { $ne: userId },
                    $expr: { $lt: [{ $size: "$teams.teamB" }, "$teamSize"] },
                },
                { $push: { "teams.teamB": userId } },
                { new: true }
            );
        }

        if (!joined) {
            res.status(409).json({
                success: false,
                message: "Could not join — the room just filled up or its state changed",
            });
            return;
        }

        markRoomAction(userIdStr);

        const populated = await BattleRoom.findById(joined._id)
            .populate("host", "username fullName avatar mascot")
            .populate("teams.teamA", "username fullName avatar mascot")
            .populate("teams.teamB", "username fullName avatar mascot");

        // Notify everyone already in the room
        io.to(roomCode).emit("battle:update", populated);

        res.status(200).json({
            success: true,
            message: "Joined room",
            data: populated
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 3. GET /battle/:roomCode — Room Details
// ─────────────────────────────────────────────

/**
 * Returns full room details: host, teams, settings, status.
 */
export const getRoomDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { roomCode } = req.params;

        const room = await BattleRoom.findOne({ roomCode })
            .populate("host", "username fullName avatar mascot")
            .populate("teams.teamA", "username fullName avatar mascot")
            .populate("teams.teamB", "username fullName avatar mascot")
            .populate("matchId");

        if (!room) {
            res.status(404).json({
                success: false,
                message: "Room not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: room
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 4. POST /battle/:roomCode/team-a — Join Team A
// ─────────────────────────────────────────────

/**
 * Moves the requesting user into Team A if a slot is available.
 * Removes them from Team B first if they were there.
 * Emits `battle:team-update`.
 */
export const joinTeamA = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const { roomCode } = req.params;
        const userIdStr = userId.toString();

        if (isOnCooldown(userIdStr)) {
            res.status(429).json({
                success: false,
                message: "You're doing that too fast — slow down a little"
            });
            return;
        }

        const room = await BattleRoom.findOne({ roomCode });

        if (!room) {
            res.status(404).json({ success: false, message: "Room not found" });
            return;
        }

        if (room.status !== "WAITING") {
            res.status(400).json({
                success: false,
                message: "Room is not in waiting state"
            });
            return;
        }

        const inTeamA = room.teams.teamA.map((id) => id.toString()).includes(userIdStr);
        const inTeamB = room.teams.teamB.map((id) => id.toString()).includes(userIdStr);

        if (!inTeamA && !inTeamB) {
            res.status(403).json({
                success: false,
                message: "You are not a member of this room"
            });
            return;
        }

        if (inTeamA) {
            res.status(409).json({
                success: false,
                message: "You are already in Team A"
            });
            return;
        }

        if (room.teams.teamA.length >= room.teamSize) {
            res.status(400).json({
                success: false,
                message: "Team A is full"
            });
            return;
        }

        // Move from B → A atomically: only succeeds if the user is still in
        // Team B and Team A still has a free slot, closing the capacity race.
        const moved = await BattleRoom.findOneAndUpdate(
            {
                roomCode,
                status: "WAITING",
                "teams.teamB": userId,
                "teams.teamA": { $ne: userId },
                $expr: { $lt: [{ $size: "$teams.teamA" }, "$teamSize"] },
            },
            {
                $pull: { "teams.teamB": userId },
                $push: { "teams.teamA": userId },
            },
            { new: true }
        );

        if (!moved) {
            res.status(409).json({
                success: false,
                message: "Could not move to Team A — it just filled up or the room state changed"
            });
            return;
        }

        markRoomAction(userIdStr);

        const populated = await BattleRoom.findById(moved._id)
            .populate("host", "username fullName avatar mascot")
            .populate("teams.teamA", "username fullName avatar mascot")
            .populate("teams.teamB", "username fullName avatar mascot");

        io.to(roomCode).emit("battle:team-update", populated);

        res.status(200).json({
            success: true,
            message: "Moved to Team A",
            data: populated
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 5. POST /battle/:roomCode/team-b — Join Team B
// ─────────────────────────────────────────────

/**
 * Moves the requesting user into Team B if a slot is available.
 * Removes them from Team A first if they were there.
 * Emits `battle:team-update`.
 */
export const joinTeamB = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const { roomCode } = req.params;
        const userIdStr = userId.toString();

        if (isOnCooldown(userIdStr)) {
            res.status(429).json({
                success: false,
                message: "You're doing that too fast — slow down a little"
            });
            return;
        }

        const room = await BattleRoom.findOne({ roomCode });

        if (!room) {
            res.status(404).json({ success: false, message: "Room not found" });
            return;
        }

        if (room.status !== "WAITING") {
            res.status(400).json({
                success: false,
                message: "Room is not in waiting state"
            });
            return;
        }

        const inTeamA = room.teams.teamA.map((id) => id.toString()).includes(userIdStr);
        const inTeamB = room.teams.teamB.map((id) => id.toString()).includes(userIdStr);

        if (!inTeamA && !inTeamB) {
            res.status(403).json({
                success: false,
                message: "You are not a member of this room"
            });
            return;
        }

        if (inTeamB) {
            res.status(409).json({
                success: false,
                message: "You are already in Team B"
            });
            return;
        }

        if (room.teams.teamB.length >= room.teamSize) {
            res.status(400).json({
                success: false,
                message: "Team B is full"
            });
            return;
        }

        // Move from A → B atomically: only succeeds if the user is still in
        // Team A and Team B still has a free slot, closing the capacity race.
        const moved = await BattleRoom.findOneAndUpdate(
            {
                roomCode,
                status: "WAITING",
                "teams.teamA": userId,
                "teams.teamB": { $ne: userId },
                $expr: { $lt: [{ $size: "$teams.teamB" }, "$teamSize"] },
            },
            {
                $pull: { "teams.teamA": userId },
                $push: { "teams.teamB": userId },
            },
            { new: true }
        );

        if (!moved) {
            res.status(409).json({
                success: false,
                message: "Could not move to Team B — it just filled up or the room state changed"
            });
            return;
        }

        markRoomAction(userIdStr);

        const populated = await BattleRoom.findById(moved._id)
            .populate("host", "username fullName avatar mascot")
            .populate("teams.teamA", "username fullName avatar mascot")
            .populate("teams.teamB", "username fullName avatar mascot");

        io.to(roomCode).emit("battle:team-update", populated);

        res.status(200).json({
            success: true,
            message: "Moved to Team B",
            data: populated
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 6. POST /battle/:roomCode/start — Start Battle
// ─────────────────────────────────────────────

/**
 * HOST ONLY.
 * Validates both teams are full, then:
 *   1. Creates a Match document
 *   2. Links it to the BattleRoom
 *   3. Sets room status → STARTED
 *   4. Emits `battle:match-created` with the new match
 *
 * Body: { questionSlug, durationInMinutes }
 */
export const startBattle = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const { roomCode } = req.params;
        const { durationInMinutes = 30 } = req.body;

        const room = await BattleRoom.findOne({ roomCode });

        if (!room) {
            res.status(404).json({ success: false, message: "Room not found" });
            return;
        }

        // Only host can start
        if (room.host.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "Only the host can start the battle"
            });
            return;
        }

        // Randomly pick a question from the room's selected topics + difficulty
        const questionSlug = await pickRandomQuestion(room);

        if (!questionSlug) {
            res.status(404).json({
                success: false,
                message: "No questions found matching the selected topics and difficulty"
            });
            return;
        }

        let match;
        try {
            match = await createMatchForRoom(room, { questionSlug, durationInMinutes });
        } catch (serviceErr) {
            if (serviceErr instanceof MatchServiceError) {
                res.status(serviceErr.statusCode).json({
                    success: false,
                    message: serviceErr.message
                });
                return;
            }
            throw serviceErr;
        }

        const populatedRoom = await BattleRoom.findById(room._id)
            .populate("host", "username fullName avatar mascot")
            .populate("teams.teamA", "username fullName avatar mascot")
            .populate("teams.teamB", "username fullName avatar mascot");

        io.to(roomCode).emit("battle:match-created", {
            room: populatedRoom,
            match
        });

        res.status(200).json({
            success: true,
            message: "Battle started",
            data: {
                room: populatedRoom,
                match
            }
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 7. POST /battle/:roomCode/leave — Leave Room
// ─────────────────────────────────────────────

/**
 * Removes the requesting user from their team.
 * If the user is the host and other players remain, transfers host
 * to the next available player in Team A (or Team B).
 * If the user is the last person, cancels the room.
 * Emits `battle:leave` or `battle:host-change`.
 */
export const leaveRoom = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const { roomCode } = req.params;
        const userIdStr = userId.toString();

        if (isOnCooldown(userIdStr)) {
            res.status(429).json({
                success: false,
                message: "You're doing that too fast — slow down a little"
            });
            return;
        }

        const room = await BattleRoom.findOne({ roomCode });

        if (!room) {
            res.status(404).json({ success: false, message: "Room not found" });
            return;
        }

        if (room.status === "STARTED" && !room.isSolo) {
            res.status(400).json({
                success: false,
                message: "Cannot leave a battle that is already in progress"
            });
            return;
        }

        if (room.status === "FINISHED" || room.status === "CANCELLED") {
            res.status(400).json({
                success: false,
                message: "Room is already closed"
            });
            return;
        }

        // Remove from whichever team they're in
        const beforeA = room.teams.teamA.length;
        const beforeB = room.teams.teamB.length;

        room.teams.teamA = room.teams.teamA.filter(
            (id) => id.toString() !== userIdStr
        ) as typeof room.teams.teamA;

        room.teams.teamB = room.teams.teamB.filter(
            (id) => id.toString() !== userIdStr
        ) as typeof room.teams.teamB;

        const wasInRoom =
            room.teams.teamA.length < beforeA ||
            room.teams.teamB.length < beforeB;

        if (!wasInRoom) {
            res.status(403).json({
                success: false,
                message: "You are not a member of this room"
            });
            return;
        }

        const remaining = [
            ...room.teams.teamA,
            ...room.teams.teamB
        ];

        if (remaining.length === 0) {
            // Last person out — cancel the room
            room.status = "CANCELLED";
            await room.save();
            markRoomAction(userIdStr);

            io.to(roomCode).emit("battle:cancel", { roomCode });

            res.status(200).json({
                success: true,
                message: "Left room (room cancelled — no players remaining)"
            });
            return;
        }

        // Transfer host if needed
        const isHost = room.host.toString() === userIdStr;
        let hostTransferred = false;

        if (isHost && remaining.length > 0) {
            room.host = remaining[0] as mongoose.Types.ObjectId;
            hostTransferred = true;
        }

        await room.save();
        markRoomAction(userIdStr);

        const populated = await BattleRoom.findById(room._id)
            .populate("host", "username fullName avatar mascot")
            .populate("teams.teamA", "username fullName avatar mascot")
            .populate("teams.teamB", "username fullName avatar mascot");

        if (hostTransferred) {
            io.to(roomCode).emit("battle:host-change", populated);
        } else {
            io.to(roomCode).emit("battle:leave", populated);
        }

        res.status(200).json({
            success: true,
            message: hostTransferred
                ? "Left room — host transferred"
                : "Left room",
            data: populated
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 8. DELETE /battle/:roomCode — Delete Room
// ─────────────────────────────────────────────

/**
 * HOST ONLY.
 * Cancels and soft-deletes the room by setting status → CANCELLED.
 * Only allowed while the room is WAITING.
 * Emits `battle:cancel` to all members.
 */
export const deleteRoom = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const { roomCode } = req.params;

        const room = await BattleRoom.findOne({ roomCode });

        if (!room) {
            res.status(404).json({ success: false, message: "Room not found" });
            return;
        }

        if (room.host.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "Only the host can delete the room"
            });
            return;
        }

        if (room.status === "STARTED") {
            res.status(400).json({
                success: false,
                message: "Cannot delete a room while a battle is in progress"
            });
            return;
        }

        if (room.status === "CANCELLED" || room.status === "FINISHED") {
            res.status(400).json({
                success: false,
                message: "Room is already closed"
            });
            return;
        }

        room.status = "CANCELLED";
        await room.save();

        io.to(roomCode).emit("battle:cancel", { roomCode, reason: "Host deleted the room" });

        res.status(200).json({
            success: true,
            message: "Room deleted"
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 9. POST /battle/:roomCode/invite/:userId — Invite friend to room
// ─────────────────────────────────────────────

export const inviteToRoom = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const senderId = req.user._id;
        const { roomCode, userId: targetId } = req.params;

        const room = await BattleRoom.findOne({ roomCode });
        if (!room) {
            res.status(404).json({ success: false, message: "Room not found" });
            return;
        }

        if (room.status !== "WAITING") {
            res.status(400).json({ success: false, message: "Room is no longer accepting players" });
            return;
        }

        const senderIdStr = senderId.toString();
        const inRoom =
            room.teams.teamA.some((id) => id.toString() === senderIdStr) ||
            room.teams.teamB.some((id) => id.toString() === senderIdStr);

        if (!inRoom) {
            res.status(403).json({ success: false, message: "You must be in the room to invite" });
            return;
        }

        const target = await User.findById(targetId).select("_id username");
        if (!target) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        const friendship = await Friendship.findOne({
            status: "ACCEPTED",
            $or: [
                { sender: senderId, receiver: targetId },
                { sender: targetId, receiver: senderId },
            ],
        });

        if (!friendship) {
            res.status(403).json({ success: false, message: "You can only invite friends" });
            return;
        }

        const notification = await Notification.create({
            recipient: new mongoose.Types.ObjectId(targetId as string),
            sender: senderId,
            type: "ROOM_INVITE",
            title: "Battle Invite",
            message: `You've been invited to join a battle!`,
            relatedEntityId: room._id,
            metadata: { roomCode },
        });

        io.to(`user:${targetId}`).emit("notification:new", notification);

        res.status(200).json({ success: true, message: `Invite sent to ${target.username}` });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// 10. GET /battle/:roomCode/friends — List friends available to invite
// ─────────────────────────────────────────────

export const getRoomInvitableFriends = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const { roomCode } = req.params;

        const room = await BattleRoom.findOne({ roomCode });
        if (!room) {
            res.status(404).json({ success: false, message: "Room not found" });
            return;
        }

        const accepted = await Friendship.find({
            status: "ACCEPTED",
            $or: [{ sender: userId }, { receiver: userId }],
        }).select("sender receiver");

        const friendIds = accepted.map((f: any) =>
            String(f.sender) === String(userId) ? f.receiver : f.sender
        );

        const inRoom = new Set([
            ...room.teams.teamA.map((id) => id.toString()),
            ...room.teams.teamB.map((id) => id.toString()),
        ]);

        const availableIds = friendIds.filter((id) => !inRoom.has(id.toString()));

        const users = await User.find({ _id: { $in: availableIds } })
            .select("_id username fullName avatar country")
            .limit(30);

        res.status(200).json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
const getRatingKey = (battleType: string): string => {
    switch (battleType) {
        case "DSA": return "dsa";
        case "FRONTEND": return "frontend";
        case "BACKEND": return "backend";
        case "PROJECTS": return "projects";
        case "PROMPT_WAR": return "promptWar";
        case "BUG_FIX": return "bugFix";
        default: return "dsa";
    }
};

// 11. POST /battle/matchmaking — Find or Create Matchmaking Room
// ─────────────────────────────────────────────
export const startMatchmaking = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user._id;
        const userIdStr = userId.toString();

        const {
            battleType,
            maxTeamSize: teamSize = 1,
            difficulty,
            isRanked = true,
            topics
        } = req.body;

        // Validate required fields
        if (!battleType || !difficulty) {
            res.status(400).json({
                success: false,
                message: "battleType and difficulty are required"
            });
            return;
        }

        const actualIsRanked = isRanked;
        const actualTeamSize = teamSize;

        const minTopics = actualIsRanked !== false ? 3 : 1;
        if (!topics || !Array.isArray(topics) || topics.length < minTopics) {
            res.status(400).json({
                success: false,
                message: `Select at least ${minTopics} topic${minTopics > 1 ? "s" : ""}`
            });
            return;
        }

        // 1. Prevent player from being in multiple active rooms
        const existingRoom = await BattleRoom.findOne({
            status: { $in: ["WAITING", "STARTED"] },
            $or: [
                { "teams.teamA": userId },
                { "teams.teamB": userId },
                { host: userId }
            ]
        });

        if (existingRoom) {
            res.status(200).json({
                success: true,
                message: "You are already in an active room",
                data: existingRoom
            });
            return;
        }

        // Fetch player rating
        const ratingKey = getRatingKey(battleType);
        const playerProfile = await UserProfile.findOne({ userId });
        const playerRating = playerProfile ? ((playerProfile.ratings as any)[ratingKey] ?? 1200) : 1200;

        // 2. Search for a matching WAITING public room
        const rooms = await BattleRoom.find({
            status: "WAITING",
            isPrivate: false,
            isSolo: false,
            battleType,
            difficulty,
            teamSize: actualTeamSize,
            isRanked: actualIsRanked,
            topics: { $all: topics, $size: topics.length }
        }).sort({ createdAt: 1 });

        let candidateRooms = rooms;

        // Apply Skill-Based Matchmaking (SBMM) for Ranked matches
        if (actualIsRanked && rooms.length > 0) {
            const hostIds = rooms.map(r => r.host);
            const hostProfiles = await UserProfile.find({ userId: { $in: hostIds } });
            const hostRatingMap = new Map<string, number>();
            for (const hp of hostProfiles) {
                hostRatingMap.set(hp.userId.toString(), (hp.ratings as any)[ratingKey] ?? 1200);
            }

            candidateRooms = rooms.filter(room => {
                const hostRating = hostRatingMap.get(room.host.toString()) ?? 1200;
                return Math.abs(hostRating - playerRating) <= 200;
            });
        }

        let joinedRoom = null;
        for (const room of candidateRooms) {
            const hasSpaceInA = room.teams.teamA.length < room.teamSize;
            const hasSpaceInB = room.teams.teamB.length < room.teamSize;

            if (hasSpaceInA || hasSpaceInB) {
                let updated = null;
                if (hasSpaceInA) {
                    updated = await BattleRoom.findOneAndUpdate(
                        {
                            _id: room._id,
                            status: "WAITING",
                            "teams.teamA": { $ne: userId },
                            "teams.teamB": { $ne: userId },
                            $expr: { $lt: [{ $size: "$teams.teamA" }, "$teamSize"] }
                        },
                        { $push: { "teams.teamA": userId } },
                        { new: true }
                    );
                }
                if (!updated && hasSpaceInB) {
                    updated = await BattleRoom.findOneAndUpdate(
                        {
                            _id: room._id,
                            status: "WAITING",
                            "teams.teamA": { $ne: userId },
                            "teams.teamB": { $ne: userId },
                            $expr: { $lt: [{ $size: "$teams.teamB" }, "$teamSize"] }
                        },
                        { $push: { "teams.teamB": userId } },
                        { new: true }
                    );
                }

                if (updated) {
                    joinedRoom = updated;
                    break;
                }
            }
        }

        // 3. If joined an existing room
        if (joinedRoom) {
            const roomCode = joinedRoom.roomCode;
            let populated = await BattleRoom.findById(joinedRoom._id)
                .populate("host", "username fullName avatar mascot")
                .populate("teams.teamA", "username fullName avatar mascot")
                .populate("teams.teamB", "username fullName avatar mascot");

            if (!populated) {
                res.status(404).json({
                    success: false,
                    message: "Room not found"
                });
                return;
            }

            const totalPlayers = populated.teams.teamA.length + populated.teams.teamB.length;
            const isFull = totalPlayers >= (populated.teamSize * 2);

            if (isFull) {
                const questionSlug = await pickRandomQuestion(populated);
                if (questionSlug) {
                    try {
                        const match = await createMatchForRoom(populated, { questionSlug, durationInMinutes: 30 });
                        
                        const refetched = await BattleRoom.findById(populated._id)
                            .populate("host", "username fullName avatar mascot")
                            .populate("teams.teamA", "username fullName avatar mascot")
                            .populate("teams.teamB", "username fullName avatar mascot");

                        if (refetched) {
                            populated = refetched;
                        }

                        io.to(roomCode).emit("battle:match-created", {
                            room: populated,
                            match
                        });
                    } catch (startErr) {
                        console.error("[Matchmaking] Auto-start match failed:", startErr);
                        io.to(roomCode).emit("battle:update", populated);
                    }
                } else {
                    io.to(roomCode).emit("battle:update", populated);
                }
            } else {
                io.to(roomCode).emit("battle:update", populated);
            }

            res.status(200).json({
                success: true,
                message: "Matched and joined room",
                data: populated
            });
            return;
        }

        // 4. If no matching room, create a new public room
        let roomCode = "";
        for (let i = 0; i < 5; i++) {
            const candidate = generateRoomCode();
            const collision = await BattleRoom.findOne({ roomCode: candidate });
            if (!collision) {
                roomCode = candidate;
                break;
            }
        }

        if (!roomCode) {
            res.status(503).json({
                success: false,
                message: "Could not generate a unique room code, try again."
            });
            return;
        }

        const newRoom = await BattleRoom.create({
            roomCode,
            host: userId,
            battleType,
            difficulty,
            teamSize: actualTeamSize,
            isRanked: actualIsRanked,
            isSolo: false,
            isPrivate: false,
            topics: topics ?? [],
            status: "WAITING",
            teams: {
                teamA: [userId],
                teamB: []
            }
        });

        const populatedNewRoom = await BattleRoom.findById(newRoom._id)
            .populate("host", "username fullName avatar mascot")
            .populate("teams.teamA", "username fullName avatar mascot")
            .populate("teams.teamB", "username fullName avatar mascot");

        res.status(201).json({
            success: true,
            message: "Matchmaking room created",
            data: populatedNewRoom
        });
    } catch (err) {
        next(err);
    }
};
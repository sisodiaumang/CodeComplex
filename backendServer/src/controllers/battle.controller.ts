import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { nanoid } from "nanoid";

import BattleRoom from "../models/battleRoom.model.js";
import Match from "../models/match.model.js";
import { io } from "../index.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Generate a readable 6-char uppercase room code, e.g. "AB3X7Q" */
const generateRoomCode = (): string =>
    nanoid(6).toUpperCase();

/** Total player slots = teamSize * 2 (team A + team B) */
const maxPlayers = (teamSize: number): number => teamSize * 2;

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
            teamSize = 1,
            difficulty,
            isRanked = true,
            topic
        } = req.body;

        // Validate required fields
        if (!battleType || !difficulty) {
            res.status(400).json({
                success: false,
                message: "battleType and difficulty are required"
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

        // Generate a unique room code (retry on collision)
        let roomCode: string;
        let attempts = 0;

        do {
            roomCode = generateRoomCode();
            const collision = await BattleRoom.findOne({ roomCode });
            if (!collision) break;
            attempts++;
        } while (attempts < 5);

        const room = await BattleRoom.create({
            roomCode,
            host: hostId,
            battleType,
            difficulty,
            teamSize,
            isRanked,
            topic: topic ?? undefined,
            status: "WAITING",
            teams: {
                teamA: [hostId],
                teamB: []
            }
        });

        const populated = await BattleRoom.findById(room._id)
            .populate("host", "username fullName avatar")
            .populate("teams.teamA", "username fullName avatar")
            .populate("teams.teamB", "username fullName avatar");

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

        const userIdStr = userId.toString();
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

        // Fill Team A first, then Team B
        if (room.teams.teamA.length < room.teamSize) {
            room.teams.teamA.push(userId);
        } else {
            room.teams.teamB.push(userId);
        }

        await room.save();

        const populated = await BattleRoom.findById(room._id)
            .populate("host", "username fullName avatar")
            .populate("teams.teamA", "username fullName avatar")
            .populate("teams.teamB", "username fullName avatar");

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
            .populate("host", "username fullName avatar")
            .populate("teams.teamA", "username fullName avatar")
            .populate("teams.teamB", "username fullName avatar")
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

        const userIdStr = userId.toString();
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

        // Move from B → A
        room.teams.teamB = room.teams.teamB.filter(
            (id) => id.toString() !== userIdStr
        ) as typeof room.teams.teamB;

        room.teams.teamA.push(userId);

        await room.save();

        const populated = await BattleRoom.findById(room._id)
            .populate("host", "username fullName avatar")
            .populate("teams.teamA", "username fullName avatar")
            .populate("teams.teamB", "username fullName avatar");

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

        const userIdStr = userId.toString();
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

        // Move from A → B
        room.teams.teamA = room.teams.teamA.filter(
            (id) => id.toString() !== userIdStr
        ) as typeof room.teams.teamA;

        room.teams.teamB.push(userId);

        await room.save();

        const populated = await BattleRoom.findById(room._id)
            .populate("host", "username fullName avatar")
            .populate("teams.teamA", "username fullName avatar")
            .populate("teams.teamB", "username fullName avatar");

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
        const { questionSlug, durationInMinutes = 30 } = req.body;

        if (!questionSlug) {
            res.status(400).json({
                success: false,
                message: "questionSlug is required to start the battle"
            });
            return;
        }

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

        if (room.status !== "WAITING") {
            res.status(400).json({
                success: false,
                message: `Battle cannot be started — room is ${room.status.toLowerCase()}`
            });
            return;
        }

        // For 1v1 both teams must have exactly 1 player; for team modes, both must be full
        const teamAFull = room.teams.teamA.length === room.teamSize;
        const teamBFull = room.teams.teamB.length === room.teamSize;

        if (!teamAFull || !teamBFull) {
            res.status(400).json({
                success: false,
                message: "Both teams must be full before starting"
            });
            return;
        }

        // Create the Match
        const match = await Match.create({
            battleRoomId: room._id,
            questionSlug,
            battleType: room.battleType,
            teamA: room.teams.teamA,
            teamB: room.teams.teamB,
            durationInMinutes,
            difficulty: room.difficulty,
            matchType: room.isRanked ? "RANKED" : "CASUAL",
            status: "ONGOING",
            startedAt: new Date()
        });

        // Link match to room and flip status
        room.matchId = match._id as mongoose.Types.ObjectId;
        room.questionSlug = questionSlug;
        room.status = "STARTED";
        await room.save();

        const populatedRoom = await BattleRoom.findById(room._id)
            .populate("host", "username fullName avatar")
            .populate("teams.teamA", "username fullName avatar")
            .populate("teams.teamB", "username fullName avatar");

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

        const room = await BattleRoom.findOne({ roomCode });

        if (!room) {
            res.status(404).json({ success: false, message: "Room not found" });
            return;
        }

        if (room.status === "STARTED") {
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

        const userIdStr = userId.toString();

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

        const populated = await BattleRoom.findById(room._id)
            .populate("host", "username fullName avatar")
            .populate("teams.teamA", "username fullName avatar")
            .populate("teams.teamB", "username fullName avatar");

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
import { Router } from "express";
import {
    createRoom,
    joinRoom,
    getRoomDetails,
    joinTeamA,
    joinTeamB,
    startBattle,
    leaveRoom,
    deleteRoom
} from "../controllers/battle.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const battleRouter = Router();

// All battle routes require authentication
battleRouter.use(verifyJWT);

// ── Room ──────────────────────────────────────
battleRouter.post("/", createRoom);
battleRouter.get("/:roomCode", getRoomDetails);
battleRouter.delete("/:roomCode", deleteRoom);

// ── Membership ───────────────────────────────
battleRouter.post("/:roomCode/join", joinRoom);
battleRouter.post("/:roomCode/leave", leaveRoom);

// ── Teams ─────────────────────────────────────
battleRouter.post("/:roomCode/team-a", joinTeamA);
battleRouter.post("/:roomCode/team-b", joinTeamB);

// ── Battle Lifecycle ──────────────────────────
battleRouter.post("/:roomCode/start", startBattle);

export default battleRouter;
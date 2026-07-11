import { Router } from "express";
import {
    createRoom,
    getActiveRoom,
    joinRoom,
    getRoomDetails,
    joinTeamA,
    joinTeamB,
    startBattle,
    leaveRoom,
    deleteRoom,
    inviteToRoom,
    getRoomInvitableFriends,
    startMatchmaking,
} from "../controllers/battle.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
    createRoomSchema,
    joinRoomSchema,
    getRoomDetailsSchema,
    joinTeamSchema,
    startBattleSchema,
    leaveRoomSchema,
    deleteRoomSchema,
} from "../validators/battle.validator.js";

const battleRouter = Router();

// All battle routes require authentication
battleRouter.use(verifyJWT);

// ── Room ──────────────────────────────────────
battleRouter.post("/", validateRequest(createRoomSchema), createRoom);
battleRouter.post("/matchmaking", validateRequest(createRoomSchema), startMatchmaking);
battleRouter.get("/me/active", getActiveRoom);
battleRouter.get("/:roomCode", validateRequest(getRoomDetailsSchema), getRoomDetails);
battleRouter.delete("/:roomCode", validateRequest(deleteRoomSchema), deleteRoom);

// ── Membership ───────────────────────────────
battleRouter.post("/:roomCode/join", validateRequest(joinRoomSchema), joinRoom);
battleRouter.post("/:roomCode/leave", validateRequest(leaveRoomSchema), leaveRoom);

// ── Teams ─────────────────────────────────────
battleRouter.post("/:roomCode/team-a", validateRequest(joinTeamSchema), joinTeamA);
battleRouter.post("/:roomCode/team-b", validateRequest(joinTeamSchema), joinTeamB);

// ── Battle Lifecycle ──────────────────────────
battleRouter.post("/:roomCode/start", validateRequest(startBattleSchema), startBattle);

// ── Invites ──────────────────────────────────
battleRouter.get("/:roomCode/friends", getRoomInvitableFriends);
battleRouter.post("/:roomCode/invite/:userId", inviteToRoom);

export default battleRouter;
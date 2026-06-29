import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    joinSpectate,
    leaveSpectate,
    getSpectators,
    getSpectatorStatus,
} from "../controllers/spectate.controller.js";

const router = Router();

router.post("/:matchId", verifyJWT, joinSpectate);
router.delete("/:matchId", verifyJWT, leaveSpectate);
router.get("/:matchId", verifyJWT, getSpectators);
router.get("/:matchId/status", verifyJWT, getSpectatorStatus);

export default router;


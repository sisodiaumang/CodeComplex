import { Router } from "express";

import {
    startMatch,
    getMatch,
    getCurrentMatch,
    endMatch,
    abandonMatch,
    getMatchResult,
    getMatchHistory,
    getMatchDetails,
    getLiveMatch
} from "../controllers/match.controller.js";

// ASSUMPTION: I don't have your HTTP auth middleware file (only
// socketAuth.middleware.js was visible, which is socket-only). Going by the
// generateAccessToken/generateRefreshToken naming in user.model.ts, this
// assumes an HTTP equivalent named `verifyJWT` in
// middlewares/auth.middleware.js. If your actual middleware has a different
// name/path, update just this import line.
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All match routes require an authenticated user — every handler reads
// req.user._id (directly, or via allPlayerIds/role checks).
router.use(verifyJWT);

// --------------------
// Literal routes — must be registered before the dynamic "/:matchId"
// routes below, or Express will match "/current" and "/history" as a
// matchId value and fail the ObjectId check inside those handlers.
// --------------------
router.post("/start", startMatch);
router.get("/current", getCurrentMatch);
router.get("/history", getMatchHistory);

// --------------------
// Dynamic "/:matchId" routes
// --------------------
router.get("/:matchId", getMatch);
router.get("/:matchId/details", getMatchDetails);
router.get("/:matchId/result", getMatchResult);
router.get("/:matchId/live", getLiveMatch);
router.post("/:matchId/end", endMatch);
router.post("/:matchId/abandon", abandonMatch);

export default router;
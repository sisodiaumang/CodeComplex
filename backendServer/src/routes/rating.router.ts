import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    getMyRating,
    getMyRatingHistory,
    getLeaderboard,
    getUserRating,
    getMatchRatingChanges,
} from "../controllers/rating.controller.js";

const router = Router();

router.get("/me", verifyJWT, getMyRating);
router.get("/history", verifyJWT, getMyRatingHistory);
router.get("/leaderboard", getLeaderboard);
router.get("/user/:username", getUserRating);
router.get("/match/:matchId", verifyJWT, getMatchRatingChanges);

export default router;


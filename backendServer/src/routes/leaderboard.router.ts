import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { cacheMiddleware } from "../middlewares/cache.middleware.js";

import {
    getGlobalLeaderboard,
    getCountryLeaderboard,
    getFriendsLeaderboard,
    getCollegeLeaderboard,
    getWeeklyLeaderboard,
    getMonthlyLeaderboard,
    getMeLeaderboardPosition,
    searchLeaderboard,
} from "../controllers/leaderboard.controller.js";

const router = Router();

// Cache public leaderboards for 60 seconds
router.get("/global", cacheMiddleware(60), getGlobalLeaderboard);
router.get("/country", cacheMiddleware(60), getCountryLeaderboard);
router.get("/friends", verifyJWT, getFriendsLeaderboard);
router.get("/weekly", cacheMiddleware(60), getWeeklyLeaderboard);
router.get("/monthly", cacheMiddleware(60), getMonthlyLeaderboard);
router.get("/college", cacheMiddleware(60), getCollegeLeaderboard);
router.get("/me", verifyJWT, getMeLeaderboardPosition);
router.get("/search", cacheMiddleware(30), searchLeaderboard);

export default router;

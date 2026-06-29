import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";

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

router.get("/global", getGlobalLeaderboard);
router.get("/country", getCountryLeaderboard);
router.get("/friends", verifyJWT, getFriendsLeaderboard);
router.get("/weekly", getWeeklyLeaderboard);
router.get("/monthly", getMonthlyLeaderboard);
router.get("/college", getCollegeLeaderboard);
router.get("/me", verifyJWT, getMeLeaderboardPosition);
router.get("/search", searchLeaderboard);

export default router;


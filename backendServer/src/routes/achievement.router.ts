import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { cacheMiddleware } from "../middlewares/cache.middleware.js";

import {
    getMyAchievements,
    getAllAchievements,
    getAchievementProgress,
    getAchievementCategories,
    getUserAchievements,
    getAchievementDetails,
} from "../controllers/achievement.controller.js";

const router = Router();

router.get("/", verifyJWT, getAllAchievements);
router.get("/me", verifyJWT, getMyAchievements);
router.get("/progress", verifyJWT, getAchievementProgress);

// Cache public achievements and categories
router.get("/categories", cacheMiddleware(300), getAchievementCategories);
router.get("/user/:username", cacheMiddleware(60), getUserAchievements);
router.get("/:achievementId", cacheMiddleware(120), getAchievementDetails);

export default router;

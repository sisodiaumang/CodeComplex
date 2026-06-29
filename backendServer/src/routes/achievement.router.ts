import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    getMyAchievements,
    getAchievementProgress,
    getAchievementCategories,
    getUserAchievements,
    getAchievementDetails,
} from "../controllers/achievement.controller.js";

const router = Router();

router.get("/me", verifyJWT, getMyAchievements);
router.get("/progress", verifyJWT, getAchievementProgress);
router.get("/categories", getAchievementCategories);
router.get("/user/:username", getUserAchievements);
router.get("/:achievementId", getAchievementDetails);

export default router;


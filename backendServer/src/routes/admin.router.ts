import { Router } from "express";
import {
    getAdminStats,
    getAdminUsers,
    updateUserRole,
    toggleUserBan,
    getAdminRooms,
    cancelRoomAdmin,
    getAdminReports,
    updateReportStatus,
    runModeratorAgent,
    triggerGrindRemindersAdmin,
    updateModelConfig,
    resetAllModelsSpent,
    createApiKey,
    toggleApiKey,
    deleteApiKey,
    getAdminQuestionDetails,
    getAdminReportDetails
} from "../controllers/admin.controller.js";
import { verifyJWT, verifyAdminOrModerator } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply auth middlewares globally to all admin endpoints
router.use(verifyJWT);
router.use(verifyAdminOrModerator);

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/ban", toggleUserBan);
router.get("/rooms", getAdminRooms);
router.delete("/rooms/:roomId", cancelRoomAdmin);
router.get("/reports", getAdminReports);
router.get("/reports/:reportId", getAdminReportDetails);
router.get("/questions/:questionId", getAdminQuestionDetails);
router.patch("/reports/:reportId/status", updateReportStatus);
router.post("/moderator/run", runModeratorAgent);
router.post("/trigger-reminders", triggerGrindRemindersAdmin);

// LLM Model Config Routing
router.patch("/llm-models/:modelId", updateModelConfig);
router.post("/llm-models/reset", resetAllModelsSpent);

// API Keys Routing
router.post("/api-keys", createApiKey);
router.patch("/api-keys/:keyId", toggleApiKey);
router.delete("/api-keys/:keyId", deleteApiKey);

export default router;

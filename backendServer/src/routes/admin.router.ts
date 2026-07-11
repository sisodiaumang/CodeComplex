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
    runModeratorAgent
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
router.patch("/reports/:reportId/status", updateReportStatus);
router.post("/moderator/run", runModeratorAgent);

export default router;

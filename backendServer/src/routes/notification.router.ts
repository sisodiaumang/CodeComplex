import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    getNotifications,
    getNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", verifyJWT, getNotifications);
router.get("/:notificationId", verifyJWT, getNotification);

router.patch("/:notificationId/read", verifyJWT, markAsRead);
router.patch("/read-all", verifyJWT, markAllAsRead);

router.delete("/:notificationId", verifyJWT, deleteNotification);
router.delete("/", verifyJWT, deleteAllNotifications);

export default router;


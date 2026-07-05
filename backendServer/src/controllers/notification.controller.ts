import { Request, Response, NextFunction } from "express";

import Notification from "../models/notification.model.js";

// Notification controller must be simple:
// - It only manages notification lifecycle (read/delete/list)
// - Other controllers/services create notifications.

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;

        const page = Math.max(DEFAULT_PAGE, parseInt(String(req.query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
        const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
        const skip = (page - 1) * limit;

        const unreadOnly = String(req.query.unreadOnly ?? "false").toLowerCase() === "true";

        const filter: any = { recipient: userId };
        if (unreadOnly) filter.isRead = false;

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments(filter),
        ]);

        // When unreadOnly is set, `total` (countDocuments over the same
        // isRead:false filter) already IS the unread total — using
        // notifications.length capped the count at one page (≤ limit).
        const unreadCount = unreadOnly
            ? total
            : await Notification.countDocuments({ recipient: userId, isRead: false });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                page,
                totalPages: Math.ceil(total / limit),
                unreadCount,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const notification = await Notification.findOne({ _id: notificationId, recipient: userId });

        if (!notification) {
            res.status(404).json({ success: false, message: "Notification not found" });
            return;
        }

        res.status(200).json({ success: true, data: notification });
    } catch (err) {
        next(err);
    }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const updated = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!updated) {
            res.status(404).json({ success: false, message: "Notification not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (err) {
        next(err);
    }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
        res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
        next(err);
    }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const deleted = await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
        if (!deleted) {
            res.status(404).json({ success: false, message: "Notification not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Notification deleted" });
    } catch (err) {
        next(err);
    }
};

export const deleteAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        await Notification.deleteMany({ recipient: userId });
        res.status(200).json({ success: true, message: "All notifications deleted" });
    } catch (err) {
        next(err);
    }
};


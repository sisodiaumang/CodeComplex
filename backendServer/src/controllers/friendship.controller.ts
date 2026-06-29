import { Request, Response, NextFunction } from "express";

import Friendship from "../models/friendship.model.js";
import User from "../models/user.model.js";
import UserProfile from "../models/userProfile.model.js";
import Notification from "../models/notification.model.js";

import { IFriendship, FriendshipStatus } from "../interfaces/friendship.interface.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function toObjectIdStr(value: unknown): string | null {
    if (!value) return null;
    // Accept mongoose ObjectId-ish strings
    return String(value);
}

function buildFriendUserDto(u: any) {
    return {
        _id: u._id,
        username: u.username,
        fullName: u.fullName ?? u.username,
        avatar: u.avatar,
        country: u.country,
        rating: u.rating,
        isOnline: u.isOnline,
    };
}

export const sendFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const senderId = req.user._id;
        const receiverIdStr = toObjectIdStr(req.params.userId);
        if (!receiverIdStr) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }
        const receiverId = receiverIdStr as any;

        if (String(senderId) === String(receiverId)) {
            return res.status(400).json({ success: false, message: "Cannot send friend request to yourself" });
        }

        const receiver = await User.findById(receiverId).select("_id username fullName avatar country isOnline");
        if (!receiver) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Already friends check (reverse pair)
        const existingFriend = await Friendship.findOne({
            $or: [
                { sender: senderId, receiver: receiverId, status: "ACCEPTED" },
                { sender: receiverId, receiver: senderId, status: "ACCEPTED" },
            ],
        });
        if (existingFriend) {
            return res.status(409).json({ success: false, message: "You are already friends" });
        }

        // Any pending/blocking check (reverse pair)
        const existingRequestOrBlock = await Friendship.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
            status: { $in: ["PENDING", "BLOCKED"] as any },
        });
        if (existingRequestOrBlock) {
            return res.status(409).json({ success: false, message: "Friend request already pending or user blocked" });
        }

        const friend = await Friendship.create({
            sender: senderId as any,
            receiver: receiverId as any,
            status: "PENDING",
        });

        await Notification.create({
            recipient: receiverId,
            sender: senderId,
            type: "FRIEND_REQUEST",
            title: "Friend Request",
            message: "You have a new friend request",
            relatedEntityId: friend._id,
        });

        // socket event is expected to be emitted by socket layer.
        // if your socket layer listens to DB changes, it will handle it.

        return res.status(201).json({ success: true, message: "Friend request sent" });
    } catch (err) {
        next(err);
    }
};

export const acceptFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestId = toObjectIdStr(req.params.requestId);
        if (!requestId) {
            return res.status(400).json({ success: false, message: "Invalid requestId" });
        }

        const userId = req.user._id;

        const fr = await Friendship.findOne({ _id: requestId, receiver: userId });
        if (!fr) {
            return res.status(404).json({ success: false, message: "Friend request not found" });
        }
        if (fr.status !== "PENDING") {
            return res.status(409).json({ success: false, message: `Cannot accept request in status ${fr.status}` });
        }

        fr.status = "ACCEPTED";
        await fr.save();

// compute other (sender/receiver friendly)
        const other = String(fr.sender) === String(userId) ? fr.receiver : fr.sender;

        await Notification.create({
            recipient: other as any,
            sender: userId,
            type: "FRIEND_ACCEPTED",
            title: "Friend Accepted",
            message: "Your friend request was accepted",
            relatedEntityId: fr._id,
        });

        return res.status(200).json({ success: true, message: "Friend request accepted" });
    } catch (err) {
        next(err);
    }
};

export const rejectFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestId = toObjectIdStr(req.params.requestId);
        if (!requestId) {
            return res.status(400).json({ success: false, message: "Invalid requestId" });
        }

        const userId = req.user._id;

        const fr = await Friendship.findOne({ _id: requestId, receiver: userId });
        if (!fr) {
            return res.status(404).json({ success: false, message: "Friend request not found" });
        }

        await Friendship.deleteOne({ _id: fr._id });

        return res.status(200).json({ success: true, message: "Friend request rejected" });
    } catch (err) {
        next(err);
    }
};

export const cancelFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestId = toObjectIdStr(req.params.requestId);
        if (!requestId) {
            return res.status(400).json({ success: false, message: "Invalid requestId" });
        }

        const userId = req.user._id;

        const fr = await Friendship.findOne({ _id: requestId, sender: userId });
        if (!fr) {
            return res.status(404).json({ success: false, message: "Friend request not found" });
        }

        await Friendship.deleteOne({ _id: fr._id });

        return res.status(200).json({ success: true, message: "Friend request canceled" });
    } catch (err) {
        next(err);
    }
};

export const removeFriend = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const friendId = toObjectIdStr(req.params.friendId);
        if (!friendId) {
            return res.status(400).json({ success: false, message: "Invalid friendId" });
        }

        const userId = req.user._id;

        // friendId is the Friendship._id
        const fr = await Friendship.findOne({
            _id: friendId,
            status: "ACCEPTED",
            $or: [{ sender: userId }, { receiver: userId }],
        });

        if (!fr) {
            return res.status(404).json({ success: false, message: "Friend relationship not found" });
        }

        const other = String(fr.sender) === String(userId) ? fr.receiver : fr.sender;

        await Friendship.deleteOne({ _id: fr._id });

        await Notification.create({
            recipient: other,
            sender: userId,
            type: "FRIEND_REMOVED",
            title: "Friend Removed",
            message: "A friend removed you",
            relatedEntityId: fr._id,
        } as any);

        return res.status(200).json({ success: true, message: "Friend removed" });
    } catch (err) {
        next(err);
    }
};

export const getFriends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const page = Math.max(DEFAULT_PAGE, parseInt(req.query.page as string) || DEFAULT_PAGE);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));
        const skip = (page - 1) * limit;

        const accepted = await Friendship.find({
            status: "ACCEPTED",
            $or: [{ sender: userId }, { receiver: userId }],
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Friendship.countDocuments({
            status: "ACCEPTED",
            $or: [{ sender: userId }, { receiver: userId }],
        });

        const friendIds = accepted.map((f: any) => (String(f.sender) === String(userId) ? f.receiver : f.sender));

        const users = await User.find({ _id: { $in: friendIds } }).select("_id username fullName avatar country isOnline");
        const profiles = await UserProfile.find({ userId: { $in: friendIds } }).select("userId ratings peakRatings");
        const profileById = new Map(profiles.map((p: any) => [String(p.userId), p]));

        const friends = users.map((u: any) => {
            const p = profileById.get(String(u._id));
            // pick a default rating; for UI you can change later
            const rating = p?.ratings?.dsa ?? 1200;
            return buildFriendUserDto({ ...u.toObject?.() ?? u, rating, isOnline: u.isOnline ?? false });
        });

        return res.status(200).json({
            success: true,
            data: {
                friends,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getIncomingRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const requests = await Friendship.find({ receiver: userId, status: "PENDING" }).sort({ createdAt: -1 }).limit(50);

        return res.status(200).json({
            success: true,
            data: requests,
        });
    } catch (err) {
        next(err);
    }
};

export const getOutgoingRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const requests = await Friendship.find({ sender: userId, status: "PENDING" }).sort({ createdAt: -1 }).limit(50);

        return res.status(200).json({
            success: true,
            data: requests,
        });
    } catch (err) {
        next(err);
    }
};

export const getMutualFriends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id.toString();
        const targetId = toObjectIdStr(req.params.userId);
        if (!targetId) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }

        const myFriends = await Friendship.find({
            status: "ACCEPTED",
            $or: [{ sender: userId }, { receiver: userId }],
        }).select("sender receiver");

        const targetFriends = await Friendship.find({
            status: "ACCEPTED",
            $or: [{ sender: targetId }, { receiver: targetId }],
        }).select("sender receiver");

        const mySet = new Set(myFriends.map((f: any) => (String(f.sender) === userId ? String(f.receiver) : String(f.sender))));
        const common = targetFriends
            .map((f: any) => (String(f.sender) === targetId ? String(f.receiver) : String(f.sender)))
            .filter((id: string) => mySet.has(id));

        const users = await User.find({ _id: { $in: common } }).select("_id username fullName avatar country isOnline");

        return res.status(200).json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

export const getFriendshipStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const targetId = toObjectIdStr(req.params.userId);
        if (!targetId) return res.status(400).json({ success: false, message: "Invalid userId" });

        const fr = await Friendship.findOne({
            $or: [
                { sender: userId, receiver: targetId },
                { sender: targetId, receiver: userId },
            ],
        });

        if (!fr) return res.status(200).json({ status: "NOT_FRIEND" });

        // Translate to UI values
        if (fr.status === "ACCEPTED") return res.status(200).json({ status: "FRIEND" });
        if (fr.status === "BLOCKED") return res.status(200).json({ status: "BLOCKED" });

        // PENDING: distinguish direction
        const status = String(fr.sender) === String(userId) ? "PENDING_SENT" : "PENDING_RECEIVED";
        return res.status(200).json({ status });
    } catch (err) {
        next(err);
    }
};

export const searchFriends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const q = String(req.query.q ?? "").trim();
        if (!q) return res.status(400).json({ success: false, message: "q is required" });

        const accepted = await Friendship.find({
            status: "ACCEPTED",
            $or: [{ sender: userId }, { receiver: userId }],
        }).select("sender receiver");

        const friendIds = accepted.map((f: any) => (String(f.sender) === String(userId) ? f.receiver : f.sender));

        const users = await User.find({
            _id: { $in: friendIds },
            username: { $regex: q, $options: "i" },
        }).select("_id username fullName avatar country isOnline");

        return res.status(200).json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};


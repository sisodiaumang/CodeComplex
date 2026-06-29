import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    getFriends,
    getIncomingRequests,
    getOutgoingRequests,
    getMutualFriends,
    getFriendshipStatus,
    searchFriends,
} from "../controllers/friendship.controller.js";

const router = Router();

// Protected routes
router.post("/request/:userId", verifyJWT, sendFriendRequest);
router.patch("/request/:requestId/accept", verifyJWT, acceptFriendRequest);
router.patch("/request/:requestId/reject", verifyJWT, rejectFriendRequest);
router.delete("/request/:requestId", verifyJWT, cancelFriendRequest);

router.delete("/:friendId", verifyJWT, removeFriend);

router.get("/", verifyJWT, getFriends);
router.get("/requests/incoming", verifyJWT, getIncomingRequests);
router.get("/requests/outgoing", verifyJWT, getOutgoingRequests);

router.get("/mutual/:userId", verifyJWT, getMutualFriends);
router.get("/status/:userId", verifyJWT, getFriendshipStatus);

router.get("/search", verifyJWT, searchFriends);

export default router;


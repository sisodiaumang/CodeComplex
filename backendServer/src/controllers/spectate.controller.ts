import { Request, Response, NextFunction } from "express";

import mongoose from "mongoose";

import Match from "../models/match.model.js";
import User from "../models/user.model.js";
import {
    canSpectate,
    addSpectator,
    removeSpectator,
    getSpectators as fetchSpectatorIds,
    getSpectatorStatus as fetchIsSpectator,
} from "../services/spectate.service.js";


const notLive = "Match is not live";


export const joinSpectate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { matchId } = req.params;
        const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;
        const spectatorId = req.user._id.toString();

        if (!mongoose.isValidObjectId(matchIdStr)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        const match = await Match.findById(matchIdStr).select("status");

        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }

        if (match.status !== "ONGOING") {
            res.status(403).json({ success: false, message: notLive });
            return;
        }

        const ok = await canSpectate(matchIdStr, spectatorId);
        if (!ok) {
            res.status(403).json({ success: false, message: "You are not allowed to spectate this match" });
            return;
        }

        await addSpectator(matchIdStr, spectatorId);


        // Inform client via socket
        // (socket join itself happens client-side; server also listens to spectate:join)
        res.status(200).json({ success: true, message: "Joined as spectator" });
    } catch (err) {
        next(err);
    }
};

export const leaveSpectate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { matchId } = req.params;
        const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;
        const spectatorId = req.user._id.toString();

        if (!mongoose.isValidObjectId(matchIdStr)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        await removeSpectator(matchIdStr, spectatorId);
        res.status(200).json({ success: true, message: "Left spectate" });
    } catch (err) {
        next(err);
    }
};


export const getSpectators = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const matchId = req.params.matchId as string;

        if (!mongoose.isValidObjectId(matchId)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        const spectatorIds = await fetchSpectatorIds(matchId);


        const users = await User.find({ _id: { $in: spectatorIds } }).select("username avatar");

        const byId = new Map(users.map((u: any) => [u._id.toString(), u]));

        const spectators = spectatorIds
            .map((id) => byId.get(id))
            .filter(Boolean)
            .map((u: any) => ({
                username: u.username,
                avatar: u.avatar?.profileImageURL,
            }));

        res.status(200).json({ success: true, data: { count: spectators.length, spectators } });
    } catch (err) {
        next(err);
    }
};

export const getSpectatorStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Simple placeholder: in MVP we only expose whether user is in spectators array
        // using getSpectators() membership.
        const matchId = req.params.matchId as string;
        const spectatorId = req.user._id.toString();

        if (!mongoose.isValidObjectId(matchId)) {
            res.status(400).json({ success: false, message: "Invalid matchId" });
            return;
        }

        const spectatorIds = await fetchSpectatorIds(matchId);
        const isSpectator = spectatorIds.includes(spectatorId);


        res.status(200).json({ success: true, data: { isSpectating: isSpectator } });
    } catch (err) {
        next(err);
    }
};


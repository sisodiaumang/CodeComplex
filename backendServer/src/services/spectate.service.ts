import mongoose from "mongoose";

import Match from "../models/match.model.js";
import Friendship from "../models/friendship.model.js";



export async function isLiveMatch(matchId: string): Promise<boolean> {
    const match = await Match.findById(matchId).select("status");
    if (!match) return false;
    return match.status === "ONGOING";
}

export async function isFriend(meId: string, otherId: string): Promise<boolean> {
    if (!meId || !otherId) return false;
    if (meId === otherId) return false;

    const fr = await Friendship.findOne({
        status: "ACCEPTED",
        $or: [
            { sender: new mongoose.Types.ObjectId(meId), receiver: new mongoose.Types.ObjectId(otherId) },
            { sender: new mongoose.Types.ObjectId(otherId), receiver: new mongoose.Types.ObjectId(meId) },
        ],
    });

    return !!fr;
}

export async function canSpectate(matchId: string, meId: string): Promise<boolean> {
    const match = await Match.findById(matchId).select("teamA teamB status");
    if (!match) return false;
    if (match.status !== "ONGOING") return false;

    const allPlayers = [
        ...(match.teamA ?? []).map((x: any) => x.toString()),
        ...(match.teamB ?? []).map((x: any) => x.toString()),
    ];

    // Allow spectating if friend with ANY player on either side.
    for (const playerId of allPlayers) {
        if (await isFriend(meId, playerId)) return true;
    }

    return false;
}

/**
 * True if the user is allowed to VIEW spectate metadata for this match:
 * either a participant (any status) or someone permitted to spectate it
 * (friend of a player while the match is ONGOING).
 */
export async function isMatchViewer(matchId: string, userId: string): Promise<boolean> {
    const match = await Match.findById(matchId).select("teamA teamB");
    if (!match) return false;

    const players = [
        ...(match.teamA ?? []).map((x: any) => x.toString()),
        ...(match.teamB ?? []).map((x: any) => x.toString()),
    ];

    if (players.includes(userId)) return true;

    return canSpectate(matchId, userId);
}

export async function addSpectator(matchId: string, spectatorId: string): Promise<void> {
    await Match.findByIdAndUpdate(
        matchId,
        { $addToSet: { spectators: new mongoose.Types.ObjectId(spectatorId) } },
        { new: false }
    );
}

export async function removeSpectator(matchId: string, spectatorId: string): Promise<void> {
    await Match.findByIdAndUpdate(
        matchId,
        { $pull: { spectators: new mongoose.Types.ObjectId(spectatorId) } },
        { new: false }
    );
}

export async function getSpectators(matchId: string): Promise<string[]> {
    const match = await Match.findById(matchId).select("spectators");
    return (match?.spectators ?? []).map((id: any) => id.toString());
}

export async function getSpectatorStatus(matchId: string, spectatorId: string): Promise<boolean> {
    const match = await Match.findById(matchId).select("spectators status");
    if (!match) return false;
    if (match.status !== "ONGOING") return false;

    const arr = match.spectators ?? [];
    return arr.some((id: any) => id.toString() === spectatorId);
}


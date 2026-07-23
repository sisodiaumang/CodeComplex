import mongoose from "mongoose";
import User from "../models/user.model.js";
import UserProfile from "../models/userProfile.model.js";
import BattleRoom from "../models/battleRoom.model.js";
import Match from "../models/match.model.js";
import { createMatchForRoom } from "./match.service.js";
import { io } from "../index.js";
import { BattleType } from "../interfaces/battleRoom.interface.js";
import { startBotSimulation } from "./botSimulator.service.js";

/**
 * Ensures a system AI Bot user exists in the database for single-player fallback.
 */
export async function getOrCreateBotUser() {
  let bot = await User.findOne({ username: "devbot_v1" });
  if (!bot) {
    bot = await User.create({
      username: "devbot_v1",
      fullName: "DevBot V1",
      email: "bot@codecomplex.site",
      oauthProvider: "google",
      oauthId: "system-bot-devbot-v1",
      country: "US",
      avatar: {
        profileImageURL: "https://api.dicebear.com/7.x/bottts/svg?seed=devbot",
        profileImagePublicId: "devbot_v1_avatar"
      },
      isVerified: true
    } as any);

    // Seed profile rating
    await UserProfile.create({
      userId: bot._id,
      ratings: {
        dsa: 1200,
        frontend: 1200,
        backend: 1200,
        projects: 1200,
        promptWar: 1200,
        bugFix: 1200
      }
    });
  }
  return bot;
}

/**
 * Searches the Match collection for a recorded completed 1v1 match
 * to serve as a Ghost Opponent replay.
 */
export async function getGhostOpponent(battleType: string, excludeUserId: string) {
  try {
    const match = await Match.findOne({
      battleType: battleType as BattleType,
      status: "COMPLETED",
      $or: [
        { teamA: { $ne: new mongoose.Types.ObjectId(excludeUserId) } },
        { teamB: { $ne: new mongoose.Types.ObjectId(excludeUserId) } }
      ]
    } as any)
    .sort({ endedAt: -1 })
    .lean();

    if (!match) return null;

    // Pick a candidate player from the recorded match who is not the current queuing user
    let ghostUserId = match.teamA[0];
    if (ghostUserId?.toString() === excludeUserId.toString() && match.teamB[0]) {
      ghostUserId = match.teamB[0];
    }

    if (!ghostUserId || ghostUserId.toString() === excludeUserId.toString()) {
      return null;
    }

    const ghostUser = await User.findById(ghostUserId).select("_id username fullName avatar").lean();
    if (!ghostUser) return null;

    return {
      ghostUser,
      questionSlug: match.questionSlug
    };
  } catch (err) {
    console.error("[MatchmakingFallback] Ghost search error:", err);
    return null;
  }
}

/**
 * 3-Tier Matchmaking Fallback Handler:
 * 1. Verifies 1v1 room is still WAITING with no human opponent after 15s.
 * 2. Checks for Ghost Player recorded submission.
 * 3. Falls back to AI Bot Rival if no Ghost recording exists.
 * (STRICTLY DISABLED for 2v2 / Team matches to protect team play experience).
 */
export async function trigger1v1Fallback(roomCode: string, pickQuestionFn?: (room: any) => Promise<string | null>) {
  try {
    const room = await BattleRoom.findOne({ roomCode });
    if (!room) {
      return { success: false, reason: "Room not found" };
    }

    // 2v2 / Team matches MUST be 100% human-only
    if (room.teamSize > 1) {
      return { success: false, reason: "Team matches require human players" };
    }

    // Only proceed if room is still waiting for an opponent
    if (room.status !== "WAITING" || room.teams.teamB.length > 0) {
      return { success: false, reason: "Room already has opponent or started" };
    }

    const hostIdStr = room.host.toString();

    // ─────────────────────────────────────────────
    // Tier 2: Search for Ghost Player Replay
    // ─────────────────────────────────────────────
    const ghostMatchData = await getGhostOpponent(room.battleType, hostIdStr);

    if (ghostMatchData && ghostMatchData.ghostUser) {
      const updated = await BattleRoom.findOneAndUpdate(
        { _id: room._id, status: "WAITING", "teams.teamB": { $size: 0 } },
        { $push: { "teams.teamB": ghostMatchData.ghostUser._id } },
        { new: true }
      );

      if (updated) {
        const match = await createMatchForRoom(updated, {
          questionSlug: ghostMatchData.questionSlug,
          durationInMinutes: 30
        });

        const populated = await BattleRoom.findById(updated._id)
          .populate("host", "username fullName avatar mascot")
          .populate("teams.teamA", "username fullName avatar mascot")
          .populate("teams.teamB", "username fullName avatar mascot");

        io.to(roomCode).emit("battle:match-created", {
          room: populated,
          match,
          isGhost: true,
          opponentType: "GHOST"
        });

        return { success: true, opponentType: "GHOST", data: populated, match };
      }
    }

    // ─────────────────────────────────────────────
    // Tier 3: Fallback to Simulated AI Bot Rival
    // ─────────────────────────────────────────────
    const botUser = await getOrCreateBotUser();
    if ((botUser._id as any).toString() === hostIdStr) {
      return { success: false, reason: "Host is bot" };
    }

    const updatedWithBot = await BattleRoom.findOneAndUpdate(
      { _id: room._id, status: "WAITING", "teams.teamB": { $size: 0 } },
      { $push: { "teams.teamB": botUser._id } },
      { new: true }
    );

    if (updatedWithBot) {
      let questionSlug: string | null = null;
      if (pickQuestionFn) {
        questionSlug = await pickQuestionFn(updatedWithBot);
      }
      if (!questionSlug) {
        questionSlug = "two-sum-easy-dsa"; // Default fallback question
      }

      const match = await createMatchForRoom(updatedWithBot, {
        questionSlug,
        durationInMinutes: 30
      });

      // Launch automated Bot simulation loop for typing and submissions
      startBotSimulation(roomCode, (match._id as any).toString(), botUser.username);

      const populated = await BattleRoom.findById(updatedWithBot._id)
        .populate("host", "username fullName avatar mascot")
        .populate("teams.teamA", "username fullName avatar mascot")
        .populate("teams.teamB", "username fullName avatar mascot");

      io.to(roomCode).emit("battle:match-created", {
        room: populated,
        match,
        isBot: true,
        opponentType: "BOT"
      });

      return { success: true, opponentType: "BOT", data: populated, match };
    }

    return { success: false, reason: "Could not pair opponent" };
  } catch (err) {
    console.error("[MatchmakingFallback] Error in trigger1v1Fallback:", err);
    return { success: false, reason: "Internal error" };
  }
}

import { io } from "../index.js";
import Match from "../models/match.model.js";
import UserProfile from "../models/userProfile.model.js";
import { applySubmissionScore } from "./score.service.js";

interface ActiveBotSimulation {
  typingInterval?: NodeJS.Timeout;
  timeouts: NodeJS.Timeout[];
}

const activeSimulations = new Map<string, ActiveBotSimulation>();

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Starts an adaptive, variable AI Bot simulation for a duel:
 * 1. Dynamically calculates solve duration based on question difficulty (EASY / MEDIUM / HARD).
 * 2. Scales bot speed and accuracy according to the host player's Elo rating.
 * 3. Randomizes submission intervals and partial score progress.
 */
export async function startBotSimulation(roomCode: string, matchId: string, botUsername: string = "devbot_v1") {
  stopBotSimulation(roomCode);

  const sim: ActiveBotSimulation = { timeouts: [] };

  // 1. Continuous Typing Indicator with Jitter
  let isTypingState = false;
  sim.typingInterval = setInterval(() => {
    isTypingState = !isTypingState;
    io.to(roomCode).emit("battle:opponent-typing", {
      username: botUsername,
      isTyping: isTypingState,
      pet: { type: "cat", color: "orange" }
    });
  }, getRandomInt(3000, 4500));

  activeSimulations.set(roomCode, sim);

  try {
    const match = await Match.findById(matchId);
    if (!match) return;

    const diff = (match.difficulty || "MEDIUM").toString().toUpperCase();
    const hostUserId = match.teamA[0];

    // Fetch Host Player Rating to calibrate bot skill level
    let playerRating = 1200;
    if (hostUserId) {
      const profile = await UserProfile.findOne({ userId: hostUserId });
      if (profile && profile.ratings) {
        playerRating = (profile.ratings as any)?.[match.battleType?.toLowerCase()] ?? 1200;
      }
    }

    // Determine Base Target Solve Time (Seconds) based on Question Difficulty
    let baseTimeSec = 180; // 3 mins default
    if (diff === "EASY") {
      baseTimeSec = getRandomInt(100, 190); // 1.5 - 3.1 mins
    } else if (diff === "MEDIUM") {
      baseTimeSec = getRandomInt(210, 360); // 3.5 - 6.0 mins
    } else if (diff === "HARD") {
      baseTimeSec = getRandomInt(360, 600); // 6.0 - 10.0 mins
    }

    // Scale time & fail rate according to player's rating bracket
    let timeMultiplier = 1.0;
    let failChance = 0.20; // 20% default

    if (playerRating < 1150) { // Beginner / Bronze
      timeMultiplier = 1.45;   // 45% slower bot
      failChance = 0.50;       // 50% chance bot fails to get full 100%
    } else if (playerRating < 1400) { // Silver
      timeMultiplier = 1.20;   // 20% slower
      failChance = 0.30;       // 30% fail chance
    } else if (playerRating > 1700) { // Gold / Master
      timeMultiplier = 0.80;   // 20% faster bot
      failChance = 0.05;       // 5% fail chance
    }

    const targetSolveTimeSec = Math.round(baseTimeSec * timeMultiplier);
    const botFailsFinal = Math.random() < failChance;

    // Stage 1 Submission: Early partial attempt (25% - 40% of solve time)
    const stage1TimeMs = Math.round(targetSolveTimeSec * getRandomInt(25, 40) * 10);
    const stage1Score = getRandomInt(25, 50);

    const t1 = setTimeout(async () => {
      try {
        const m = await Match.findById(matchId);
        if (!m || m.status !== "ONGOING") {
          stopBotSimulation(roomCode);
          return;
        }

        io.to(roomCode).emit("battle:opponent-typing", {
          username: botUsername,
          isTyping: true,
          pet: { type: "cat", color: "orange" }
        });

        await applySubmissionScore(matchId, "B", stage1Score, false);
      } catch (e) {
        console.error("[BotSimulator] Stage 1 error:", e);
      }
    }, stage1TimeMs);
    sim.timeouts.push(t1);

    // Stage 2 Submission: Near-solve attempt (65% - 80% of solve time)
    const stage2TimeMs = Math.round(targetSolveTimeSec * getRandomInt(65, 80) * 10);
    const stage2Score = getRandomInt(65, 85);

    const t2 = setTimeout(async () => {
      try {
        const m = await Match.findById(matchId);
        if (!m || m.status !== "ONGOING") {
          stopBotSimulation(roomCode);
          return;
        }

        io.to(roomCode).emit("battle:opponent-typing", {
          username: botUsername,
          isTyping: true,
          pet: { type: "cat", color: "orange" }
        });

        await applySubmissionScore(matchId, "B", stage2Score, false);
      } catch (e) {
        console.error("[BotSimulator] Stage 2 error:", e);
      }
    }, stage2TimeMs);
    sim.timeouts.push(t2);

    // Stage 3 Submission: Final attempt (100% of solve time)
    const stage3TimeMs = targetSolveTimeSec * 1000;
    const stage3Score = botFailsFinal ? stage2Score : 100;
    const isFullPass = !botFailsFinal;

    const t3 = setTimeout(async () => {
      try {
        const m = await Match.findById(matchId);
        if (!m || m.status !== "ONGOING") {
          stopBotSimulation(roomCode);
          return;
        }

        io.to(roomCode).emit("battle:opponent-typing", {
          username: botUsername,
          isTyping: true,
          pet: { type: "cat", color: "orange" }
        });

        await applySubmissionScore(matchId, "B", stage3Score, isFullPass);
        if (isFullPass) stopBotSimulation(roomCode);
      } catch (e) {
        console.error("[BotSimulator] Stage 3 error:", e);
      }
    }, stage3TimeMs);
    sim.timeouts.push(t3);

  } catch (err) {
    console.error("[BotSimulator] Failed to initialize adaptive simulation:", err);
  }
}

/**
 * Stops any active bot simulation timers for a room.
 */
export function stopBotSimulation(roomCode: string) {
  const sim = activeSimulations.get(roomCode);
  if (sim) {
    if (sim.typingInterval) clearInterval(sim.typingInterval);
    (sim.timeouts || []).forEach((t) => clearTimeout(t));
    activeSimulations.delete(roomCode);
  }
}

import { io } from "../index.js";
import Match from "../models/match.model.js";
import { applySubmissionScore } from "./score.service.js";

interface ActiveBotSimulation {
  typingInterval?: NodeJS.Timeout;
  sub1Timeout?: NodeJS.Timeout;
  sub2Timeout?: NodeJS.Timeout;
}

const activeSimulations = new Map<string, ActiveBotSimulation>();

/**
 * Starts a live simulation for a bot opponent (e.g. devbot_v1):
 * 1. Simulates continuous keystroke / typing activity with pet mascot animations.
 * 2. Simulates realistic testcase submissions and score updates.
 */
export function startBotSimulation(roomCode: string, matchId: string, botUsername: string = "devbot_v1") {
  // Clear any existing simulation for this room
  stopBotSimulation(roomCode);

  const sim: ActiveBotSimulation = {};

  // 1. Continuous Typing Loop (fires every 4 seconds)
  let isTypingState = false;
  sim.typingInterval = setInterval(() => {
    isTypingState = !isTypingState;
    io.to(roomCode).emit("battle:opponent-typing", {
      username: botUsername,
      isTyping: isTypingState,
      pet: { type: "cat", color: "orange" }
    });
  }, 3500);

  // 2. Submission 1 (At 30 seconds -> 50% score / testcases passed)
  sim.sub1Timeout = setTimeout(async () => {
    try {
      const match = await Match.findById(matchId);
      if (!match || match.status !== "ONGOING") {
        stopBotSimulation(roomCode);
        return;
      }

      // Signal typing submit burst
      io.to(roomCode).emit("battle:opponent-typing", {
        username: botUsername,
        isTyping: true,
        pet: { type: "cat", color: "orange" }
      });

      // Apply 50% partial score
      await applySubmissionScore(matchId, "B", 50, false);
    } catch (err) {
      console.error("[BotSimulator] Submission 1 error:", err);
    }
  }, 30000);

  // 3. Submission 2 (At 90 seconds -> 100% full solve)
  sim.sub2Timeout = setTimeout(async () => {
    try {
      const match = await Match.findById(matchId);
      if (!match || match.status !== "ONGOING") {
        stopBotSimulation(roomCode);
        return;
      }

      // Signal typing submit burst
      io.to(roomCode).emit("battle:opponent-typing", {
        username: botUsername,
        isTyping: true,
        pet: { type: "cat", color: "orange" }
      });

      // Apply 100% full solve (settles match as won if human hasn't won first)
      await applySubmissionScore(matchId, "B", 100, true);
      stopBotSimulation(roomCode);
    } catch (err) {
      console.error("[BotSimulator] Submission 2 error:", err);
    }
  }, 90000);

  activeSimulations.set(roomCode, sim);
}

/**
 * Stops any active bot simulation timers for a room (e.g. when match finishes or user leaves).
 */
export function stopBotSimulation(roomCode: string) {
  const sim = activeSimulations.get(roomCode);
  if (sim) {
    if (sim.typingInterval) clearInterval(sim.typingInterval);
    if (sim.sub1Timeout) clearTimeout(sim.sub1Timeout);
    if (sim.sub2Timeout) clearTimeout(sim.sub2Timeout);
    activeSimulations.delete(roomCode);
  }
}

"use client";

import { useEffect } from "react";

export default function WebMCPProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const nav = navigator as any;
    if (nav?.modelContext?.provideContext) {
      try {
        nav.modelContext.provideContext({
          name: "CodeComplex Battle Tools",
          description: "Tools for AI agents to interact with the CodeComplex competitive coding platform",
          tools: [
            {
              name: "create_battle_room",
              description: "Create a 1v1 or team competitive coding battle room",
              inputSchema: {
                type: "object",
                properties: {
                  battleType: { type: "string", enum: ["DSA", "FRONTEND", "BACKEND", "PROMPT_WAR", "BUG_FIX"] },
                  difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
                  isRanked: { type: "boolean" },
                },
                required: ["battleType", "difficulty"],
              },
              execute: async (args: any) => {
                return { action: "NAVIGATE", url: "/battle", params: args };
              },
            },
            {
              name: "view_leaderboard",
              description: "View global Elo player rankings",
              inputSchema: {
                type: "object",
                properties: {
                  category: { type: "string", enum: ["dsa", "frontend", "backend", "promptWar", "bugFix"] },
                },
              },
              execute: async (args: any) => {
                return { action: "NAVIGATE", url: "/leaderboard", params: args };
              },
            },
          ],
        });
      } catch (e) {
        console.warn("[WebMCP] Failed to register browser tools:", e);
      }
    }
  }, []);

  return null;
}

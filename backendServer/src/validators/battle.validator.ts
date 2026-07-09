import { z } from "zod";

export const createRoomSchema = z.object({
    body: z.object({
        battleType: z.enum(["DSA", "BUG_FIX", "BACKEND", "FRONTEND", "FULLSTACK", "PROMPT_WAR"]),
        difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
        topics: z.array(z.string().min(1)).min(3, "Select at least 3 topics"),
        maxTeamSize: z.number().min(1).max(5).optional(),
        timeLimit: z.number().min(1).optional(),
    }).strict(),
});

export const joinRoomSchema = z.object({
    params: z.object({
        roomCode: z.string().min(1),
    }).strict(),
    body: z.object({
        teamPreference: z.enum(["NONE", "A", "B"]).optional().default("NONE"),
    }).strict().optional().default({}),
});

export const getRoomDetailsSchema = z.object({
    params: z.object({
        roomCode: z.string().min(1),
    }).strict(),
});

export const joinTeamSchema = z.object({
    params: z.object({
        roomCode: z.string().min(1),
    }).strict(),
});

export const startBattleSchema = z.object({
    params: z.object({
        roomCode: z.string().min(1),
    }).strict(),
});

export const leaveRoomSchema = z.object({
    params: z.object({
        roomCode: z.string().min(1),
    }).strict(),
});

export const deleteRoomSchema = z.object({
    params: z.object({
        roomCode: z.string().min(1),
    }).strict(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type GetRoomDetailsInput = z.infer<typeof getRoomDetailsSchema>;
export type JoinTeamInput = z.infer<typeof joinTeamSchema>;
export type StartBattleInput = z.infer<typeof startBattleSchema>;
export type LeaveRoomInput = z.infer<typeof leaveRoomSchema>;
export type DeleteRoomInput = z.infer<typeof deleteRoomSchema>;

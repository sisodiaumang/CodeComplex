import { Document, Types } from "mongoose";


export type Difficulty =
    | "EASY"
    | "MEDIUM"
    | "HARD";

export type BattleType =
    | "DSA"
    | "FRONTEND"
    | "BACKEND"
    | "PROJECTS"
    | "PROMPT_WAR"
    | "BUG_FIX"
    | "PROMPT_WAR"
    | "TEAM";

export type RoomStatus =
    | "WAITING"
    | "STARTED"
    | "FINISHED"
    | "CANCELLED";

export interface IBattleRoom extends Document {

    roomCode: string;

    host: Types.ObjectId;

    battleType: BattleType;

    topics?: string[];

    difficulty?: Difficulty;

    teamSize: number;

    status: RoomStatus;

    questionSlug?: string;

    matchId?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
    teams: {
        teamA: Types.ObjectId[];
        teamB: Types.ObjectId[];

    };
    isRanked: boolean;
    isSolo?: boolean;
    isPrivate: boolean;
}
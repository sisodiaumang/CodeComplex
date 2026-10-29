import { Document, Types } from "mongoose";
import { BattleType, Difficulty } from "./battleRoom.interface.js";

export type TournamentFormat = "SOLO" | "TEAM";
export type TournamentStatus = "REGISTRATION" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TournamentMatchStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "BYE";

export interface ITournamentParticipantMember {
    userId: Types.ObjectId;
    username: string;
    avatar?: string;
}

export interface ITournamentParticipant {
    id: string; // userId (if solo) or unique teamId / leaderId (if team)
    name: string;
    avatar?: string;
    members: ITournamentParticipantMember[];
    seed?: number;
    registeredAt: Date;
}

export interface ITournamentMatchParticipant {
    id: string;
    name: string;
    avatar?: string;
    score?: number;
    members?: ITournamentParticipantMember[];
}

export interface ITournamentMatch {
    matchIndex: number;
    participantA?: ITournamentMatchParticipant;
    participantB?: ITournamentMatchParticipant;
    battleRoomCode?: string;
    matchId?: Types.ObjectId;
    winnerId?: string;
    status: TournamentMatchStatus;
    completedAt?: Date;
}

export interface ITournamentRound {
    roundIndex: number; // 1, 2, 3...
    roundName: string; // e.g. "Quarter-Finals", "Semi-Finals", "Grand Finals"
    matches: ITournamentMatch[];
}

export interface ITournament extends Document {
    title: string;
    description?: string;
    creator: Types.ObjectId;
    format: TournamentFormat;
    teamSize: number;
    battleType: BattleType;
    difficulty: Difficulty | "MIXED";
    topics: string[];
    maxParticipants: number;
    status: TournamentStatus;
    currentRound: number;
    totalRounds: number;
    startTime?: Date;
    autoStartWhenFull: boolean;
    participants: ITournamentParticipant[];
    rounds: ITournamentRound[];
    winner?: {
        id: string;
        name: string;
        avatar?: string;
        members?: ITournamentParticipantMember[];
    };
    runnerUp?: {
        id: string;
        name: string;
        avatar?: string;
        members?: ITournamentParticipantMember[];
    };
    prizes: {
        winnerXp: number;
        runnerUpXp: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

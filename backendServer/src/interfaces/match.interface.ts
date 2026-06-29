import { Document, Types } from "mongoose";
import { BattleType } from "./battleRoom.interface.js";
import { Difficulty } from "./battleRoom.interface.js";
export type MatchStatus =
    | "ONGOING"
    | "COMPLETED"
    | "ABANDONED";

export type MatchType = 
    |    "RANKED"
    |   "CASUAL"
    |   "FRIEND"
    |  "TOURNAMENT"

export interface IMatch extends Document {

    battleRoomId: Types.ObjectId;

    questionSlug: string;

    battleType: BattleType;
        

    teamA: Types.ObjectId[];

    teamB: Types.ObjectId[];

    winnerTeam?: "A" | "B" | "DRAW";

    startedAt: Date;

    endedAt?: Date;

    durationInMinutes: number;

    status: MatchStatus;

    createdAt: Date;
    updatedAt: Date;
    teamAScore: number;
    teamBScore: number;
    ratingProcessed: Boolean;
    matchType : MatchType;
    difficulty: Difficulty;
    abandonReason : String;
    spectators: Types.ObjectId[];
}

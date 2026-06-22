import { Document, Types } from "mongoose";
import { BattleType } from "./battleRoom.interface.js";
import { MatchType } from "./match.interface.js";

export interface IRatingHistory extends Document {

    userId: Types.ObjectId;

    matchId: Types.ObjectId;

    category: BattleType;

    oldRating: number;

    newRating: number;

    ratingChange: number;

    reason: string;

    createdAt: Date;
    updatedAt: Date;
    matchType:MatchType;
}
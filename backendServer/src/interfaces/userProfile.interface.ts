import { Document, Types } from "mongoose";

export interface IUserProfile extends Document {

    userId: Types.ObjectId;

    ratings: {
        dsa: Number,
        frontend: Number,
        backend: Number,
        fullstack: Number,
        promptWar: Number,
        team: Number
    }

    stats: {
        wins: number;
        losses: number;
        draws: number;
        totalMatches: number;

        dsaSolved: number;

        frontendCompleted: number;
        backendCompleted: number;
        fullstackCompleted: number;
    };

    streak: number;

    badges: string[];

    achievements: string[];

    createdAt: Date;
    updatedAt: Date;
}

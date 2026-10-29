import { Document, Types } from "mongoose";

export interface IUserProfile extends Document {
    userId: Types.ObjectId;

    ratings: {
        dsa: number;
        frontend: number;
        backend: number;
        projects: number;
        promptWar: number;
        team: number;
        bugFix: number;
    };

    peakRatings: {
        dsa: number;
        frontend: number;
        backend: number;
        projects: number;
        promptWar: number;
        team: number;
        bugFix: number;
    };

    stats: {
        wins: number;
        losses: number;
        draws: number;
        totalMatches: number;
        dsaSolved: number;
        frontendCompleted: number;
        backendCompleted: number;
        projectsCompleted: number;
        tournamentsPlayed?: number;
        tournamentsWon?: number;
        tournamentMatchesWon?: number;
        finalsReached?: number;
    };

    streak: number;
    badges: string[];
    achievements: string[];
    createdAt: Date;
    updatedAt: Date;
}

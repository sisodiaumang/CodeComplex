import mongoose from "mongoose";
import { IUserProfile } from "../interfaces/userProfile.interface.js";

const userProfileSchema =
    new mongoose.Schema<IUserProfile>(
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
                unique: true
            },

            ratings: {
                dsa:       { type: Number, default: 1200, min: 0 },
                frontend:  { type: Number, default: 1200, min: 0 },
                backend:   { type: Number, default: 1200, min: 0 },
                projects:  { type: Number, default: 1200, min: 0 },
                team:      { type: Number, default: 1200, min: 0 },
                promptWar: { type: Number, default: 1200, min: 0 },
                bugFix:    { type: Number, default: 1200, min: 0 }
            },

            peakRatings: {
                dsa:       { type: Number, default: 1200, min: 0 },
                frontend:  { type: Number, default: 1200, min: 0 },
                backend:   { type: Number, default: 1200, min: 0 },
                projects:  { type: Number, default: 1200, min: 0 },
                team:      { type: Number, default: 1200, min: 0 },
                promptWar: { type: Number, default: 1200, min: 0 },
                bugFix:    { type: Number, default: 1200, min: 0 }
            },

            stats: {
                wins:                 { type: Number, default: 0, min: 0 },
                losses:               { type: Number, default: 0, min: 0 },
                draws:                { type: Number, default: 0, min: 0 },
                totalMatches:         { type: Number, default: 0, min: 0 },
                dsaSolved:            { type: Number, default: 0, min: 0 },
                frontendCompleted:    { type: Number, default: 0, min: 0 },
                backendCompleted:     { type: Number, default: 0, min: 0 },
                projectsCompleted:    { type: Number, default: 0, min: 0 },
                tournamentsPlayed:    { type: Number, default: 0, min: 0 },
                tournamentsWon:       { type: Number, default: 0, min: 0 },
                tournamentMatchesWon: { type: Number, default: 0, min: 0 },
                finalsReached:        { type: Number, default: 0, min: 0 }
            },

            streak: {
                type: Number,
                default: 0,
                min: 0
            },

            badges: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Achievement"
                }
            ],

            achievements: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Achievement"
                }
            ]
        },
        {
            timestamps: true
        }
    );

// Per-category leaderboard compound indexes for fast MongoDB index-only scans.
userProfileSchema.index({ "ratings.dsa": -1, userId: 1 });
userProfileSchema.index({ "ratings.frontend": -1, userId: 1 });
userProfileSchema.index({ "ratings.backend": -1, userId: 1 });
userProfileSchema.index({ "ratings.projects": -1, userId: 1 });
userProfileSchema.index({ "ratings.team": -1, userId: 1 });
userProfileSchema.index({ "ratings.promptWar": -1, userId: 1 });
userProfileSchema.index({ "ratings.bugFix": -1, userId: 1 });

const UserProfile: mongoose.Model<IUserProfile> =
    (mongoose.models.UserProfile as mongoose.Model<IUserProfile>) ||
    mongoose.model<IUserProfile>("UserProfile", userProfileSchema);

export default UserProfile;

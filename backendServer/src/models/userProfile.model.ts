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
                fullstack: { type: Number, default: 1200, min: 0 },
                team:      { type: Number, default: 1200, min: 0 },
                promptWar: { type: Number, default: 1200, min: 0 }
            },

            stats: {
                wins:               { type: Number, default: 0, min: 0 },
                losses:             { type: Number, default: 0, min: 0 },
                draws:              { type: Number, default: 0, min: 0 },
                totalMatches:       { type: Number, default: 0, min: 0 },
                dsaSolved:          { type: Number, default: 0, min: 0 },
                frontendCompleted:  { type: Number, default: 0, min: 0 },
                backendCompleted:   { type: Number, default: 0, min: 0 },
                fullstackCompleted: { type: Number, default: 0, min: 0 }
            },

            streak: {
                type: Number,
                default: 0,
                min: 0
            },

            // FIX: Changed from [String] to ObjectId references so that
            // badges and achievements can be populated and referential
            // integrity is maintained. Update your IUserProfile interface
            // to reflect Types.ObjectId[] for both fields.
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


// Per-category leaderboard indexes.
userProfileSchema.index({ "ratings.dsa": -1 });
userProfileSchema.index({ "ratings.frontend": -1 });
userProfileSchema.index({ "ratings.backend": -1 });
userProfileSchema.index({ "ratings.fullstack": -1 });
userProfileSchema.index({ "ratings.team": -1 });
userProfileSchema.index({ "ratings.promptWar": -1 });

// FIX: Compound indexes for leaderboard queries that filter by userId
// (e.g. "top N players, with the current user's rank shown").
userProfileSchema.index({ "ratings.dsa": -1, userId: 1 });
userProfileSchema.index({ "ratings.frontend": -1, userId: 1 });
userProfileSchema.index({ "ratings.backend": -1, userId: 1 });
userProfileSchema.index({ "ratings.fullstack": -1, userId: 1 });
userProfileSchema.index({ "ratings.team": -1, userId: 1 });
userProfileSchema.index({ "ratings.promptWar": -1, userId: 1 });


const UserProfile: mongoose.Model<IUserProfile> =
    (mongoose.models.UserProfile as mongoose.Model<IUserProfile>) ||
    mongoose.model<IUserProfile>("UserProfile", userProfileSchema);

export default UserProfile;
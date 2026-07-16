import mongoose from "mongoose";
import { IRatingHistory } from "../interfaces/ratingHistory.interface.js";

const ratingHistorySchema =
    new mongoose.Schema<IRatingHistory>(
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            matchId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Match",
                required: true
            },

            // FIX: Added "BUG_FIX" to match the battleType enum in BattleRoom
            // and Match models. Previously a BUG_FIX match could never have
            // its rating recorded, silently dropping rating changes on the floor.
            // If BUG_FIX battles are intended to be unranked, set isRanked: false
            // on the BattleRoom instead of filtering here.
            category: {
                type: String,
                enum: [
                    "DSA",
                    "FRONTEND",
                    "BACKEND",
                    "PROJECTS",
                    "PROMPT_WAR",
                    "BUG_FIX",
                    "TEAM"
                ],
                required: true
            },

            oldRating: {
                type: Number,
                required: true,
                min: 0
            },

            newRating: {
                type: Number,
                required: true,
                min: 0
            },

            ratingChange: {
                type: Number,
                required: true
            },

            reason: {
                type: String,
                required: true
            },

            matchType: {
                type: String,
                enum: [
                    "RANKED",
                    "CASUAL",
                    "FRIEND",
                    "TOURNAMENT"
                ],
                required: true
            }
        },
        {
            timestamps: true
        }
    );


ratingHistorySchema.index({ userId: 1 });
ratingHistorySchema.index({ matchId: 1 });
ratingHistorySchema.index({ category: 1 });
ratingHistorySchema.index({ userId: 1, category: 1 });


const RatingHistory: mongoose.Model<IRatingHistory> =
    (mongoose.models.RatingHistory as mongoose.Model<IRatingHistory>) ||
    mongoose.model<IRatingHistory>("RatingHistory", ratingHistorySchema);

export default RatingHistory;
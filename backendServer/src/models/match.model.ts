import mongoose, { Types } from "mongoose";
import { IMatch } from "../interfaces/match.interface.js";


const matchSchema =
    new mongoose.Schema<IMatch>(
        {
            battleRoomId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "BattleRoom",
                required: true
            },

            questionSlug: {
                type: String,
                required: true
            },

            battleType: {
                type: String,
                required: true,
                enum: [
                    "DSA",
                    "FRONTEND",
                    "BACKEND",
                    "FULLSTACK",
                    "PROMPT_WAR",
                    "BUG_FIX"
                ]
            },

            teamA: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }
            ],

            teamB: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }
            ],

            winnerTeam: {
                type: String,
                enum: ["A", "B", "DRAW"]
            },

            startedAt: {
                type: Date,
                default: Date.now
            },

            endedAt: {
                type: Date
            },

            durationInMinutes: {
                type: Number,
                required: true,
                min: 1
            },

            status: {
                type: String,
                enum: [
                    "ONGOING",
                    "COMPLETED",
                    "ABANDONED"
                ],
                default: "ONGOING"
            },
            teamAScore: {
                type: Number,
                default: 0,
                min: 0
            },

            teamBScore: {
                type: Number,
                default: 0,
                min: 0
            },
            ratingProcessed: {
                type: Boolean,
                default: false
            },
            matchType: {
                type: String,
                enum: [
                    "RANKED",
                    "CASUAL",
                    "FRIEND",
                    "TOURNAMENT"
                ],
                default: "CASUAL"
            },
            difficulty: {
                type: String,
                enum: ["EASY", "MEDIUM", "HARD"],
                required: true
            },
            abandonReason: {
                type: String
            }

        },
        {
            timestamps: true
        });



matchSchema.index({
    battleRoomId: 1
});

matchSchema.index({
    status: 1
});

matchSchema.index({
    questionSlug: 1
});
matchSchema.index({
    battleType: 1,
    status: 1
});


const Match: mongoose.Model<IMatch> =
    (mongoose.models.Match as mongoose.Model<IMatch>) ||
    mongoose.model<IMatch>(
        "Match",
        matchSchema
    );

export default Match;
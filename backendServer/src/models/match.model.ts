import mongoose from "mongoose";
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
                    "PROJECTS",
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
                default: 0
            },

            teamBScore: {
                type: Number,
                default: 0
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
            },

            spectators: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }
            ],

            tournamentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Tournament"
            }
        },

        {
            timestamps: true
        }
    );

matchSchema.pre("save", function () {
    const terminal = ["COMPLETED", "ABANDONED"];

    if (
        terminal.includes(this.status) &&
        !this.endedAt
    ) {
        throw new Error(
            `endedAt is required when match status is "${this.status}"`
        );
    }
});

matchSchema.index({ battleRoomId: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ questionSlug: 1 });
matchSchema.index({ battleType: 1, status: 1 });
matchSchema.index({ status: 1, ratingProcessed: 1 });
matchSchema.index({ tournamentId: 1 });

const Match: mongoose.Model<IMatch> =
    (mongoose.models.Match as mongoose.Model<IMatch>) ||
    mongoose.model<IMatch>("Match", matchSchema);

export default Match;

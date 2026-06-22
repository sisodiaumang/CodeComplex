import mongoose, { Types } from "mongoose";
import { IBattleRoom } from "../interfaces/battleRoom.interface.js";

const battleRoomSchema =
    new mongoose.Schema<IBattleRoom>(
        {
            roomCode: {
                type: String,
                required: true,
                unique: true
            },

            host: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            battleType: {
                type: String,
                enum: [
                    "DSA",
                    "FRONTEND",
                    "BACKEND",
                    "FULLSTACK",
                    "PROMPT_WAR",
                    "BUG_FIX"
                ],
                required: true
            },

            topic: {
                type: String
            },

            difficulty: {
                type: String,
                enum: ["EASY", "MEDIUM", "HARD"]
            },

            teamSize: {
                type: Number,
                default: 1,
                enum: [1, 2, 3, 4]
            },

            status: {
                type: String,
                enum: [
                    "WAITING",
                    "STARTED",
                    "FINISHED",
                    "CANCELLED"
                ],
                default: "WAITING"
            },

            questionSlug: {
                type: String
            },

            matchId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Match"
            },
            teams: {
                teamA: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }],

                teamB: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }]
            },
            isRanked: {
                type: Boolean,
                default: true
            }

        },
        {
            timestamps: true
        });


battleRoomSchema.index({
    roomCode: 1
});

battleRoomSchema.index({
    status: 1
});

battleRoomSchema.index({
    battleType: 1
});

const BattleRoom: mongoose.Model<IBattleRoom> =
    (mongoose.models.BattleRoom as mongoose.Model<IBattleRoom>) ||
    mongoose.model<IBattleRoom>(
        "Submission",
        battleRoomSchema
    );

export default BattleRoom;
import mongoose from "mongoose";
import { ITournament } from "../interfaces/tournament.interface.js";

const participantMemberSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String, required: true },
        avatar: { type: String }
    },
    { _id: false }
);

const participantSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        avatar: { type: String },
        members: [participantMemberSchema],
        seed: { type: Number },
        registeredAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const matchParticipantSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        avatar: { type: String },
        score: { type: Number, default: 0 },
        members: [participantMemberSchema]
    },
    { _id: false }
);

const tournamentMatchSchema = new mongoose.Schema(
    {
        matchIndex: { type: Number, required: true },
        participantA: matchParticipantSchema,
        participantB: matchParticipantSchema,
        battleRoomCode: { type: String },
        matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
        winnerId: { type: String },
        status: {
            type: String,
            enum: ["PENDING", "ACTIVE", "COMPLETED", "BYE"],
            default: "PENDING"
        },
        completedAt: { type: Date }
    },
    { _id: false }
);

const tournamentRoundSchema = new mongoose.Schema(
    {
        roundIndex: { type: Number, required: true },
        roundName: { type: String, required: true },
        matches: [tournamentMatchSchema]
    },
    { _id: false }
);

const tournamentSchema = new mongoose.Schema<ITournament>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        format: { type: String, enum: ["SOLO", "TEAM"], default: "SOLO" },
        teamSize: { type: Number, enum: [1, 2, 3, 4], default: 1 },
        battleType: {
            type: String,
            enum: ["DSA", "FRONTEND", "BACKEND", "PROJECTS", "PROMPT_WAR", "BUG_FIX"],
            default: "DSA"
        },
        difficulty: {
            type: String,
            enum: ["EASY", "MEDIUM", "HARD", "MIXED"],
            default: "MEDIUM"
        },
        topics: { type: [String], default: [] },
        maxParticipants: { type: Number, enum: [4, 8, 16, 32], default: 8 },
        status: {
            type: String,
            enum: ["REGISTRATION", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            default: "REGISTRATION"
        },
        currentRound: { type: Number, default: 0 },
        totalRounds: { type: Number, default: 0 },
        startTime: { type: Date },
        autoStartWhenFull: { type: Boolean, default: true },
        participants: [participantSchema],
        rounds: [tournamentRoundSchema],
        winner: {
            id: { type: String },
            name: { type: String },
            avatar: { type: String },
            members: [participantMemberSchema]
        },
        runnerUp: {
            id: { type: String },
            name: { type: String },
            avatar: { type: String },
            members: [participantMemberSchema]
        },
        prizes: {
            winnerXp: { type: Number, default: 500 },
            runnerUpXp: { type: Number, default: 200 }
        }
    },
    { timestamps: true }
);

tournamentSchema.index({ status: 1 });
tournamentSchema.index({ format: 1 });
tournamentSchema.index({ battleType: 1 });
tournamentSchema.index({ createdAt: -1 });

const Tournament: mongoose.Model<ITournament> =
    (mongoose.models.Tournament as mongoose.Model<ITournament>) ||
    mongoose.model<ITournament>("Tournament", tournamentSchema);

export default Tournament;

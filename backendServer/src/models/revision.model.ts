import mongoose, { Document, Schema } from "mongoose";

export interface IRevisionTracker extends Document {
    userId: mongoose.Types.ObjectId;
    questionSlug: string;
    battleType: string;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    topics: string[];
    category: string;
    lastSolvedAt: Date;
    solveCount: number;
    nextRevisionDue: Date;
    masteryScore: number; // 0 to 100
    createdAt: Date;
    updatedAt: Date;
}

const revisionTrackerSchema = new Schema<IRevisionTracker>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        questionSlug: {
            type: String,
            required: true,
            index: true
        },
        battleType: {
            type: String,
            default: "DSA"
        },
        title: {
            type: String,
            required: true
        },
        difficulty: {
            type: String,
            enum: ["EASY", "MEDIUM", "HARD"],
            default: "MEDIUM"
        },
        topics: {
            type: [String],
            default: []
        },
        category: {
            type: String,
            default: "General"
        },
        lastSolvedAt: {
            type: Date,
            required: true,
            default: Date.now
        },
        solveCount: {
            type: Number,
            default: 1
        },
        nextRevisionDue: {
            type: Date,
            required: true,
            index: true
        },
        masteryScore: {
            type: Number,
            default: 50,
            min: 0,
            max: 100
        }
    },
    { timestamps: true }
);

revisionTrackerSchema.index({ userId: 1, questionSlug: 1 }, { unique: true });

const RevisionTracker = mongoose.model<IRevisionTracker>("RevisionTracker", revisionTrackerSchema);
export default RevisionTracker;

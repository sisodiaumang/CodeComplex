import mongoose from "mongoose";
import { ISubmission } from "../interfaces/submission.interface.js";

const submissionSchema =
    new mongoose.Schema<ISubmission>(
        {
            matchId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Match",
                required: true
            },

            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            questionSlug: {
                type: String,
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

            language: {
                type: String,
                enum: [
                    "CPP",
                    "JAVA",
                    "PYTHON",
                    "JAVASCRIPT",
                    "TYPESCRIPT"
                ]
            },

            // FIX: For large submissions (frontend/fullstack), store source code
            // in object storage (S3/R2) and keep only the URL here.
            // For DSA submissions this field holds the code directly; for
            // FRONTEND/BACKEND/FULLSTACK battles prefer sourceCodeUrl instead
            // and set this to a short placeholder so the required constraint
            // is still satisfied. Both fields are kept for backward compatibility.
            sourceCode: {
                type: String,
                required: true
            },

            // Optional S3/R2 URL for large source trees (non-DSA battle types).
            sourceCodeUrl: {
                type: String,
                match: /^https?:\/\/.+/
            },

            score: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },

            // FIX: `status` is the lifecycle state (PENDING → RUNNING → settled).
            // `judgeResult` is the judge's verdict once settled.
            // Rule: when judgeResult is set, status must be one of the terminal
            // values (ACCEPTED, REJECTED, PARTIAL, ERROR). Never let the two
            // disagree — update them atomically in the same write.
            status: {
                type: String,
                enum: [
                    "PENDING",
                    "RUNNING",
                    "ACCEPTED",
                    "REJECTED",
                    "PARTIAL",
                    "ERROR"
                ],
                default: "PENDING"
            },

            judgeResult: {
                type: String,
                enum: [
                    "ACCEPTED",
                    "WRONG_ANSWER",
                    "TIME_LIMIT_EXCEEDED",
                    "MEMORY_LIMIT_EXCEEDED",
                    "RUNTIME_ERROR",
                    "COMPILATION_ERROR"
                ]
            },

            executionTime: {
                type: Number,
                min: 0
            },

            memoryUsage: {
                type: Number,
                min: 0
            },

            passedTestCases: {
                type: Number,
                default: 0,
                min: 0
            },

            totalTestCases: {
                type: Number,
                default: 0,
                min: 0
            },

            aiEvaluation: {
                correctness: { type: Number, min: 0, max: 100 },
                codeQuality:  { type: Number, min: 0, max: 100 },
                performance:  { type: Number, min: 0, max: 100 },
                uiUx:         { type: Number, min: 0, max: 100 },
                creativity:   { type: Number, min: 0, max: 100 }
            },

            rank: {
                type: Number
            },

            feedback: {
                type: String
            },

            repositoryUrl: {
                type: String,
                match: /^https?:\/\/.+/
            },

            deploymentUrl: {
                type: String,
                match: /^https?:\/\/.+/
            },

            submissionNumber: {
                type: Number,
                required: true,
                min: 1
            },

            aiScore: {
                type: Number,
                min: 0,
                max: 100
            }
        },
        {
            timestamps: true
        }
    );


submissionSchema.index({ matchId: 1 });
submissionSchema.index({ userId: 1 });
submissionSchema.index({ questionSlug: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ matchId: 1, userId: 1 });

// Unique constraint: one submission number per user per match.
submissionSchema.index(
    { matchId: 1, userId: 1, submissionNumber: 1 },
    { unique: true }
);

// FIX: Index to support AI-score leaderboard queries efficiently.
submissionSchema.index({ status: 1, aiScore: -1 });


const Submission: mongoose.Model<ISubmission> =
    (mongoose.models.Submission as mongoose.Model<ISubmission>) ||
    mongoose.model<ISubmission>("Submission", submissionSchema);

export default Submission;
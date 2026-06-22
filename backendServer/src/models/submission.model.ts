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

            sourceCode: {
                type: String,
                required: true
            },

            score: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },

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
                correctness: {
                    type: Number,
                    min: 0,
                    max: 100
                },

                codeQuality: {
                    type: Number,
                    min: 0,
                    max: 100
                },

                performance: {
                    type: Number,
                    min: 0,
                    max: 100
                },

                uiUx: {
                    type: Number,
                    min: 0,
                    max: 100
                },

                creativity: {
                    type: Number,
                    min: 0,
                    max: 100
                }
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

        },
        {
            timestamps: true
        });

submissionSchema.index({
    matchId: 1
});

submissionSchema.index({
    userId: 1
});

submissionSchema.index({
    questionSlug: 1
});

submissionSchema.index({
    status: 1
});
submissionSchema.index({
    matchId: 1,
    userId: 1
});
submissionSchema.index(
    {
        matchId: 1,
        userId: 1,
        submissionNumber: 1
    },
    {
        unique: true
    }
);
const Submission: mongoose.Model<ISubmission> =
    (mongoose.models.Submission as mongoose.Model<ISubmission>) ||
    mongoose.model<ISubmission>(
        "Submission",
        submissionSchema
    );

export default Submission;
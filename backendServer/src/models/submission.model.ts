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

            // FIX (submission-controller spec): the spec's model checklist
            // calls for `team` — needed so score.service.ts can credit the
            // right side (Match.teamAScore vs teamBScore) without having to
            // re-derive team membership from Match.teamA/teamB on every
            // score update. Snapshotted at submission time, same rationale
            // as Match.teamA/teamB being a snapshot of BattleRoom.teams.
            team: {
                type: String,
                enum: ["A", "B"],
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
                    "PROJECTS",
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
                    "TYPESCRIPT",
                    "HTML",
                    "CSS",
                    "REACT"
                ]
            },

            // FIX: For large submissions (frontend/projects), store source code
            // in object storage (S3/R2) and keep only the URL here.
            // For DSA submissions this field holds the code directly; for
            // FRONTEND/BACKEND/PROJECTS battles prefer sourceCodeUrl instead
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

            // FIX (submission-controller spec): judgeToken is Judge0's
            // submission token. judge.service.ts uses the synchronous
            // wait=true mode by default (see that file's header comment),
            // so this is unused on the happy path today — but it's needed
            // the moment you switch to async submit+poll or a webhook
            // callback, and rejudge needs somewhere to stash the new token.
            judgeToken: {
                type: String,
                select: false
            },

            // FIX (submission-controller spec): timestamp of when judging
            // actually completed, distinct from `createdAt` (submittedAt).
            judgedAt: {
                type: Date
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

submissionSchema.post("save", async function (doc, next) {
    if (doc.status === "ACCEPTED") {
        try {
            const UserProfile = mongoose.model("UserProfile");
            
            // Check if this user has already solved this question slug previously
            const alreadySolved = await mongoose.model("Submission").exists({
                userId: doc.userId,
                questionSlug: doc.questionSlug,
                status: "ACCEPTED",
                _id: { $ne: doc._id }
            });

            if (!alreadySolved) {
                let statField: string | null = null;
                if (doc.battleType === "DSA") {
                    statField = "stats.dsaSolved";
                } else if (doc.battleType === "FRONTEND") {
                    statField = "stats.frontendCompleted";
                } else if (doc.battleType === "BACKEND") {
                    statField = "stats.backendCompleted";
                } else if (doc.battleType === "PROJECTS") {
                    statField = "stats.projectsCompleted";
                }

                if (statField) {
                    await UserProfile.findOneAndUpdate(
                        { userId: doc.userId },
                        { $inc: { [statField]: 1 } },
                        { upsert: true }
                    );
                    console.log(`[SubmissionModel] Incremented ${statField} for user ${doc.userId}`);
                }
            }
        } catch (err) {
            console.error("[SubmissionModel] Failed to update user profile stats:", err);
        }
    }
    next();
});


const Submission: mongoose.Model<ISubmission> =
    (mongoose.models.Submission as mongoose.Model<ISubmission>) ||
    mongoose.model<ISubmission>("Submission", submissionSchema);

export default Submission;
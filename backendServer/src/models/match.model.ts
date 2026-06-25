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
                    "FULLSTACK",
                    "PROMPT_WAR",
                    "BUG_FIX"
                ]
            },

            // FIX: teamA/teamB here are a deliberate snapshot of team
            // membership taken at match-start time, intentionally decoupled
            // from BattleRoom.teams (which may change while the room is in
            // WAITING state). Never mutate these after the match begins.
            // Source-of-truth for in-flight match logic is always this snapshot.
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

            // FIX: endedAt is required when status transitions to COMPLETED or
            // ABANDONED — enforced in the pre-save hook below. durationInMinutes
            // is the *planned* duration (set at room creation); actual elapsed
            // time should be derived from startedAt/endedAt when needed.
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

            // FIX: ratingProcessed defaults to false. Your rating processor
            // MUST be idempotent and a scheduled job should periodically query
            // { status: "COMPLETED", ratingProcessed: false } to catch any
            // records that were missed due to a crash.
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
        }
    );


// FIX: Require endedAt whenever the match is no longer ONGOING.
// This prevents silent data loss where COMPLETED/ABANDONED matches
// have no recorded end time, making elapsed-time calculations impossible.
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

// FIX: Index to support the idempotent rating retry job efficiently.
matchSchema.index({ status: 1, ratingProcessed: 1 });


const Match: mongoose.Model<IMatch> =
    (mongoose.models.Match as mongoose.Model<IMatch>) ||
    mongoose.model<IMatch>("Match", matchSchema);

export default Match;
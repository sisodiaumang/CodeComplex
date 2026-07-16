import mongoose from "mongoose";
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
                    "PROJECTS",
                    "PROMPT_WAR",
                    "BUG_FIX"
                ],
                required: true
            },

            topics: {
                type: [String],
                default: []
            },

            // FIX: difficulty is conditionally required — enforced in the
            // pre-validate hook below. DSA battles always need a difficulty;
            // PROMPT_WAR and BUG_FIX may reasonably omit it.
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
                ]
            },

            isRanked: {
                type: Boolean,
                default: true
            },
            isSolo: {
                type: Boolean,
                default: false
            },
            isPrivate: {
                type: Boolean,
                default: true
            }
        },
        {
            timestamps: true
        }
    );


// FIX: Require difficulty for battle types where it is meaningful.
battleRoomSchema.pre("validate", function () {
    const requiresDifficulty = ["DSA", "FRONTEND", "BACKEND", "PROJECTS", "BUG_FIX"];

    if (requiresDifficulty.includes(this.battleType) && !this.difficulty) {
        throw  (
            new Error(`difficulty is required for battleType "${this.battleType}"`)
        );
    }

    ;
});


// FIX: Enforce teamSize cap on both teams so the schema-level enum actually
// means something at runtime. This guard runs on every save; for join flows
// using findOneAndUpdate you must also enforce this in the controller/service
// before issuing the update.
battleRoomSchema.pre("save", function () {
    const max = this.teamSize ?? 1;

    if (this.teams.teamA.length > max) {
        throw (new Error(`teamA exceeds the allowed teamSize of ${max}`));
    }

    if (this.teams.teamB.length > max) {
        throw(new Error(`teamB exceeds the allowed teamSize of ${max}`));
    }

    
});


battleRoomSchema.index({ roomCode: 1 });
battleRoomSchema.index({ status: 1 });
battleRoomSchema.index({ battleType: 1 });

// Dynamic websocket active room notification on save
battleRoomSchema.post("save", function (doc) {
    if (!doc) return;
    import("../index.js").then(({ io }) => {
        if (!io) return;
        const userIds = [
            doc.host?.toString(),
            ...(doc.teams?.teamA?.map((id: any) => id.toString()) ?? []),
            ...(doc.teams?.teamB?.map((id: any) => id.toString()) ?? [])
        ].filter(Boolean);
        const uniqueUserIds = [...new Set(userIds)];
        uniqueUserIds.forEach(id => {
            io.to(`user:${id}`).emit("battle:active_room_update");
        });
    }).catch(() => {});
});

// Dynamic websocket active room notification on findOneAndUpdate
battleRoomSchema.post("findOneAndUpdate", function (doc) {
    if (!doc) return;
    import("../index.js").then(({ io }) => {
        if (!io) return;
        const userIds = [
            doc.host?.toString(),
            ...(doc.teams?.teamA?.map((id: any) => id.toString()) ?? []),
            ...(doc.teams?.teamB?.map((id: any) => id.toString()) ?? [])
        ].filter(Boolean);
        const uniqueUserIds = [...new Set(userIds)];
        uniqueUserIds.forEach(id => {
            io.to(`user:${id}`).emit("battle:active_room_update");
        });
    }).catch(() => {});
});

// Dynamic websocket active room notification on findOneAndDelete
battleRoomSchema.post("findOneAndDelete", function (doc) {
    if (!doc) return;
    import("../index.js").then(({ io }) => {
        if (!io) return;
        const userIds = [
            doc.host?.toString(),
            ...(doc.teams?.teamA?.map((id: any) => id.toString()) ?? []),
            ...(doc.teams?.teamB?.map((id: any) => id.toString()) ?? [])
        ].filter(Boolean);
        const uniqueUserIds = [...new Set(userIds)];
        uniqueUserIds.forEach(id => {
            io.to(`user:${id}`).emit("battle:active_room_update");
        });
    }).catch(() => {});
});


// FIX (I6): defense-in-depth helper for any future findOneAndUpdate-based
// join flow. The pre-save hook above enforces the teamSize cap correctly
// today because joinRoom/joinTeamA/joinTeamB (battle_controller.ts) all
// fetch the document and call room.save() — but pre-save hooks NEVER run
// on findOneAndUpdate, with or without { runValidators: true }, since that
// option only re-runs schema-level field validators, not custom document
// hooks. If a future refactor switches any of those handlers to a
// $push-based findOneAndUpdate (a common optimisation to avoid the fetch),
// it MUST call this first and reject the request on `false` — there is no
// way to make Mongoose enforce this automatically for that update style.
export function hasTeamCapacity(
    room: Pick<IBattleRoom, "teamSize">,
    currentTeamLength: number
): boolean {
    return currentTeamLength < (room.teamSize ?? 1);
}


const BattleRoom: mongoose.Model<IBattleRoom> =
    (mongoose.models.BattleRoom as mongoose.Model<IBattleRoom>) ||
    mongoose.model<IBattleRoom>("BattleRoom", battleRoomSchema);

export default BattleRoom;
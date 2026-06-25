import { Server, Socket } from "socket.io";
import BattleRoom from "../models/battleRoom.model.js";
import { SocketUser } from "../middlewares/socketAuth.middleware.js";
import { getUserTeam, TeamLetter } from "./utils/battleTeam.util.js";



interface JoinPayload {
    roomCode: string;
}

interface SendPayload {
    roomCode: string;
    message: string;
}

const GLOBAL_PREFIX = "!!";
const MAX_MESSAGE_LENGTH = 500;

const globalChannel = (roomCode: string) => roomCode;
const teamChannel = (roomCode: string, team: TeamLetter) => `${roomCode}:${team}`;

/** Returns which team the user belongs to in this room, or null if not a member. */


export const registerBattleChatHandlers = (io: Server, socket: Socket): void => {
    const user = socket.data.user as SocketUser;

    // ── battle:chat:join ──────────────────────────────────────────────
    // Call when entering a room, and again whenever the team changes
    // (e.g. after a battle:team-update event) so the cache stays correct.
    socket.on("battle:chat:join", async ({ roomCode }: JoinPayload) => {
        try {
            if (!roomCode) return;

            const team = await getUserTeam(roomCode, user._id);
            if (!team) {
                socket.emit("battle:chat:error", { message: "You are not a member of this room" });
                return;
            }

            const previousTeam = socket.data.teams?.[roomCode];
            if (previousTeam && previousTeam !== team) {
                socket.leave(teamChannel(roomCode, previousTeam));
            }

            socket.join(globalChannel(roomCode));
            socket.join(teamChannel(roomCode, team));

            socket.data.teams = { ...(socket.data.teams ?? {}), [roomCode]: team };

            socket.emit("battle:chat:joined", { roomCode, team });
        } catch {
            socket.emit("battle:chat:error", { message: "Could not join chat for this room" });
        }
    });

    // ── battle:chat:send ───────────────────────────────────────────────
    // "!!" prefix  -> whole room (both teams)
    // no prefix    -> sender's team only
    socket.on("battle:chat:send", async ({ roomCode, message }: SendPayload) => {
        try {
            if (!roomCode || typeof message !== "string") return;

            const trimmed = message.trim();
            if (!trimmed) return;

            if (trimmed.length > MAX_MESSAGE_LENGTH) {
                socket.emit("battle:chat:error", {
                    message: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`
                });
                return;
            }

            // Defensive re-check — don't trust a stale cache for something
            // that fans out to other people.
            let team = socket.data.teams?.[roomCode] as TeamLetter | undefined;
            if (!team) {
                team = (await getUserTeam(roomCode, user._id)) ?? undefined;
            }

            if (!team) {
                socket.emit("battle:chat:error", { message: "You are not a member of this room" });
                return;
            }

            const isGlobal = trimmed.startsWith(GLOBAL_PREFIX);
            const content = isGlobal ? trimmed.slice(GLOBAL_PREFIX.length).trim() : trimmed;
            if (!content) return;

            const payload = {
                roomCode,
                scope: isGlobal ? "global" : "team",
                team,
                sender: {
                    _id: user._id,
                    username: user.username,
                    fullName: user.fullName
                },
                message: content,
                createdAt: new Date()
            };

            const channel = isGlobal ? globalChannel(roomCode) : teamChannel(roomCode, team);
            io.to(channel).emit("battle:chat:message", payload);
        } catch {
            socket.emit("battle:chat:error", { message: "Failed to send message" });
        }
    });
};
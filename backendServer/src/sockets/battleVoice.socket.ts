import { Server, Socket } from "socket.io";
import { getUserTeam, TeamLetter } from "./utils/battleTeam.util.js";
import { SocketUser } from "../middlewares/socketAuth.middleware.js";

interface JoinPayload { roomCode: string }
interface LeavePayload { roomCode: string }
interface MutePayload { roomCode: string; muted: boolean }
interface SignalPayload {
    roomCode: string;
    to: string; // target socket id
    data: { type: "offer" | "answer" | "candidate"; payload: unknown };
}

const voiceRoomKey = (roomCode: string, team: TeamLetter) => `${roomCode}:${team}:voice`;

export const registerBattleVoiceHandlers = (io: Server, socket: Socket): void => {
    const user = socket.data.user as SocketUser;

    // ── battle:voice:join ──────────────────────────────────────────────
    // Joins the team's voice presence room and tells the new socket who's
    // already there, so it can initiate WebRTC offers (mesh topology —
    // fine for team sizes up to 4, which is your current max).
    socket.on("battle:voice:join", async ({ roomCode }: JoinPayload) => {
        try {
            if (!roomCode) return;

            const team =
                (socket.data.teams?.[roomCode] as TeamLetter | undefined) ??
                (await getUserTeam(roomCode, user._id)) ?? undefined;

            if (!team) {
                socket.emit("battle:voice:error", { message: "You are not a member of this room" });
                return;
            }

            const key = voiceRoomKey(roomCode, team);

            // Snapshot peers BEFORE joining so the list never includes self.
            const existingRoom = io.sockets.adapter.rooms.get(key);
            const peers = existingRoom ? Array.from(existingRoom) : [];

            socket.join(key);
            socket.data.voiceRoom = key;

            socket.emit("battle:voice:peers", { roomCode, peers });

            socket.to(key).emit("battle:voice:peer-joined", {
                roomCode,
                socketId: socket.id,
                user: { _id: user._id, username: user.username, fullName: user.fullName }
            });
        } catch {
            socket.emit("battle:voice:error", { message: "Could not join voice" });
        }
    });

    // ── battle:voice:signal ──────────────────────────────────────────────
    // Pure relay for WebRTC SDP offers/answers and ICE candidates.
    // The server never inspects or stores the payload.
    socket.on("battle:voice:signal", ({ roomCode, to, data }: SignalPayload) => {
        if (!to || !data) return;
        io.to(to).emit("battle:voice:signal", { roomCode, from: socket.id, data });
    });

    // ── battle:voice:mute ──────────────────────────────────────────────
    socket.on("battle:voice:mute", ({ roomCode, muted }: MutePayload) => {
        const key = socket.data.voiceRoom;
        if (!key) return;
        socket.to(key).emit("battle:voice:mute-changed", { roomCode, socketId: socket.id, muted });
    });

    // ── battle:voice:leave ───────────────────────────────────────────────
    const leaveVoice = (roomCode?: string) => {
        const key = socket.data.voiceRoom;
        if (!key) return;
        socket.leave(key);
        socket.to(key).emit("battle:voice:peer-left", { roomCode, socketId: socket.id });
        delete socket.data.voiceRoom;
    };

    socket.on("battle:voice:leave", ({ roomCode }: LeavePayload) => leaveVoice(roomCode));
    socket.on("disconnect", () => leaveVoice());
};
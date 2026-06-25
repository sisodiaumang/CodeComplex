import { Server, Socket } from "socket.io";
import { getUserTeam, TeamLetter } from "./utils/battleTeam.util.js";
import { SocketUser } from "../middlewares/socketAuth.middleware.js";

export type VoiceScope = "global" | "team";

interface JoinPayload { roomCode: string; scope?: VoiceScope }
interface LeavePayload { roomCode: string }
interface MutePayload { roomCode: string; muted: boolean }
interface SignalPayload {
    roomCode: string;
    to: string; // target socket id
    data: { type: "offer" | "answer" | "candidate"; payload: unknown };
}

interface PeerInfo {
    socketId: string;
    user: { _id: string; username: string; fullName: string };
}

// global -> whole room, regardless of team
// team   -> caller's team only
const voiceRoomKey = (roomCode: string, scope: VoiceScope, team?: TeamLetter) =>
    scope === "global" ? `${roomCode}:GLOBAL:voice` : `${roomCode}:${team}:voice`;

export const registerBattleVoiceHandlers = (io: Server, socket: Socket): void => {
    const user = socket.data.user as SocketUser;

    const peerInfo = (): PeerInfo["user"] => ({
        _id: user._id,
        username: user.username,
        fullName: user.fullName
    });

    // Tracks { key -> Map<socketId, PeerInfo["user"]> } per socket so we can
    // build a self-sufficient peers payload without depending on the
    // peer-joined event having fired for everyone already in the room.
    const getRoomPeers = (key: string): Map<string, PeerInfo["user"]> => {
        const rooms = io.sockets.adapter.rooms.get(key);
        const peers = new Map<string, PeerInfo["user"]>();
        if (!rooms) return peers;
        for (const sid of rooms) {
            const s = io.sockets.sockets.get(sid);
            const u = s?.data?.user as SocketUser | undefined;
            if (u) peers.set(sid, { _id: u._id, username: u.username, fullName: u.fullName });
        }
        return peers;
    };

    // ── battle:voice:join ──────────────────────────────────────────────
    // scope: "team" (default) joins the caller's team-only voice mesh.
    // scope: "global" joins a whole-room mesh shared by both teams.
    // Mesh topology — fine for team sizes up to 4 / rooms up to 8 total,
    // which is your current max.
    socket.on("battle:voice:join", async ({ roomCode, scope = "team" }: JoinPayload) => {
        try {
            if (!roomCode) return;

            let team: TeamLetter | undefined;
            if (scope === "team") {
                team =
                    (socket.data.teams?.[roomCode] as TeamLetter | undefined) ??
                    (await getUserTeam(roomCode, user._id)) ?? undefined;

                if (!team) {
                    socket.emit("battle:voice:error", { message: "You are not a member of this room" });
                    return;
                }
            } else {
                // Global voice still requires room membership, just not a
                // specific team.
                const resolvedTeam = await getUserTeam(roomCode, user._id);
                if (!resolvedTeam) {
                    socket.emit("battle:voice:error", { message: "You are not a member of this room" });
                    return;
                }
            }

            const key = voiceRoomKey(roomCode, scope, team);

            // Snapshot peers BEFORE joining so the list never includes self,
            // and carry user info so the new joiner can render identities
            // immediately without waiting on peer-joined events for peers
            // that were already present.
            const existingPeers = getRoomPeers(key);

            socket.join(key);
            socket.data.voiceRoom = key;
            socket.data.voiceScope = scope;

            socket.emit("battle:voice:peers", {
                roomCode,
                scope,
                peers: Array.from(existingPeers, ([socketId, u]) => ({ socketId, user: u }))
            });

            socket.to(key).emit("battle:voice:peer-joined", {
                roomCode,
                scope,
                socketId: socket.id,
                user: peerInfo()
            });
        } catch {
            socket.emit("battle:voice:error", { message: "Could not join voice" });
        }
    });

    // ── battle:voice:signal ──────────────────────────────────────────────
    // Pure relay for WebRTC SDP offers/answers and ICE candidates.
    // The server never inspects or stores the payload — but it MUST verify
    // both sockets are in the same voice room before relaying, otherwise
    // this is an open relay any connected client can use to spam arbitrary
    // offers/candidates at any other socket id on the server.
    socket.on("battle:voice:signal", ({ roomCode, to, data }: SignalPayload) => {
        if (!to || !data) return;

        const myRoom = socket.data.voiceRoom as string | undefined;
        if (!myRoom) {
            socket.emit("battle:voice:error", { message: "You are not in a voice channel" });
            return;
        }

        const targetSocket = io.sockets.sockets.get(to);
        const targetRoom = targetSocket?.data?.voiceRoom as string | undefined;

        if (!targetSocket || targetRoom !== myRoom) {
            socket.emit("battle:voice:error", { message: "Target is not in your voice channel" });
            return;
        }

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
        const scope = socket.data.voiceScope as VoiceScope | undefined;
        socket.leave(key);
        socket.to(key).emit("battle:voice:peer-left", { roomCode, scope, socketId: socket.id });
        delete socket.data.voiceRoom;
        delete socket.data.voiceScope;
    };

    socket.on("battle:voice:leave", ({ roomCode }: LeavePayload) => leaveVoice(roomCode));
    socket.on("disconnect", () => leaveVoice());
};
import BattleRoom from "../../models/battleRoom.model.js";

export type TeamLetter = "A" | "B";

/** Resolves which team (if any) a user belongs to in a given room. */
export async function getUserTeam(
    roomCode: string,
    userId: string
): Promise<TeamLetter | null> {
    const room = await BattleRoom.findOne({ roomCode }).select("teams");
    if (!room) return null;

    if (room.teams.teamA.map((id) => id.toString()).includes(userId)) return "A";
    if (room.teams.teamB.map((id) => id.toString()).includes(userId)) return "B";
    return null;
}
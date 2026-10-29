import mongoose, { Types } from "mongoose";
import { nanoid } from "nanoid";
import Tournament from "../models/tournament.model.js";
import BattleRoom from "../models/battleRoom.model.js";
import Match from "../models/match.model.js";
import User from "../models/user.model.js";
import UserProfile from "../models/userProfile.model.js";
import Notification from "../models/notification.model.js";
import { io } from "../index.js";
import { pickRandomQuestion } from "../controllers/battle.controller.js";
import { checkAchievements } from "./achievement.service.js";
import {
    ITournament,
    ITournamentParticipant,
    ITournamentMatch,
    ITournamentRound,
    TournamentStatus,
    TournamentFormat
} from "../interfaces/tournament.interface.js";

function getRoundName(totalMatchesInRound: number, totalRounds: number, currentRoundIndex: number): string {
    if (totalMatchesInRound === 1) return "Grand Finals";
    if (totalMatchesInRound === 2) return "Semi-Finals";
    if (totalMatchesInRound === 4) return "Quarter-Finals";
    return `Round ${currentRoundIndex}`;
}

export async function createTournament(
    creatorId: string,
    data: {
        title: string;
        description?: string;
        format: TournamentFormat;
        teamSize?: number;
        battleType: "DSA" | "FRONTEND" | "BACKEND" | "PROJECTS" | "PROMPT_WAR" | "BUG_FIX";
        difficulty?: "EASY" | "MEDIUM" | "HARD" | "MIXED";
        topics?: string[];
        maxParticipants: 4 | 8 | 16 | 32;
        startTime?: Date;
        autoStartWhenFull?: boolean;
    }
): Promise<ITournament> {
    const format = data.format || "SOLO";
    const teamSize = format === "SOLO" ? 1 : Math.max(2, Math.min(4, Number(data.teamSize || 2)));
    const maxParticipants = Number(data.maxParticipants) || 8;
    const totalRounds = Math.log2(maxParticipants);

    const tournament = new Tournament({
        title: data.title.trim(),
        description: data.description?.trim() || "",
        creator: new Types.ObjectId(creatorId),
        format,
        teamSize,
        battleType: data.battleType || "DSA",
        difficulty: data.difficulty || "MEDIUM",
        topics: data.topics || [],
        maxParticipants,
        status: "REGISTRATION",
        currentRound: 0,
        totalRounds,
        startTime: data.startTime,
        autoStartWhenFull: data.autoStartWhenFull !== false,
        participants: [],
        rounds: [],
        prizes: {
            winnerXp: maxParticipants * 100,
            runnerUpXp: maxParticipants * 40
        }
    });

    await tournament.save();

    if (io) {
        io.emit("tournament:created", {
            id: tournament._id,
            title: tournament.title,
            format: tournament.format,
            battleType: tournament.battleType,
            status: tournament.status
        });
    }

    return tournament;
}

export async function joinTournament(
    tournamentId: string,
    userId: string,
    options?: {
        teamName?: string;
        teamMemberUsernames?: string[];
    }
): Promise<ITournament> {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    if (tournament.status !== "REGISTRATION") {
        throw new Error("Tournament registration is closed");
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
        throw new Error("Tournament is already full");
    }

    const user = await User.findById(userId).select("username fullName avatar");
    if (!user) throw new Error("User not found");

    // Check if user is already registered in this tournament
    const alreadyRegistered = tournament.participants.some(p =>
        p.members.some(m => m.userId.toString() === userId)
    );
    if (alreadyRegistered) {
        throw new Error("You are already registered in this tournament");
    }

    let participant: ITournamentParticipant;

    if (tournament.format === "SOLO") {
        participant = {
            id: user._id.toString(),
            name: user.username,
            avatar: user.avatar?.profileImageURL || "",
            members: [
                {
                    userId: user._id as Types.ObjectId,
                    username: user.username,
                    avatar: user.avatar?.profileImageURL || ""
                }
            ],
            seed: tournament.participants.length + 1,
            registeredAt: new Date()
        };
    } else {
        // TEAM tournament
        const teamName = options?.teamName?.trim() || `${user.username}'s Team`;
        const members: ITournamentParticipant["members"] = [
            {
                userId: user._id as Types.ObjectId,
                username: user.username,
                avatar: user.avatar?.profileImageURL || ""
            }
        ];

        // If teammates were specified
        if (options?.teamMemberUsernames && options.teamMemberUsernames.length > 0) {
            const usernames = options.teamMemberUsernames
                .map(u => u.trim().toLowerCase())
                .filter(u => u && u !== user.username.toLowerCase());

            const teammateUsers = await User.find({
                username: { $in: usernames.map(u => new RegExp(`^${u}$`, "i")) }
            }).select("username fullName avatar");

            for (const teammate of teammateUsers) {
                if (members.length >= tournament.teamSize) break;
                // Verify teammate isn't already in tournament
                const teammateInTourney = tournament.participants.some(p =>
                    p.members.some(m => m.userId.toString() === teammate._id.toString())
                );
                if (!teammateInTourney) {
                    members.push({
                        userId: teammate._id as Types.ObjectId,
                        username: teammate.username,
                        avatar: teammate.avatar?.profileImageURL || ""
                    });
                }
            }
        }

        participant = {
            id: nanoid(8),
            name: teamName,
            avatar: user.avatar?.profileImageURL || "",
            members,
            seed: tournament.participants.length + 1,
            registeredAt: new Date()
        };
    }

    tournament.participants.push(participant);
    await tournament.save();

    if (io) {
        io.to(`tournament:${tournament._id}`).emit("tournament:updated", tournament);
        io.emit("tournament:participant_joined", {
            tournamentId: tournament._id,
            participantCount: tournament.participants.length,
            maxParticipants: tournament.maxParticipants
        });
    }

    // Auto-start if filled and autoStartWhenFull is true
    if (tournament.autoStartWhenFull && tournament.participants.length >= tournament.maxParticipants) {
        startTournamentInternal(tournament).catch(err =>
            console.error("[TournamentService] Auto-start failed:", err)
        );
    }

    return tournament;
}

export async function leaveTournament(tournamentId: string, userId: string): Promise<ITournament> {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    if (tournament.status !== "REGISTRATION") {
        throw new Error("Cannot leave tournament after it has started");
    }

    const initialCount = tournament.participants.length;
    tournament.participants = tournament.participants.filter(
        p => !p.members.some(m => m.userId.toString() === userId)
    );

    if (tournament.participants.length === initialCount) {
        throw new Error("You are not registered in this tournament");
    }

    await tournament.save();

    if (io) {
        io.to(`tournament:${tournament._id}`).emit("tournament:updated", tournament);
    }

    return tournament;
}

export async function startTournament(tournamentId: string, requesterUserId: string): Promise<ITournament> {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    if (tournament.status !== "REGISTRATION") {
        throw new Error("Tournament has already started or concluded");
    }

    if (tournament.creator.toString() !== requesterUserId) {
        const user = await User.findById(requesterUserId).select("role");
        if (!user || !["ADMIN", "MODERATOR", "OWNER"].includes(user.role || "")) {
            throw new Error("Only the tournament creator or an admin can manually start the tournament");
        }
    }

    if (tournament.participants.length < 2) {
        throw new Error("At least 2 participants are required to start a tournament bracket");
    }

    return await startTournamentInternal(tournament);
}

async function startTournamentInternal(tournament: InstanceType<typeof Tournament>): Promise<ITournament> {
    const participants = [...tournament.participants];

    // Determine bracket size: next power of 2
    let bracketSize = 2;
    while (bracketSize < participants.length) {
        bracketSize *= 2;
    }
    const totalRounds = Math.log2(bracketSize);

    // Shuffle participants for fair seeding
    const seeded = [...participants].sort(() => Math.random() - 0.5);

    // Build Round 1 matches
    const round1Matches: ITournamentMatch[] = [];
    const numMatchesInRound1 = bracketSize / 2;

    for (let i = 0; i < numMatchesInRound1; i++) {
        const partA = seeded[i * 2];
        const partB = seeded[i * 2 + 1];

        const match: ITournamentMatch = {
            matchIndex: i,
            participantA: partA ? {
                id: partA.id,
                name: partA.name,
                avatar: partA.avatar,
                score: 0,
                members: partA.members
            } : undefined,
            participantB: partB ? {
                id: partB.id,
                name: partB.name,
                avatar: partB.avatar,
                score: 0,
                members: partB.members
            } : undefined,
            status: "PENDING"
        };

        if (partA && !partB) {
            // BYE advancement
            match.status = "BYE";
            match.winnerId = partA.id;
        } else if (!partA && partB) {
            match.status = "BYE";
            match.winnerId = partB.id;
        } else if (partA && partB) {
            match.status = "ACTIVE";
        }

        round1Matches.push(match);
    }

    const round1: ITournamentRound = {
        roundIndex: 1,
        roundName: getRoundName(numMatchesInRound1, totalRounds, 1),
        matches: round1Matches
    };

    tournament.rounds = [round1];
    tournament.currentRound = 1;
    tournament.totalRounds = totalRounds;
    tournament.status = "IN_PROGRESS";
    await tournament.save();

    // Create BattleRooms and Matches for all active matchups in Round 1
    for (const match of round1Matches) {
        if (match.status === "ACTIVE" && match.participantA && match.participantB) {
            try {
                await createBattleRoomForTournamentMatch(tournament, 1, match);
            } catch (err) {
                console.error("[TournamentService] Failed to create room for match:", err);
            }
        }
    }

    await tournament.save();

    // Track tournamentsPlayed stat for all participants
    for (const p of tournament.participants) {
        for (const member of p.members) {
            UserProfile.updateOne(
                { userId: member.userId },
                { $inc: { "stats.tournamentsPlayed": 1 } }
            ).catch(() => {});
        }
    }

    // Check achievement for entering tournament (Tournament Contender)
    const allUserIds = tournament.participants.flatMap(p => p.members.map(m => m.userId.toString()));
    checkAchievements(allUserIds, "tournament_start").catch(() => {});

    if (io) {
        io.to(`tournament:${tournament._id}`).emit("tournament:started", tournament);
        io.to(`tournament:${tournament._id}`).emit("tournament:updated", tournament);
        io.emit("tournament:status_changed", {
            id: tournament._id,
            status: tournament.status,
            currentRound: tournament.currentRound
        });
    }

    return tournament;
}

async function createBattleRoomForTournamentMatch(
    tournament: InstanceType<typeof Tournament>,
    roundIndex: number,
    match: ITournamentMatch
): Promise<void> {
    if (!match.participantA || !match.participantB) return;

    const hostUserId = match.participantA.members?.[0]?.userId;
    if (!hostUserId) return;

    const teamAIds = (match.participantA.members || []).map(m => m.userId);
    const teamBIds = (match.participantB.members || []).map(m => m.userId);

    // Difficulty scaling for MIXED tournaments
    let diff = tournament.difficulty;
    if (diff === "MIXED") {
        if (roundIndex === 1) diff = "EASY";
        else if (roundIndex >= tournament.totalRounds) diff = "HARD";
        else diff = "MEDIUM";
    }

    const roomCode = nanoid(6).toUpperCase();

    const room = new BattleRoom({
        roomCode,
        host: hostUserId,
        battleType: tournament.battleType,
        difficulty: diff as any,
        topics: tournament.topics || [],
        teamSize: tournament.teamSize,
        status: "STARTED",
        isRanked: true,
        isPrivate: true,
        isSolo: tournament.teamSize === 1,
        teams: {
            teamA: teamAIds,
            teamB: teamBIds
        },
        tournamentId: tournament._id,
        tournamentRoundIndex: roundIndex,
        tournamentMatchIndex: match.matchIndex
    });

    // Random question selection
    try {
        const questionSlug = await pickRandomQuestion(room);
        if (questionSlug) {
            room.questionSlug = questionSlug;
        }
    } catch (err) {
        console.error("[TournamentService] Question selection error:", err);
    }

    await room.save();

    // Create Match document
    const matchDoc = new Match({
        battleRoomId: room._id,
        questionSlug: room.questionSlug || "two-sum",
        battleType: tournament.battleType,
        difficulty: diff as any,
        teamA: teamAIds,
        teamB: teamBIds,
        durationInMinutes: 30,
        status: "ONGOING",
        matchType: "TOURNAMENT",
        startedAt: new Date(),
        tournamentId: tournament._id
    });

    await matchDoc.save();

    room.matchId = matchDoc._id as Types.ObjectId;
    await room.save();

    match.battleRoomCode = roomCode;
    match.matchId = matchDoc._id as Types.ObjectId;

    // Notify participants via in-app notification & socket
    const participantUserIds = [...teamAIds, ...teamBIds];
    for (const uId of participantUserIds) {
        Notification.create({
            recipient: uId,
            type: "SYSTEM",
            title: `🏆 Tournament Match Ready! (${tournament.title})`,
            message: `Round ${roundIndex} is starting! Click to join your battle room.`
        }).catch(() => {});

        if (io) {
            io.to(`user:${uId}`).emit("tournament:match_ready", {
                tournamentId: tournament._id,
                roomCode,
                roundIndex,
                title: tournament.title
            });
        }
    }
}

export async function handleTournamentMatchFinished(
    matchId: string,
    winnerId?: string | null,
    winnerTeam?: "A" | "B" | "DRAW"
): Promise<void> {
    const tournament = await Tournament.findOne({
        "rounds.matches.matchId": new Types.ObjectId(matchId)
    });

    if (!tournament || tournament.status !== "IN_PROGRESS") {
        return;
    }

    const currentRound = tournament.rounds.find(r => r.roundIndex === tournament.currentRound);
    if (!currentRound) return;

    const match = currentRound.matches.find(
        m => m.matchId && m.matchId.toString() === matchId
    );
    if (!match) return;

    // Determine winner participant
    let winningParticipant = match.participantA;
    if (winnerTeam === "B") {
        winningParticipant = match.participantB;
    } else if (winnerTeam === "A") {
        winningParticipant = match.participantA;
    } else if (winnerId) {
        const isA = match.participantA?.members?.some(m => m.userId.toString() === winnerId) || match.participantA?.id === winnerId;
        winningParticipant = isA ? match.participantA : match.participantB;
    }

    if (!winningParticipant) {
        winningParticipant = match.participantA; // Fallback
    }

    match.status = "COMPLETED";
    match.winnerId = winningParticipant?.id;
    match.completedAt = new Date();

    // Increment tournamentMatchesWon stat for winning team members
    if (winningParticipant?.members) {
        for (const m of winningParticipant.members) {
            UserProfile.updateOne(
                { userId: m.userId },
                { $inc: { "stats.tournamentMatchesWon": 1 } }
            ).catch(() => {});
        }
    }

    // Check if ALL matches in this round are completed
    const allMatchesCompleted = currentRound.matches.every(
        m => m.status === "COMPLETED" || m.status === "BYE"
    );

    if (allMatchesCompleted) {
        if (tournament.currentRound >= tournament.totalRounds) {
            // Tournament is FINISHED! Crown champion!
            const grandFinalMatch = currentRound.matches[0];
            const champId = grandFinalMatch?.winnerId;
            const champ = champId === grandFinalMatch?.participantA?.id
                ? grandFinalMatch?.participantA
                : grandFinalMatch?.participantB;

            const runnerUp = champId === grandFinalMatch?.participantA?.id
                ? grandFinalMatch?.participantB
                : grandFinalMatch?.participantA;

            tournament.status = "COMPLETED";
            if (champ) {
                tournament.winner = {
                    id: champ.id,
                    name: champ.name,
                    avatar: champ.avatar,
                    members: champ.members
                };
            }
            if (runnerUp) {
                tournament.runnerUp = {
                    id: runnerUp.id,
                    name: runnerUp.name,
                    avatar: runnerUp.avatar,
                    members: runnerUp.members
                };
            }

            // Award stats and XP to champion
            if (champ?.members) {
                for (const member of champ.members) {
                    UserProfile.updateOne(
                        { userId: member.userId },
                        { $inc: { "stats.tournamentsWon": 1, "stats.finalsReached": 1 } }
                    ).catch(() => {});
                }
            }

            // Award stats to runner-up
            if (runnerUp?.members) {
                for (const member of runnerUp.members) {
                    UserProfile.updateOne(
                        { userId: member.userId },
                        { $inc: { "stats.finalsReached": 1 } }
                    ).catch(() => {});
                }
            }

            // Check achievements for all participants (especially champions and finalists)
            const allParticipantsUserIds = tournament.participants.flatMap(p =>
                p.members.map(m => m.userId.toString())
            );
            checkAchievements(allParticipantsUserIds, "tournament_concluded").catch(() => {});

            // Global broadcast
            if (io) {
                io.to(`tournament:${tournament._id}`).emit("tournament:champion_crowned", {
                    tournamentId: tournament._id,
                    winner: tournament.winner,
                    runnerUp: tournament.runnerUp
                });
                io.emit("tournament:completed", {
                    id: tournament._id,
                    title: tournament.title,
                    winner: tournament.winner
                });
            }
        } else {
            // Advance to NEXT ROUND!
            const nextRoundIndex = tournament.currentRound + 1;
            const winners: ITournament["rounds"][0]["matches"][0]["participantA"][] = [];

            for (const m of currentRound.matches) {
                const w = m.winnerId === m.participantA?.id ? m.participantA : m.participantB;
                if (w) winners.push(w);
            }

            const nextRoundMatches: ITournamentMatch[] = [];
            const numMatchesNextRound = winners.length / 2;

            for (let i = 0; i < numMatchesNextRound; i++) {
                const partA = winners[i * 2];
                const partB = winners[i * 2 + 1];

                const nextMatch: ITournamentMatch = {
                    matchIndex: i,
                    participantA: partA,
                    participantB: partB,
                    status: (partA && partB) ? "ACTIVE" : "PENDING"
                };

                nextRoundMatches.push(nextMatch);
            }

            const nextRound: ITournamentRound = {
                roundIndex: nextRoundIndex,
                roundName: getRoundName(numMatchesNextRound, tournament.totalRounds, nextRoundIndex),
                matches: nextRoundMatches
            };

            tournament.rounds.push(nextRound);
            tournament.currentRound = nextRoundIndex;
            await tournament.save();

            // Create battle rooms for next round matches
            for (const m of nextRoundMatches) {
                if (m.status === "ACTIVE") {
                    try {
                        await createBattleRoomForTournamentMatch(tournament, nextRoundIndex, m);
                    } catch (err) {
                        console.error("[TournamentService] Failed next round room creation:", err);
                    }
                }
            }

            if (io) {
                io.to(`tournament:${tournament._id}`).emit("tournament:round_advanced", {
                    tournamentId: tournament._id,
                    currentRound: nextRoundIndex,
                    roundName: nextRound.roundName
                });
            }
        }
    }

    await tournament.save();

    if (io) {
        io.to(`tournament:${tournament._id}`).emit("tournament:updated", tournament);
    }
}

export async function getTournaments(query?: {
    format?: string;
    battleType?: string;
    status?: string;
    search?: string;
}): Promise<ITournament[]> {
    const filter: any = {};

    if (query?.format && query.format !== "ALL") {
        filter.format = query.format.toUpperCase();
    }
    if (query?.battleType && query.battleType !== "ALL") {
        filter.battleType = query.battleType.toUpperCase();
    }
    if (query?.status && query.status !== "ALL") {
        filter.status = query.status.toUpperCase();
    }
    if (query?.search?.trim()) {
        filter.title = { $regex: query.search.trim(), $options: "i" };
    }

    return await Tournament.find(filter)
        .sort({ status: 1, createdAt: -1 })
        .populate("creator", "username avatar");
}

export async function getTournamentById(tournamentId: string): Promise<ITournament | null> {
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) return null;
    return await Tournament.findById(tournamentId)
        .populate("creator", "username avatar fullName")
        .populate("participants.members.userId", "username avatar fullName");
}

export async function deleteTournament(tournamentId: string, requesterUserId: string): Promise<boolean> {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    if (tournament.creator.toString() !== requesterUserId) {
        const user = await User.findById(requesterUserId).select("role");
        if (!user || !["ADMIN", "MODERATOR", "OWNER"].includes(user.role || "")) {
            throw new Error("Unauthorized to delete tournament");
        }
    }

    await tournament.deleteOne();

    if (io) {
        io.emit("tournament:deleted", { tournamentId });
    }

    return true;
}

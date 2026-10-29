import { Request, Response, NextFunction } from "express";
import {
    createTournament,
    joinTournament,
    leaveTournament,
    startTournament,
    getTournaments,
    getTournamentById,
    deleteTournament
} from "../services/tournament.service.js";

export const getTournamentsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { format, battleType, status, search } = req.query as Record<string, string>;
        const tournaments = await getTournaments({
            format,
            battleType,
            status,
            search
        });

        res.status(200).json({
            success: true,
            data: tournaments
        });
    } catch (err) {
        next(err);
    }
};

export const getTournamentDetailsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const tournamentId = req.params.tournamentId as string;
        const tournament = await getTournamentById(tournamentId);

        if (!tournament) {
            res.status(404).json({
                success: false,
                message: "Tournament not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: tournament
        });
    } catch (err) {
        next(err);
    }
};

export const createTournamentHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).user?._id?.toString();
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const {
            title,
            description,
            format,
            teamSize,
            battleType,
            difficulty,
            topics,
            maxParticipants,
            startTime,
            autoStartWhenFull
        } = req.body;

        if (!title || !title.trim()) {
            res.status(400).json({ success: false, message: "Tournament title is required" });
            return;
        }

        const tournament = await createTournament(userId, {
            title,
            description,
            format,
            teamSize,
            battleType,
            difficulty,
            topics,
            maxParticipants,
            startTime: startTime ? new Date(startTime) : undefined,
            autoStartWhenFull
        });

        res.status(201).json({
            success: true,
            message: "Tournament created successfully",
            data: tournament
        });
    } catch (err) {
        next(err);
    }
};

export const joinTournamentHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).user?._id?.toString();
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const tournamentId = req.params.tournamentId as string;
        const { teamName, teamMemberUsernames } = req.body;

        const tournament = await joinTournament(tournamentId, userId, {
            teamName,
            teamMemberUsernames
        });

        res.status(200).json({
            success: true,
            message: "Successfully registered for tournament",
            data: tournament
        });
    } catch (err: any) {
        res.status(400).json({
            success: false,
            message: err.message || "Failed to join tournament"
        });
    }
};

export const leaveTournamentHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).user?._id?.toString();
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const tournamentId = req.params.tournamentId as string;
        const tournament = await leaveTournament(tournamentId, userId);

        res.status(200).json({
            success: true,
            message: "Successfully withdrew from tournament",
            data: tournament
        });
    } catch (err: any) {
        res.status(400).json({
            success: false,
            message: err.message || "Failed to leave tournament"
        });
    }
};

export const startTournamentHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).user?._id?.toString();
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const tournamentId = req.params.tournamentId as string;
        const tournament = await startTournament(tournamentId, userId);

        res.status(200).json({
            success: true,
            message: "Tournament started successfully",
            data: tournament
        });
    } catch (err: any) {
        res.status(400).json({
            success: false,
            message: err.message || "Failed to start tournament"
        });
    }
};

export const deleteTournamentHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).user?._id?.toString();
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const tournamentId = req.params.tournamentId as string;
        await deleteTournament(tournamentId, userId);

        res.status(200).json({
            success: true,
            message: "Tournament deleted successfully"
        });
    } catch (err: any) {
        res.status(400).json({
            success: false,
            message: err.message || "Failed to delete tournament"
        });
    }
};

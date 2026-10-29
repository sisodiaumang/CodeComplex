import { Router } from "express";
import {
    getTournamentsHandler,
    getTournamentDetailsHandler,
    createTournamentHandler,
    joinTournamentHandler,
    leaveTournamentHandler,
    startTournamentHandler,
    deleteTournamentHandler
} from "../controllers/tournament.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const tournamentRouter = Router();

// Public listing and inspection
tournamentRouter.get("/", getTournamentsHandler);
tournamentRouter.get("/:tournamentId", getTournamentDetailsHandler);

// Authenticated tournament actions
tournamentRouter.post("/", verifyJWT, createTournamentHandler);
tournamentRouter.post("/:tournamentId/join", verifyJWT, joinTournamentHandler);
tournamentRouter.post("/:tournamentId/leave", verifyJWT, leaveTournamentHandler);
tournamentRouter.post("/:tournamentId/start", verifyJWT, startTournamentHandler);
tournamentRouter.delete("/:tournamentId", verifyJWT, deleteTournamentHandler);

export default tournamentRouter;

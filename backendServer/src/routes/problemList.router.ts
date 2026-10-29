import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getUserProblemStatus,
  getProblemLists,
  createProblemList,
  deleteProblemList,
  toggleQuestionInList,
  toggleFavorite,
} from "../controllers/problemList.controller.js";

const problemListRouter = Router();

// All problem list endpoints require authentication
problemListRouter.use(verifyJWT);

problemListRouter.get("/user-status", getUserProblemStatus);
problemListRouter.get("/", getProblemLists);
problemListRouter.post("/favorite/toggle", toggleFavorite);
problemListRouter.post("/", createProblemList);
problemListRouter.delete("/:listId", deleteProblemList);
problemListRouter.post("/:listId/toggle", toggleQuestionInList);

export default problemListRouter;

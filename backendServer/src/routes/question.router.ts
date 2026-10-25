import { Router } from "express";
import {
    getPublicQuestions,
    getPublicQuestionBySlugOrId,
    runSampleCode,
} from "../controllers/question.controller.js";

const questionRouter = Router();

questionRouter.get("/", getPublicQuestions);
questionRouter.get("/:identifier", getPublicQuestionBySlugOrId);
questionRouter.post("/:identifier/run", runSampleCode);

export default questionRouter;

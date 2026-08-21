import { Router } from "express";
import { getUserRevisionDashboard, syncUserRevision } from "../controllers/revision.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const revisionRouter = Router();

revisionRouter.use(verifyJWT);

revisionRouter.get("/", getUserRevisionDashboard);
revisionRouter.post("/sync", syncUserRevision);

export default revisionRouter;

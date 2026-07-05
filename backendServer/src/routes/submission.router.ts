import { Router } from "express";

import {
    submitCode,
    getSubmission,
    getMySubmissions,
    getMatchSubmissions,
    rejudgeSubmission,
    deleteSubmission
} from "../controllers/submission.controller.js";

// Same ASSUMPTION as match.router.ts: I don't have your HTTP auth
// middleware file, so this assumes `verifyJWT` in
// middlewares/auth.middleware.js. Update this one import if the real name
// differs.
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
    submitCodeSchema,
    rejudgeSubmissionSchema,
    getMatchSubmissionsSchema,
} from "../validators/submission.validator.js";

const router = Router();

router.use(verifyJWT);

// --------------------
// Literal routes — must be registered before the dynamic "/:submissionId"
// routes below, same reasoning as match.router.ts: otherwise Express
// would try to match "me" as a submissionId value.
// --------------------
router.get("/me", getMySubmissions);
router.get("/match/:matchId", validateRequest(getMatchSubmissionsSchema), getMatchSubmissions);

router.post("/", validateRequest(submitCodeSchema), submitCode);

// --------------------
// Dynamic "/:submissionId" routes
// --------------------
router.get("/:submissionId", getSubmission);
router.post("/:submissionId/rejudge", validateRequest(rejudgeSubmissionSchema), rejudgeSubmission);
router.delete("/:submissionId", deleteSubmission);

export default router;
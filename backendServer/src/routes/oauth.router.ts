import { Router } from "express";
import {
    googleRedirect,
    googleCallback,
    githubRedirect,
    githubCallback,
    completeProfile,
} from "../controllers/oauth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/google", googleRedirect);
router.get("/google/callback", googleCallback);

router.get("/github", githubRedirect);
router.get("/github/callback", githubCallback);

router.post("/complete-profile", verifyJWT, completeProfile);

export default router;

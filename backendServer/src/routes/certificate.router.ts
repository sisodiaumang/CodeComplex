import { Router } from "express";
import {
    verifyCertificateHandler,
    getCertificatesAdminHandler,
    getCertificateByIdAdminHandler,
    createCertificateAdminHandler,
    updateCertificateAdminHandler,
    deleteCertificateAdminHandler
} from "../controllers/certificate.controller.js";
import { verifyJWT, verifyAdminOrModerator } from "../middlewares/auth.middleware.js";

const router = Router();

// ─── Public verification endpoints (No login/signup required) ─────────────────
router.get("/verify/:certificateId", verifyCertificateHandler);
router.get("/verify", verifyCertificateHandler);

// ─── Admin management endpoints ───────────────────────────────────────────────
router.get("/admin", verifyJWT, verifyAdminOrModerator, getCertificatesAdminHandler);
router.post("/admin", verifyJWT, verifyAdminOrModerator, createCertificateAdminHandler);
router.get("/admin/:id", verifyJWT, verifyAdminOrModerator, getCertificateByIdAdminHandler);
router.patch("/admin/:id", verifyJWT, verifyAdminOrModerator, updateCertificateAdminHandler);
router.delete("/admin/:id", verifyJWT, verifyAdminOrModerator, deleteCertificateAdminHandler);

export default router;

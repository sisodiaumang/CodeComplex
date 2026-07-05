import { Router } from "express";

import {
    signupUser,
    verifyUser,
    resendOtp,
    loginUser,
    logoutUser,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    changePassword,
    requestEmailChange,
    verifyEmailChange,
    deleteAccount,
    getMe,
    getUserByUsername,
    uploadProfileImage,
    updateBio,
    updateCountry
} from "../controllers/user.controllers.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadAvatar } from "../middlewares/uploadSingleImage.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
    signupSchema,
    verifyUserSchema,
    resendOtpSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    requestEmailChangeSchema,
    verifyEmailChangeSchema,
    updateBioSchema,
    updateCountrySchema,
} from "../validators/auth.validator.js";

const userRouter = Router();


// ─── Auth / Signup flow ───────────────────────────────────────────────
userRouter.route("/signup").post(validateRequest(signupSchema), signupUser);
userRouter.route("/signup/verify").post(validateRequest(verifyUserSchema), verifyUser);
userRouter.route("/otp/resend").post(validateRequest(resendOtpSchema), resendOtp);

userRouter.route("/login").post(validateRequest(loginSchema), loginUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

// ─── Password management ───────────────────────────────────────────────
userRouter.route("/password/forgot").post(validateRequest(forgotPasswordSchema), forgotPassword);
userRouter.route("/password/reset").post(validateRequest(resetPasswordSchema), resetPassword);
userRouter.route("/password/change").patch(verifyJWT, validateRequest(changePasswordSchema), changePassword);

// ─── Email change flow ─────────────────────────────────────────────────
userRouter.route("/email/change").post(verifyJWT, validateRequest(requestEmailChangeSchema), requestEmailChange);
userRouter.route("/email/change/verify").post(verifyJWT, validateRequest(verifyEmailChangeSchema), verifyEmailChange);

// ─── Account ─────────────────────────────────────────────────────────
userRouter.route("/account").delete(verifyJWT, deleteAccount);
userRouter.route("/me").get(verifyJWT, getMe);

userRouter.route("/avatar").patch(verifyJWT, uploadAvatar, uploadProfileImage);
userRouter.route("/bio").patch(verifyJWT, validateRequest(updateBioSchema), updateBio);
userRouter.route("/country").patch(verifyJWT, validateRequest(updateCountrySchema), updateCountry);

// ─── Public profile lookup — keep LAST among GET routes ───────────────
// A param route like "/:username" matches any path segment, so if it were
// registered above "/me", a GET to "/me" would be captured here instead
// (username="me") and never reach the getMe handler below it.
userRouter.route("/:username").get(getUserByUsername);


export default userRouter;
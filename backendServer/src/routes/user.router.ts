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

const userRouter = Router();


// ─── Auth / Signup flow ───────────────────────────────────────────────
userRouter.route("/signup").post(signupUser);
userRouter.route("/signup/verify").post(verifyUser);
userRouter.route("/otp/resend").post(resendOtp);

userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

// ─── Password management ───────────────────────────────────────────────
userRouter.route("/password/forgot").post(forgotPassword);
userRouter.route("/password/reset").post(resetPassword);
userRouter.route("/password/change").patch(verifyJWT, changePassword);

// ─── Email change flow ─────────────────────────────────────────────────
userRouter.route("/email/change").post(verifyJWT, requestEmailChange);
userRouter.route("/email/change/verify").post(verifyJWT, verifyEmailChange);

// ─── Account ─────────────────────────────────────────────────────────
userRouter.route("/account").delete(verifyJWT, deleteAccount);
userRouter.route("/me").get(verifyJWT, getMe);

userRouter.route("/avatar").patch(verifyJWT, uploadAvatar, uploadProfileImage);
userRouter.route("/bio").patch(verifyJWT, updateBio);
userRouter.route("/country").patch(verifyJWT, updateCountry);

// ─── Public profile lookup — keep LAST among GET routes ───────────────
// A param route like "/:username" matches any path segment, so if it were
// registered above "/me", a GET to "/me" would be captured here instead
// (username="me") and never reach the getMe handler below it.
userRouter.route("/:username").get(getUserByUsername);


export default userRouter;
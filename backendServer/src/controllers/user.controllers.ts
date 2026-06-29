import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import RefreshToken from "../models/refreshToken.model.js";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import ms, { StringValue } from "ms";
import bcrypt from "bcrypt";
import OTP, { MAX_OTP_ATTEMPTS } from "../models/otp.model.js";
import { generateOTP } from "../services/otp.service.js";
import { sendVerificationMail } from "../services/emailSend.service.js";
import UserProfile from "../models/userProfile.model.js";
import { OtpPurpose } from "../interfaces/otp.interface.js";
import { uploadOnCloudinary, deleteCloudinary } from "../utils/cloudinary.js";
import countries from "../constants/countries.js";
import { isReservedUsername } from "../constants/reservedUsernames.js";

// ─── Types ─────────────────────────────────────────────────────────────────────

type refreshAndAccess = {
    newRefreshToken: string;
    newAccessToken: string;
};


// ─── Internal helpers ──────────────────────────────────────────────────────────

async function generateNewRefreshAndAccessToken(
    oldRefreshToken: string
): Promise<refreshAndAccess> {

    if (!oldRefreshToken) {
        throw new ApiError(400, "Old refresh token not found");
    }

    let decoded: JwtPayload;

    try {
        decoded = jwt.verify(
            oldRefreshToken,
            process.env.REFRESH_TOKEN_SECRET!
        ) as JwtPayload;
    } catch {
        throw new ApiError(401, "Invalid refresh token");
    }

    const storedToken = await RefreshToken
        .findOne({ userId: decoded._id })
        .select("+token");

    if (!storedToken) {
        throw new ApiError(401, "Refresh token not valid");
    }

    const valid = await storedToken.compareToken(oldRefreshToken);

    if (!valid) {
        throw new ApiError(401, "Invalid refresh token");
    }

    if (storedToken.isExpired()) {
        throw new ApiError(401, "Refresh token expired");
    }

    const user = await User.findById(decoded._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const newAccessToken: string = user.generateAccessToken();
    const newRefreshToken: string = user.generateRefreshToken();

    storedToken.token = newRefreshToken;
    storedToken.expiresAt = new Date(
        Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRY as StringValue)
    );

    await storedToken.save();

    return { newRefreshToken, newAccessToken };
}


async function generateAccessAndRefreshToken(
    userId: string
): Promise<refreshAndAccess> {

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    let refreshDoc = await RefreshToken.findOne({ userId: user._id });

    if (!refreshDoc) {
        refreshDoc = new RefreshToken({ userId: user._id });
    }

    refreshDoc.token = newRefreshToken;
    refreshDoc.expiresAt = new Date(
        Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRY as StringValue)
    );

    await refreshDoc.save();

    return { newAccessToken, newRefreshToken };
}


async function sendOtp(
    email: string,
    purpose: OtpPurpose
): Promise<string> {

    let otpDoc = await OTP.findOne({ email, purpose });

    // First OTP request for this email+purpose
    if (!otpDoc) {
        const plainOtp = generateOTP();

        await OTP.create({
            email,
            otp: plainOtp,
            purpose,
            attempts: 0,
            resendAttempts: 0,
            lastSentAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });

        return plainOtp;
    }

    // Blocked?
    if (otpDoc.blockedUntil && otpDoc.blockedUntil.getTime() > Date.now()) {
        throw new ApiError(429, "Too many OTP requests. Try again later.");
    }

    // Cooldown: 60s between resends
    if (
        otpDoc.lastSentAt &&
        Date.now() - otpDoc.lastSentAt.getTime() < 60 * 1000
    ) {
        throw new ApiError(429, "Wait 60 seconds before requesting another OTP.");
    }

    if (otpDoc.expiresAt.getTime() >= Date.now()) {
        // FIX (W4): resend count now tracked on its own `resendAttempts`
        // field — no longer shares `attempts` with the wrong-guess counter
        // used by verifyUser / resetPassword / verifyEmailChange.
        otpDoc.resendAttempts++;

        if (otpDoc.resendAttempts >= MAX_OTP_ATTEMPTS) {
            otpDoc.resendAttempts = 0;
            otpDoc.blockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);

            await otpDoc.save();

            throw new ApiError(
                429,
                "Too many OTP requests. Try again after 2 hours."
            );
        }
    } else {
        // OTP expired → fresh start, reset resend attempts
        otpDoc.resendAttempts = 0;
    }

    // Always issue a brand-new plaintext code. The stored value is a one-way
    // bcrypt hash, so even a "still valid" OTP can never be recovered to
    // re-send the exact same code — only a fresh one can be emailed.
    const plainOtp = generateOTP();

    otpDoc.otp = plainOtp;
    otpDoc.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    otpDoc.lastSentAt = new Date();

    await otpDoc.save();

    return plainOtp;
}


function getCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
    };
}


// ─── signupUser ────────────────────────────────────────────────────────────────

const signupUser = asyncHandler(async (req, res) => {

    type userSignup = {
        username: string;
        fullName: string;
        email: string;
        password: string;
    };

    const userData: userSignup = req.body;

    if (!userData.username)
        throw new ApiError(400, "Account Creation Failed", ["Username not found"]);
    if (!userData.fullName)
        throw new ApiError(400, "Account Creation Failed", ["fullName not found"]);
    if (!userData.email)
        throw new ApiError(400, "Account Creation Failed", ["Email not found"]);
    if (!userData.password)
        throw new ApiError(400, "Account Creation Failed", ["Password not found"]);
    if (isReservedUsername(userData.username))
        throw new ApiError(409, "Account Creation Failed", ["This username is reserved and cannot be used"]);
    const eUser = await User.findOne({ email: userData.email });
    if (eUser)
        throw new ApiError(409, "Account Creation Failed", ["Email already in use"]);

    const uUser = await User.findOne({ username: userData.username });
    if (uUser)
        throw new ApiError(409, "Account Creation Failed", ["Username already in use"]);

    // Hash password before storing — never store plain-text even temporarily
    const passwordHash = await bcrypt.hash(userData.password, 12);

    const otp = await sendOtp(userData.email, "EMAIL_VERIFICATION");

    try {
        await sendVerificationMail(userData.email, otp);
    } catch {
        await OTP.deleteOne({ email: userData.email, purpose: "EMAIL_VERIFICATION" });
        throw new ApiError(500, "Failed to send verification email");
    }

    // Attach signup payload to OTP doc — User is created only after OTP passes
    await OTP.findOneAndUpdate(
        { email: userData.email, purpose: "EMAIL_VERIFICATION" },
        {
            pendingUser: {
                username: userData.username,
                fullName: userData.fullName,
                passwordHash
            }
        }
    );

    return res.status(201).json(
        new ApiResponse(
            201,
            { email: userData.email },
            "Verification OTP sent. Please Enter OTP to  complete registration."
        )
    );
});


// ─── verifyUser ────────────────────────────────────────────────────────────────

const verifyUser = asyncHandler(async (req, res) => {

    const { email, userOtp } = req.body;

    if (!email) throw new ApiError(400, "Email is required");
    if (!userOtp) throw new ApiError(400, "OTP is required");

    const otpDoc = await OTP
        .findOne({ email, purpose: "EMAIL_VERIFICATION" })
        .select("+otp +pendingUser.passwordHash");

    if (!otpDoc)
        throw new ApiError(404, "OTP not found. Please request a new one.");

    if (Date.now() > otpDoc.expiresAt.getTime()) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    const isValid = await otpDoc.compareOTP(userOtp);

    if (!isValid) {
        otpDoc.attempts += 1;

        if (otpDoc.attempts >= 5) {
            await OTP.deleteOne({ _id: otpDoc._id });
            throw new ApiError(429, "Too many invalid attempts. Please request a new OTP.");
        }

        await otpDoc.save();
        throw new ApiError(401, `Invalid OTP. ${5 - otpDoc.attempts} attempts remaining.`);
    }

    if (!otpDoc.pendingUser) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new ApiError(400, "Signup data not found. Please sign up again.");
    }

    const { username, fullName, passwordHash } = otpDoc.pendingUser;

    // Race-condition guard
    if (await User.findOne({ email }))
        throw new ApiError(409, "An account with this email already exists.");

    if (await User.findOne({ username }))
        throw new ApiError(409, "Username is already taken.");

    const user = await User.create({
        username,
        fullName,
        email,
        password: passwordHash,
        isVerified: true
    });

    // FIX (W7): previously no UserProfile was created at registration —
    // leaderboard queries, achievement checks, and profile endpoints would
    // come up empty (or rely on rating.service.ts's getOrCreateProfile
    // fallback) until the user played their first match.
    await UserProfile.create({ userId: user._id });

    await OTP.deleteOne({ _id: otpDoc._id });

    return res.status(200).json(
        new ApiResponse(
            200,
            { email: user.email, isVerified: true },
            "Email verified successfully. You can now log in."
        )
    );
});


// ─── resendOtp ─────────────────────────────────────────────────────────────────

const resendOtp = asyncHandler(async (req, res) => {

    const { email, purpose } = req.body;

    if (!email)
        throw new ApiError(400, "Email is required");

    if (!purpose)
        throw new ApiError(400, "Purpose is required");

    const validPurposes: OtpPurpose[] = [
        "EMAIL_VERIFICATION",
        "PASSWORD_RESET",
        "EMAIL_CHANGE"
    ];

    if (!validPurposes.includes(purpose)) {
        throw new ApiError(400, `Invalid purpose. Must be one of: ${validPurposes.join(", ")}`);
    }

    // For EMAIL_VERIFICATION — user must not already be verified
    if (purpose === "EMAIL_VERIFICATION") {
        const user = await User.findOne({ email });

        if (user?.isVerified) {
            throw new ApiError(400, "Email is already verified.");
        }
    }

    // For PASSWORD_RESET / EMAIL_CHANGE — user must exist
    if (purpose === "PASSWORD_RESET" || purpose === "EMAIL_CHANGE") {
        const user = await User.findOne({ email });

        if (!user) {
            // Intentionally vague — don't reveal whether email exists
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {},
                    "If this email is registered, a new OTP has been sent."
                )
            );
        }
    }

    const otp = await sendOtp(email, purpose as OtpPurpose);

    try {
        await sendVerificationMail(email, otp);
    } catch {
        throw new ApiError(500, "Failed to send OTP email");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "OTP resent successfully.")
    );
});


// ─── loginUser ─────────────────────────────────────────────────────────────────

const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    if (!email) throw new ApiError(400, "Email is required");
    if (!password) throw new ApiError(400, "Password is required");

    const user = await User.findOne({ email }).select("+password");

    if (!user) throw new ApiError(401, "Invalid email or password");

    if (user.isBanned) throw new ApiError(403, "Your account has been banned");

    if (!user.isVerified) throw new ApiError(403, "Please verify your email first");

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) throw new ApiError(401, "Invalid email or password");

    const { newAccessToken, newRefreshToken } =
        await generateAccessAndRefreshToken(user._id.toString());

    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const cookieOptions = getCookieOptions();

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, {
            ...cookieOptions,
            maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY as StringValue)
        })
        .cookie("refreshToken", newRefreshToken, {
            ...cookieOptions,
            maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY as StringValue)
        })
        .json(
            new ApiResponse(
                200,
                {
                    user: {
                        _id: user._id,
                        username: user.username,
                        fullName: user.fullName,
                        email: user.email,
                        avatar: user.avatar,
                        role: user.role,
                        country: user.country,
                        bio: user.bio,
                        isVerified: user.isVerified
                    }
                },
                "Login successful"
            )
        );
});


// ─── logoutUser ────────────────────────────────────────────────────────────────

const logoutUser = asyncHandler(async (req, res) => {

    // Delete refresh token doc from DB — invalidates the session server-side
    await RefreshToken.deleteOne({ userId: req.user!._id });

    const cookieOptions = getCookieOptions();

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(200, {}, "Logged out successfully")
        );
});


// ─── refreshAccessToken ────────────────────────────────────────────────────────

const refreshAccessToken = asyncHandler(async (req, res) => {

    const oldRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!oldRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    const { newAccessToken, newRefreshToken } =
        await generateNewRefreshAndAccessToken(oldRefreshToken);

    const cookieOptions = getCookieOptions();

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, {
            ...cookieOptions,
            maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY as StringValue)
        })
        .cookie("refreshToken", newRefreshToken, {
            ...cookieOptions,
            maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY as StringValue)
        })
        .json(
            new ApiResponse(200, {}, "Tokens refreshed successfully")
        );
});


// ─── forgotPassword ────────────────────────────────────────────────────────────

const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body;

    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email });

    // Intentionally vague — don't reveal whether email exists
    if (!user) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "If this email is registered, a password reset OTP has been sent."
            )
        );
    }

    if (user.isBanned) {
        throw new ApiError(403, "Your account has been banned");
    }

    const otp = await sendOtp(email, "PASSWORD_RESET");

    try {
        await sendVerificationMail(email, otp);
    } catch {
        await OTP.deleteOne({ email, purpose: "PASSWORD_RESET" });
        throw new ApiError(500, "Failed to send password reset email");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "If this email is registered, a password reset OTP has been sent."
        )
    );
});


// ─── resetPassword ─────────────────────────────────────────────────────────────

const resetPassword = asyncHandler(async (req, res) => {

    const { email, userOtp, newPassword } = req.body;

    if (!email) throw new ApiError(400, "Email is required");
    if (!userOtp) throw new ApiError(400, "OTP is required");
    if (!newPassword) throw new ApiError(400, "New password is required");

    if (newPassword.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters");
    }

    const otpDoc = await OTP
        .findOne({ email, purpose: "PASSWORD_RESET" })
        .select("+otp");

    if (!otpDoc)
        throw new ApiError(404, "OTP not found. Please request a new one.");

    if (Date.now() > otpDoc.expiresAt.getTime()) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    const isValid = await otpDoc.compareOTP(userOtp);

    if (!isValid) {
        otpDoc.attempts += 1;

        if (otpDoc.attempts >= 5) {
            await OTP.deleteOne({ _id: otpDoc._id });
            throw new ApiError(429, "Too many invalid attempts. Please request a new OTP.");
        }

        await otpDoc.save();
        throw new ApiError(401, `Invalid OTP. ${5 - otpDoc.attempts} attempts remaining.`);
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new ApiError(404, "User not found");
    }

    // Check new password isn't same as current
    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
        throw new ApiError(400, "New password must be different from the current password");
    }

    // Assign plain-text — pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    // Invalidate all sessions — force re-login everywhere
    await RefreshToken.deleteOne({ userId: user._id });

    await OTP.deleteOne({ _id: otpDoc._id });

    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully. Please log in again.")
    );
});


// ─── changePassword ────────────────────────────────────────────────────────────

const changePassword = asyncHandler(async (req, res) => {

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) throw new ApiError(400, "Current password is required");
    if (!newPassword) throw new ApiError(400, "New password is required");

    if (newPassword.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters");
    }

    if (currentPassword === newPassword) {
        throw new ApiError(400, "New password must be different from the current password");
    }

    const user = await User.findById(req.user!._id).select("+password");

    if (!user) throw new ApiError(404, "User not found");

    const isCorrect = await user.comparePassword(currentPassword);

    if (!isCorrect) throw new ApiError(401, "Current password is incorrect");

    // Assign plain-text — pre-save hook hashes it
    user.password = newPassword;
    await user.save();

    // Invalidate all other sessions — force re-login on other devices
    await RefreshToken.deleteOne({ userId: user._id });

    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully. Please log in again.")
    );
});


// ─── changeEmail (step 1: request) ────────────────────────────────────────────

const requestEmailChange = asyncHandler(async (req, res) => {

    const { newEmail } = req.body;

    if (!newEmail) throw new ApiError(400, "New email is required");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(newEmail)) {
        throw new ApiError(400, "Invalid email format");
    }

    const currentUser = await User.findById(req.user!._id);

    if (!currentUser) throw new ApiError(404, "User not found");

    if (currentUser.email === newEmail.toLowerCase().trim()) {
        throw new ApiError(400, "New email must be different from your current email");
    }

    // Check new email isn't taken
    const emailTaken = await User.findOne({ email: newEmail });

    if (emailTaken) throw new ApiError(409, "This email is already in use");

    const otp = await sendOtp(newEmail, "EMAIL_CHANGE");

    try {
        await sendVerificationMail(newEmail, otp);
    } catch {
        await OTP.deleteOne({ email: newEmail, purpose: "EMAIL_CHANGE" });
        throw new ApiError(500, "Failed to send verification email to new address");
    }

    // Store who is requesting this change inside the OTP doc
    // (so verifyEmailChange knows which user to update)
    await OTP.findOneAndUpdate(
        { email: newEmail, purpose: "EMAIL_CHANGE" },
        { requestedByUserId: req.user!._id }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            { newEmail },
            "Verification OTP sent to your new email address."
        )
    );
});


// ─── changeEmail (step 2: verify) ─────────────────────────────────────────────

const verifyEmailChange = asyncHandler(async (req, res) => {

    const { newEmail, userOtp } = req.body;

    if (!newEmail) throw new ApiError(400, "New email is required");
    if (!userOtp) throw new ApiError(400, "OTP is required");

    const otpDoc = await OTP
        .findOne({ email: newEmail, purpose: "EMAIL_CHANGE" })
        .select("+otp");

    if (!otpDoc)
        throw new ApiError(404, "OTP not found. Please request a new one.");

    if (Date.now() > otpDoc.expiresAt.getTime()) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    const isValid = await otpDoc.compareOTP(userOtp);

    if (!isValid) {
        otpDoc.attempts += 1;

        if (otpDoc.attempts >= 5) {
            await OTP.deleteOne({ _id: otpDoc._id });
            throw new ApiError(429, "Too many invalid attempts. Please request a new OTP.");
        }

        await otpDoc.save();
        throw new ApiError(401, `Invalid OTP. ${5 - otpDoc.attempts} attempts remaining.`);
    }

    // FIX (W2): confirm the account completing this change is the same one
    // that requested it. requestedByUserId was already being written by
    // requestEmailChange but was never read back here, so a stolen OTP
    // could previously be redeemed by a different account.
    if (
        !otpDoc.requestedByUserId ||
        otpDoc.requestedByUserId.toString() !== req.user!._id.toString()
    ) {
        throw new ApiError(403, "This email change request was not initiated by your account.");
    }

    // Confirm new email still isn't taken (race condition guard)
    const emailTaken = await User.findOne({ email: newEmail });

    if (emailTaken) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new ApiError(409, "This email is already in use");
    }

    const user = await User.findById(req.user!._id);

    if (!user) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new ApiError(404, "User not found");
    }

    user.email = newEmail.toLowerCase().trim();
    await user.save({ validateBeforeSave: false });

    await OTP.deleteOne({ _id: otpDoc._id });

    return res.status(200).json(
        new ApiResponse(
            200,
            { email: user.email },
            "Email updated successfully."
        )
    );
});


// ─── deleteAccount ─────────────────────────────────────────────────────────────

const deleteAccount = asyncHandler(async (req, res) => {

    const { password } = req.body;

    if (!password) throw new ApiError(400, "Password is required to delete your account");

    const user = await User.findById(req.user!._id).select("+password");

    if (!user) throw new ApiError(404, "User not found");

    const isCorrect = await user.comparePassword(password);

    if (!isCorrect) throw new ApiError(401, "Incorrect password");

    // Delete Cloudinary avatar if it's not the default
    if (
        user.avatar?.profileImagePublicId &&
        user.avatar.profileImagePublicId !== process.env.DEFAULT_AVATAR_PUBLIC_ID
    ) {
        await deleteCloudinary(user.avatar.profileImagePublicId);
    }

    // Hard delete — remove user + their refresh token + any pending OTPs
    await Promise.all([
        User.deleteOne({ _id: user._id }),
        RefreshToken.deleteOne({ userId: user._id }),
        OTP.deleteMany({ email: user.email })
    ]);

    const cookieOptions = getCookieOptions();

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(200, {}, "Account deleted successfully.")
        );
});


// ─── getMe ─────────────────────────────────────────────────────────────────────

const getMe = asyncHandler(async (req, res) => {

    // req.user is set by auth middleware — no extra DB call needed
    // unless you want fresher data than what's in the JWT
    const user = await User.findById(req.user!._id);

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                country: user.country,
                bio: user.bio,
                isVerified: user.isVerified,
                lastSeen: user.lastSeen,
                createdAt: user.createdAt
            },
            "User fetched successfully"
        )
    );
});


// ─── getUserByUsername ─────────────────────────────────────────────────────────

const getUserByUsername = asyncHandler(async (req, res) => {

    const { username } = req.params;

    if (!username) throw new ApiError(400, "Username is required");

    const user = await User.findOne({ username })
        .select(
            // Public-safe fields only — no email, no role internals
            "username fullName avatar bio country createdAt"
        );

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                username: user.username,
                fullName: user.fullName,
                avatar: user.avatar,
                bio: user.bio,
                country: {
                    code: user.country,
                    name: user.country
                        ? countries.getName(user.country, "en")
                        : null
                },
                memberSince: user.createdAt
            },
            "User fetched successfully"
        )
    );
});


// ─── uploadProfileImage ────────────────────────────────────────────────────────

const uploadProfileImage = asyncHandler(async (req, res) => {

    const localFilePath = req.file?.path;

    if (!localFilePath) throw new ApiError(400, "Profile image is required");

    const user = await User.findById(req.user?._id);

    if (!user) throw new ApiError(404, "User not found");

    const uploadedImage = await uploadOnCloudinary(localFilePath);

    if (!uploadedImage) throw new ApiError(500, "Failed to upload image");

    if (
        user.avatar.profileImagePublicId &&
        user.avatar.profileImagePublicId !== process.env.DEFAULT_AVATAR_PUBLIC_ID
    ) {
        await deleteCloudinary(user.avatar.profileImagePublicId);
    }

    user.avatar.profileImageURL = uploadedImage.secure_url;
    user.avatar.profileImagePublicId = uploadedImage.public_id;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, { avatar: user.avatar }, "Profile image updated successfully")
    );
});


// ─── updateBio ─────────────────────────────────────────────────────────────────

const updateBio = asyncHandler(async (req, res) => {

    const { bio } = req.body;

    if (typeof bio !== "string") throw new ApiError(400, "Bio must be a string");

    const trimmedBio = bio.trim();

    if (trimmedBio.length > 200) throw new ApiError(400, "Bio cannot exceed 200 characters");

    const user = await User.findByIdAndUpdate(
        req.user!._id,
        { $set: { bio: trimmedBio } },
        { new: true, runValidators: true }
    ).select("-password");

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(
        new ApiResponse(200, { bio: user.bio }, "Bio updated successfully")
    );
});


// ─── updateCountry ─────────────────────────────────────────────────────────────

const updateCountry = asyncHandler(async (req, res) => {

    const { country } = req.body;

    if (typeof country !== "string") throw new ApiError(400, "Country code is required");

    const countryCode = country.trim().toUpperCase();

    if (!countries.isValid(countryCode)) {
        throw new ApiError(400, `Invalid country code: "${countryCode}"`);
    }

    const user = await User.findByIdAndUpdate(
        req.user!._id,
        { $set: { country: countryCode } },
        { new: true, runValidators: true }
    ).select("-password");

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                country: {
                    code: user.country,
                    name: countries.getName(user.country, "en")
                }
            },
            "Country updated successfully"
        )
    );
});


// ─── Exports ───────────────────────────────────────────────────────────────────

export {
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
    updateCountry,
};
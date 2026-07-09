import { Request, Response } from "express";
import crypto from "crypto";
import ms, { StringValue } from "ms";
import { env } from "../config/env.js";
import User from "../models/user.model.js";
import UserProfile from "../models/userProfile.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax" as const,
    };
}

async function issueTokens(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    let refreshDoc = await RefreshToken.findOne({ userId: user._id });
    if (!refreshDoc) refreshDoc = new RefreshToken({ userId: user._id });

    refreshDoc.token = refreshToken;
    refreshDoc.expiresAt = new Date(
        Date.now() + ms(env.REFRESH_TOKEN_EXPIRY as StringValue)
    );
    await refreshDoc.save();

    return { accessToken, refreshToken };
}

function generateUsername(name: string, email: string): string {
    const base = (name || email.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20);
    const suffix = crypto.randomBytes(3).toString("hex");
    return `${base}_${suffix}`;
}

async function findOrCreateOAuthUser(
    provider: "google" | "github",
    oauthId: string,
    email: string,
    fullName: string,
    avatarUrl?: string
): Promise<{ user: InstanceType<typeof User>; isNew: boolean }> {
    // 1. Already linked OAuth user
    let user = await User.findOne({ oauthProvider: provider, oauthId });
    if (user) {
        // Update avatar from provider on every login
        if (avatarUrl) {
            user.avatar.profileImageURL = avatarUrl;
        }
        return { user, isNew: false };
    }

    // 2. Existing user with same email — link OAuth
    user = await User.findOne({ email });
    if (user) {
        if (!user.oauthProvider) {
            user.oauthProvider = provider;
            user.oauthId = oauthId;
        }
        // Update avatar from provider if they still have default
        if (avatarUrl) {
            user.avatar.profileImageURL = avatarUrl;
            user.avatar.profileImagePublicId = "";
        }
        await user.save({ validateBeforeSave: false });
        return { user, isNew: false };
    }

    // 3. Brand new user
    let username = generateUsername(fullName, email);
    while (await User.findOne({ username })) {
        username = generateUsername(fullName, email);
    }

    user = await User.create({
        username,
        fullName: fullName || username,
        email,
        password: crypto.randomBytes(32).toString("hex"),
        oauthProvider: provider,
        oauthId,
        isVerified: true,
        avatar: {
            profileImageURL: avatarUrl || env.DEFAULT_AVATAR_URL,
            profileImagePublicId: "",
        },
    });

    await UserProfile.create({ userId: user._id });

    return { user, isNew: true };
}

function setCookiesAndRedirect(res: Response, accessToken: string, refreshToken: string, isNew: boolean) {
    const cookieOptions = getCookieOptions();
    const destination = isNew
        ? `${env.CLIENT_URL}/auth/complete-profile`
        : `${env.CLIENT_URL}/dashboard`;

    res
        .cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: ms(env.ACCESS_TOKEN_EXPIRY as StringValue),
        })
        .cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: ms(env.REFRESH_TOKEN_EXPIRY as StringValue),
        })
        .redirect(destination);
}

/* ─── Google OAuth ────────────────────────────────────────────────────── */

const googleRedirect = asyncHandler(async (_req: Request, res: Response) => {
    if (!env.GOOGLE_CLIENT_ID) throw new ApiError(500, "Google OAuth not configured");

    const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: `${env.OAUTH_CALLBACK_URL}/google/callback`,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "select_account",
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

const googleCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;
    if (!code) throw new ApiError(400, "Authorization code missing");
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
        throw new ApiError(500, "Google OAuth not configured");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code: code as string,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${env.OAUTH_CALLBACK_URL}/google/callback`,
            grant_type: "authorization_code",
        }),
    });

    const tokenData = await tokenRes.json() as { error?: string; access_token?: string };
    if (tokenData.error) {
        return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userInfoRes.json() as { id: string; email: string; name: string; picture?: string };

    const { user, isNew } = await findOrCreateOAuthUser(
        "google",
        profile.id,
        profile.email,
        profile.name,
        profile.picture
    );

    if (user.isBanned) {
        return res.redirect(`${env.CLIENT_URL}/login?error=account_banned`);
    }

    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await issueTokens(user._id.toString());
    setCookiesAndRedirect(res, accessToken, refreshToken, isNew);
});

/* ─── GitHub OAuth ────────────────────────────────────────────────────── */

const githubRedirect = asyncHandler(async (_req: Request, res: Response) => {
    if (!env.GITHUB_CLIENT_ID) throw new ApiError(500, "GitHub OAuth not configured");

    const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${env.OAUTH_CALLBACK_URL}/github/callback`,
        scope: "user:email read:user",
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

const githubCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;
    if (!code) throw new ApiError(400, "Authorization code missing");
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET)
        throw new ApiError(500, "GitHub OAuth not configured");

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: `${env.OAUTH_CALLBACK_URL}/github/callback`,
        }),
    });

    const tokenData = await tokenRes.json() as { error?: string; access_token?: string };
    if (tokenData.error) {
        return res.redirect(`${env.CLIENT_URL}/login?error=github_auth_failed`);
    }

    const headers = {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
    };

    const [userRes, emailsRes] = await Promise.all([
        fetch("https://api.github.com/user", { headers }),
        fetch("https://api.github.com/user/emails", { headers }),
    ]);

    const profile = await userRes.json() as { id: number; email?: string; name?: string; login: string; avatar_url?: string };
    const emails = (await emailsRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
    }>;

    const primaryEmail =
        emails.find((e) => e.primary && e.verified)?.email ??
        emails.find((e) => e.verified)?.email ??
        profile.email;

    if (!primaryEmail) {
        return res.redirect(`${env.CLIENT_URL}/login?error=no_email`);
    }

    const { user, isNew } = await findOrCreateOAuthUser(
        "github",
        String(profile.id),
        primaryEmail,
        profile.name || profile.login,
        profile.avatar_url
    );

    if (user.isBanned) {
        return res.redirect(`${env.CLIENT_URL}/login?error=account_banned`);
    }

    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await issueTokens(user._id.toString());
    setCookiesAndRedirect(res, accessToken, refreshToken, isNew);
});

/* ─── Complete Profile (update username/fullName after OAuth signup) ─── */

const completeProfile = asyncHandler(async (req: Request, res: Response) => {
    const { username, fullName } = req.body;

    if (!username || !fullName) {
        throw new ApiError(400, "Username and full name are required");
    }

    if (username.length < 3 || username.length > 30) {
        throw new ApiError(400, "Username must be 3–30 characters");
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
        throw new ApiError(400, "Username can only contain lowercase letters, numbers, and underscores");
    }

    const existing = await User.findOne({ username, _id: { $ne: req.user!._id } });
    if (existing) {
        throw new ApiError(409, "Username is already taken");
    }

    const user = await User.findById(req.user!._id);
    if (!user) throw new ApiError(404, "User not found");

    user.username = username;
    user.fullName = fullName;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            avatar: user.avatar,
            oauthProvider: user.oauthProvider,
        },
        message: "Profile updated successfully",
    });
});

export { googleRedirect, googleCallback, githubRedirect, githubCallback, completeProfile };

import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { env } from "../config/env.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace(
                "Bearer ",
                ""
            );

        if (!token) {
            throw new ApiError(
                401,
                "Unauthorized request"
            );
        }

        const decoded = jwt.verify(
            token,
            env.JWT_ACCESS_SECRET
        ) as JwtPayload;

        const user = await User.findById(
            decoded._id
        ).select("-password");

        if (!user) {
            throw new ApiError(
                401,
                "Invalid access token"
            );
        }

        // Reject a banned account even if it still holds a valid token.
        if (user.isBanned) {
            throw new ApiError(403, "Your account has been banned");
        }

        // Reject tokens minted before the user's last password change.
        // Password reset/change only deletes the refresh token, so without
        // this an old access token would remain valid until it expired.
        // decoded.passwordChangedAt is a Unix epoch in SECONDS
        // (see user.model.ts generateAccessToken).
        if (user.lastPasswordChangedAt) {
            const changedAtSec = Math.floor(user.lastPasswordChangedAt.getTime() / 1000);
            const tokenIssuedAtSec = Number(decoded.passwordChangedAt ?? 0);

            if (tokenIssuedAtSec < changedAtSec) {
                throw new ApiError(401, "Session expired. Please log in again.");
            }
        }

        req.user = user;

        next();
    }
);
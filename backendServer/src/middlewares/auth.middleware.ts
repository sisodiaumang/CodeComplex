import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

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
            process.env.ACCESS_TOKEN_SECRET!
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

        req.user = user;

        next();
    }
);
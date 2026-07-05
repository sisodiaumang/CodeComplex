import { Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import * as cookie from "cookie";
import { env } from "../config/env.js";
import User from "../models/user.model.js";

export interface SocketUser {
    _id: string;
    email: string;
    username: string;
    fullName: string;
}

const socketAuthMiddleware = async (
    socket: Socket,
    next: (err?: Error) => void
): Promise<void> => {
    try {
        let token = socket.handshake.auth?.token as string | undefined;

        // If token wasn't passed in auth, read it from cookies
        if (!token) {
            const rawCookie = socket.handshake.headers.cookie;

            if (rawCookie) {
                const cookies = cookie.parse(rawCookie);
                token = cookies.accessToken;
            }
        }

        if (!token) {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(
            token,
            env.JWT_ACCESS_SECRET
        ) as JwtPayload;

        // Look the user up so a banned account or a token issued before a
        // password change can't hold a live socket until token expiry — the
        // HTTP auth middleware enforces the same two guards.
        const user = await User.findById(decoded._id).select(
            "isBanned lastPasswordChangedAt email username fullName"
        );

        if (!user) {
            return next(new Error("Invalid or expired token"));
        }

        if (user.isBanned) {
            return next(new Error("Account banned"));
        }

        if (user.lastPasswordChangedAt) {
            const changedAtSec = Math.floor(user.lastPasswordChangedAt.getTime() / 1000);
            const tokenIssuedAtSec = Number(decoded.passwordChangedAt ?? 0);

            if (tokenIssuedAtSec < changedAtSec) {
                return next(new Error("Session expired"));
            }
        }

        socket.data.user = {
            _id: user._id.toString(),
            email: user.email,
            username: user.username,
            fullName: user.fullName,
        } as SocketUser;

        next();
    } catch (err) {
        next(new Error("Invalid or expired token"));
    }
};

export default socketAuthMiddleware;
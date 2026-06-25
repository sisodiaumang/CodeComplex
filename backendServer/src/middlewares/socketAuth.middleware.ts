import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

export interface SocketUser {
    _id: string;
    email: string;
    username: string;
    fullName: string;
}

const socketAuthMiddleware = (
    socket: Socket,
    next: (err?: Error) => void
): void => {
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
            process.env.ACCESS_TOKEN_SECRET!
        ) as SocketUser;

        socket.data.user = decoded;

        next();
    } catch (err) {
        next(new Error("Invalid or expired token"));
    }
};

export default socketAuthMiddleware;
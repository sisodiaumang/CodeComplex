import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";

import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import connectDB from "./db/connectDB.js";
import startCleanupJob from "./jobs/cleanUnverifedUser.js";
import startRatingRecoveryJob from "./jobs/ratingRecoveryjob.js";
import startRefreshTokenCleanupJob from "./jobs/refreshTokenCleanup.js";
import startOtpCleanupJob from "./jobs/otpCleanup.js";
import startNotificationCleanupJob from "./jobs/notificationCleanup.js";
import startStaleBattleRoomCleanupJob from "./jobs/staleBattleRoomCleanup.js";

//sockets
import { registerBattleChatHandlers } from "./sockets/battleChat.socket.js";
import { registerBattleVoiceHandlers } from "./sockets/battleVoice.socket.js";

// Routes
import userRouter from "./routes/user.router.js";
import battleRouter from "./routes/battle.router.js";
import matchRouter from "./routes/match.router.js";
import submissionRouter from "./routes/submission.router.js";
import ratingRouter from "./routes/rating.router.js";
import friendshipRouter from "./routes/friendship.router.js";
import notificationRouter from "./routes/notification.router.js";
import achievementRouter from "./routes/achievement.router.js";
import leaderboardRouter from "./routes/leaderboard.router.js";
import spectateRouter from "./routes/spectate.router.js";
import oauthRouter from "./routes/oauth.router.js";
import adminRouter from "./routes/admin.router.js";







// Middlewares
import errorHandler from "./middlewares/error.middleware.js";
import socketAuthMiddleware from "./middlewares/socketAuth.middleware.js";

const app = express();

// ────────────────────────────────────────────────────────────────────
// Security & Logging Middleware (must be early in the pipeline)
// ────────────────────────────────────────────────────────────────────

// HTTP logging middleware
app.use(pinoHttp({ logger }));

// Security headers
app.use(helmet());

// Response compression
app.use(compression());

// Rate limiting
if (env.NODE_ENV === "production") {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: "Too many requests from this IP, please try again later",
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);
} else {
    const devLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10000, // very generous limit in development to avoid EADDRINUSE / fetch locks
        message: "Too many requests from this IP in development, please try again later",
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(devLimiter);
}

// Prevent HTTP Parameter Pollution
app.use(hpp());

// CORS
app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true
    })
);

// Cookie parser
app.use(cookieParser());

// JSON and URL-encoded body parsing (with size limits)
app.use(express.json({ limit: "50mb" }));
app.use(
    express.urlencoded({
        extended: true,
        limit: "50mb"
    })
);

// --------------------
// Health Check
// --------------------

app.get("/", (_, res) => {
    res.status(200).json({
        success: true,
        message: "CodeComplex API Running 🚀"
    });
});

app.get("/health", (_, res) => {
    res.status(200).json({
        success: true,
        uptime: process.uptime(),
        timestamp: new Date(),
        message: "Server Healthy"
    });
});

// --------------------
// API Routes
// --------------------

app.use("/api/v1/user", userRouter);
app.use("/api/v1/battle", battleRouter);
app.use("/api/v1/match", matchRouter);
app.use("/api/v1/submission", submissionRouter);
app.use("/api/v1/ratings", ratingRouter);
app.use("/api/v1/friends", friendshipRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/achievements", achievementRouter);
app.use("/api/v1/leaderboard", leaderboardRouter);
app.use("/api/v1/spectate", spectateRouter);
app.use("/api/v1/auth", oauthRouter);
app.use("/api/v1/admin", adminRouter);






// --------------------
// 404 Handler
// --------------------


app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// --------------------
// Global Error Handler
// --------------------

app.use(errorHandler);

// --------------------
// Socket.IO
// --------------------

const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: env.CORS_ORIGIN,
        credentials: true
    }
});

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
    console.log(` User Connected : ${socket.id}`);

    const userId = socket.data.user?._id;
    if (userId) {
        socket.join(`user:${userId}`);
    }

    registerBattleChatHandlers(io, socket);
    registerBattleVoiceHandlers(io, socket);

    socket.on("disconnect", () => {
        console.log(` User Disconnected : ${socket.id}`);
    });
});
// --------------------
// Start Server
// --------------------

const PORT = env.PORT;

connectDB()
    .then(() => {

        console.log(" MongoDB Connected");

        // Start background cron jobs
        startCleanupJob();
        startRatingRecoveryJob();
        startRefreshTokenCleanupJob();
        startOtpCleanupJob();
        startNotificationCleanupJob();
        startStaleBattleRoomCleanupJob();

        server.listen(PORT, () => {

            console.log(
                ` Server running at http://localhost:${PORT}`
            );

        });

    })
    .catch((error) => {

        console.error(
            " MongoDB connection failed",
            error
        );

        process.exit(1);

    });
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import cookieParser from "cookie-parser";

import connectDB from "./db/connectDB.js";
import startCleanupJob from "./jobs/cleanUnverifedUser.js";
import startRatingRecoveryJob from "./jobs/ratingRecoveryjob.js";

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








// Middlewares
import errorHandler from "./middlewares/error.middleware.js";
import socketAuthMiddleware from "./middlewares/socketAuth.middleware.js";


const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
);

app.use(cookieParser());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// --------------------
// Health Check
// --------------------

app.get("/", (_, res) => {
    res.status(200).json({
        success: true,
        message: "DevWar API Running 🚀"
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
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
});

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
    console.log(` User Connected : ${socket.id}`);

    registerBattleChatHandlers(io, socket);
    registerBattleVoiceHandlers(io, socket);

    socket.on("disconnect", () => {
        console.log(` User Disconnected : ${socket.id}`);
    });
});
// --------------------
// Start Server
// --------------------

const PORT = Number(process.env.PORT) || 8000;

connectDB()
    .then(() => {

        console.log(" MongoDB Connected");

        startCleanupJob();
        startRatingRecoveryJob();

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
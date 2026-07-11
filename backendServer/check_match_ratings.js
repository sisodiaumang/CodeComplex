import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function check() {
    let connected = false;
    
    // Try local first
    try {
        console.log("Trying local MongoDB...");
        await mongoose.connect("mongodb://localhost:27017/devarena");
        console.log("Connected to local MongoDB!");
        connected = true;
    } catch (e) {
        console.log("Local MongoDB failed:", e.message);
    }

    if (!connected) {
        try {
            console.log("Trying env MONGODB_URI...");
            const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/devarena";
            await mongoose.connect(mongoUri);
            console.log("Connected to env MONGODB_URI!");
            connected = true;
        } catch (e) {
            console.log("Env MONGODB_URI failed:", e.message);
        }
    }

    if (!connected) {
        console.log("Could not connect to any database.");
        return;
    }

    // 1. Get room
    const room = await mongoose.connection.db.collection("battlerooms").findOne({ roomCode: "D-_8L-" });
    console.log("\n--- ROOM DOCUMENT ---");
    console.log(JSON.stringify(room, null, 2));

    if (room && room.matchId) {
        // 2. Get match
        const match = await mongoose.connection.db.collection("matches").findOne({ _id: room.matchId });
        console.log("\n--- MATCH DOCUMENT ---");
        console.log(JSON.stringify(match, null, 2));

        // 3. Get rating history records for this match
        const history = await mongoose.connection.db.collection("ratinghistories").find({ matchId: room.matchId }).toArray();
        console.log("\n--- RATING HISTORY RECORDS ---");
        console.log(JSON.stringify(history, null, 2));
    }

    await mongoose.disconnect();
}

check().catch(console.error);

import connectDB from "./connectDB.js";
import mongoose from "mongoose";

async function run() {
    await connectDB();
    console.log("Cleaning up redundant indexes from MongoDB database...");

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("Database connection not established");
    }

    // 1. Clean UserProfile Collection Indexes
    const userProfilesCol = db.collection("userprofiles");
    const upIndexes = await userProfilesCol.indexes();
    const upRedundantIndexNames = [
        "ratings.dsa_-1_userId_1",
        "ratings.frontend_-1_userId_1",
        "ratings.backend_-1_userId_1",
        "ratings.projects_-1_userId_1",
        "ratings.team_-1_userId_1",
        "ratings.promptWar_-1_userId_1",
        "ratings.bugFix_-1_userId_1"
    ];

    for (const name of upRedundantIndexNames) {
        if (upIndexes.some((idx) => idx.name === name)) {
            console.log(`Dropping redundant index from userprofiles: ${name}`);
            await userProfilesCol.dropIndex(name);
        }
    }

    // 2. Clean Question Collection Indexes
    const questionsCol = db.collection("questions");
    const qIndexes = await questionsCol.indexes();
    const qRedundantIndexKeys = [
        "metadata.topics_1",
        "metadata.patterns_1",
        "metadata.tags_1",
        "metadata.keywords_1",
        "metadata.prerequisites_1",
        "metadata.variants_1",
        "metadata.companies.name_1"
    ];

    for (const name of qRedundantIndexKeys) {
        if (qIndexes.some((idx) => idx.name === name)) {
            console.log(`Dropping redundant index from questions: ${name}`);
            await questionsCol.dropIndex(name);
        }
    }

    console.log("Database index cleanup complete.");
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

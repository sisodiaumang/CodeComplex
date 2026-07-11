import connectDB from "./connectDB.js";
import UserProfile from "../models/userProfile.model.js";

async function run() {
    await connectDB();
    console.log("Migrating User Profiles to add ratings.bugFix...");
    const result = await UserProfile.updateMany(
        { "ratings.bugFix": { $exists: false } },
        { 
            $set: { 
                "ratings.bugFix": 1200,
                "peakRatings.bugFix": 1200 
            } 
        }
    );
    console.log(`Migration complete. Updated ${result.modifiedCount} user profiles.`);
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

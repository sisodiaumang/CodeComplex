import cron from "node-cron";
import User from "../models/user.model.js";

const startCleanupJob = () => {

    // Every day at midnight
    cron.schedule("0 0 * * *", async () => {

        try {

            const result = await User.deleteMany({
                isVerified: false,
                createdAt: {
                    $lt: new Date(
                        Date.now() - 24 * 60 * 60 * 1000
                    )
                }
            });

            console.log(
                `Deleted ${result.deletedCount} unverified users`
            );

        } catch (error) {

            console.error(
                "Cleanup job failed",
                error
            );

        }

    });

};

export default startCleanupJob;
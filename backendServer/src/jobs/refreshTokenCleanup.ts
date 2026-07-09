import cron from "node-cron";
import RefreshToken from "../models/refreshToken.model.js";
import { logger } from "../utils/logger.js";

/**
 * Cron job to remove expired refresh tokens
 * Runs every day at 2 AM
 */
const startRefreshTokenCleanupJob = () => {
    cron.schedule("0 2 * * *", async () => {
        try {
            logger.info("Starting refresh token cleanup job");
            
            const result = await RefreshToken.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            
            logger.info(`Deleted ${result.deletedCount} expired refresh tokens`);
        } catch (error) {
            logger.error(error as Error, "Refresh token cleanup job failed");
        }
    });
};

export default startRefreshTokenCleanupJob;

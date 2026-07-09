import cron from "node-cron";
import OTP from "../models/otp.model.js";
import { logger } from "../utils/logger.js";

/**
 * Cron job to remove expired OTPs
 * Runs every 6 hours
 */
const startOtpCleanupJob = () => {
    cron.schedule("0 */6 * * *", async () => {
        try {
            logger.info("Starting OTP cleanup job");
            
            const result = await OTP.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            
            logger.info(`Deleted ${result.deletedCount} expired OTPs`);
        } catch (error) {
            logger.error(error as Error, "OTP cleanup job failed");
        }
    });
};

export default startOtpCleanupJob;

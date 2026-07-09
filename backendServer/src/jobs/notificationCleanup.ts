import cron from "node-cron";
import Notification from "../models/notification.model.js";
import { logger } from "../utils/logger.js";

/**
 * Cron job to remove old notifications (older than 30 days)
 * Runs daily at 3 AM
 */
const startNotificationCleanupJob = () => {
    cron.schedule("0 3 * * *", async () => {
        try {
            logger.info("Starting notification cleanup job");
            
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            const result = await Notification.deleteMany({
                createdAt: { $lt: thirtyDaysAgo }
            });
            
            logger.info(`Deleted ${result.deletedCount} old notifications`);
        } catch (error) {
            logger.error(error as Error, "Notification cleanup job failed");
        }
    });
};

export default startNotificationCleanupJob;

import cron from "node-cron";
import BattleRoom from "../models/battleRoom.model.js";
import { logger } from "../utils/logger.js";

/**
 * Cron job to remove stale battle rooms (not started after 1 hour creation)
 * Runs every 30 minutes
 */
const startStaleBattleRoomCleanupJob = () => {
    cron.schedule("*/30 * * * *", async () => {
        try {
            logger.info("Starting stale battle room cleanup job");
            
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            const result = await BattleRoom.deleteMany({
                status: "WAITING", // Only delete rooms that haven't started
                createdAt: { $lt: oneHourAgo }
            });
            
            logger.info(`Deleted ${result.deletedCount} stale battle rooms`);
        } catch (error) {
            logger.error("Stale battle room cleanup job failed:", error);
        }
    });
};

export default startStaleBattleRoomCleanupJob;

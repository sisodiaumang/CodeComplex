import cron from "node-cron";
import User from "../models/user.model.js";
import { enqueueGrindReminderEmail } from "../queues/emailQueue.js";

/**
 * Triggers the grind reminder email task immediately for all inactive users
 * who have not disabled grind reminders in their notification settings.
 * Returns the number of reminder emails successfully enqueued.
 */
export const triggerGrindReminders = async (): Promise<number> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find verified, non-banned users who haven't been seen in the last 7 days
    // and who have grind reminders enabled (not explicitly false).
    const inactiveUsers = await User.find({
        isVerified: true,
        isBanned: false,
        lastSeen: { $lt: sevenDaysAgo },
        "emailNotifications.grindReminders": { $ne: false }
    });

    console.log(`[Job] Found ${inactiveUsers.length} inactive users with grind reminders enabled.`);

    let enqueuedCount = 0;
    for (const user of inactiveUsers) {
        try {
            await enqueueGrindReminderEmail(user.email, user.username);
            enqueuedCount++;
        } catch (sendErr: any) {
            console.error(`[Job] Failed to enqueue reminder email to ${user.email}:`, sendErr.message);
        }
    }
    return enqueuedCount;
};

/**
 * Cron job to send grind reminder emails to inactive users.
 * Runs every Monday at 10:00 AM.
 */
export const startGrindReminderJob = (): void => {
    cron.schedule("0 10 * * 1", async () => {
        try {
            console.log("[Job] Running scheduled grind reminder cron job...");
            const sent = await triggerGrindReminders();
            console.log(`[Job] Scheduled grind reminder job completed. Sent: ${sent}`);
        } catch (err: any) {
            console.error("[Job] Scheduled grind reminder job failed:", err.message);
        }
    });
};

import cron from "node-cron";
import User from "../models/user.model.js";
import { sendGrindReminderMail } from "../services/emailSend.service.js";

/**
 * Triggers the grind reminder email task immediately for all inactive users.
 * Returns the number of reminder emails successfully sent.
 */
export const triggerGrindReminders = async (): Promise<number> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find verified, non-banned users who haven't been seen in the last 7 days
    const inactiveUsers = await User.find({
        isVerified: true,
        isBanned: false,
        lastSeen: { $lt: sevenDaysAgo }
    });

    console.log(`[Job] Found ${inactiveUsers.length} inactive users.`);

    let sentCount = 0;
    for (const user of inactiveUsers) {
        try {
            await sendGrindReminderMail(user.email, user.username);
            sentCount++;
            // Basic rate throttling to avoid hitting SMTP sending limits
            await new Promise((r) => setTimeout(r, 1000));
        } catch (sendErr: any) {
            console.error(`[Job] Failed to send reminder email to ${user.email}:`, sendErr.message);
        }
    }
    return sentCount;
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

import cron from "node-cron";
import RevisionTracker from "../models/revision.model.js";
import { enqueueRevisionReminderEmail } from "../queues/emailQueue.js";

/**
 * Triggers revision reminder emails immediately for all due questions.
 */
export const triggerRevisionReminders = async (): Promise<number> => {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Find all revision tracker docs that are due today or overdue
    const dueItems = await RevisionTracker.find({
        nextRevisionDue: { $lte: endOfToday }
    }).populate<{ userId: { _id: any; email: string; username: string; isVerified: boolean; isBanned: boolean } }>(
        "userId",
        "email username isVerified isBanned"
    ).lean();

    console.log(`[Job] Found ${dueItems.length} due revision items.`);

    let enqueuedCount = 0;
    const sentUserQuestionPair = new Set<string>();

    for (const item of dueItems) {
        const user = item.userId as any;
        if (!user || !user.email || user.isBanned) {
            continue;
        }

        const pairKey = `${user._id.toString()}:${item.questionSlug}`;
        if (sentUserQuestionPair.has(pairKey)) {
            continue;
        }
        sentUserQuestionPair.add(pairKey);

        const daysAgo = Math.max(1, Math.floor((now.getTime() - new Date(item.lastSolvedAt).getTime()) / (1000 * 60 * 60 * 24)));

        try {
            await enqueueRevisionReminderEmail(
                user.email,
                user.username,
                item.title,
                daysAgo,
                item.questionSlug
            );
            enqueuedCount++;
        } catch (sendErr: any) {
            console.error(`[Job] Failed to enqueue revision reminder to ${user.email}:`, sendErr.message);
        }
    }

    return enqueuedCount;
};

/**
 * Cron job running every day at 9:00 AM to send revision reminders.
 */
export const startRevisionReminderJob = (): void => {
    cron.schedule("0 9 * * *", async () => {
        try {
            console.log("[Job] Running daily revision reminder cron job...");
            const sent = await triggerRevisionReminders();
            console.log(`[Job] Scheduled revision reminder job completed. Sent: ${sent}`);
        } catch (err: any) {
            console.error("[Job] Scheduled revision reminder job failed:", err.message);
        }
    });
};

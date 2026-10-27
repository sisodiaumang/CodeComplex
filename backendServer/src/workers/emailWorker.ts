import { Worker, Job } from "bullmq";
import {
  EMAIL_QUEUE_NAME,
  EmailJobType,
  redisConnection,
  VerificationEmailPayload,
  WelcomeEmailPayload,
  EmailChangeEmailPayload,
  GrindReminderEmailPayload,
  SiteReportEmailPayload,
  RevisionReminderPayload,
} from "../queues/emailQueue.js";
import {
  sendVerificationMail,
  sendWelcomeMail,
  sendEmailChangeMail,
  sendGrindReminderMail,
  sendSiteReportMail,
  sendRevisionReminderMail,
} from "../services/emailSend.service.js";
import { logger } from "../utils/logger.js";
import connectDB from "../db/connectDB.js";
import User from "../models/user.model.js";

logger.info("Initializing standalone Email Worker process...");

connectDB()
  .then(() => {
    logger.info("Email Worker: Database connected successfully.");
  })
  .catch((err) => {
    logger.warn({ err }, "Email Worker: Database connection failed (non-fatal for SMTP processing)");
  });

const worker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job: Job) => {
    logger.info({ jobId: job.id, name: job.name }, "Processing email job");

    switch (job.name) {
      case EmailJobType.VERIFICATION: {
        const data = job.data as VerificationEmailPayload;
        await sendVerificationMail(data.email, data.otp);
        break;
      }
      case EmailJobType.WELCOME: {
        const data = job.data as WelcomeEmailPayload;
        try {
          const user = await User.findOne({ email: data.email }).select("emailNotifications");
          if (user && user.emailNotifications?.welcomeAndAnnouncements === false) {
            logger.info({ email: data.email }, "Skipping welcome email: user disabled announcements");
            break;
          }
        } catch (dbErr) {
          logger.warn({ dbErr }, "Could not check user notification prefs; continuing with send");
        }
        await sendWelcomeMail(data.email, data.username);
        break;
      }
      case EmailJobType.EMAIL_CHANGE: {
        const data = job.data as EmailChangeEmailPayload;
        await sendEmailChangeMail(data.email, data.otp);
        break;
      }
      case EmailJobType.GRIND_REMINDER: {
        const data = job.data as GrindReminderEmailPayload;
        try {
          const user = await User.findOne({ email: data.email }).select("emailNotifications");
          if (user && user.emailNotifications?.grindReminders === false) {
            logger.info({ email: data.email }, "Skipping grind reminder: user disabled grind reminders");
            break;
          }
        } catch (dbErr) {
          logger.warn({ dbErr }, "Could not check user notification prefs; continuing with send");
        }
        await sendGrindReminderMail(data.email, data.username);
        break;
      }
      case EmailJobType.SITE_REPORT: {
        const data = job.data as SiteReportEmailPayload;
        await sendSiteReportMail(
          data.reporterUsername,
          data.reporterEmail,
          data.reason,
          data.details
        );
        break;
      }
      case EmailJobType.REVISION_REMINDER: {
        const data = job.data as RevisionReminderPayload;
        try {
          const user = await User.findOne({ email: data.email }).select("emailNotifications");
          if (user && user.emailNotifications?.revisionReminders === false) {
            logger.info({ email: data.email }, "Skipping revision reminder: user disabled revision reminders");
            break;
          }
        } catch (dbErr) {
          logger.warn({ dbErr }, "Could not check user notification prefs; continuing with send");
        }
        await sendRevisionReminderMail(
          data.email,
          data.username,
          data.questionTitle,
          data.daysAgo,
          data.questionSlug
        );
        break;
      }
      default:
        logger.warn({ jobName: job.name }, "Unknown email job type received");
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id, name: job.name }, "Email job completed successfully");
});

worker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, name: job?.name, err: err.message },
    "Email job failed execution"
  );
});

worker.on("error", (err) => {
  logger.error({ err: err.message }, "Unhandled error in Email Worker");
});

logger.info("🚀 Email Worker is active and listening for queued jobs.");

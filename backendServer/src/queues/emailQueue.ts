import { Queue } from "bullmq";

const redisUrlString = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export function parseRedisUrl(urlStr: string) {
  try {
    const url = new URL(urlStr);
    return {
      host: url.hostname || "127.0.0.1",
      port: Number(url.port) || 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return {
      host: "127.0.0.1",
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
}

export const redisConnection = parseRedisUrl(redisUrlString);

export const EMAIL_QUEUE_NAME = "email-queue";

export interface VerificationEmailPayload {
  email: string;
  otp: string;
}

export interface WelcomeEmailPayload {
  email: string;
  username: string;
}

export interface EmailChangeEmailPayload {
  email: string;
  otp: string;
}

export interface GrindReminderEmailPayload {
  email: string;
  username: string;
}

export interface SiteReportEmailPayload {
  reporterUsername: string;
  reporterEmail: string;
  reason: string;
  details: string;
}

export interface RevisionReminderPayload {
  email: string;
  username: string;
  questionTitle: string;
  daysAgo: number;
  questionSlug: string;
}

export enum EmailJobType {
  VERIFICATION = "VERIFICATION",
  WELCOME = "WELCOME",
  EMAIL_CHANGE = "EMAIL_CHANGE",
  GRIND_REMINDER = "GRIND_REMINDER",
  SITE_REPORT = "SITE_REPORT",
  REVISION_REMINDER = "REVISION_REMINDER",
}

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800, count: 5000 },
  },
});

export async function enqueueVerificationEmail(email: string, otp: string): Promise<void> {
  await emailQueue.add(EmailJobType.VERIFICATION, { email, otp });
}

export async function enqueueWelcomeEmail(email: string, username: string): Promise<void> {
  await emailQueue.add(EmailJobType.WELCOME, { email, username });
}

export async function enqueueEmailChangeEmail(email: string, otp: string): Promise<void> {
  await emailQueue.add(EmailJobType.EMAIL_CHANGE, { email, otp });
}

export async function enqueueGrindReminderEmail(email: string, username: string): Promise<void> {
  await emailQueue.add(EmailJobType.GRIND_REMINDER, { email, username });
}

export async function enqueueSiteReportEmail(
  reporterUsername: string,
  reporterEmail: string,
  reason: string,
  details: string
): Promise<void> {
  await emailQueue.add(EmailJobType.SITE_REPORT, {
    reporterUsername,
    reporterEmail,
    reason,
    details,
  });
}

export async function enqueueRevisionReminderEmail(
  email: string,
  username: string,
  questionTitle: string,
  daysAgo: number,
  questionSlug: string
): Promise<void> {
  await emailQueue.add(EmailJobType.REVISION_REMINDER, {
    email,
    username,
    questionTitle,
    daysAgo,
    questionSlug,
  });
}

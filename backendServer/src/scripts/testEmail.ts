import dotenv from "dotenv";
dotenv.config();

import { sendTestMailToOwner } from "../services/emailSend.service.js";
import { enqueueTestEmail } from "../queues/emailQueue.js";
import { env } from "../config/env.js";

async function runEmailTests() {
  console.log("--------------------------------------------------");
  console.log("📧 Starting System Email Verification Check...");
  console.log("--------------------------------------------------");
  
  const recipient = process.argv[2] || env.OWNER_EMAIL || env.EMAIL_USER || "test@example.com";
  console.log(`[Config] Target Recipient: ${recipient}`);
  console.log(`[Config] Environment: ${env.NODE_ENV}`);
  console.log(`[Config] App Name: ${env.APP_NAME}`);

  try {
    console.log("\n1️⃣ Testing Direct SMTP Transport (sendTestMailToOwner)...");
    const directRes = await sendTestMailToOwner(recipient);
    console.log(`   ✅ Direct test email sent successfully to ${directRes.recipient}`);
  } catch (err: any) {
    console.error("   ❌ Direct SMTP send failed:", err?.message || err);
  }

  try {
    console.log("\n2️⃣ Testing BullMQ Redis Queue Enqueue (enqueueTestEmail)...");
    await enqueueTestEmail(recipient);
    console.log("   ✅ Test email job successfully enqueued in BullMQ email-queue");
  } catch (err: any) {
    console.error("   ❌ BullMQ Queue enqueue failed:", err?.message || err);
  }

  console.log("--------------------------------------------------");
  console.log("✨ Email Verification Check Completed!");
  console.log("--------------------------------------------------");
  process.exit(0);
}

runEmailTests();

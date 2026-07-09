import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
});

if (env.NODE_ENV === "production" && (!env.EMAIL_USER || !env.EMAIL_PASS)) {
    throw new Error(
        "[EmailService] EMAIL_USER and EMAIL_PASS must be set in production. " +
        "Configure your SMTP credentials (e.g. Gmail app password) in the environment."
    );
}

const FROM_ADDRESS = env.EMAIL_FROM_ADDRESS ?? env.EMAIL_USER ?? "noreply@devarena.dev";
const APP_NAME = env.APP_NAME ?? 'DevWar';

function buildVerificationHtml(otp: string): string {
    return `
        <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color:#111827; margin-bottom: 4px;">${APP_NAME}</h2>
            <p style="color:#374151; font-size: 15px;">Use the verification code below. It expires in 5 minutes.</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; background:#f3f4f6; color:#111827; padding: 14px 20px; border-radius: 8px; display:inline-block; margin: 12px 0;">
                ${otp}
            </p>
            <p style="color:#6b7280; font-size: 13px; margin-top: 20px;">
                If you didn't request this code, you can safely ignore this email.
            </p>
        </div>
    `;
}

/**
 * Sends a one-time verification code to the given email address.
 * Uses Nodemailer with Gmail SMTP.
 */
async function sendVerificationMail(email: string, otp: string): Promise<void> {
    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
            to: email,
            subject: `${APP_NAME} — Your verification code`,
            html: buildVerificationHtml(otp),
        });
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        throw new ApiError(
            500,
            "Failed to send verification email",
            [reason]
        );
    }
}


export { sendVerificationMail };

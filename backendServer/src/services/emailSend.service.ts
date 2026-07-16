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
    console.warn(
        "[EmailService] EMAIL_USER and EMAIL_PASS must be set in production. " +
        "Configure SMTP credentials in the environment."
    );
}

const FROM_ADDRESS = env.EMAIL_FROM_ADDRESS ?? env.EMAIL_USER ?? "noreply@codecomplex.dev";
const APP_NAME = 'CodeComplex';

function buildVerificationHtml(otp: string): string {
    return `
        <div style="background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; border-radius: 8px; max-width: 500px; margin: 0 auto; border: 1px solid #30363d;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Code<span style="color: #FF6B00;">Complex</span></h1>
            </div>
            <div style="background-color: #161b22; padding: 28px; border-radius: 8px; border: 1px solid #30363d;">
                <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 600; text-align: center;">Verify Your Account</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #8b949e; text-align: center; margin-top: 8px;">Thank you for registering at CodeComplex. Use the one-time verification code below to complete your registration. This code will expire in 5 minutes.</p>
                <div style="text-align: center; margin: 28px 0;">
                    <div style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #FF6B00; background-color: #0d1117; padding: 16px 24px; border-radius: 6px; display: inline-block; border: 1px solid #30363d; box-shadow: inset 0 0 10px rgba(255, 107, 0, 0.05);">${otp}</div>
                </div>
                <p style="font-size: 13px; line-height: 1.5; color: #8b949e; text-align: center; margin-bottom: 0;">If you did not request this verification, you can safely ignore this email.</p>
            </div>
            <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #484f58;">
                &copy; ${new Date().getFullYear()} CodeComplex. All rights reserved.
            </div>
        </div>
    `;
}

function buildEmailChangeHtml(otp: string): string {
    return `
        <div style="background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; border-radius: 8px; max-width: 500px; margin: 0 auto; border: 1px solid #30363d;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Code<span style="color: #FF6B00;">Complex</span></h1>
            </div>
            <div style="background-color: #161b22; padding: 28px; border-radius: 8px; border: 1px solid #30363d;">
                <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 600; text-align: center;">Confirm Email Change</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #8b949e; text-align: center; margin-top: 8px;">We received a request to update the email address linked to your CodeComplex account. Please use the verification code below to authorize this change. This code will expire in 5 minutes.</p>
                <div style="text-align: center; margin: 28px 0;">
                    <div style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #FF6B00; background-color: #0d1117; padding: 16px 24px; border-radius: 6px; display: inline-block; border: 1px solid #30363d; box-shadow: inset 0 0 10px rgba(255, 107, 0, 0.05);">${otp}</div>
                </div>
                <p style="font-size: 13px; line-height: 1.5; color: #8b949e; text-align: center; margin-bottom: 0;">If you did not initiate this change, please contact support and secure your account immediately.</p>
            </div>
            <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #484f58;">
                &copy; ${new Date().getFullYear()} CodeComplex. All rights reserved.
            </div>
        </div>
    `;
}

function buildWelcomeHtml(username: string): string {
    return `
        <div style="background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; border-radius: 8px; max-width: 500px; margin: 0 auto; border: 1px solid #30363d;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Code<span style="color: #FF6B00;">Complex</span></h1>
            </div>
            <div style="background-color: #161b22; padding: 28px; border-radius: 8px; border: 1px solid #30363d;">
                <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 600;">Welcome to the Arena, @${username}! 🚀</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #8b949e; margin-top: 8px;">Your account at CodeComplex is verified and ready. Prepare to showcase your skills, solve real-world challenges, and climb the ranks.</p>
                <p style="font-size: 15px; line-height: 1.6; color: #8b949e;">Here's what you can build and conquer on our platform:</p>
                <ul style="color: #c9d1d9; font-size: 14px; padding-left: 20px; line-height: 1.8; margin: 12px 0;">
                    <li><strong>DSA Arena:</strong> Compete in ranked and practice matches with LeetCode-style code execution.</li>
                    <li><strong>Frontend & Backend:</strong> Run containerized tests to debug live code.</li>
                    <li><strong>Prompt War:</strong> Battle other developers to write the best LLM instructions.</li>
                </ul>
                <div style="text-align: center; margin: 28px 0 8px 0;">
                    <a href="${env.CLIENT_URL}/battle" target="_blank" style="background-color: #FF6B00; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.25);">Enter the Arena</a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #484f58;">
                &copy; ${new Date().getFullYear()} CodeComplex. All rights reserved.
            </div>
        </div>
    `;
}

function buildGrindReminderHtml(username: string): string {
    return `
        <div style="background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; border-radius: 8px; max-width: 500px; margin: 0 auto; border: 1px solid #30363d;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Code<span style="color: #FF6B00;">Complex</span></h1>
            </div>
            <div style="background-color: #161b22; padding: 28px; border-radius: 8px; border: 1px solid #30363d;">
                <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 600; text-align: center;">Your friends are grinding! ⚔️</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #c9d1d9; margin-top: 12px;">Hey <strong>@${username}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6; color: #8b949e;">Your peers and competitors are climbing the leaderboards and stacking up rating points! Don't let your score gather dust while they grind.</p>
                <p style="font-size: 15px; line-height: 1.6; color: #8b949e;">Hop back on <strong>CodeComplex</strong> today to claim your victories and show everyone who owns the leaderboard.</p>
                <div style="text-align: center; margin: 28px 0 8px 0;">
                    <a href="${env.CLIENT_URL}/battle" target="_blank" style="background-color: #FF6B00; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.25);">Back to the Arena</a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #484f58;">
                &copy; ${new Date().getFullYear()} CodeComplex. All rights reserved.
            </div>
        </div>
    `;
}

/**
 * Sends a one-time verification code to the given email address.
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

/**
 * Sends a welcome email when user is successfully verified/activated.
 */
async function sendWelcomeMail(email: string, username: string): Promise<void> {
    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
            to: email,
            subject: `Welcome to ${APP_NAME}! 🚀`,
            html: buildWelcomeHtml(username),
        });
    } catch (err) {
        console.error(`[EmailService] Welcome email failed to send to ${email}:`, err);
    }
}

/**
 * Sends email change OTP code.
 */
async function sendEmailChangeMail(email: string, otp: string): Promise<void> {
    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
            to: email,
            subject: `${APP_NAME} — Confirm email address update`,
            html: buildEmailChangeHtml(otp),
        });
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        throw new ApiError(
            500,
            "Failed to send email change verification code",
            [reason]
        );
    }
}

/**
 * Sends inactivity reminders.
 */
async function sendGrindReminderMail(email: string, username: string): Promise<void> {
    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
            to: email,
            subject: `Your friends are grinding on ${APP_NAME}! ⚔️`,
            html: buildGrindReminderHtml(username),
        });
    } catch (err) {
        console.error(`[EmailService] Grind reminder email failed to send to ${email}:`, err);
    }
}

/**
 * Sends a website/system issue report email to the owner of the platform.
 */
async function sendSiteReportMail(
    reporterUsername: string,
    reporterEmail: string,
    reason: string,
    details: string
): Promise<void> {
    const ownerEmail = env.OWNER_EMAIL ?? env.EMAIL_USER;
    if (!ownerEmail) {
        console.warn("[EmailService] No OWNER_EMAIL or EMAIL_USER configured to receive reports.");
        return;
    }

    try {
        await transporter.sendMail({
            from: `"${APP_NAME} System" <${FROM_ADDRESS}>`,
            to: ownerEmail,
            subject: `[${APP_NAME}] New Site/System Report from @${reporterUsername}`,
            html: `
                <div style="background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #30363d;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Code<span style="color: #FF6B00;">Complex</span></h1>
                    </div>
                    <div style="background-color: #161b22; padding: 28px; border-radius: 8px; border: 1px solid #30363d;">
                        <h2 style="color: #ff6b00; margin-top: 0; font-size: 20px; font-weight: 600; text-align: center;">New Site Report Submitted ⚠️</h2>
                        <p style="font-size: 15px; line-height: 1.6; color: #8b949e; margin-top: 8px;">A user has submitted a general report about the website.</p>
                        
                        <div style="margin: 20px 0; border-top: 1px solid #30363d; padding-top: 15px;">
                            <p style="font-size: 14px; margin: 4px 0;"><strong>Reporter:</strong> @${reporterUsername} (${reporterEmail})</p>
                            <p style="font-size: 14px; margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>
                        </div>
                        
                        <div style="background-color: #0d1117; padding: 16px; border-radius: 6px; border: 1px solid #30363d;">
                            <p style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #ffffff;">Details / Description:</p>
                            <p style="font-size: 14px; line-height: 1.6; color: #c9d1d9; margin: 0; white-space: pre-wrap;">${details}</p>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #484f58;">
                        &copy; ${new Date().getFullYear()} CodeComplex. All rights reserved.
                    </div>
                </div>
            `,
        });
    } catch (err) {
        console.error("[EmailService] Failed to send site report email to owner:", err);
    }
}

export {
    sendVerificationMail,
    sendWelcomeMail,
    sendEmailChangeMail,
    sendGrindReminderMail,
    sendSiteReportMail
};

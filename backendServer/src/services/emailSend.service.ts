import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// In production the sandbox address silently drops all mail — fail fast
// so a misconfigured deploy is caught at startup, not at the first OTP send.
if (process.env.NODE_ENV === "production" && !process.env.EMAIL_FROM_ADDRESS) {
    throw new Error(
        "[EmailService] EMAIL_FROM_ADDRESS must be set to a verified Resend sending domain in production. " +
        "The default sandbox address (onboarding@resend.dev) does not deliver to real inboxes."
    );
}

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS ?? "onboarding@resend.dev";
const APP_NAME = process.env.APP_NAME ?? 'DevArena';

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
 * Used for both EMAIL_VERIFICATION (signup) and EMAIL_CHANGE flows.
 *
 * FIX (I3): previously had no error handling — a Resend API-level failure
 * (returned as `{ error }`, not always a thrown exception) would pass
 * through silently. Callers in user_controllers.ts wrap this in try/catch,
 * but only get a bare SDK error with no context on which address/flow
 * failed. This now checks the response explicitly and re-throws with
 * enough context to log meaningfully upstream.
 */
async function sendVerificationMail(email: string, otp: string): Promise<void> {
    try {
        const { error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: email,
            subject: `${APP_NAME} — Your verification code`,
            html: buildVerificationHtml(otp),
        });

        if (error) {
            throw new Error(
                typeof error === "object" && error !== null && "message" in error
                    ? String((error as { message: unknown }).message)
                    : JSON.stringify(error)
            );
        }
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        throw new Error(`[EmailService] Failed to send verification email to ${email}: ${reason}`);
    }
}


export { sendVerificationMail };
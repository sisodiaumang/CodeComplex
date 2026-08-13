import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for sensitive authentication & OTP routes.
 * Limits each IP to 10 attempts per 15-minute window.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per IP per windowMs
    message: {
        success: false,
        message: "Too many authentication attempts from this IP, please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { IOTP } from "../interfaces/otp.interface.js";

// FIX: Max attempts enforced here AND must also be enforced at the application
// layer when using findOneAndUpdate with $inc, because Mongoose validators are
// bypassed by update operators. See otpService / otpController.
const MAX_OTP_ATTEMPTS = 5;

const otpSchema = new mongoose.Schema<IOTP>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },

        otp: {
            type: String,
            required: true,
            select: false
        },

        purpose: {
            type: String,
            enum: [
                "EMAIL_VERIFICATION",
                "PASSWORD_RESET",
                "EMAIL_CHANGE"
            ],
            required: true
        },

        blockedUntil: {
            type: Date
        },

        expiresAt: {
            type: Date,
            required: true
        },

        attempts: {
            type: Number,
            default: 0,
            min: 0,
            // FIX: Schema-level max is a last resort only. ALWAYS check and
            // enforce MAX_OTP_ATTEMPTS in application code before any $inc,
            // since findOneAndUpdate bypasses this validator entirely.
            max: MAX_OTP_ATTEMPTS
        },

        lastSentAt: {
            type: Date
        },

        // Stores signup payload temporarily until email is verified.
        // Only populated for EMAIL_VERIFICATION purpose.
        // Cleared (along with the whole doc) once verifyUser succeeds.
        //
        // FIX: passwordHash must be bcrypt-hashed BEFORE being written into
        // this field. The pre-save hook on the User model does NOT run here,
        // so the caller (signup service) is responsible for hashing. Never
        // store a plaintext password in pendingUser.passwordHash.
        pendingUser: {
            type: new mongoose.Schema(
                {
                    username: {
                        type: String,
                        required: true,
                        trim: true
                    },
                    fullName: {
                        type: String,
                        required: true,
                        trim: true
                    },
                    // select: false prevents the hash from leaking in any
                    // query that populates this subdoc, but it is NOT
                    // encryption-at-rest. Enable Atlas Encrypted Storage if
                    // at-rest protection is required.
                    passwordHash: {
                        type: String,
                        required: true,
                        select: false
                    }
                },
                { _id: false }
            ),
            required: false,
            default: undefined
        }
    },
    {
        timestamps: true
    }
);

// TTL index — MongoDB auto-deletes expired OTP documents.
otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

// FIX: Unique index on {email, purpose} is intentional: one active OTP per
// email per purpose at a time. Resend flows MUST use findOneAndUpdate (upsert)
// rather than create(), otherwise they will hit a duplicate-key error while the
// previous OTP doc still exists.
otpSchema.index(
    { email: 1, purpose: 1 },
    { unique: true }
);


otpSchema.pre("save", async function () {
    if (!this.isModified("otp")) return;
    this.otp = await bcrypt.hash(this.otp, 10);
});

otpSchema.methods.compareOTP = async function (otp: string): Promise<boolean> {
    return bcrypt.compare(otp, this.otp);
};


const OTP =
    (mongoose.models.OTP as mongoose.Model<IOTP>) ||
    mongoose.model<IOTP>("OTP", otpSchema);

export { MAX_OTP_ATTEMPTS };
export default OTP;
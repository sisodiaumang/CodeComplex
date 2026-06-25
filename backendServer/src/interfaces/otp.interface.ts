import { Document } from "mongoose";

export type OtpPurpose =
    | "EMAIL_VERIFICATION"
    | "PASSWORD_RESET"
    | "EMAIL_CHANGE";

export interface PendingUser {
    username: string;
    fullName: string;
    passwordHash: string;
}

export interface IOTP extends Document {
    email: string;
    otp: string;
    purpose: OtpPurpose;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    lastSentAt?: Date;
    blockedUntil?: Date;       // was non-optional before, made optional — it's not always set
    attempts: number;
    pendingUser?: PendingUser; // signup payload stored here until OTP is verified
    compareOTP(otp: string): Promise<boolean>;
}

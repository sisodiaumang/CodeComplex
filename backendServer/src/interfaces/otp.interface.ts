import { Document } from "mongoose";



export type OtpPurpose =
    | "EMAIL_VERIFICATION"
    | "PASSWORD_RESET"
    | "EMAIL_CHANGE";

export interface IOTP extends Document {

    email: string;

    otp: string;

    purpose: OtpPurpose;

    expiresAt: Date;

    createdAt: Date;
    updatedAt: Date;
    lastSentAt?: Date;
    attempts: number;
    compareOTP(
        otp: string
    ): Promise<boolean>;
}

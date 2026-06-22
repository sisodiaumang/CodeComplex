
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { IOTP } from "../interfaces/otp.interface.js";




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

        expiresAt: {
            type: Date,
            required: true
        },
        attempts: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        lastSentAt: {
            type: Date
        }


    },
    {
        timestamps: true
    });


otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

otpSchema.index(
    {
        email: 1,
        purpose: 1
    },
    {
        unique: true
    }
);


otpSchema.pre("save", async function () {

    if (!this.isModified("otp")) {
        return;
    }

    this.otp = await bcrypt.hash(
        this.otp,
        10
    );

});

otpSchema.methods.compareOTP = async function (
    otp: string
): Promise<boolean> {
    return bcrypt.compare(
        otp,
        this.otp
    );

};


const OTP =
    (mongoose.models.OTP as mongoose.Model<IOTP>) ||
    mongoose.model<IOTP>(
        "OTP",
        otpSchema
    );

export default OTP;
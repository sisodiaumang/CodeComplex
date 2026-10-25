import mongoose, { Schema } from "mongoose";
import { ICertificate } from "../interfaces/certificate.interface.js";

const certificateSchema = new Schema<ICertificate>(
    {
        certificateId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        recipientName: {
            type: String,
            required: true,
            trim: true,
        },
        recipientEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },
        role: {
            type: String,
            default: "Software Engineering Intern",
            trim: true,
        },
        domain: {
            type: String,
            required: true,
            trim: true,
        },
        duration: {
            type: String,
            required: true,
            trim: true,
        },
        startDate: {
            type: String,
            required: true,
        },
        endDate: {
            type: String,
            required: true,
        },
        issueDate: {
            type: Date,
            default: Date.now,
        },
        grade: {
            type: String,
            default: "Distinction (Top 5%)",
            trim: true,
        },
        skills: {
            type: [String],
            default: [],
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["VALID", "REVOKED", "EXPIRED"],
            default: "VALID",
            index: true,
        },
        revocationReason: {
            type: String,
            trim: true,
        },
        issuer: {
            type: String,
            default: "CodeComplex Engineering Division",
        },
        signatoryName: {
            type: String,
            default: "Umang Sisodia",
        },
        signatoryTitle: {
            type: String,
            default: "Founding Director & Lead Architect",
        },
        verificationCount: {
            type: Number,
            default: 0,
        },
        lastVerifiedAt: {
            type: Date,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

certificateSchema.index({ recipientName: "text", domain: "text", certificateId: "text" });

const Certificate = mongoose.model<ICertificate>("Certificate", certificateSchema);
export default Certificate;

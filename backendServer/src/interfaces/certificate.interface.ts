import { Document } from "mongoose";

export type CertificateStatus = "VALID" | "REVOKED" | "EXPIRED";

export interface ICertificate extends Document {
    certificateId: string;
    recipientName: string;
    recipientEmail?: string;
    role: string;
    domain: string;
    duration: string;
    startDate: string;
    endDate: string;
    issueDate: Date;
    grade?: string;
    skills: string[];
    description: string;
    status: CertificateStatus;
    revocationReason?: string;
    issuer: string;
    signatoryName: string;
    signatoryTitle: string;
    verificationCount: number;
    lastVerifiedAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

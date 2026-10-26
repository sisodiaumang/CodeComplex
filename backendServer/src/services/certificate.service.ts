import Certificate from "../models/certificate.model.js";
import { ICertificate } from "../interfaces/certificate.interface.js";
import ApiError from "../utils/ApiError.js";

export const SAMPLE_CERTIFICATES = [
    {
        certificateId: "CC-INT-2026-001",
        recipientName: "Arjun Sharma",
        recipientEmail: "arjun.sharma@example.com",
        role: "Software Engineering Intern",
        domain: "Full Stack Web & Real-Time Systems",
        duration: "12 Weeks (Summer 2026)",
        startDate: "2026-06-01",
        endDate: "2026-08-24",
        issueDate: new Date("2026-08-25"),
        grade: "Outstanding Distinction (Top 2%)",
        skills: [
            "Next.js 16",
            "React 19",
            "TypeScript",
            "Node.js",
            "Express",
            "Socket.IO",
            "Redis Pub/Sub",
            "Docker Sandboxing",
            "Tailwind CSS"
        ],
        description: "Successfully completed an intensive 12-week software engineering internship at CodeComplex. Architected high-concurrency real-time WebSocket state synchronizers, optimized ephemeral Docker sandbox container recycling, and engineered core matchmaking logic for 1v1 and squad battle arenas.",
        status: "VALID" as const,
        issuer: "CodeComplex Engineering Division",
        signatoryName: "Umang Sisodia",
        signatoryTitle: "Founding Director & Lead Architect",
    },
    {
        certificateId: "CC-INT-2026-002",
        recipientName: "Sophia Chen",
        recipientEmail: "sophia.chen@example.com",
        role: "Backend Systems Intern",
        domain: "Distributed Backend & Containerization",
        duration: "10 Weeks",
        startDate: "2026-06-15",
        endDate: "2026-08-24",
        issueDate: new Date("2026-08-26"),
        grade: "Exemplary Performance",
        skills: [
            "Node.js",
            "Express",
            "Docker Engine",
            "Redis Streams",
            "BullMQ",
            "PostgreSQL",
            "Linux cgroups",
            "Jest"
        ],
        description: "Demonstrated advanced engineering proficiency in building distributed asynchronous background queues, rate-limiting algorithms, and hardened Docker sandbox runners for multi-language automated code evaluation and real-time execution telemetry.",
        status: "VALID" as const,
        issuer: "CodeComplex Engineering Division",
        signatoryName: "Umang Sisodia",
        signatoryTitle: "Founding Director & Lead Architect",
    },
    {
        certificateId: "CC-INT-2026-003",
        recipientName: "Liam Patel",
        recipientEmail: "liam.patel@example.com",
        role: "Frontend Engineering Intern",
        domain: "Modern Web UI & WebRTC Systems",
        duration: "8 Weeks",
        startDate: "2026-07-01",
        endDate: "2026-08-26",
        issueDate: new Date("2026-08-27"),
        grade: "High Honors",
        skills: [
            "Next.js 16",
            "React 19",
            "WebRTC Voice Signaling",
            "Monaco Editor",
            "Tailwind CSS v4",
            "Zustand",
            "TanStack Query"
        ],
        description: "Engineered responsive real-time multiplayer duel interfaces, integrated WebRTC peer-to-peer voice channels for competitive squads, and built collaborative code editors with sub-50ms keystroke synchronization and fluid dark-mode transitions.",
        status: "VALID" as const,
        issuer: "CodeComplex Engineering Division",
        signatoryName: "Umang Sisodia",
        signatoryTitle: "Founding Director & Lead Architect",
    },
    {
        certificateId: "CC-INT-2026-9479",
        recipientName: "Suraj Saw",
        recipientEmail: "suraj.saw@example.com",
        role: "Machine Learning Trainee",
        domain: "Artificial Intelligence & Machine Learning",
        duration: "10 Weeks",
        startDate: "2026-06-01",
        endDate: "2026-08-01",
        issueDate: new Date("2026-10-26"),
        grade: "Outstanding Distinction (Top 10%)",
        skills: [
            "Deep Learning",
            "Machine Learning",
            "Pandas",
            "Numpy",
            "Data Visualization"
        ],
        description: "Successfully completed the Artificial Intelligence & Machine Learning Internship at CodeComplex with excellence in software engineering, technical problem solving, and system architecture.",
        status: "VALID" as const,
        issuer: "CodeComplex Engineering Division",
        signatoryName: "Pawan Singh",
        signatoryTitle: "Founding Director & Lead Architect",
    }
];

/**
 * Seed initial sample certificates if they don't already exist.
 */
export async function seedCertificates(): Promise<void> {
    try {
        for (const cert of SAMPLE_CERTIFICATES) {
            await Certificate.findOneAndUpdate(
                { certificateId: cert.certificateId },
                { $set: cert },
                { upsert: true, new: true }
            );
        }
        console.log("[CertificateService] Sample internship certificates verified and synced.");
    } catch (error) {
        console.error("[CertificateService] Seeding certificates failed:", error);
    }
}

/**
 * Public verification: looks up certificate by ID, updates lookup count & last verified timestamp.
 */
export async function verifyCertificate(certificateId: string): Promise<ICertificate | null> {
    const normalizedId = certificateId.trim().toUpperCase();
    if (!normalizedId) return null;

    const cert = await Certificate.findOneAndUpdate(
        { certificateId: normalizedId },
        {
            $inc: { verificationCount: 1 },
            $set: { lastVerifiedAt: new Date() }
        },
        { new: true }
    );

    return cert;
}

/**
 * Admin: List all certificates with pagination, search, and status filters.
 */
export async function listCertificates(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
}): Promise<{
    certificates: ICertificate[];
    total: number;
    page: number;
    totalPages: number;
}> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (params.status && params.status !== "ALL") {
        query.status = params.status;
    }

    if (params.search && params.search.trim()) {
        const searchRegex = new RegExp(params.search.trim(), "i");
        query.$or = [
            { certificateId: searchRegex },
            { recipientName: searchRegex },
            { domain: searchRegex },
            { role: searchRegex },
            { recipientEmail: searchRegex }
        ];
    }

    const [certificates, total] = await Promise.all([
        Certificate.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Certificate.countDocuments(query)
    ]);

    return {
        certificates,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1
    };
}

/**
 * Admin: Get single certificate by ID or _id.
 */
export async function getCertificateById(id: string): Promise<ICertificate | null> {
    const normalized = id.trim();
    return await Certificate.findOne({
        $or: [
            { certificateId: normalized.toUpperCase() },
            ...(normalized.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: normalized }] : [])
        ]
    });
}

/**
 * Admin: Create a new certificate.
 */
export async function createCertificate(data: Partial<ICertificate>): Promise<ICertificate> {
    if (!data.recipientName || !data.domain || !data.duration || !data.startDate || !data.endDate) {
        throw new ApiError(400, "Missing required certificate fields (recipientName, domain, duration, startDate, endDate)");
    }

    let certificateId = data.certificateId?.trim().toUpperCase();
    if (!certificateId) {
        // Generate an official ID format: CC-INT-YYYY-XXXX
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        certificateId = `CC-INT-${year}-${rand}`;
    }

    const existing = await Certificate.findOne({ certificateId });
    if (existing) {
        throw new ApiError(409, `Certificate ID "${certificateId}" already exists.`);
    }

    const newCert = new Certificate({
        ...data,
        certificateId,
        skills: Array.isArray(data.skills) ? data.skills : (typeof data.skills === "string" ? (data.skills as string).split(",").map(s => s.trim()).filter(Boolean) : []),
        description: data.description || `Successfully completed the ${data.domain} internship at CodeComplex with excellence in software engineering, technical problem solving, and system architecture.`,
        issuer: data.issuer || "CodeComplex Engineering Division",
        signatoryName: data.signatoryName || "Umang Sisodia",
        signatoryTitle: data.signatoryTitle || "Founding Director & Lead Architect",
        status: data.status || "VALID"
    });

    return await newCert.save();
}

/**
 * Admin: Update an existing certificate (e.g. revoke, edit recipient, change dates).
 */
export async function updateCertificate(
    id: string,
    updateData: Partial<ICertificate>
): Promise<ICertificate> {
    const cert = await getCertificateById(id);
    if (!cert) {
        throw new ApiError(404, "Certificate not found");
    }

    if (updateData.certificateId && updateData.certificateId.trim().toUpperCase() !== cert.certificateId) {
        const newId = updateData.certificateId.trim().toUpperCase();
        const conflict = await Certificate.findOne({ certificateId: newId });
        if (conflict) {
            throw new ApiError(409, `Certificate ID "${newId}" already exists.`);
        }
        cert.certificateId = newId;
    }

    if (updateData.recipientName !== undefined) cert.recipientName = updateData.recipientName;
    if (updateData.recipientEmail !== undefined) cert.recipientEmail = updateData.recipientEmail;
    if (updateData.role !== undefined) cert.role = updateData.role;
    if (updateData.domain !== undefined) cert.domain = updateData.domain;
    if (updateData.duration !== undefined) cert.duration = updateData.duration;
    if (updateData.startDate !== undefined) cert.startDate = updateData.startDate;
    if (updateData.endDate !== undefined) cert.endDate = updateData.endDate;
    if (updateData.grade !== undefined) cert.grade = updateData.grade;
    if (updateData.description !== undefined) cert.description = updateData.description;
    if (updateData.issuer !== undefined) cert.issuer = updateData.issuer;
    if (updateData.signatoryName !== undefined) cert.signatoryName = updateData.signatoryName;
    if (updateData.signatoryTitle !== undefined) cert.signatoryTitle = updateData.signatoryTitle;
    if (updateData.status !== undefined) cert.status = updateData.status;
    if (updateData.revocationReason !== undefined) cert.revocationReason = updateData.revocationReason;

    if (updateData.skills !== undefined) {
        cert.skills = Array.isArray(updateData.skills)
            ? updateData.skills
            : typeof updateData.skills === "string"
                ? (updateData.skills as string).split(",").map(s => s.trim()).filter(Boolean)
                : cert.skills;
    }

    return await cert.save();
}

/**
 * Admin: Delete a certificate.
 */
export async function deleteCertificate(id: string): Promise<void> {
    const cert = await getCertificateById(id);
    if (!cert) {
        throw new ApiError(404, "Certificate not found");
    }
    await Certificate.findByIdAndDelete(cert._id);
}

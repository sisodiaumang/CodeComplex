import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
    verifyCertificate,
    listCertificates,
    getCertificateById,
    createCertificate,
    updateCertificate,
    deleteCertificate
} from "../services/certificate.service.js";

/**
 * Public Endpoint: Verify an internship certificate.
 * No signup or authentication required.
 * GET /api/v1/certificates/verify/:certificateId
 * GET /api/v1/certificates/verify?id=...
 */
export const verifyCertificateHandler = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const paramId = Array.isArray(req.params.certificateId)
            ? req.params.certificateId[0]
            : req.params.certificateId;
        const queryId = Array.isArray(req.query.id)
            ? (req.query.id[0] as string)
            : (req.query.id as string);

        const rawId = String(paramId || queryId || "").trim();

        if (!rawId) {
            throw new ApiError(400, "Please provide a certificate ID to verify");
        }

        const certificate = await verifyCertificate(rawId);

        if (!certificate) {
            throw new ApiError(
                404,
                `No certificate found matching ID "${rawId.toUpperCase()}". Please check for typos and verify that the credential was issued by CodeComplex.`
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    certificate,
                    isAuthentic: certificate.status === "VALID",
                    verifiedAt: new Date().toISOString()
                },
                "Certificate verified successfully"
            )
        );
    }
);

/**
 * Admin: List all certificates.
 * GET /api/v1/certificates/admin
 */
export const getCertificatesAdminHandler = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const search = Array.isArray(req.query.search) ? String(req.query.search[0]) : (req.query.search as string | undefined);
        const status = Array.isArray(req.query.status) ? String(req.query.status[0]) : (req.query.status as string | undefined);
        const page = Array.isArray(req.query.page) ? Number(req.query.page[0]) : Number(req.query.page);
        const limit = Array.isArray(req.query.limit) ? Number(req.query.limit[0]) : Number(req.query.limit);

        const result = await listCertificates({
            search,
            status,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20
        });

        return res.status(200).json(
            new ApiResponse(200, result, "Certificates retrieved successfully")
        );
    }
);

/**
 * Admin: Get single certificate details.
 * GET /api/v1/certificates/admin/:id
 */
export const getCertificateByIdAdminHandler = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const cert = await getCertificateById(String(id || ""));

        if (!cert) {
            throw new ApiError(404, "Certificate not found");
        }

        return res.status(200).json(
            new ApiResponse(200, { certificate: cert }, "Certificate retrieved successfully")
        );
    }
);

/**
 * Admin: Issue / create a new certificate.
 * POST /api/v1/certificates/admin
 */
export const createCertificateAdminHandler = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const newCert = await createCertificate(req.body);

        return res.status(201).json(
            new ApiResponse(201, { certificate: newCert }, "Certificate created and registered successfully")
        );
    }
);

/**
 * Admin: Update an existing certificate.
 * PATCH /api/v1/certificates/admin/:id
 */
export const updateCertificateAdminHandler = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updated = await updateCertificate(String(id || ""), req.body);

        return res.status(200).json(
            new ApiResponse(200, { certificate: updated }, "Certificate updated successfully")
        );
    }
);

/**
 * Admin: Delete a certificate.
 * DELETE /api/v1/certificates/admin/:id
 */
export const deleteCertificateAdminHandler = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await deleteCertificate(String(id || ""));

        return res.status(200).json(
            new ApiResponse(200, { deletedId: id }, "Certificate deleted successfully")
        );
    }
);

import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import ApiError from "../utils/ApiError.js";

export const validateRequest = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = schema.parse({
                body: req.body,
                params: req.params,
                query: req.query,
            });

            // NOTE:
            // - Express defines req.query/req.params as getters in many versions.
            // - Mutating them can throw ("Cannot set property query/params... has only a getter").
            // - For this project we only need to safely replace req.body.

            if (typeof (validated as any)?.body !== "undefined") {
                req.body = (validated as any).body;
            } else {
                // If the schema is just for body, zod.parse(...) returns the validated body value directly.
                req.body = validated;
            }

            return next();
        } catch (error) {
            if (error instanceof Error && error.name === "ZodError") {
                const zodErrors = (error as any).errors ?? [];
                const message = zodErrors
                    .map((e: any) => `${(e.path ?? []).join(".")}: ${e.message}`)
                    .join(", ");
                throw new ApiError(400, `Validation failed: ${message}`);
            }
            throw error;
        }
    };
};

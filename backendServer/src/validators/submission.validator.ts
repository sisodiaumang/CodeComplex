import { z } from "zod";

export const submitCodeSchema = z.object({
    body: z.object({
        matchId: z.string().min(1),
        questionSlug: z.string().min(1),
        language: z.enum(["CPP", "JAVA", "PYTHON", "JAVASCRIPT", "TYPESCRIPT"]),
        sourceCode: z.string().min(1).max(40000),
    }).strict(),
});

export const rejudgeSubmissionSchema = z.object({
    params: z.object({
        submissionId: z.string().min(1),
    }).strict(),
});

export const getMatchSubmissionsSchema = z.object({
    params: z.object({
        matchId: z.string().min(1),
    }).strict(),
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }).strict(),
});

export type SubmitCodeInput = z.infer<typeof submitCodeSchema>;
export type RejudgeSubmissionInput = z.infer<typeof rejudgeSubmissionSchema>;
export type GetMatchSubmissionsInput = z.infer<typeof getMatchSubmissionsSchema>;

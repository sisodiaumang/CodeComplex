import { z } from "zod";

export const signupSchema = z.object({
    body: z.object({
        username: z.string().min(3).max(30).toLowerCase(),
        email: z.string().email(),
        password: z.string().min(8).max(128),
        fullName: z.string().min(3).max(50),
        country: z.string().length(2).toUpperCase().optional().default("IN"),
    }).strict(),
});

export const verifyUserSchema = z.object({
    body: z.object({
        email: z.string().email(),
        otp: z.string().regex(/^\d{6}$/),
    }).strict(),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }).strict(),
});

export const resendOtpSchema = z.object({
    body: z.object({
        email: z.string().email(),
        purpose: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET", "EMAIL_CHANGE"]),
    }).strict(),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }).strict(),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string().email(),
        otp: z.string().regex(/^\d{6}$/),
        newPassword: z.string().min(8).max(128),
    }).strict(),
});

export const changePasswordSchema = z.object({
    body: z.object({
        oldPassword: z.string().min(1),
        newPassword: z.string().min(8).max(128),
    }).strict(),
});

export const requestEmailChangeSchema = z.object({
    body: z.object({
        newEmail: z.string().email(),
    }).strict(),
});

export const verifyEmailChangeSchema = z.object({
    body: z.object({
        newEmail: z.string().email(),
        otp: z.string().regex(/^\d{6}$/),
    }).strict(),
});

export const updateBioSchema = z.object({
    body: z.object({
        bio: z.string().max(200),
    }).strict(),
});

export const updateCountrySchema = z.object({
    body: z.object({
        country: z.string().length(2).toUpperCase(),
    }).strict(),
});

export const updateFullNameSchema = z.object({
    body: z.object({
        fullName: z.string().min(3).max(50),
    }).strict(),
});

export const updateSocialsSchema = z.object({
    body: z.object({
        githubProfile: z.string().max(200).optional(),
        linkedinProfile: z.string().max(200).optional(),
        leetcodeProfile: z.string().max(200).optional(),
    }).strict(),
});

export const updateMascotSchema = z.object({
    body: z.object({
        type: z.enum(["cat", "dog", "panda", "crab"]),
        color: z.string().min(4).max(10),
    }).strict(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type VerifyUserInput = z.infer<typeof verifyUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>;
export type VerifyEmailChangeInput = z.infer<typeof verifyEmailChangeSchema>;
export type UpdateBioInput = z.infer<typeof updateBioSchema>;
export type UpdateCountryInput = z.infer<typeof updateCountrySchema>;
export type UpdateFullNameInput = z.infer<typeof updateFullNameSchema>;
export type UpdateSocialsInput = z.infer<typeof updateSocialsSchema>;

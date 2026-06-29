import { z } from "zod";

// Centralized environment validation (no direct process.env usage elsewhere).
export const env = {
  PORT: z.coerce.number().int().min(1).max(65535).default(8000).parse(process.env.PORT),

  CORS_ORIGIN: z
    .string()
    .min(1)
    .default("http://localhost:3000")
    .parse(process.env.CORS_ORIGIN),

  MONGO_URI: z
    .string()
    .min(1)
    .parse(process.env.MONGO_URI),

  JWT_ACCESS_SECRET: z
    .string()
    .min(10)
    .parse(process.env.JWT_ACCESS_SECRET),

  JWT_REFRESH_SECRET: z
    .string()
    .min(10)
    .parse(process.env.JWT_REFRESH_SECRET),

  // Judge0 (optional depending on battle types)
  JUDGE0_API_URL: z
    .string()
    .min(1)
    .default("http://localhost:2358")
    .parse(process.env.JUDGE0_API_URL),

  XAI_API_KEY: z.string().min(1).optional().parse(process.env.XAI_API_KEY),
  // Email / OTP / Cloudinary are optional because not every environment uses them.
  EMAIL_USER: z.string().min(1).optional().parse(process.env.EMAIL_USER),
  EMAIL_PASS: z.string().min(1).optional().parse(process.env.EMAIL_PASS),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional().parse(process.env.CLOUDINARY_CLOUD_NAME),
  CLOUDINARY_API_KEY: z.string().min(1).optional().parse(process.env.CLOUDINARY_API_KEY),
  CLOUDINARY_API_SECRET: z.string().min(1).optional().parse(process.env.CLOUDINARY_API_SECRET),

  // Rate limit / security toggles
  NODE_ENV: z.enum(["development", "test", "production"]).default("development").parse(process.env.NODE_ENV),
};

export type Env = typeof env;


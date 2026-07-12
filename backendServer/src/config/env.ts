import { z } from "zod";

const getEnv = (key: string, fallback?: string): string | undefined =>
  process.env[key] ?? fallback;

// Centralized environment validation (no direct process.env usage elsewhere).
export const env = {
  PORT: z.coerce.number().int().min(1).max(65535).default(8000).parse(getEnv("PORT")),

  CORS_ORIGIN: z
    .string()
    .min(1)
    .default("http://localhost:3000")
    .parse(getEnv("CORS_ORIGIN")),

  MONGODB_URI: z
    .string()
    .min(1)
    .parse(getEnv("MONGODB_URI") ?? getEnv("MONGO_URI")),

  JWT_ACCESS_SECRET: z
    .string()
    .min(10)
    .parse(getEnv("JWT_ACCESS_SECRET")),

  JWT_REFRESH_SECRET: z
    .string()
    .min(10)
    .parse(getEnv("JWT_REFRESH_SECRET")),

  ACCESS_TOKEN_EXPIRY: z
    .string()
    .min(1)
    .default("15m")
    .parse(getEnv("ACCESS_TOKEN_EXPIRY")),

  REFRESH_TOKEN_EXPIRY: z
    .string()
    .min(1)
    .default("7d")
    .parse(getEnv("REFRESH_TOKEN_EXPIRY")),

  // Judge0 (optional depending on battle types)
  JUDGE0_API_URL: z
    .string()
    .min(1)
    .default("http://localhost:2358")
    .parse(getEnv("JUDGE0_API_URL")),

  JUDGE0_API_KEY: z.string().min(1).optional().parse(getEnv("JUDGE0_API_KEY")),
  JUDGE0_API_HOST: z.string().min(1).optional().parse(getEnv("JUDGE0_API_HOST")),

  XAI_API_KEY: z.string().min(1).optional().parse(getEnv("XAI_API_KEY")),
  GROQ_API_KEY: z.string().min(1).optional().parse(getEnv("GROQ_API_KEY")),
  GROQ_API_KEYS: z.string().min(1).optional().parse(getEnv("GROQ_API_KEYS")),

  GOOGLE_CLIENT_ID: z.string().min(1).optional().parse(getEnv("GOOGLE_CLIENT_ID")),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional().parse(getEnv("GOOGLE_CLIENT_SECRET")),
  GITHUB_CLIENT_ID: z.string().min(1).optional().parse(getEnv("GITHUB_CLIENT_ID")),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional().parse(getEnv("GITHUB_CLIENT_SECRET")),
  OAUTH_CALLBACK_URL: z.string().min(1).default("http://localhost:8000/api/v1/auth").parse(getEnv("OAUTH_CALLBACK_URL")),
  CLIENT_URL: z.string().min(1).default("http://localhost:3000").parse(getEnv("CLIENT_URL")),
  EMAIL_FROM_ADDRESS: z.string().min(1).optional().parse(getEnv("EMAIL_FROM_ADDRESS")),
  APP_NAME: z.string().min(1).default("CodeComplex").parse(getEnv("APP_NAME")),
  EMAIL_USER: z.string().min(1).optional().parse(getEnv("EMAIL_USER")),
  EMAIL_PASS: z.string().min(1).optional().parse(getEnv("EMAIL_PASS")),

  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional().parse(getEnv("CLOUDINARY_CLOUD_NAME")),
  CLOUDINARY_API_KEY: z.string().min(1).optional().parse(getEnv("CLOUDINARY_API_KEY")),
  CLOUDINARY_API_SECRET: z.string().min(1).optional().parse(getEnv("CLOUDINARY_API_SECRET")),

  DEFAULT_AVATAR_URL: z.string().min(1).optional().parse(getEnv("DEFAULT_AVATAR_URL")),
  DEFAULT_AVATAR_PUBLIC_URL: z.string().min(1).optional().parse(getEnv("DEFAULT_AVATAR_PUBLIC_URL")),
  DEFAULT_AVATAR_PUBLIC_ID: z.string().min(1).optional().parse(getEnv("DEFAULT_AVATAR_PUBLIC_ID")),

  LOG_LEVEL: z.string().default("info").parse(getEnv("LOG_LEVEL")),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development").parse(getEnv("NODE_ENV")),
};

export type Env = typeof env;


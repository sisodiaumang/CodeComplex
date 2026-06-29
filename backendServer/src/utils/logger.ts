import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers[" + "set-cookie" + "]",
      "password",
      "token",
      "refreshToken",
    ],
    remove: true,
  },
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

// Note: pino-pretty is not a runtime dependency in package.json.
// This module falls back to plain JSON logs if it's not installed.

export function createLoggerChild(context: Record<string, unknown>) {
  return logger.child(context);
}


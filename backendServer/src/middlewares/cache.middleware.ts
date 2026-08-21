import { Request, Response, NextFunction } from "express";
import { redis } from "../utils/redis.js";

/**
 * Express Redis caching middleware for read-heavy GET routes.
 * @param ttlSeconds Cache expiration time in seconds (default: 60s)
 */
export const cacheMiddleware = (ttlSeconds = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redis.get(key);

      if (cachedResponse) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(cachedResponse);
        return;
      }

      // Override res.send to capture output and set in Redis
      const originalSend = res.send.bind(res);

      res.send = (body: any): Response => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const contentToCache = typeof body === "string" ? body : JSON.stringify(body);
          redis.setex(key, ttlSeconds, contentToCache).catch((err: any) => {
            console.error("Failed to write Redis cache:", err);
          });
        }
        res.setHeader("X-Cache", "MISS");
        return originalSend(body);
      };

      next();
    } catch (error: any) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

/**
 * Utility function to purge cache entries matching a prefix
 */
export const purgeCacheByPattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err: any) {
    console.error("Error purging Redis cache pattern:", err);
  }
};

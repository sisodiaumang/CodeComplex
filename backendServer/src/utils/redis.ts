import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
});

redis.on("connect", () => {
  console.log("Redis Client Connected for Caching");
});

redis.on("error", (err: any) => {
  console.error("Redis Cache Error:", err);
});

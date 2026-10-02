import IORedis from "ioredis";

/**
 * ⚡ TicketWar Redis Cache Layer (Powered by ioredis)
 *
 * Configured via REDIS_URL (e.g. redis://localhost:6379, Docker, or Redis Cloud).
 * Guarantees zero downtime:
 * - Fail-Open: If Redis is offline or REDIS_URL is not set, all operations
 *   silently return null/false, allowing the app to fallback to PostgreSQL.
 */

const redisUrl = process.env.REDIS_URL;

function createRedisClient(): IORedis | null {
  if (!redisUrl || !redisUrl.trim()) return null;

  try {
    const client = new IORedis(redisUrl.trim(), {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 3000,
      lazyConnect: false,
      retryStrategy(times) {
        // Retry at most 3 times, then stop to avoid log spam
        if (times > 3) return null;
        return Math.min(times * 500, 2000);
      },
    });

    client.on("error", (err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Redis warning]:", err.message);
      }
    });

    return client;
  } catch (err) {
    console.warn("[Redis initialization warning]:", err);
    return null;
  }
}

// Global Singleton to prevent multiple connections during Next.js Hot Reload
const globalForRedis = globalThis as unknown as {
  redisClient: IORedis | null | undefined;
};

export const redis =
  globalForRedis.redisClient !== undefined
    ? globalForRedis.redisClient
    : (globalForRedis.redisClient = createRedisClient());

// ----------------------------------------------------
// Default Cache TTLs (in Seconds)
// ----------------------------------------------------
export const CACHE_TTL = {
  ROOM_META: 300, // 5 minutes (invalidated on edit/status change)
  ROOM_MEMBERS: 600, // 10 minutes (invalidated on join/leave/kick/accept)
  DASHBOARD: 30, // 30 seconds (short-lived query cache)
} as const;

// ----------------------------------------------------
// Standardized Cache Key Generators
// ----------------------------------------------------
export function getRoomMetaKey(roomId: string): string {
  return `room:${roomId}:meta`;
}

export function getRoomMembersKey(roomId: string): string {
  return `room:${roomId}:members`;
}

export function getDashboardKey(params: {
  userId?: string | null;
  tab?: string;
  status?: string;
  dateFilter?: string;
  customDate?: string;
  page?: number;
  limit?: number;
  search?: string;
}): string {
  const parts = [
    params.userId || "anon",
    params.tab || "ALL",
    params.status || "ALL",
    params.dateFilter || "UPCOMING",
    params.customDate || "",
    params.page || 1,
    params.limit || 6,
    params.search ? encodeURIComponent(params.search) : "",
  ];
  return `dashboard:${parts.join(":")}`;
}

// ----------------------------------------------------
// Safe Fail-Open Wrapper Methods
// ----------------------------------------------------

/**
 * Retrieve cached data by key with automatic JSON parsing and Fail-Open fallback.
 * Returns null if cache miss, Redis is unconfigured, or an error occurs.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Redis Fail-Open] Failed to get key "${key}":`, error);
    }
    return null;
  }
}

/**
 * Store data in cache with TTL (seconds). Fails silently if Redis errors.
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number = CACHE_TTL.ROOM_META
): Promise<boolean> {
  if (!redis) return false;
  try {
    const payload = typeof value === "string" ? value : JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.set(key, payload, "EX", ttlSeconds);
    } else {
      await redis.set(key, payload);
    }
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Redis Fail-Open] Failed to set key "${key}":`, error);
    }
    return false;
  }
}

/**
 * Delete a single cache key immediately (Active Invalidation).
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Redis Fail-Open] Failed to delete key "${key}":`, error);
    }
    return false;
  }
}

/**
 * Delete multiple cache keys at once.
 */
export async function deleteCacheKeys(keys: string[]): Promise<boolean> {
  if (!redis || keys.length === 0) return false;
  try {
    await redis.del(...keys);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Redis Fail-Open] Failed to delete keys:`, error);
    }
    return false;
  }
}

/**
 * Delete dashboard caches for a specific user (or all dashboard caches if no userId provided).
 */
export async function deleteDashboardCache(userId?: string): Promise<boolean> {
  if (!redis) return false;
  try {
    const pattern = userId ? `dashboard:${userId}:*` : `dashboard:*`;
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Redis Fail-Open] Failed to delete dashboard keys:`, error);
    }
    return false;
  }
}


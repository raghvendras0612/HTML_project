import { NextResponse } from "next/server";

/**
 * IN-MEMORY SLIDING-WINDOW RATE LIMITER FOR GEMINI AI FEATURES
 *
 * NOTE FOR PRODUCTION:
 * In a multi-instance or serverless production deployment (e.g. Vercel Serverless Functions),
 * replace this in-memory Map with an atomic distributed store such as Upstash Redis
 * (@upstash/ratelimit) using Redis pipelines or Cloudflare Workers KV to ensure rate limits
 * persist across distributed compute nodes and edge regions.
 */

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store: key -> list of call timestamps
const rateLimitStore = new Map<string, RateLimitRecord>();

const ONE_HOUR_MS = 60 * 60 * 1000;

export const RATE_LIMITS = {
  authenticated: {
    limit: 20, // 20 AI calls per user per hour
    windowMs: ONE_HOUR_MS,
  },
  anonymous: {
    limit: 10, // 10 AI calls per IP per hour
    windowMs: ONE_HOUR_MS,
  },
};

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Check and record an AI request against rate limits.
 * @param identifier User ID (for authenticated) or IP address (for anonymous)
 * @param type "authenticated" or "anonymous"
 */
export function checkRateLimit(
  identifier: string,
  type: "authenticated" | "anonymous" = "authenticated"
): RateLimitResult {
  const now = Date.now();
  const config = RATE_LIMITS[type];
  const windowStart = now - config.windowMs;

  const key = `${type}:${identifier}`;
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= config.limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetInSeconds = Math.ceil((oldestTimestamp + config.windowMs - now) / 1000);

    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  // Allow call and record timestamp
  record.timestamps.push(now);
  const remaining = config.limit - record.timestamps.length;

  return {
    allowed: true,
    limit: config.limit,
    remaining,
    resetInSeconds: 3600,
  };
}

/**
 * Helper to extract client IP address from Next.js request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Return a typed 429 Too Many Requests response with friendly error message and headers
 */
export function createRateLimitResponse(resetInSeconds: number): NextResponse {
  return NextResponse.json(
    {
      error: "Rate limit exceeded. You have reached the maximum number of AI requests allowed per hour. Please wait before trying again.",
      retry_after_seconds: resetInSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": resetInSeconds.toString(),
        "X-RateLimit-Reset": resetInSeconds.toString(),
      },
    }
  );
}

// Optional helper for test harness to reset rate limits
export function resetRateLimits(): void {
  rateLimitStore.clear();
}

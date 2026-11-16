import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

// Fallback in-memory cache to guarantee zero downtime and instant test repeatability
const memoryCache = new Map<string, { result: unknown; created_at: string }>();

/**
 * Compute SHA-256 hash of key content for cache indexing.
 */
export function computeContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Retrieve cached AI result by content hash.
 * Checks Supabase `ai_cache` table first, falling back to in-memory cache.
 */
export async function getCachedAIResult<T = unknown>(contentHash: string): Promise<T | null> {
  // Check memory cache first
  const memoryHit = memoryCache.get(contentHash);
  if (memoryHit) {
    return memoryHit.result as T;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await (admin.from("ai_cache" as any) as any)
      .select("result")
      .eq("content_hash", contentHash)
      .maybeSingle();

    if (!error && data?.result) {
      // Warm memory cache
      memoryCache.set(contentHash, {
        result: data.result,
        created_at: new Date().toISOString(),
      });
      return data.result as T;
    }
  } catch {
    // If Supabase table does not exist or network error occurs, degrade gracefully
  }

  return null;
}

/**
 * Store AI result in both Supabase `ai_cache` and memory cache.
 */
export async function setCachedAIResult<T = unknown>(
  contentHash: string,
  result: T
): Promise<void> {
  // Store in memory cache
  memoryCache.set(contentHash, {
    result,
    created_at: new Date().toISOString(),
  });

  try {
    const admin = createAdminClient();
    await (admin.from("ai_cache" as any) as any).upsert(
      {
        content_hash: contentHash,
        result: result as unknown as Record<string, unknown>,
        created_at: new Date().toISOString(),
      },
      { onConflict: "content_hash" }
    );
  } catch {
    // Non-fatal if DB insert fails
  }
}

export function clearMemoryCache(): void {
  memoryCache.clear();
}

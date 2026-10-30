/**
 * Database-backed rate limiting (works across Vercel isolates).
 * Falls back to in-process limiting only when DATABASE_URL is missing (local tests).
 */

import { Pool } from "@neondatabase/serverless";

type Bucket = { count: number; resetAt: number };
const memoryBuckets = new Map<string, Bucket>();

function memoryRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const existing = memoryBuckets.get(params.key);
  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(params.key, {
      count: 1,
      resetAt: now + params.windowMs,
    });
    return { ok: true };
  }
  if (existing.count >= params.limit) {
    return { ok: false, retryAfterMs: existing.resetAt - now };
  }
  existing.count += 1;
  return { ok: true };
}

/** Progressive delay suggestion after failures (ms). */
export function progressiveDelayMs(failureCount: number): number {
  if (failureCount <= 2) return 0;
  if (failureCount <= 5) return 1000 * failureCount;
  return Math.min(60_000, 2000 * failureCount);
}

/**
 * Atomic rate limit using INSERT ... ON CONFLICT.
 * Window resets when window_start is older than windowMs.
 */
export async function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return memoryRateLimit(params);
  }

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      `SELECT hit_count, window_start, window_ms
       FROM rate_limit_buckets
       WHERE bucket_key = $1
       FOR UPDATE`,
      [params.key]
    );

    const now = Date.now();
    if (!existing.rows[0]) {
      await client.query(
        `INSERT INTO rate_limit_buckets (bucket_key, hit_count, window_start, window_ms)
         VALUES ($1, 1, NOW(), $2)
         ON CONFLICT (bucket_key) DO NOTHING`,
        [params.key, params.windowMs]
      );
      await client.query("COMMIT");
      return { ok: true };
    }

    const row = existing.rows[0];
    const windowStart = new Date(row.window_start).getTime();
    const windowMs = Number(row.window_ms) || params.windowMs;
    const elapsed = now - windowStart;

    if (elapsed >= windowMs) {
      await client.query(
        `UPDATE rate_limit_buckets
         SET hit_count = 1, window_start = NOW(), window_ms = $2
         WHERE bucket_key = $1`,
        [params.key, params.windowMs]
      );
      await client.query("COMMIT");
      return { ok: true };
    }

    const hitCount = Number(row.hit_count);
    if (hitCount >= params.limit) {
      await client.query("COMMIT");
      return { ok: false, retryAfterMs: windowMs - elapsed };
    }

    await client.query(
      `UPDATE rate_limit_buckets SET hit_count = hit_count + 1 WHERE bucket_key = $1`,
      [params.key]
    );
    await client.query("COMMIT");
    return { ok: true };
  } catch {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    // Fail closed for security-sensitive endpoints would block users if table missing;
    // fail open to memory only for availability, still limits per instance.
    return memoryRateLimit(params);
  } finally {
    client.release();
    await pool.end();
  }
}

/** Sync helper for pure unit tests (memory only). */
export function rateLimitMemoryForTests(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterMs: number } {
  return memoryRateLimit(params);
}

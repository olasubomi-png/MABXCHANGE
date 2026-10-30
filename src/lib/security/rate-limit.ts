/**
 * Database-backed rate limiting (works across Vercel isolates).
 * On DB failure: fail closed (deny) for production safety.
 * Memory path is only for unit tests / local without DATABASE_URL.
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
 * Atomic rate limit.
 * First-request race: INSERT ... ON CONFLICT then re-read under the same transaction.
 * Never returns ok:true on database errors when DATABASE_URL is set.
 */
export async function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Local/unit only — production always has DATABASE_URL on Vercel
    return memoryRateLimit(params);
  }

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Serialize concurrent first inserts on the same key
    await client.query(
      `INSERT INTO rate_limit_buckets (bucket_key, hit_count, window_start, window_ms)
       VALUES ($1, 0, NOW(), $2)
       ON CONFLICT (bucket_key) DO NOTHING`,
      [params.key, params.windowMs]
    );

    const locked = await client.query(
      `SELECT hit_count, window_start, window_ms
       FROM rate_limit_buckets
       WHERE bucket_key = $1
       FOR UPDATE`,
      [params.key]
    );

    if (!locked.rows[0]) {
      await client.query("ROLLBACK");
      // Table missing or unexpected — fail closed
      return { ok: false, retryAfterMs: params.windowMs };
    }

    const row = locked.rows[0];
    const windowStart = new Date(row.window_start).getTime();
    const windowMs = Number(row.window_ms) || params.windowMs;
    const now = Date.now();
    const elapsed = now - windowStart;

    let hitCount = Number(row.hit_count);

    if (elapsed >= windowMs) {
      hitCount = 0;
      await client.query(
        `UPDATE rate_limit_buckets
         SET hit_count = 0, window_start = NOW(), window_ms = $2
         WHERE bucket_key = $1`,
        [params.key, params.windowMs]
      );
    }

    if (hitCount >= params.limit) {
      await client.query("COMMIT");
      return {
        ok: false,
        retryAfterMs: Math.max(0, windowMs - (elapsed >= windowMs ? 0 : elapsed)),
      };
    }

    await client.query(
      `UPDATE rate_limit_buckets
       SET hit_count = hit_count + 1
       WHERE bucket_key = $1`,
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
    // Fail closed: do not silently allow unlimited requests on DB errors
    return { ok: false, retryAfterMs: params.windowMs };
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

/**
 * In-memory rate limiter (per serverless instance).
 * Document limitation: not global across all Vercel isolates.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(params.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(params.key, { count: 1, resetAt: now + params.windowMs });
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

import { Pool } from "@neondatabase/serverless";
import { hashValue } from "./crypto";

function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return new Pool({ connectionString: url });
}

export async function logSecurityEvent(params: {
  userId?: string | null;
  eventType: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const p = pool();
  const client = await p.connect();
  try {
    await client.query(
      `INSERT INTO security_events (user_id, event_type, ip_hash, user_agent, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
      [
        params.userId ?? null,
        params.eventType,
        params.ip ? hashValue(params.ip) : null,
        params.userAgent?.slice(0, 512) ?? null,
        JSON.stringify(params.metadata ?? {}),
      ]
    );
  } catch {
    // Table may not exist yet — fail soft for logging only
  } finally {
    client.release();
    await p.end();
  }
}

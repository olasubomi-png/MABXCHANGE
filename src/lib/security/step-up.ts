import { Pool } from "@neondatabase/serverless";
import { hashValue, randomToken } from "./crypto";

function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return new Pool({ connectionString: url });
}

export const SENSITIVE_PURPOSES = [
  "withdraw",
  "change_email",
  "change_password",
  "disable_2fa",
  "remove_passkey",
  "revoke_all_devices",
  "security_settings",
] as const;

export type SensitivePurpose = (typeof SENSITIVE_PURPOSES)[number];

export function isSensitivePurpose(v: string): v is SensitivePurpose {
  return (SENSITIVE_PURPOSES as readonly string[]).includes(v);
}

/** Issue a short-lived step-up token after passkey/TOTP verification. */
export async function issueStepUpToken(params: {
  userId: string;
  purpose: string;
  ttlSeconds?: number;
}): Promise<string> {
  if (!isSensitivePurpose(params.purpose) && params.purpose !== "security_settings") {
    // still allow known purposes only
    if (!(SENSITIVE_PURPOSES as readonly string[]).includes(params.purpose)) {
      throw new Error("Invalid step-up purpose");
    }
  }
  const token = randomToken(32);
  const tokenHash = hashValue(token);
  const ttl = Math.min(Math.max(params.ttlSeconds ?? 300, 30), 600);
  const p = pool();
  const client = await p.connect();
  try {
    await client.query(
      `INSERT INTO step_up_tokens (user_id, token_hash, purpose, expires_at)
       VALUES ($1, $2, $3, NOW() + ($4 || ' seconds')::interval)`,
      [params.userId, tokenHash, params.purpose, String(ttl)]
    );
  } finally {
    client.release();
    await p.end();
  }
  return token;
}

/**
 * Atomically consume a step-up token bound to user + exact purpose.
 * Expired or wrong-purpose tokens fail.
 */
export async function consumeStepUpToken(params: {
  userId: string;
  token: string;
  purpose: string;
}): Promise<boolean> {
  if (!params.token || params.token.length < 16) return false;
  const tokenHash = hashValue(params.token);
  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `UPDATE step_up_tokens
       SET consumed_at = NOW()
       WHERE user_id = $1
         AND token_hash = $2
         AND purpose = $3
         AND consumed_at IS NULL
         AND expires_at > NOW()
       RETURNING id`,
      [params.userId, tokenHash, params.purpose]
    );
    return Boolean(res.rows[0]);
  } finally {
    client.release();
    await p.end();
  }
}

/** Pure checks for unit tests (no DB). */
export function isStepUpTokenFormatValid(token: string): boolean {
  return typeof token === "string" && token.length >= 32;
}

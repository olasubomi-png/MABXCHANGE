import * as OTPAuth from "otpauth";
import { Pool } from "@neondatabase/serverless";
import {
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "./crypto";

function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return new Pool({ connectionString: url });
}

/** Unix time-step for 30s TOTP (RFC 6238). */
export function totpTimeStep(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 1000 / 30);
}

/**
 * Atomically record a used time-step. Returns false if already used (replay).
 */
export async function claimTotpTimeStep(
  userId: string,
  timeStep: number
): Promise<boolean> {
  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `INSERT INTO totp_used_steps (user_id, time_step, used_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, time_step) DO NOTHING
       RETURNING time_step`,
      [userId, timeStep]
    );
    if (!res.rows[0]) return false;
    try {
      await client.query(
        `UPDATE totp_secrets SET last_used_step = $2, updated_at = NOW()
         WHERE user_id = $1`,
        [userId, timeStep]
      );
    } catch {
      /* column may not exist yet */
    }
    return true;
  } finally {
    client.release();
    await p.end();
  }
}

export async function beginTotpSetup(userId: string, accountName: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "MABXCHANGE",
    label: accountName,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  const encrypted = encryptSecret(secret.base32);
  const p = pool();
  const client = await p.connect();
  try {
    await client.query(
      `INSERT INTO totp_secrets (user_id, encrypted_secret, enabled, created_at, updated_at)
       VALUES ($1, $2, FALSE, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET encrypted_secret = EXCLUDED.encrypted_secret,
             enabled = FALSE,
             verified_at = NULL,
             updated_at = NOW()`,
      [userId, encrypted]
    );
  } finally {
    client.release();
    await p.end();
  }

  return {
    otpauthUrl: totp.toString(),
    secret: secret.base32,
  };
}

export async function verifyAndEnableTotp(userId: string, code: string) {
  if (!/^\d{6}$/.test(code)) {
    return { ok: false as const, message: "Enter a 6-digit code" };
  }

  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `SELECT encrypted_secret, enabled FROM totp_secrets WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    const row = res.rows[0];
    if (!row) return { ok: false as const, message: "Authenticator setup not started" };

    const secret = decryptSecret(String(row.encrypted_secret));
    const totp = new OTPAuth.TOTP({
      issuer: "MABXCHANGE",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      return { ok: false as const, message: "Invalid authenticator code" };
    }

    const step = totpTimeStep() + delta;
    // claim outside this connection to avoid nested pool issues — use same client
    const claim = await client.query(
      `INSERT INTO totp_used_steps (user_id, time_step, used_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, time_step) DO NOTHING
       RETURNING time_step`,
      [userId, step]
    );
    if (!claim.rows[0]) {
      return { ok: false as const, message: "Code already used" };
    }

    await client.query(
      `UPDATE totp_secrets SET enabled = TRUE, verified_at = NOW(), updated_at = NOW() WHERE user_id = $1`,
      [userId]
    );

    await client.query(`DELETE FROM recovery_codes WHERE user_id = $1`, [userId]);
    const codes = generateRecoveryCodes(10);
    for (const c of codes) {
      await client.query(
        `INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1, $2)`,
        [userId, hashRecoveryCode(c)]
      );
    }

    return { ok: true as const, recoveryCodes: codes };
  } finally {
    client.release();
    await p.end();
  }
}

export async function verifyTotpCode(userId: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false;

  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `SELECT encrypted_secret, enabled FROM totp_secrets WHERE user_id = $1 AND enabled = TRUE LIMIT 1`,
      [userId]
    );
    const row = res.rows[0];
    if (!row) return false;
    const secret = decryptSecret(String(row.encrypted_secret));
    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) return false;

    const step = totpTimeStep() + delta;
    const claim = await client.query(
      `INSERT INTO totp_used_steps (user_id, time_step, used_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, time_step) DO NOTHING
       RETURNING time_step`,
      [userId, step]
    );
    return Boolean(claim.rows[0]);
  } finally {
    client.release();
    await p.end();
  }
}

export async function verifyRecoveryCode(userId: string, code: string) {
  const hash = hashRecoveryCode(code);
  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `UPDATE recovery_codes
       SET used_at = NOW()
       WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL
       RETURNING id`,
      [userId, hash]
    );
    return Boolean(res.rows[0]);
  } finally {
    client.release();
    await p.end();
  }
}

export async function getTotpStatus(userId: string) {
  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `SELECT enabled, verified_at FROM totp_secrets WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    const row = res.rows[0];
    const codes = await client.query(
      `SELECT COUNT(*)::int AS n FROM recovery_codes WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );
    return {
      enabled: Boolean(row?.enabled),
      verifiedAt: row?.verified_at ?? null,
      unusedRecoveryCodes: Number(codes.rows[0]?.n ?? 0),
    };
  } finally {
    client.release();
    await p.end();
  }
}

export async function disableTotp(userId: string) {
  const p = pool();
  const client = await p.connect();
  try {
    await client.query(`DELETE FROM totp_secrets WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM recovery_codes WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM totp_used_steps WHERE user_id = $1`, [userId]);
  } finally {
    client.release();
    await p.end();
  }
}

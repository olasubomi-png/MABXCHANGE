import { createHash } from "crypto";
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

/** In-process replay prevention for accepted TOTP codes (per instance). */
const usedCodes = new Map<string, number>();

function markCodeUsed(userId: string, code: string) {
  const key = `${userId}:${code}`;
  usedCodes.set(key, Date.now() + 90_000);
  // prune
  const now = Date.now();
  for (const [k, exp] of usedCodes) {
    if (exp < now) usedCodes.delete(k);
  }
}

function wasCodeUsed(userId: string, code: string): boolean {
  const exp = usedCodes.get(`${userId}:${code}`);
  return Boolean(exp && exp > Date.now());
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
  if (wasCodeUsed(userId, code)) {
    return { ok: false as const, message: "Code already used" };
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

    markCodeUsed(userId, code);
    await client.query(
      `UPDATE totp_secrets SET enabled = TRUE, verified_at = NOW(), updated_at = NOW() WHERE user_id = $1`,
      [userId]
    );

    // Replace recovery codes
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
  if (wasCodeUsed(userId, code)) return false;

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
    markCodeUsed(userId, code);
    return true;
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
  } finally {
    client.release();
    await p.end();
  }
}

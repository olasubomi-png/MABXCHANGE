import { Pool } from "@neondatabase/serverless";
import { hashValue } from "./crypto";

function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return new Pool({ connectionString: url });
}

function fingerprint(userAgent: string, ip?: string | null): string {
  return hashValue(`${userAgent || "unknown"}|${ip || ""}`);
}

function labelFromUa(ua: string): string {
  if (/iPhone|iPad/i.test(ua)) return "iOS device";
  if (/Android/i.test(ua)) return "Android device";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Browser";
}

export async function touchDevice(params: {
  userId: string;
  userAgent?: string | null;
  ip?: string | null;
  approxLocation?: string | null;
}): Promise<{ isNew: boolean }> {
  const ua = params.userAgent || "unknown";
  const fp = fingerprint(ua, params.ip);
  const p = pool();
  const client = await p.connect();
  try {
    const existing = await client.query(
      `SELECT id, revoked_at FROM auth_devices WHERE user_id = $1 AND device_fingerprint = $2 LIMIT 1`,
      [params.userId, fp]
    );
    if (existing.rows[0]) {
      if (existing.rows[0].revoked_at) {
        return { isNew: true };
      }
      await client.query(
        `UPDATE auth_devices SET last_seen_at = NOW(), user_agent = $1 WHERE id = $2`,
        [ua.slice(0, 512), existing.rows[0].id]
      );
      return { isNew: false };
    }
    await client.query(
      `INSERT INTO auth_devices (
         user_id, device_fingerprint, user_agent, device_label, approx_location, trusted, first_seen_at, last_seen_at
       ) VALUES ($1, $2, $3, $4, $5, FALSE, NOW(), NOW())`,
      [
        params.userId,
        fp,
        ua.slice(0, 512),
        labelFromUa(ua),
        params.approxLocation ?? null,
      ]
    );
    return { isNew: true };
  } catch {
    return { isNew: false };
  } finally {
    client.release();
    await p.end();
  }
}

export async function listDevices(userId: string) {
  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `SELECT id, device_label, user_agent, approx_location, trusted, first_seen_at, last_seen_at, revoked_at
       FROM auth_devices WHERE user_id = $1 ORDER BY last_seen_at DESC LIMIT 50`,
      [userId]
    );
    return res.rows.map((r) => ({
      id: String(r.id),
      label: String(r.device_label || "Device"),
      userAgent: r.user_agent ? String(r.user_agent) : null,
      approxLocation: r.approx_location ? String(r.approx_location) : null,
      trusted: Boolean(r.trusted),
      firstSeenAt: r.first_seen_at,
      lastSeenAt: r.last_seen_at,
      revoked: Boolean(r.revoked_at),
    }));
  } finally {
    client.release();
    await p.end();
  }
}

export async function revokeDevice(userId: string, deviceId: string) {
  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `UPDATE auth_devices SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id`,
      [deviceId, userId]
    );
    return Boolean(res.rows[0]);
  } finally {
    client.release();
    await p.end();
  }
}

export async function revokeAllDevices(userId: string) {
  const p = pool();
  const client = await p.connect();
  try {
    await client.query(
      `UPDATE auth_devices SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  } finally {
    client.release();
    await p.end();
  }
}

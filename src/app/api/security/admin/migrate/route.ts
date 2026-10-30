import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { timingSafeEqual } from "crypto";
import { SECURITY_MIGRATION_002_SQL } from "@/lib/security/migration-002-sql";
import { SECURITY_MIGRATION_003_SQL } from "@/lib/security/migration-003-sql";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * POST /api/security/admin/migrate
 * Header: x-migration-secret: $SECURITY_MIGRATION_SECRET
 *
 * Applies migrations/002_account_security.sql idempotently against DATABASE_URL.
 * Does not modify ledger or balance tables.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.SECURITY_MIGRATION_SECRET;
  if (!expected || expected.length < 16) {
    return NextResponse.json(
      { error: "Migration endpoint is not configured" },
      { status: 503 }
    );
  }

  const provided =
    req.headers.get("x-migration-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (!provided || !secretsMatch(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  const sqlText = `${SECURITY_MIGRATION_002_SQL}\n${SECURITY_MIGRATION_003_SQL}`;

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  const created: string[] = [];

  try {
    await client.query("BEGIN");
    // Split statements — Neon serverless often rejects multi-statement queries
    const statements = sqlText
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));
    for (const statement of statements) {
      await client.query(statement);
    }
    await client.query("COMMIT");

    // Verify tables exist
    const check = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])
       ORDER BY table_name`,
      [
        [
          "webauthn_credentials",
          "totp_secrets",
          "recovery_codes",
          "auth_devices",
          "security_events",
          "login_attempts",
          "webauthn_challenges",
          "step_up_tokens",
          "rate_limit_buckets",
          "totp_used_steps",
        ],
      ]
    );
    for (const row of check.rows) {
      created.push(String(row.table_name));
    }

    return NextResponse.json({
      ok: true,
      migration: "002_account_security.sql + 003_security_hardening.sql",
      tablesPresent: created,
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    console.error("[security-migrate]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Migration failed. Check server logs." },
      { status: 500 }
    );
  } finally {
    client.release();
    await pool.end();
  }
}

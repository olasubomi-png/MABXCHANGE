import { neon } from "@neondatabase/serverless";

/**
 * Server-only Neon Postgres client.
 * Never import this file from Client Components.
 *
 * Uses the existing DATABASE_URL environment variable (already set in Vercel).
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(url);
}

/**
 * Fetch the application user row linked to a Neon Auth user id.
 * Authorization is always performed with the session user id from the server.
 */
export async function getAppUserByAuthId(authUserId: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      auth_user_id,
      email,
      display_name,
      created_at,
      updated_at
    FROM app_users
    WHERE auth_user_id = ${authUserId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Ensure an app_users row exists for the authenticated user.
 * Safe to call on every session load; uses ON CONFLICT DO NOTHING style logic.
 */
export async function ensureAppUser(params: {
  authUserId: string;
  email: string;
  displayName?: string | null;
}) {
  const sql = getDb();
  const existing = await getAppUserByAuthId(params.authUserId);
  if (existing) return existing;

  const rows = await sql`
    INSERT INTO app_users (auth_user_id, email, display_name)
    VALUES (
      ${params.authUserId},
      ${params.email},
      ${params.displayName ?? null}
    )
    ON CONFLICT (auth_user_id) DO UPDATE
      SET email = EXCLUDED.email,
          display_name = COALESCE(EXCLUDED.display_name, app_users.display_name),
          updated_at = NOW()
    RETURNING
      id,
      auth_user_id,
      email,
      display_name,
      created_at,
      updated_at
  `;
  return rows[0] ?? null;
}

/**
 * Fetch the customer's primary account (sandbox).
 * Always filtered by the authenticated app user id.
 */
export async function getCustomerAccountForUser(appUserId: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      user_id,
      status,
      currency,
      created_at
    FROM customer_accounts
    WHERE user_id = ${appUserId}
    ORDER BY created_at ASC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

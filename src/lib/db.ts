import { neon } from "@neondatabase/serverless";

/**
 * Server-only Neon Postgres client.
 * Never import this file from Client Components.
 * Uses DATABASE_URL (configured in Vercel; never commit the value).
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(url);
}

export type AppUserRow = {
  id: string | number;
  auth_user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | Date | null;
  updated_at?: string | Date | null;
};

export type CustomerAccountRow = {
  id: string | number;
  user_id: string | number;
  status: string | null;
  currency: string | null;
  created_at: string | Date | null;
};

/**
 * Fetch the application user row linked to a Neon Auth user id.
 * Authorization is always performed with the session user id from the server.
 */
export async function getAppUserByAuthId(
  authUserId: string
): Promise<AppUserRow | null> {
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
  return (rows[0] as AppUserRow) ?? null;
}

/**
 * Ensure an app_users row exists for the authenticated user.
 * Safe on every sign-in (Google or email). Idempotent via unique auth_user_id.
 * Never accepts a client-supplied user id for authorization.
 */
export async function ensureAppUser(params: {
  authUserId: string;
  email: string;
  displayName?: string | null;
}): Promise<AppUserRow> {
  if (!params.authUserId) {
    throw new Error("authUserId is required for account provisioning");
  }

  const existing = await getAppUserByAuthId(params.authUserId);
  if (existing) {
    // Soft-update email/name on repeat sign-in when present
    if (
      (params.email && params.email !== existing.email) ||
      (params.displayName && params.displayName !== existing.display_name)
    ) {
      const sql = getDb();
      const updated = await sql`
        UPDATE app_users
        SET
          email = COALESCE(${params.email || null}, email),
          display_name = COALESCE(${params.displayName ?? null}, display_name),
          updated_at = NOW()
        WHERE auth_user_id = ${params.authUserId}
        RETURNING
          id,
          auth_user_id,
          email,
          display_name,
          created_at,
          updated_at
      `;
      return (updated[0] as AppUserRow) ?? existing;
    }
    return existing;
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO app_users (auth_user_id, email, display_name)
    VALUES (
      ${params.authUserId},
      ${params.email},
      ${params.displayName ?? null}
    )
    ON CONFLICT (auth_user_id) DO UPDATE
      SET
        email = COALESCE(EXCLUDED.email, app_users.email),
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

  const row = rows[0] as AppUserRow | undefined;
  if (!row) {
    throw new Error("Failed to provision app_users record");
  }
  return row;
}

/**
 * Fetch the customer's primary sandbox account.
 * Always filtered by the authenticated app user id (never client-supplied alone).
 */
export async function getCustomerAccountForUser(
  appUserId: string | number
): Promise<CustomerAccountRow | null> {
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
  return (rows[0] as CustomerAccountRow) ?? null;
}

/**
 * Ensure a sandbox customer_accounts row exists for the app user.
 * Idempotent. If the table shape differs, returns null without throwing
 * so the UI can show a safe empty/fallback state.
 */
export async function ensureSandboxAccount(
  appUserId: string | number
): Promise<CustomerAccountRow | null> {
  const existing = await getCustomerAccountForUser(appUserId);
  if (existing) return existing;

  try {
    const sql = getDb();
    // Minimal insert compatible with a typical sandbox schema.
    // status defaults to sandbox; currency to NGN for the primary market.
    const rows = await sql`
      INSERT INTO customer_accounts (user_id, status, currency)
      VALUES (${appUserId}, 'sandbox', 'NGN')
      ON CONFLICT DO NOTHING
      RETURNING id, user_id, status, currency, created_at
    `;
    if (rows[0]) return rows[0] as CustomerAccountRow;

    // Some schemas use a unique(user_id) without ON CONFLICT target —
    // re-read in case another request created the row.
    return await getCustomerAccountForUser(appUserId);
  } catch {
    // Schema may not support this insert shape yet; do not invent success.
    return null;
  }
}

/**
 * Full provisioning pipeline for an authenticated session.
 * Links Neon Auth user → app_users → optional sandbox customer_accounts.
 * All authorization is based on session.user.id from the server.
 */
export async function provisionAuthenticatedUser(sessionUser: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Promise<{
  appUser: AppUserRow;
  account: CustomerAccountRow | null;
  dbError: string | null;
}> {
  try {
    const appUser = await ensureAppUser({
      authUserId: sessionUser.id,
      email: sessionUser.email ?? "",
      displayName: sessionUser.name ?? null,
    });

    let account: CustomerAccountRow | null = null;
    try {
      account = await ensureSandboxAccount(appUser.id);
    } catch {
      account = null;
    }

    return { appUser, account, dbError: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Database unavailable";
    return {
      appUser: {
        id: "",
        auth_user_id: sessionUser.id,
        email: sessionUser.email ?? null,
        display_name: sessionUser.name ?? null,
        created_at: null,
      },
      account: null,
      dbError: message,
    };
  }
}

/** Initials helper (first letters of up to two name parts). */
export function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Format a date for profile display. */
export function formatAccountDate(
  value: string | Date | null | undefined
): string {
  if (!value) return "—";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

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

/**
 * Matches the real Neon `customer_accounts` table:
 * id, user_id, asset_id, bucket (available|locked), balance, created_at, updated_at
 * There is no status or currency column on this table.
 */
export type CustomerAccountRow = {
  id: string | number;
  user_id: string | number;
  asset_id: string | number;
  bucket: "available" | "locked" | string;
  balance: string | number;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

export type CustomerAccountsSummary = {
  /** All balance rows for the user (may be empty). */
  accounts: CustomerAccountRow[];
  /** True when at least one balance row exists. */
  hasBalances: boolean;
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
 * List all customer_accounts balance rows for an app user.
 * Always filtered by the authenticated app user id (never client-supplied alone).
 * Does not invent rows. Throws on query failure so callers can surface errors.
 */
export async function getCustomerAccountsForUser(
  appUserId: string | number
): Promise<CustomerAccountRow[]> {
  if (appUserId === "" || appUserId === null || appUserId === undefined) {
    throw new Error("appUserId is required");
  }

  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      user_id,
      asset_id,
      bucket,
      balance,
      created_at,
      updated_at
    FROM customer_accounts
    WHERE user_id = ${appUserId}
    ORDER BY asset_id ASC, bucket ASC, created_at ASC
  `;
  return rows as CustomerAccountRow[];
}

/**
 * First balance row for the user, if any.
 * Prefer getCustomerAccountsForUser for full state.
 */
export async function getCustomerAccountForUser(
  appUserId: string | number
): Promise<CustomerAccountRow | null> {
  const accounts = await getCustomerAccountsForUser(appUserId);
  return accounts[0] ?? null;
}

/**
 * Look up existing sandbox/balance rows for the app user.
 *
 * Does NOT insert into customer_accounts. Balance rows require a valid seeded
 * asset_id and a deliberate, validated provisioning operation. Auto-inserting
 * with invented status/currency columns is invalid for the real schema.
 *
 * Returns a summary. Throws if the lookup fails so provisioning can report
 * the error instead of pretending success.
 */
export async function ensureSandboxAccount(
  appUserId: string | number
): Promise<CustomerAccountsSummary> {
  const accounts = await getCustomerAccountsForUser(appUserId);
  return {
    accounts,
    hasBalances: accounts.length > 0,
  };
}

/**
 * Full provisioning pipeline for an authenticated session.
 * Links Neon Auth user → app_users → lookup of customer_accounts (read-only).
 * All authorization is based on session.user.id from the server.
 */
export async function provisionAuthenticatedUser(sessionUser: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Promise<{
  appUser: AppUserRow;
  /** First balance row if any (legacy single-account consumers). */
  account: CustomerAccountRow | null;
  accounts: CustomerAccountRow[];
  hasBalances: boolean;
  dbError: string | null;
}> {
  try {
    const appUser = await ensureAppUser({
      authUserId: sessionUser.id,
      email: sessionUser.email ?? "",
      displayName: sessionUser.name ?? null,
    });

    try {
      const summary = await ensureSandboxAccount(appUser.id);
      return {
        appUser,
        account: summary.accounts[0] ?? null,
        accounts: summary.accounts,
        hasBalances: summary.hasBalances,
        dbError: null,
      };
    } catch (accountErr) {
      const message =
        accountErr instanceof Error
          ? accountErr.message
          : "Failed to load customer accounts";
      // App user was provisioned; account lookup failed — report accurately.
      return {
        appUser,
        account: null,
        accounts: [],
        hasBalances: false,
        dbError: message,
      };
    }
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
      accounts: [],
      hasBalances: false,
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

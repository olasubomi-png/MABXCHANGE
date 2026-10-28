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

/**
 * Neon Managed Auth provider key stored in app_users.auth_provider.
 * Must stay stable across deploys so (auth_provider, auth_subject) remains unique.
 */
export const AUTH_PROVIDER_NEON = "neon" as const;

export type AppUserStatus = "pending" | "active" | "restricted" | "closed";

/**
 * Matches production Neon `app_users`:
 * id UUID, auth_provider, auth_subject, email, status, created_at, updated_at
 * Unique (auth_provider, auth_subject). No auth_user_id or display_name columns.
 */
export type AppUserRow = {
  id: string;
  auth_provider: string;
  auth_subject: string;
  email: string | null;
  status: AppUserStatus | string;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

/**
 * Matches production Neon `customer_accounts`:
 * id, user_id → app_users.id, asset_id, bucket, balance, created_at, updated_at
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
  accounts: CustomerAccountRow[];
  hasBalances: boolean;
};

/**
 * Fetch app_users by Neon Auth session subject (session.user.id).
 */
export async function getAppUserByAuthSubject(
  authSubject: string,
  authProvider: string = AUTH_PROVIDER_NEON
): Promise<AppUserRow | null> {
  if (!authSubject) {
    throw new Error("authSubject is required");
  }
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      auth_provider,
      auth_subject,
      email,
      status,
      created_at,
      updated_at
    FROM app_users
    WHERE auth_provider = ${authProvider}
      AND auth_subject = ${authSubject}
    LIMIT 1
  `;
  return (rows[0] as AppUserRow) ?? null;
}

/** @deprecated Use getAppUserByAuthSubject — kept for call-site migration */
export async function getAppUserByAuthId(
  authUserId: string
): Promise<AppUserRow | null> {
  return getAppUserByAuthSubject(authUserId, AUTH_PROVIDER_NEON);
}

/**
 * Ensure an app_users row exists for the authenticated Neon Auth user.
 * Idempotent via UNIQUE (auth_provider, auth_subject).
 * Never accepts a client-supplied user id for authorization.
 */
export async function ensureAppUser(params: {
  /** Neon Auth session.user.id → stored as auth_subject */
  authSubject: string;
  email?: string | null;
  authProvider?: string;
  /** Initial status for new rows only */
  status?: AppUserStatus;
}): Promise<AppUserRow> {
  const authSubject = params.authSubject;
  if (!authSubject) {
    throw new Error("authSubject is required for account provisioning");
  }
  const authProvider = params.authProvider ?? AUTH_PROVIDER_NEON;
  const email = params.email?.trim() ? params.email.trim() : null;
  const initialStatus: AppUserStatus = params.status ?? "active";

  const existing = await getAppUserByAuthSubject(authSubject, authProvider);
  if (existing) {
    if (email && email !== existing.email) {
      const sql = getDb();
      const updated = await sql`
        UPDATE app_users
        SET
          email = ${email},
          updated_at = NOW()
        WHERE auth_provider = ${authProvider}
          AND auth_subject = ${authSubject}
        RETURNING
          id,
          auth_provider,
          auth_subject,
          email,
          status,
          created_at,
          updated_at
      `;
      return (updated[0] as AppUserRow) ?? existing;
    }
    return existing;
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO app_users (auth_provider, auth_subject, email, status)
    VALUES (
      ${authProvider},
      ${authSubject},
      ${email},
      ${initialStatus}
    )
    ON CONFLICT (auth_provider, auth_subject) DO UPDATE
      SET
        email = COALESCE(EXCLUDED.email, app_users.email),
        updated_at = NOW()
    RETURNING
      id,
      auth_provider,
      auth_subject,
      email,
      status,
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
 * List customer_accounts for an app_users.id (UUID).
 * Throws on query failure. Does not invent rows.
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

export async function getCustomerAccountForUser(
  appUserId: string | number
): Promise<CustomerAccountRow | null> {
  const accounts = await getCustomerAccountsForUser(appUserId);
  return accounts[0] ?? null;
}

/**
 * Read-only lookup of balance rows. Does not INSERT into customer_accounts.
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
 * Provision app_users from server session, then read customer_accounts.
 * sessionUser.id → auth_subject. Never trusts client-supplied ids.
 */
export async function provisionAuthenticatedUser(sessionUser: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Promise<{
  appUser: AppUserRow;
  account: CustomerAccountRow | null;
  accounts: CustomerAccountRow[];
  hasBalances: boolean;
  dbError: string | null;
}> {
  try {
    const appUser = await ensureAppUser({
      authSubject: sessionUser.id,
      email: sessionUser.email ?? null,
      authProvider: AUTH_PROVIDER_NEON,
      status: "active",
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
        auth_provider: AUTH_PROVIDER_NEON,
        auth_subject: sessionUser.id,
        email: sessionUser.email ?? null,
        status: "pending",
        created_at: null,
        updated_at: null,
      },
      account: null,
      accounts: [],
      hasBalances: false,
      dbError: message,
    };
  }
}

export function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

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

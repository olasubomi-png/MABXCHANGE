/**
 * Server-only double-entry ledger service.
 * Uses Neon transactions. Never import from Client Components.
 */

import { Pool, type PoolClient } from "@neondatabase/serverless";
import {
  isBalancedPosting,
  isValidIdempotencyKey,
  type LedgerEntryInput,
} from "@/lib/ledger-safety";
import { simulatePosting, type AccountBalanceState } from "./balances";
import type { LedgerEntryDraft, PostingRequest, PostingResult } from "./types";

let pool: Pool | null = null;

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

function toEntryInputs(entries: LedgerEntryDraft[]): LedgerEntryInput[] {
  return entries.map((e) => ({
    accountId: e.accountId,
    assetId: e.assetId,
    side: e.side,
    amount: e.amount,
  }));
}

async function loadAccountsForUpdate(
  client: PoolClient,
  accountIds: string[],
  userId: string
): Promise<Map<string, AccountBalanceState>> {
  const map = new Map<string, AccountBalanceState>();
  if (accountIds.length === 0) return map;

  // Lock rows for concurrent safety
  const result = await client.query(
    `SELECT id, user_id, asset_id, bucket, balance
     FROM customer_accounts
     WHERE id = ANY($1::uuid[])
     FOR UPDATE`,
    [accountIds]
  );

  for (const row of result.rows) {
    if (String(row.user_id) !== String(userId)) {
      throw new Error("UNAUTHORIZED_ACCOUNT");
    }
    map.set(String(row.id), {
      accountId: String(row.id),
      userId: String(row.user_id),
      assetId: String(row.asset_id),
      bucket: String(row.bucket),
      balance: Number(row.balance),
    });
  }
  return map;
}

async function writeAudit(
  client: PoolClient,
  userId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await client.query(
      `INSERT INTO audit_events (user_id, event_type, payload, created_at)
       VALUES ($1, $2, $3::jsonb, NOW())`,
      [userId, eventType, JSON.stringify(payload)]
    );
  } catch {
    // audit_events shape may differ; try minimal columns
    try {
      await client.query(
        `INSERT INTO audit_events (user_id, event_type, payload)
         VALUES ($1, $2, $3::jsonb)`,
        [userId, eventType, JSON.stringify(payload)]
      );
    } catch (err) {
      // Do not swallow silently in transaction — rethrow
      throw err;
    }
  }
}

/**
 * Atomically post a balanced double-entry transaction.
 * - Validates balance and ownership
 * - Idempotent on idempotency_key
 * - Rolls back on any failure
 */
export async function postLedgerTransaction(
  req: PostingRequest
): Promise<PostingResult> {
  if (!isValidIdempotencyKey(req.idempotencyKey)) {
    return { ok: false, code: "INVALID", message: "Invalid idempotency key" };
  }
  if (!req.userId) {
    return { ok: false, code: "UNAUTHORIZED", message: "User required" };
  }

  const mode = req.balanceMode ?? "strict";
  const entryInputs = toEntryInputs(req.entries);
  if (mode === "strict" && !isBalancedPosting(entryInputs)) {
    return {
      ok: false,
      code: "INVALID",
      message: "Posting is not balanced per asset",
    };
  }
  if (mode === "trade" && req.entries.length < 2) {
    return {
      ok: false,
      code: "INVALID",
      message: "Trade posting requires at least two legs",
    };
  }

  const accountIds = [...new Set(req.entries.map((e) => e.accountId))];
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    // Idempotency: existing transaction?
    const existing = await client.query(
      `SELECT id FROM ledger_transactions WHERE idempotency_key = $1 LIMIT 1`,
      [req.idempotencyKey]
    );
    if (existing.rows[0]) {
      await client.query("COMMIT");
      return {
        ok: true,
        transactionId: String(existing.rows[0].id),
        duplicate: true,
      };
    }

    const accounts = await loadAccountsForUpdate(
      client,
      accountIds,
      req.userId
    );

    if (accounts.size !== accountIds.length) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "One or more accounts not found or not owned by user",
      };
    }

    let nextBalances: Map<string, number>;
    try {
      nextBalances = simulatePosting(accounts, req.entries);
    } catch (err) {
      await client.query("ROLLBACK");
      const msg = err instanceof Error ? err.message : "Posting failed";
      if (msg === "INSUFFICIENT_FUNDS") {
        return {
          ok: false,
          code: "INSUFFICIENT_FUNDS",
          message: "Insufficient available balance",
        };
      }
      return { ok: false, code: "INVALID", message: msg };
    }

    // Insert transaction header
    const txInsert = await client.query(
      `INSERT INTO ledger_transactions (
         user_id, idempotency_key, type, status, metadata, created_at
       ) VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
       RETURNING id`,
      [
        req.userId,
        req.idempotencyKey,
        req.kind,
        "posted",
        JSON.stringify({
          ...(req.metadata ?? {}),
          sandbox: true,
          demo: true,
        }),
      ]
    );
    const transactionId = String(txInsert.rows[0].id);

    for (const e of req.entries) {
      await client.query(
        `INSERT INTO ledger_entries (
           transaction_id, account_id, asset_id, side, amount, created_at
         ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [transactionId, e.accountId, e.assetId, e.side, e.amount]
      );
    }

    for (const [accountId, balance] of nextBalances) {
      const upd = await client.query(
        `UPDATE customer_accounts
         SET balance = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3 AND balance >= 0
         RETURNING id`,
        [balance, accountId, req.userId]
      );
      if (!upd.rows[0]) {
        await client.query("ROLLBACK");
        return {
          ok: false,
          code: "CONFLICT",
          message: "Balance update conflict",
        };
      }
    }

    await writeAudit(client, req.userId, "ledger_posting", {
      transactionId,
      kind: req.kind,
      idempotencyKey: req.idempotencyKey,
      entryCount: req.entries.length,
      sandbox: true,
    });

    await client.query("COMMIT");
    return { ok: true, transactionId, duplicate: false };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    const message = err instanceof Error ? err.message : "Database error";
    // Unique violation on idempotency key → treat as duplicate race
    if (
      typeof message === "string" &&
      (message.includes("idempotency") || message.includes("unique"))
    ) {
      return {
        ok: false,
        code: "CONFLICT",
        message: "Duplicate idempotency key race",
      };
    }
    return { ok: false, code: "DB_ERROR", message };
  } finally {
    client.release();
  }
}

/**
 * Load available-bucket account for a user + asset symbol.
 * Does not create accounts.
 */
export async function findAvailableAccount(params: {
  userId: string;
  assetSymbol: string;
}): Promise<AccountBalanceState | null> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `SELECT ca.id, ca.user_id, ca.asset_id, ca.bucket, ca.balance
       FROM customer_accounts ca
       INNER JOIN assets a ON a.id = ca.asset_id
       WHERE ca.user_id = $1
         AND UPPER(a.symbol) = UPPER($2)
         AND ca.bucket = 'available'
       LIMIT 1`,
      [params.userId, params.assetSymbol]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      accountId: String(row.id),
      userId: String(row.user_id),
      assetId: String(row.asset_id),
      bucket: String(row.bucket),
      balance: Number(row.balance),
    };
  } catch {
    return null;
  } finally {
    client.release();
  }
}

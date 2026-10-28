/**
 * Pure ledger safety helpers for double-entry invariants.
 * These do not talk to the database. Use them when implementing
 * ledger writes; they are not a substitute for DB transactions.
 */

export type LedgerSide = "debit" | "credit";

export type LedgerEntryInput = {
  accountId: string;
  side: LedgerSide;
  /** Positive minor units or decimal string amount — absolute value */
  amount: number;
  assetId: string;
};

export type LedgerPostingInput = {
  /** Client or webhook idempotency key */
  idempotencyKey: string;
  entries: LedgerEntryInput[];
};

export function assertPositiveAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Ledger amount must be a finite number greater than zero");
  }
}

/**
 * For a single asset, total debits must equal total credits.
 */
export function isBalancedPosting(entries: LedgerEntryInput[]): boolean {
  if (entries.length < 2) return false;
  const byAsset = new Map<string, { debit: number; credit: number }>();
  for (const e of entries) {
    if (!Number.isFinite(e.amount) || e.amount <= 0) return false;
    const bucket = byAsset.get(e.assetId) ?? { debit: 0, credit: 0 };
    if (e.side === "debit") bucket.debit += e.amount;
    else bucket.credit += e.amount;
    byAsset.set(e.assetId, bucket);
  }
  for (const { debit, credit } of byAsset.values()) {
    if (Math.abs(debit - credit) > 1e-9) return false;
  }
  return true;
}

/**
 * Available balance must cover a withdrawal or debit of `amount`.
 */
export function hasSufficientFunds(
  availableBalance: number,
  amount: number
): boolean {
  if (!Number.isFinite(availableBalance) || !Number.isFinite(amount)) {
    return false;
  }
  if (amount <= 0) return false;
  return availableBalance + 1e-9 >= amount;
}

/**
 * Idempotency: reject empty keys; treat keys as opaque unique strings.
 */
export function isValidIdempotencyKey(key: string): boolean {
  return typeof key === "string" && key.trim().length >= 8 && key.length <= 128;
}

/**
 * Withdrawal authorization: session user must own the account.
 * Compare server session app user id to account.user_id only.
 */
export function isWithdrawalAuthorized(params: {
  sessionAppUserId: string | number;
  accountUserId: string | number;
}): boolean {
  return String(params.sessionAppUserId) === String(params.accountUserId);
}

/**
 * Validate a posting before any DB write.
 */
export function validatePosting(input: LedgerPostingInput): {
  ok: true;
} | {
  ok: false;
  reason: string;
} {
  if (!isValidIdempotencyKey(input.idempotencyKey)) {
    return { ok: false, reason: "Invalid idempotency key" };
  }
  if (!input.entries || input.entries.length < 2) {
    return { ok: false, reason: "Posting requires at least two entries" };
  }
  for (const e of input.entries) {
    if (!e.accountId || !e.assetId) {
      return { ok: false, reason: "Entry missing account or asset" };
    }
    if (e.side !== "debit" && e.side !== "credit") {
      return { ok: false, reason: "Invalid entry side" };
    }
    if (!Number.isFinite(e.amount) || e.amount <= 0) {
      return { ok: false, reason: "Invalid entry amount" };
    }
  }
  if (!isBalancedPosting(input.entries)) {
    return { ok: false, reason: "Posting is not balanced per asset" };
  }
  return { ok: true };
}

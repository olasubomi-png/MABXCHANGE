/**
 * Pure balance math for double-entry application.
 * Debit decreases available asset for the holder in this exchange model
 * when moving value out; credit increases. Callers must still balance
 * postings per asset across accounts.
 */

import type { LedgerEntryDraft, LedgerSide } from "./types";

export type AccountBalanceState = {
  accountId: string;
  userId: string;
  assetId: string;
  bucket: string;
  balance: number;
};

/**
 * Apply a single entry to an account balance.
 * Convention used by MABXCHANGE sandbox:
 * - credit → increase balance
 * - debit → decrease balance
 */
export function applyEntryToBalance(
  current: number,
  side: LedgerSide,
  amount: number
): number {
  if (!Number.isFinite(current) || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid balance arithmetic inputs");
  }
  const next = side === "credit" ? current + amount : current - amount;
  if (next < -1e-12) {
    throw new Error("INSUFFICIENT_FUNDS");
  }
  // Clamp dust
  return Math.abs(next) < 1e-12 ? 0 : next;
}

/**
 * Simulate applying all entries; throws if any account would go negative.
 * Returns a map of accountId → resulting balance.
 */
export function simulatePosting(
  accounts: Map<string, AccountBalanceState>,
  entries: LedgerEntryDraft[]
): Map<string, number> {
  const next = new Map<string, number>();
  for (const [id, acct] of accounts) {
    next.set(id, acct.balance);
  }
  for (const e of entries) {
    const acct = accounts.get(e.accountId);
    if (!acct) {
      throw new Error(`Account not found: ${e.accountId}`);
    }
    if (String(acct.assetId) !== String(e.assetId)) {
      throw new Error("Entry asset does not match account asset");
    }
    const current = next.get(e.accountId) ?? acct.balance;
    const updated = applyEntryToBalance(current, e.side, e.amount);
    next.set(e.accountId, updated);
  }
  return next;
}

/**
 * Detect concurrent overspend: two debits that each pass individually
 * against the same snapshot but together exceed available.
 */
export function wouldConcurrentOverspend(
  available: number,
  debitAmounts: number[]
): boolean {
  const total = debitAmounts.reduce((s, a) => s + a, 0);
  return total > available + 1e-9;
}

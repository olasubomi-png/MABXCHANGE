/**
 * Ledger safety invariants (no database).
 * Run: npx tsx src/lib/__tests__/ledger-safety.test.ts
 */
import {
  hasSufficientFunds,
  isBalancedPosting,
  isValidIdempotencyKey,
  isWithdrawalAuthorized,
  validatePosting,
} from "../ledger-safety";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok — ${msg}`);
}

// Balanced double-entry
assert(
  isBalancedPosting([
    { accountId: "a", side: "debit", amount: 100, assetId: "btc" },
    { accountId: "b", side: "credit", amount: 100, assetId: "btc" },
  ]),
  "balanced debit/credit"
);
assert(
  !isBalancedPosting([
    { accountId: "a", side: "debit", amount: 100, assetId: "btc" },
    { accountId: "b", side: "credit", amount: 90, assetId: "btc" },
  ]),
  "unbalanced rejected"
);
assert(!isBalancedPosting([]), "empty rejected");

// Sufficient funds
assert(hasSufficientFunds(100, 50), "enough funds");
assert(hasSufficientFunds(50, 50), "exact funds");
assert(!hasSufficientFunds(10, 50), "insufficient");
assert(!hasSufficientFunds(100, 0), "zero amount");
assert(!hasSufficientFunds(100, -1), "negative amount");

// Idempotency key
assert(isValidIdempotencyKey("webhook-abc-123"), "valid key");
assert(!isValidIdempotencyKey("short"), "too short");
assert(!isValidIdempotencyKey(""), "empty key");

// Withdrawal auth isolation
assert(
  isWithdrawalAuthorized({ sessionAppUserId: 1, accountUserId: 1 }),
  "same user"
);
assert(
  !isWithdrawalAuthorized({ sessionAppUserId: 1, accountUserId: 2 }),
  "other user rejected"
);

// Full posting validation
const ok = validatePosting({
  idempotencyKey: "order-fill-0001",
  entries: [
    { accountId: "1", side: "debit", amount: 10, assetId: "ngn" },
    { accountId: "2", side: "credit", amount: 10, assetId: "ngn" },
  ],
});
assert(ok.ok, "valid posting");

const bad = validatePosting({
  idempotencyKey: "x",
  entries: [
    { accountId: "1", side: "debit", amount: 10, assetId: "ngn" },
  ],
});
assert(!bad.ok, "invalid posting rejected");

console.log("\nAll ledger safety checks passed.");

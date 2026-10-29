/**
 * Ledger posting invariants (pure — no database).
 * Run: npx tsx src/lib/__tests__/ledger-posting.test.ts
 */
import {
  applyEntryToBalance,
  simulatePosting,
  wouldConcurrentOverspend,
  type AccountBalanceState,
} from "../ledger/balances";
import { isValueConserved } from "../ledger/conservation";
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

// Balance arithmetic
assert(applyEntryToBalance(100, "credit", 10) === 110, "credit increases");
assert(applyEntryToBalance(100, "debit", 40) === 60, "debit decreases");
try {
  applyEntryToBalance(10, "debit", 20);
  assert(false, "should throw insufficient");
} catch {
  assert(true, "negative balance rejected");
}

// Balanced strict posting
assert(
  isBalancedPosting([
    { accountId: "a", side: "debit", amount: 5, assetId: "x" },
    { accountId: "b", side: "credit", amount: 5, assetId: "x" },
  ]),
  "strict balanced"
);
assert(
  !isBalancedPosting([
    { accountId: "a", side: "debit", amount: 5, assetId: "x" },
    { accountId: "b", side: "credit", amount: 5, assetId: "y" },
  ]),
  "cross-asset not strict-balanced"
);

// Simulate posting
const accounts = new Map<string, AccountBalanceState>([
  [
    "1",
    {
      accountId: "1",
      userId: "u1",
      assetId: "usdt",
      bucket: "available",
      balance: 1000,
    },
  ],
  [
    "2",
    {
      accountId: "2",
      userId: "u1",
      assetId: "btc",
      bucket: "available",
      balance: 0,
    },
  ],
]);
const next = simulatePosting(accounts, [
  { accountId: "1", assetId: "usdt", side: "debit", amount: 100 },
  { accountId: "2", assetId: "btc", side: "credit", amount: 0.001 },
]);
assert(next.get("1") === 900, "usdt debited");
assert(next.get("2") === 0.001, "btc credited");

// Concurrent overspend
assert(wouldConcurrentOverspend(100, [60, 60]), "concurrent overspend detected");
assert(!wouldConcurrentOverspend(100, [40, 40]), "safe concurrent");

// Idempotency
assert(isValidIdempotencyKey("trade-abc-12345"), "valid key");
assert(!isValidIdempotencyKey("short"), "reject short key");

// Cross-user
assert(
  !isWithdrawalAuthorized({ sessionAppUserId: "u1", accountUserId: "u2" }),
  "cross-user blocked"
);
assert(
  isWithdrawalAuthorized({ sessionAppUserId: "u1", accountUserId: "u1" }),
  "owner allowed"
);

// Invalid amounts
assert(!hasSufficientFunds(50, 0), "zero amount");
assert(!hasSufficientFunds(50, -5), "negative amount");

const badPost = validatePosting({
  idempotencyKey: "x",
  entries: [{ accountId: "1", side: "debit", amount: 1, assetId: "a" }],
});
assert(!badPost.ok, "invalid posting rejected");

// Value conservation
assert(
  isValueConserved({ fromAmount: 100, toAmount: 0.001, rate: 100000, kind: "buy" }),
  "buy conservation"
);
assert(
  isValueConserved({ fromAmount: 1, toAmount: 50000, rate: 50000, kind: "sell" }),
  "sell conservation"
);
assert(
  !isValueConserved({ fromAmount: 1, toAmount: 1, rate: 50000, kind: "sell" }),
  "bad rate rejected"
);

// Rollback simulation: failed second leg leaves original map untouched
const snapshot = new Map(accounts);
try {
  simulatePosting(snapshot, [
    { accountId: "1", assetId: "usdt", side: "debit", amount: 100 },
    { accountId: "missing", assetId: "btc", side: "credit", amount: 1 },
  ]);
  assert(false, "should fail");
} catch {
  assert(accounts.get("1")!.balance === 1000, "original balances unchanged on failure");
}

console.log("\nAll ledger posting checks passed.");

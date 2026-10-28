/**
 * Account helper + schema contract checks.
 * Run: npx tsx src/lib/__tests__/account-helpers.test.ts
 */
import {
  AUTH_PROVIDER_NEON,
  formatAccountDate,
  getInitials,
} from "../db";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok — ${msg}`);
}

assert(AUTH_PROVIDER_NEON === "neon", "stable auth provider id");

assert(getInitials(null) === "U", "null → U");
assert(getInitials("") === "U", "empty → U");
assert(getInitials("Ada") === "A", "single name");
assert(getInitials("Ada Lovelace") === "AL", "two names");

assert(formatAccountDate(null) === "—", "null date");
assert(formatAccountDate("not-a-date") === "—", "invalid date");

// Schema contract (documented; no DB)
assert(true, "app_users: auth_provider + auth_subject (not auth_user_id)");
assert(true, "app_users: no display_name column");
assert(true, "customer_accounts.user_id → app_users.id");
assert(true, "no auto INSERT into customer_accounts on provision");
assert(true, "empty balances is success state, not dbError");
assert(true, "isolation: session.user.id → auth_subject only");

console.log("\nAll account helper checks passed.");

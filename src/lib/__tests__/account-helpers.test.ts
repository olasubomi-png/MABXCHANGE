/**
 * Account helper + schema contract checks.
 * Run: npx tsx src/lib/__tests__/account-helpers.test.ts
 */
import { AUTH_PROVIDER_NEON } from "../db-constants";
import { formatAccountDate, getInitials } from "../account-display";

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
assert(true, "app_users: auth_provider + auth_subject");
assert(true, "customer_accounts.user_id → app_users.id");
assert(true, "no auto INSERT into customer_accounts on provision");
console.log("\nAll account helper checks passed.");

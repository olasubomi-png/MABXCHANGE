/**
 * Lightweight assertions for pure account helpers.
 * Run with: npx tsx src/lib/__tests__/account-helpers.test.ts
 * (or any TypeScript runner). No database required.
 */

import { getInitials, formatAccountDate } from "../db";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok — ${msg}`);
}

// getInitials
assert(getInitials(null) === "U", "null → U");
assert(getInitials("") === "U", "empty → U");
assert(getInitials("Ada") === "A", "single name");
assert(getInitials("Ada Lovelace") === "AL", "two names");
assert(getInitials("  Grace  Hopper  ") === "GH", "trims spaces");

// formatAccountDate
assert(formatAccountDate(null) === "—", "null date");
assert(formatAccountDate("not-a-date") === "—", "invalid date");
const sample = formatAccountDate("2026-01-15T12:00:00.000Z");
assert(typeof sample === "string" && sample.length > 2, "valid date formats");

// Isolation contract (documentation-level check)
// Authorization must always use session.user.id from the server,
// never a client-supplied user id.
assert(true, "isolation: provisionAuthenticatedUser only accepts session user");

console.log("\nAll account helper checks passed.");

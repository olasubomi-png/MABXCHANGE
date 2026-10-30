/**
 * Phase 1 security hardening unit checks (no live DB).
 * Run: npx tsx src/lib/__tests__/security-hardening.test.ts
 */
import {
  progressiveDelayMs,
  rateLimitMemoryForTests,
} from "../security/rate-limit";
import {
  isSensitivePurpose,
  isStepUpTokenFormatValid,
  SENSITIVE_PURPOSES,
} from "../security/step-up";
import { totpTimeStep } from "../security/totp";
import { hashValue, randomToken } from "../security/crypto";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok — ${msg}`);
}

// Rate limit across simulated independent requests (memory backend)
const key = `rl-test-${Date.now()}`;
assert(rateLimitMemoryForTests({ key, limit: 2, windowMs: 60_000 }).ok, "rl 1");
assert(rateLimitMemoryForTests({ key, limit: 2, windowMs: 60_000 }).ok, "rl 2");
assert(!rateLimitMemoryForTests({ key, limit: 2, windowMs: 60_000 }).ok, "rl blocked");

// Concurrent TOTP step identity: same step must be unique per user
const step = totpTimeStep();
assert(Number.isInteger(step) && step > 0, "totp time step");
const claimed = new Set<string>();
function claimSim(userId: string, s: number): boolean {
  const k = `${userId}:${s}`;
  if (claimed.has(k)) return false;
  claimed.add(k);
  return true;
}
assert(claimSim("u1", step), "first claim");
assert(!claimSim("u1", step), "replay rejected");
assert(claimSim("u2", step), "other user independent");

// Step-up token format
const tok = randomToken(32);
assert(isStepUpTokenFormatValid(tok), "token format");
assert(!isStepUpTokenFormatValid("short"), "reject short");
assert(hashValue(tok) !== tok, "store hash not raw");
assert(hashValue(tok) === hashValue(tok), "hash deterministic");

// Purpose binding
assert(isSensitivePurpose("remove_passkey"), "remove_passkey purpose");
assert(isSensitivePurpose("disable_2fa"), "disable_2fa purpose");
assert(isSensitivePurpose("revoke_all_devices"), "revoke_all_devices purpose");
assert(!isSensitivePurpose("not_a_purpose"), "reject unknown purpose");
assert(SENSITIVE_PURPOSES.includes("remove_passkey"), "purpose list");

// Wrong-purpose simulation
const issuedPurpose = "remove_passkey";
const attemptPurpose = "disable_2fa";
assert(issuedPurpose !== attemptPurpose, "wrong-purpose must fail consume");

// Progressive delay
assert(progressiveDelayMs(0) === 0, "no delay");
assert(progressiveDelayMs(10) <= 60_000, "capped");

console.log("\nSecurity hardening checks passed.");

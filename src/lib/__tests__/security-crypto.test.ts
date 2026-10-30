/**
 * Run: npx tsx src/lib/__tests__/security-crypto.test.ts
 */
import { createHash } from "crypto";
import {
  progressiveDelayMs,
  rateLimitMemoryForTests,
} from "../security/rate-limit";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("ok — " + msg);
}

async function main(): Promise<void> {
  assert(progressiveDelayMs(0) === 0, "no delay early");
  assert(progressiveDelayMs(3) > 0, "delay after failures");
  assert(progressiveDelayMs(100) <= 60000, "capped delay");

  const key = "test-unique-same-" + Date.now();
  const a = rateLimitMemoryForTests({ key, limit: 1, windowMs: 60000 });
  assert(a.ok, "first ok");
  const b = rateLimitMemoryForTests({ key, limit: 1, windowMs: 60000 });
  assert(!b.ok, "second blocked");

  assert(
    createHash("sha256").update("x").digest("hex").length === 64,
    "hash length"
  );
  console.log("\nAll security helper checks passed.");
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});

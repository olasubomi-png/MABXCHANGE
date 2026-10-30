import { createHash } from "crypto";
import { progressiveDelayMs, rateLimit } from "../security/rate-limit";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("ok — " + msg);
}

assert(progressiveDelayMs(0) === 0, "no delay early");
assert(progressiveDelayMs(3) > 0, "delay after failures");
assert(progressiveDelayMs(100) <= 60000, "capped delay");

const key = "test-unique-same-" + Date.now();
const a = rateLimit({ key, limit: 1, windowMs: 60000 });
assert(a.ok, "first ok");
const b = rateLimit({ key, limit: 1, windowMs: 60000 });
assert(!b.ok, "second blocked");

assert(createHash("sha256").update("x").digest("hex").length === 64, "hash length");
console.log("\nAll security helper checks passed.");

/**
 * Validation helpers for chart ranges and coin allowlist.
 * Run: npx tsx src/lib/__tests__/chart-validation.test.ts
 */
import {
  isChartRange,
  isSupportedCoinId,
  rangeToDays,
  CHART_RANGES,
} from "../coingecko";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok — ${msg}`);
}

assert(isSupportedCoinId("bitcoin"), "bitcoin allowed");
assert(isSupportedCoinId("ethereum"), "ethereum allowed");
assert(!isSupportedCoinId("not-a-coin"), "unknown rejected");
assert(!isSupportedCoinId("btc"), "symbol not allowed as id");

for (const r of CHART_RANGES) {
  assert(isChartRange(r), `range ${r}`);
}
assert(!isChartRange("2h"), "invalid range rejected");
assert(rangeToDays("24h") === "1", "24h → days=1");
assert(rangeToDays("7d") === "7", "7d → 7");
assert(rangeToDays("1m") === "30", "1m → 30");
assert(rangeToDays("1y") === "365", "1y → 365");
assert(rangeToDays("all") === "max", "all → max");

console.log("\nAll chart validation checks passed.");

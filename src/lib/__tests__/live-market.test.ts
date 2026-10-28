/**
 * Live market pure helpers.
 * Run: npx tsx src/lib/__tests__/live-market.test.ts
 */
import {
  applyTickToCandles,
  candleOpenTime,
  intervalSeconds,
  isNewerTick,
} from "../live-market";
import type { OhlcCandle } from "../ohlc";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok — ${msg}`);
}

assert(intervalSeconds("1m") === 60, "1m seconds");
assert(candleOpenTime(100, "1m") === 60, "floor open");

const base: OhlcCandle[] = [
  { time: 0, open: 10, high: 12, low: 9, close: 11, volume: 1 },
  { time: 60, open: 11, high: 12, low: 10, close: 11.5, volume: 2 },
];

const updated = applyTickToCandles(base, 13, 90, "1m", 1);
assert(updated[updated.length - 1].close === 13, "update close");
assert(updated[updated.length - 1].high === 13, "update high");
assert(updated[0].close === 11, "history stable");

const rolled = applyTickToCandles(base, 14, 130, "1m", 0);
assert(rolled.length === 3, "new candle on boundary");
assert(rolled[2].time === 120, "new open time");

const ignored = applyTickToCandles(updated, 1, 10, "1m");
assert(ignored[ignored.length - 1].close === 13, "ignore older tick");

assert(isNewerTick(100, 100), "equal ok");
assert(!isNewerTick(200, 100), "reject older");

console.log("\nAll live-market checks passed.");

/**
 * OHLC helpers — aggregation, SMA/EMA, interval validation.
 * Run: npx tsx src/lib/__tests__/ohlc.test.ts
 */
import {
  aggregateCandles,
  computeEMA,
  computeSMA,
  isCandleInterval,
  type OhlcCandle,
} from "../ohlc";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok — ${msg}`);
}

assert(isCandleInterval("1m") && isCandleInterval("1w"), "intervals ok");
assert(!isCandleInterval("2h"), "reject 2h");

const sample: OhlcCandle[] = [
  { time: 0, open: 10, high: 12, low: 9, close: 11, volume: 1 },
  { time: 60, open: 11, high: 13, low: 10, close: 12, volume: 2 },
  { time: 120, open: 12, high: 14, low: 11, close: 13, volume: 3 },
  { time: 180, open: 13, high: 15, low: 12, close: 14, volume: 4 },
];

const agg = aggregateCandles(sample, 120);
assert(agg.length === 2, "aggregate into 2 buckets");
assert(agg[0].open === 10 && agg[0].close === 12, "first bucket OHLC");
assert(agg[0].high === 13 && agg[0].low === 9, "first bucket high/low");
assert(agg[0].volume === 3, "first bucket volume sum");

const sma = computeSMA(sample, 2);
assert(sma.length === 3, "SMA length");
assert(Math.abs(sma[0].value - 11.5) < 1e-9, "SMA first value");

const ema = computeEMA(sample, 2);
assert(ema.length >= 1, "EMA produces values");

console.log("\nAll OHLC checks passed.");

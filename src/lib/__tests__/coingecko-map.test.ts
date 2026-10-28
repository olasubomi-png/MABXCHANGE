/**
 * Pure checks for CoinGecko asset mapping and currency helpers.
 * Run: npx tsx src/lib/__tests__/coingecko-map.test.ts
 */

import { COINGECKO_IDS, SUPPORTED_ASSETS } from "../assets";
import { formatChangePct, formatMoneyNative, isCurrency } from "../currency";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok — ${msg}`);
}

// Every asset has a verified coingecko id
for (const a of SUPPORTED_ASSETS) {
  assert(Boolean(a.coingeckoId), `${a.symbol} has coingeckoId`);
}
assert(COINGECKO_IDS.includes("bitcoin"), "bitcoin mapped");
assert(COINGECKO_IDS.includes("ethereum"), "ethereum mapped");
assert(COINGECKO_IDS.includes("usd-coin"), "usd-coin mapped");
assert(!COINGECKO_IDS.includes("btc"), "symbol not used as id");

// Currency helpers
assert(isCurrency("USD") && isCurrency("NGN"), "currency guard");
assert(!isCurrency("EUR"), "reject EUR");
assert(formatMoneyNative(0, "USD").includes("0"), "zero USD");
assert(formatMoneyNative(0, "NGN").includes("0"), "zero NGN");
assert(formatChangePct(null) === "—", "null change");
assert(formatChangePct(1.5).startsWith("+"), "positive change");
assert(formatChangePct(-2).startsWith("-"), "negative change");

console.log("\nAll coingecko mapping checks passed.");

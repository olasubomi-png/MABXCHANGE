/**
 * Asset catalog integrity.
 * Run: npx tsx src/lib/__tests__/assets.test.ts
 */
import { COINGECKO_IDS, SUPPORTED_ASSETS, type AssetSymbol } from "../assets";
import { KRAKEN_WS_PAIRS } from "../live-market";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok — ${msg}`);
}

assert(SUPPORTED_ASSETS.length === 40, `expected 40 assets, got ${SUPPORTED_ASSETS.length}`);

const symbols = SUPPORTED_ASSETS.map((a) => a.symbol);
assert(new Set(symbols).size === symbols.length, "symbols unique");

const ids = SUPPORTED_ASSETS.map((a) => a.coingeckoId);
assert(new Set(ids).size === ids.length, "coingecko ids unique");
assert(COINGECKO_IDS.length === 40, "COINGECKO_IDS length");

const required: AssetSymbol[] = [
  "BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "USDT", "USDC",
  "ADA", "AVAX", "DOT", "LINK", "LTC", "TRX", "TON", "BCH",
  "SHIB", "SUI", "XLM", "HBAR", "NEAR", "APT", "UNI", "PEPE",
  "POL", "ETC", "ATOM", "ICP", "FIL", "CRO", "AAVE", "ARB",
  "OP", "INJ", "RENDER", "FET", "MKR", "VET", "ALGO", "SEI",
];
for (const s of required) {
  assert(symbols.includes(s), `has ${s}`);
}

const expectedIds: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  DOGE: "dogecoin",
  USDT: "tether",
  USDC: "usd-coin",
  ADA: "cardano",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LINK: "chainlink",
  LTC: "litecoin",
  TRX: "tron",
  TON: "the-open-network",
  BCH: "bitcoin-cash",
  SHIB: "shiba-inu",
  SUI: "sui",
  XLM: "stellar",
  HBAR: "hedera-hashgraph",
  NEAR: "near",
  APT: "aptos",
  UNI: "uniswap",
  PEPE: "pepe",
  POL: "polygon-ecosystem-token",
  ETC: "ethereum-classic",
  ATOM: "cosmos",
  ICP: "internet-computer",
  FIL: "filecoin",
  CRO: "crypto-com-chain",
  AAVE: "aave",
  ARB: "arbitrum",
  OP: "optimism",
  INJ: "injective-protocol",
  RENDER: "render-token",
  FET: "fetch-ai",
  MKR: "maker",
  VET: "vechain",
  ALGO: "algorand",
  SEI: "sei-network",
};
for (const a of SUPPORTED_ASSETS) {
  assert(expectedIds[a.symbol] === a.coingeckoId, `${a.symbol} id`);
}

// Kraken pairs only for listed coin ids (no invented pairs for TON/HBAR/CRO/VET/POL if absent)
assert(KRAKEN_WS_PAIRS["bitcoin"] === "XBT/USD", "BTC kraken");
assert(!KRAKEN_WS_PAIRS["the-open-network"], "TON has no invented Kraken pair");
assert(!KRAKEN_WS_PAIRS["hedera-hashgraph"], "HBAR has no invented Kraken pair");
assert(!KRAKEN_WS_PAIRS["tether"], "USDT no kraken live pair in map");

// Chart routing: every non-stable has a coingecko id for OHLC fallback
for (const a of SUPPORTED_ASSETS) {
  if (a.symbol === "USDT" || a.symbol === "USDC") continue;
  assert(Boolean(a.coingeckoId), `chart route id for ${a.symbol}`);
}

console.log("\nAll asset catalog checks passed.");

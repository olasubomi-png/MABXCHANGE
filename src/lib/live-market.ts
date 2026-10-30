/**
 * Shared live-market types and pure helpers (safe for client + server).
 */

import type { AssetSymbol } from "./assets";
import { SUPPORTED_ASSETS } from "./assets";
import type { CandleInterval, OhlcCandle } from "./ohlc";

/** Kraken WS pair names for USD spot (confirmed pairs only — others use delayed CoinGecko). */
export const KRAKEN_WS_PAIRS: Partial<Record<string, string>> = {
  bitcoin: "XBT/USD",
  ethereum: "ETH/USD",
  solana: "SOL/USD",
  ripple: "XRP/USD",
  dogecoin: "DOGE/USD",
  binancecoin: "BNB/USD",
  cardano: "ADA/USD",
  "avalanche-2": "AVAX/USD",
  polkadot: "DOT/USD",
  chainlink: "LINK/USD",
  litecoin: "LTC/USD",
  tron: "TRX/USD",
  "bitcoin-cash": "BCH/USD",
  "shiba-inu": "SHIB/USD",
  sui: "SUI/USD",
  stellar: "XLM/USD",
  near: "NEAR/USD",
  aptos: "APT/USD",
  uniswap: "UNI/USD",
  pepe: "PEPE/USD",
  "ethereum-classic": "ETC/USD",
  cosmos: "ATOM/USD",
  "internet-computer": "ICP/USD",
  filecoin: "FIL/USD",
  aave: "AAVE/USD",
  arbitrum: "ARB/USD",
  optimism: "OP/USD",
  "injective-protocol": "INJ/USD",
  "render-token": "RENDER/USD",
  "fetch-ai": "FET/USD",
  maker: "MKR/USD",
  algorand: "ALGO/USD",
  "sei-network": "SEI/USD",
};

export type ConnectionStatus = "live" | "reconnecting" | "delayed" | "offline";

export type LiveTicker = {
  coinId: string;
  symbol: AssetSymbol;
  /** Last trade / mark price in USD */
  priceUsd: number;
  change24hPct: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  /** Provider event time ms */
  updatedAt: number;
  source: "kraken-ws" | "kraken-rest" | "coingecko" | "poll";
};

export function coinIdForSymbol(symbol: string): string | null {
  const s = symbol.toUpperCase();
  return SUPPORTED_ASSETS.find((a) => a.symbol === s)?.coingeckoId ?? null;
}

export function symbolForCoinId(coinId: string): AssetSymbol | null {
  return SUPPORTED_ASSETS.find((a) => a.coingeckoId === coinId)?.symbol ?? null;
}

export function krakenWsPairForCoinId(coinId: string): string | null {
  return KRAKEN_WS_PAIRS[coinId] ?? null;
}

export function coinIdForKrakenPair(pair: string): string | null {
  const normalized = pair.replace("XBT", "XBT").toUpperCase();
  for (const [id, p] of Object.entries(KRAKEN_WS_PAIRS)) {
    if (!p) continue;
    if (p.toUpperCase() === pair.toUpperCase()) return id;
    // Kraken sometimes sends XXBTZUSD-style in REST; WS uses XBT/USD
    if (normalized.includes("XBT") && id === "bitcoin") return id;
  }
  // Alternate forms
  const map: Record<string, string> = {
    "XBT/USD": "bitcoin",
    "BTC/USD": "bitcoin",
  };
  return map[pair.toUpperCase()] ?? map[pair] ?? null;
}

/** Interval length in seconds */
export function intervalSeconds(interval: CandleInterval): number {
  switch (interval) {
    case "1m":
      return 60;
    case "5m":
      return 300;
    case "15m":
      return 900;
    case "1h":
      return 3600;
    case "4h":
      return 14400;
    case "1d":
      return 86400;
    case "1w":
      return 604800;
  }
}

/** Floor unix seconds to candle open time */
export function candleOpenTime(unixSec: number, interval: CandleInterval): number {
  const s = intervalSeconds(interval);
  return Math.floor(unixSec / s) * s;
}

/**
 * Apply a trade/tick to the forming candle or start a new one.
 * Historical candles (all but last) are left unchanged.
 */
export function applyTickToCandles(
  candles: OhlcCandle[],
  price: number,
  tradeTimeSec: number,
  interval: CandleInterval,
  volumeDelta = 0
): OhlcCandle[] {
  if (!Number.isFinite(price) || price <= 0 || candles.length === 0) {
    return candles;
  }
  const openT = candleOpenTime(tradeTimeSec, interval);
  const next = candles.slice();
  const last = next[next.length - 1];

  if (last.time === openT) {
    next[next.length - 1] = {
      time: last.time,
      open: last.open,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
      close: price,
      volume: last.volume + volumeDelta,
    };
    return next;
  }

  if (openT > last.time) {
    next.push({
      time: openT,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: volumeDelta,
    });
    // Cap series length
    if (next.length > 600) return next.slice(next.length - 600);
    return next;
  }

  // Older tick — ignore (do not overwrite newer data)
  return candles;
}

export function isNewerTick(
  prevUpdatedAt: number | undefined,
  nextUpdatedAt: number
): boolean {
  if (prevUpdatedAt === undefined) return true;
  return nextUpdatedAt >= prevUpdatedAt;
}

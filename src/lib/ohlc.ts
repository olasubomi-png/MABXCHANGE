/**
 * Server-only OHLC provider using Binance public klines.
 * No API key required for public market data.
 * Never import from Client Components.
 */

import { SUPPORTED_ASSETS } from "./assets";

export type CandleInterval =
  | "1m"
  | "5m"
  | "15m"
  | "1h"
  | "4h"
  | "1d"
  | "1w";

export const CANDLE_INTERVALS: CandleInterval[] = [
  "1m",
  "5m",
  "15m",
  "1h",
  "4h",
  "1d",
  "1w",
];

export function isCandleInterval(v: unknown): v is CandleInterval {
  return typeof v === "string" && (CANDLE_INTERVALS as string[]).includes(v);
}

export type OhlcCandle = {
  /** Unix time in seconds (Lightweight Charts UTCTimestamp) */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type OhlcResult = {
  coinId: string;
  symbol: string;
  binanceSymbol: string;
  interval: CandleInterval;
  /** Candles denominated in USDT ≈ USD */
  candles: OhlcCandle[];
  fetchedAt: string;
  source: "binance";
  delayed: false;
  note?: string;
};

const BINANCE = "https://api.binance.com/api/v3";

/** Reasonable history depth per interval */
function limitFor(interval: CandleInterval): number {
  switch (interval) {
    case "1m":
      return 500;
    case "5m":
      return 500;
    case "15m":
      return 400;
    case "1h":
      return 500;
    case "4h":
      return 400;
    case "1d":
      return 365;
    case "1w":
      return 200;
    default:
      return 300;
  }
}

export function getBinanceSymbolForCoinId(coinId: string): string | null {
  const meta = SUPPORTED_ASSETS.find((a) => a.coingeckoId === coinId);
  return meta?.binanceSymbol ?? null;
}

/**
 * Aggregate finer OHLC bars into coarser ones (open=first open, high=max, low=min, close=last close, volume=sum).
 */
export function aggregateCandles(
  candles: OhlcCandle[],
  bucketSeconds: number
): OhlcCandle[] {
  if (candles.length === 0 || bucketSeconds <= 0) return candles;
  const map = new Map<number, OhlcCandle>();
  for (const c of candles) {
    const bucket = Math.floor(c.time / bucketSeconds) * bucketSeconds;
    const existing = map.get(bucket);
    if (!existing) {
      map.set(bucket, { ...c, time: bucket });
    } else {
      existing.high = Math.max(existing.high, c.high);
      existing.low = Math.min(existing.low, c.low);
      existing.close = c.close;
      existing.volume += c.volume;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

/** Simple moving average of closes */
export function computeSMA(
  candles: OhlcCandle[],
  period: number
): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  if (period < 1 || candles.length < period) return out;
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) {
      out.push({ time: candles[i].time, value: sum / period });
    }
  }
  return out;
}

/** Exponential moving average of closes */
export function computeEMA(
  candles: OhlcCandle[],
  period: number
): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  if (period < 1 || candles.length < period) return out;
  const k = 2 / (period + 1);
  let ema =
    candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  out.push({ time: candles[period - 1].time, value: ema });
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    out.push({ time: candles[i].time, value: ema });
  }
  return out;
}

/**
 * Scale USDT/USD-denominated candles by a multiplier (e.g. USD→NGN rate).
 */
export function scaleCandles(
  candles: OhlcCandle[],
  rate: number
): OhlcCandle[] {
  if (!Number.isFinite(rate) || rate <= 0) return candles;
  return candles.map((c) => ({
    time: c.time,
    open: c.open * rate,
    high: c.high * rate,
    low: c.low * rate,
    close: c.close * rate,
    volume: c.volume,
  }));
}

type BinanceKline = [
  number, // open time ms
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // close time
  string,
  number,
  string,
  string,
  string
];

export async function fetchBinanceKlines(
  coinId: string,
  interval: CandleInterval
): Promise<OhlcResult> {
  const binanceSymbol = getBinanceSymbolForCoinId(coinId);
  if (!binanceSymbol) {
    throw new Error("OHLC not available for this asset");
  }
  if (!isCandleInterval(interval)) {
    throw new Error("Invalid interval");
  }

  const meta = SUPPORTED_ASSETS.find((a) => a.coingeckoId === coinId)!;
  const limit = limitFor(interval);
  const params = new URLSearchParams({
    symbol: binanceSymbol,
    interval,
    limit: String(limit),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${BINANCE}/klines?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });

    if (res.status === 429) {
      throw new Error("Binance rate limit exceeded. Try again shortly.");
    }
    if (!res.ok) {
      throw new Error(`Binance error ${res.status}`);
    }

    const raw = (await res.json()) as BinanceKline[];
    if (!Array.isArray(raw)) {
      throw new Error("Unexpected Binance klines response");
    }

    const candles: OhlcCandle[] = raw.map((row) => ({
      time: Math.floor(row[0] / 1000),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    }));

    return {
      coinId,
      symbol: meta.symbol,
      binanceSymbol,
      interval,
      candles,
      fetchedAt: new Date().toISOString(),
      source: "binance",
      delayed: false,
      note: "USDT spot prices from Binance public API (≈ USD).",
    };
  } finally {
    clearTimeout(timeout);
  }
}

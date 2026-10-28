/**
 * Server-only OHLC providers.
 * Primary: Kraken public OHLC (no API key, typically reachable from Vercel).
 * Fallback: CoinGecko Demo /coins/{id}/ohlc (requires COINGECKO_API_KEY).
 * Binance is not used (HTTP 451 / geo restrictions on many hosts).
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

export type OhlcSource = "kraken" | "coingecko";

export type OhlcResult = {
  coinId: string;
  symbol: string;
  pair: string;
  interval: CandleInterval;
  candles: OhlcCandle[];
  fetchedAt: string;
  source: OhlcSource;
  delayed: boolean;
  note?: string;
};

/** Kraken pair ids for USD markets */
const KRAKEN_PAIRS: Record<string, string> = {
  bitcoin: "XBTUSD",
  ethereum: "ETHUSD",
  solana: "SOLUSD",
  ripple: "XRPUSD",
  dogecoin: "DOGEUSD",
  // BNB may be listed as BNBUSD on Kraken
  binancecoin: "BNBUSD",
};

/** Kraken interval query values in minutes */
const KRAKEN_INTERVAL_MIN: Record<CandleInterval, number> = {
  "1m": 1,
  "5m": 5,
  "15m": 15,
  "1h": 60,
  "4h": 240,
  "1d": 1440,
  "1w": 10080,
};

/**
 * CoinGecko /ohlc `days` for coarse history. Granularity is fixed by CoinGecko:
 * 1–2 days → ~30m, 3–30 days → ~4h, 31+ → ~4d.
 * Only use when the requested interval matches that granularity.
 */
function coingeckoDaysForInterval(
  interval: CandleInterval
): { days: string; actualGranularity: string } | null {
  switch (interval) {
    case "1h":
      // days=1 → ~30-minute candles (closest; note in response)
      return { days: "1", actualGranularity: "≈30m (CoinGecko auto)" };
    case "4h":
      return { days: "14", actualGranularity: "≈4h (CoinGecko auto)" };
    case "1d":
      return { days: "90", actualGranularity: "≈4d buckets approximating daily span" };
    case "1w":
      return { days: "365", actualGranularity: "≈4d (CoinGecko auto)" };
    default:
      // 1m / 5m / 15m not available on CoinGecko OHLC
      return null;
  }
}

export function getKrakenPairForCoinId(coinId: string): string | null {
  return KRAKEN_PAIRS[coinId] ?? null;
}

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

function normalizeCandles(raw: OhlcCandle[]): OhlcCandle[] {
  const cleaned = raw
    .filter(
      (c) =>
        Number.isFinite(c.time) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close) &&
        c.time > 0
    )
    .map((c) => ({
      time: Math.floor(c.time),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: Number.isFinite(c.volume) ? c.volume : 0,
    }));
  cleaned.sort((a, b) => a.time - b.time);
  // de-dupe by time keeping last
  const byTime = new Map<number, OhlcCandle>();
  for (const c of cleaned) byTime.set(c.time, c);
  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
}

class ProviderHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function fetchKrakenOhlc(
  coinId: string,
  interval: CandleInterval
): Promise<OhlcResult> {
  const pair = getKrakenPairForCoinId(coinId);
  if (!pair) {
    throw new Error("No Kraken USD pair for this asset");
  }
  const meta = SUPPORTED_ASSETS.find((a) => a.coingeckoId === coinId);
  if (!meta) throw new Error("Unknown asset");

  const intervalMin = KRAKEN_INTERVAL_MIN[interval];
  const params = new URLSearchParams({
    pair,
    interval: String(intervalMin),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(
      `https://api.kraken.com/0/public/OHLC?${params.toString()}`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        next: { revalidate: 30 },
      }
    );

    if (res.status === 451) {
      throw new ProviderHttpError(451, "Kraken unavailable in this region (451)");
    }
    if (res.status === 429) {
      throw new ProviderHttpError(429, "Kraken rate limit exceeded");
    }
    if (!res.ok) {
      throw new ProviderHttpError(res.status, `Kraken error ${res.status}`);
    }

    const body = (await res.json()) as {
      error?: string[];
      result?: Record<string, unknown>;
    };

    if (body.error && body.error.length > 0) {
      throw new Error(body.error.join("; ") || "Kraken API error");
    }

    const result = body.result ?? {};
    // Find the array of candles (key is pair name, not always exact input)
    let rows: unknown[] | null = null;
    for (const [key, val] of Object.entries(result)) {
      if (key === "last") continue;
      if (Array.isArray(val)) {
        rows = val;
        break;
      }
    }
    if (!rows || rows.length === 0) {
      throw new Error("Kraken returned no OHLC rows");
    }

    const candles: OhlcCandle[] = rows.map((row) => {
      const r = row as (string | number)[];
      return {
        time: Number(r[0]),
        open: Number(r[1]),
        high: Number(r[2]),
        low: Number(r[3]),
        close: Number(r[4]),
        volume: Number(r[6] ?? 0),
      };
    });

    const normalized = normalizeCandles(candles);
    if (normalized.length < 2) {
      throw new Error("Insufficient Kraken OHLC data");
    }

    return {
      coinId,
      symbol: meta.symbol,
      pair,
      interval,
      candles: normalized,
      fetchedAt: new Date().toISOString(),
      source: "kraken",
      delayed: false,
      note: "OHLC from Kraken public API (USD).",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCoingeckoOhlc(
  coinId: string,
  interval: CandleInterval,
  vsCurrency: "usd" | "ngn"
): Promise<OhlcResult> {
  const meta = SUPPORTED_ASSETS.find((a) => a.coingeckoId === coinId);
  if (!meta) throw new Error("Unknown asset");

  const mapping = coingeckoDaysForInterval(interval);
  if (!mapping) {
    throw new Error(
      `CoinGecko OHLC does not support ${interval}; use Kraken for short intervals`
    );
  }

  const key = process.env.COINGECKO_API_KEY?.trim();
  if (!key) {
    throw new Error("COINGECKO_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    vs_currency: vsCurrency,
    days: mapping.days,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/ohlc?${params}`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "x-cg-demo-api-key": key,
        },
        next: { revalidate: 60 },
      }
    );

    if (res.status === 429) {
      throw new ProviderHttpError(429, "CoinGecko rate limit exceeded");
    }
    if (res.status === 451) {
      throw new ProviderHttpError(451, "CoinGecko unavailable (451)");
    }
    if (!res.ok) {
      throw new ProviderHttpError(res.status, `CoinGecko error ${res.status}`);
    }

    const data = (await res.json()) as number[][];
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("CoinGecko returned empty OHLC");
    }

    // [timestamp_ms, open, high, low, close] — no volume on this endpoint
    const candles: OhlcCandle[] = data.map((row) => ({
      time: Math.floor(Number(row[0]) / 1000),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: 0,
    }));

    const normalized = normalizeCandles(candles);
    if (normalized.length < 2) {
      throw new Error("Insufficient CoinGecko OHLC data");
    }

    return {
      coinId,
      symbol: meta.symbol,
      pair: `${coinId}/${vsCurrency}`,
      interval,
      candles: normalized,
      fetchedAt: new Date().toISOString(),
      source: "coingecko",
      delayed: true,
      note: `CoinGecko Demo OHLC · ${mapping.actualGranularity} · may be delayed`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch OHLC: Kraken first (all listed intervals), then CoinGecko for supported coarse ranges.
 * Does not call Binance.
 */
export async function fetchOhlc(
  coinId: string,
  interval: CandleInterval,
  vsCurrency: "usd" | "ngn" = "usd"
): Promise<OhlcResult> {
  const meta = SUPPORTED_ASSETS.find((a) => a.coingeckoId === coinId);
  if (!meta) throw new Error("Unknown asset");

  // Stables: no meaningful OHLC pair
  if (meta.symbol === "USDT" || meta.symbol === "USDC") {
    throw new Error("OHLC not available for stablecoins");
  }

  const errors: string[] = [];

  // 1) Kraken (USD). For NGN we scale later in the route.
  try {
    return await fetchKrakenOhlc(coinId, interval);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kraken failed";
    errors.push(`Kraken: ${msg}`);
    // Do not loop on 451
  }

  // 2) CoinGecko fallback when interval is representable
  try {
    // Prefer native vs_currency when possible
    return await fetchCoingeckoOhlc(coinId, interval, vsCurrency === "ngn" ? "ngn" : "usd");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "CoinGecko failed";
    errors.push(`CoinGecko: ${msg}`);
  }

  throw new Error(
    `Chart data unavailable. ${errors.join(" · ")}`
  );
}

export { ProviderHttpError };

/**
 * Server-only CoinGecko Demo API client.
 * Never import this module from Client Components.
 */

import { COINGECKO_IDS, SUPPORTED_ASSETS, type AssetSymbol } from "./assets";

const BASE = "https://api.coingecko.com/api/v3";

export type MarketCoin = {
  id: string;
  symbol: AssetSymbol;
  name: string;
  mark: string;
  color: string;
  image: string | null;
  currentPrice: number | null;
  priceChange24hPct: number | null;
  high24h: number | null;
  low24h: number | null;
  totalVolume: number | null;
  marketCap: number | null;
  lastUpdated: string | null;
};

export type MarketsResult = {
  coins: MarketCoin[];
  vsCurrency: "usd" | "ngn";
  fetchedAt: string;
  delayed: true;
};

export type ChartRange = "1h" | "24h" | "7d" | "1m" | "1y" | "all";

export const CHART_RANGES: ChartRange[] = ["1h", "24h", "7d", "1m", "1y", "all"];

/** Map UI range → CoinGecko `days` query (Demo plan). */
export function rangeToDays(range: ChartRange): string {
  switch (range) {
    case "1h":
    case "24h":
      return "1";
    case "7d":
      return "7";
    case "1m":
      return "30";
    case "1y":
      return "365";
    case "all":
      return "max";
    default:
      return "1";
  }
}

export function isChartRange(v: unknown): v is ChartRange {
  return typeof v === "string" && (CHART_RANGES as string[]).includes(v);
}

export function isSupportedCoinId(id: string): boolean {
  return COINGECKO_IDS.includes(id);
}

export type ChartPoint = { t: number; price: number };

export type MarketChartResult = {
  coinId: string;
  vsCurrency: "usd" | "ngn";
  range: ChartRange;
  points: ChartPoint[];
  fetchedAt: string;
  delayed: true;
  note?: string;
};

function getApiKey(): string | null {
  const key = process.env.COINGECKO_API_KEY;
  if (!key || !key.trim()) return null;
  return key.trim();
}

export function hasCoingeckoKey(): boolean {
  return Boolean(getApiKey());
}

async function cgFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = getApiKey();
  if (!key) {
    throw new Error("COINGECKO_API_KEY is not configured");
  }

  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "x-cg-demo-api-key": key,
        ...(init?.headers ?? {}),
      },
      next: { revalidate: 60 },
    });
  } finally {
    clearTimeout(timeout);
  }
}

type CgMarketRow = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number | null;
  price_change_percentage_24h?: number | null;
  high_24h?: number | null;
  low_24h?: number | null;
  total_volume?: number | null;
  market_cap?: number | null;
  last_updated?: string | null;
};

function mapRow(meta: (typeof SUPPORTED_ASSETS)[number], row?: CgMarketRow): MarketCoin {
  return {
    id: meta.coingeckoId,
    symbol: meta.symbol,
    name: meta.name,
    mark: meta.mark,
    color: meta.color,
    image: row?.image ?? null,
    currentPrice:
      typeof row?.current_price === "number" ? row.current_price : null,
    priceChange24hPct:
      typeof row?.price_change_percentage_24h === "number"
        ? row.price_change_percentage_24h
        : null,
    high24h: typeof row?.high_24h === "number" ? row.high_24h : null,
    low24h: typeof row?.low_24h === "number" ? row.low_24h : null,
    totalVolume: typeof row?.total_volume === "number" ? row.total_volume : null,
    marketCap: typeof row?.market_cap === "number" ? row.market_cap : null,
    lastUpdated: row?.last_updated ?? null,
  };
}

export async function fetchMarkets(
  vsCurrency: "usd" | "ngn" = "usd"
): Promise<MarketsResult> {
  const ids = COINGECKO_IDS.join(",");
  const params = new URLSearchParams({
    vs_currency: vsCurrency,
    ids,
    order: "market_cap_desc",
    per_page: String(COINGECKO_IDS.length),
    page: "1",
    sparkline: "false",
    price_change_percentage: "24h",
  });

  const res = await cgFetch(`/coins/markets?${params.toString()}`);
  if (res.status === 429) {
    throw new Error("CoinGecko rate limit exceeded. Try again shortly.");
  }
  if (!res.ok) {
    throw new Error(`CoinGecko error ${res.status}`);
  }

  const data = (await res.json()) as CgMarketRow[];
  if (!Array.isArray(data)) {
    throw new Error("Unexpected CoinGecko response shape");
  }

  const byId = new Map(data.map((row) => [row.id, row]));
  const coins = SUPPORTED_ASSETS.map((meta) => mapRow(meta, byId.get(meta.coingeckoId)));

  return {
    coins,
    vsCurrency,
    fetchedAt: new Date().toISOString(),
    delayed: true,
  };
}

/** Snapshot for a single supported coin. */
export async function fetchCoinMarket(
  coinId: string,
  vsCurrency: "usd" | "ngn" = "usd"
): Promise<MarketCoin> {
  if (!isSupportedCoinId(coinId)) {
    throw new Error("Unsupported coin");
  }
  const meta = SUPPORTED_ASSETS.find((a) => a.coingeckoId === coinId)!;
  const params = new URLSearchParams({
    vs_currency: vsCurrency,
    ids: coinId,
    sparkline: "false",
    price_change_percentage: "24h",
  });
  const res = await cgFetch(`/coins/markets?${params.toString()}`);
  if (res.status === 429) {
    throw new Error("CoinGecko rate limit exceeded. Try again shortly.");
  }
  if (!res.ok) {
    throw new Error(`CoinGecko error ${res.status}`);
  }
  const data = (await res.json()) as CgMarketRow[];
  const row = Array.isArray(data) ? data[0] : undefined;
  return mapRow(meta, row);
}

/**
 * Historical price series for a supported coin.
 * 1h: uses days=1 and keeps points from the last hour when timestamps allow.
 */
export async function fetchMarketChart(
  coinId: string,
  vsCurrency: "usd" | "ngn",
  range: ChartRange
): Promise<MarketChartResult> {
  if (!isSupportedCoinId(coinId)) {
    throw new Error("Unsupported coin");
  }
  if (!isChartRange(range)) {
    throw new Error("Invalid chart range");
  }

  const days = rangeToDays(range);
  const params = new URLSearchParams({
    vs_currency: vsCurrency,
    days,
  });

  const res = await cgFetch(
    `/coins/${encodeURIComponent(coinId)}/market_chart?${params.toString()}`
  );
  if (res.status === 429) {
    throw new Error("CoinGecko rate limit exceeded. Try again shortly.");
  }
  if (!res.ok) {
    throw new Error(`CoinGecko error ${res.status}`);
  }

  const data = (await res.json()) as { prices?: [number, number][] };
  if (!data || !Array.isArray(data.prices)) {
    throw new Error("Unexpected chart response shape");
  }

  let points: ChartPoint[] = data.prices
    .filter((p) => Array.isArray(p) && p.length >= 2)
    .map(([t, price]) => ({ t, price }));

  let note: string | undefined;
  if (range === "1h") {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const filtered = points.filter((p) => p.t >= cutoff);
    if (filtered.length >= 2) {
      points = filtered;
    } else {
      note =
        "True 1H resolution is limited on the Demo plan; showing densest available recent data.";
    }
  }

  return {
    coinId,
    vsCurrency,
    range,
    points,
    fetchedAt: new Date().toISOString(),
    delayed: true,
    note,
  };
}

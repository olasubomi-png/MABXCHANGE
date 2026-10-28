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
  /** Price in the requested vs_currency */
  currentPrice: number | null;
  priceChange24hPct: number | null;
  marketCap: number | null;
  lastUpdated: string | null;
};

export type MarketsResult = {
  coins: MarketCoin[];
  vsCurrency: "usd" | "ngn";
  fetchedAt: string;
  /** Demo plan data may be delayed */
  delayed: true;
};

function getApiKey(): string | null {
  const key = process.env.COINGECKO_API_KEY;
  if (!key || !key.trim()) return null;
  return key.trim();
}

async function cgFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = getApiKey();
  if (!key) {
    throw new Error("COINGECKO_API_KEY is not configured");
  }

  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "x-cg-demo-api-key": key,
        ...(init?.headers ?? {}),
      },
      // Next.js fetch cache — short revalidate to respect rate limits
      next: { revalidate: 60 },
    });
    return res;
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
  market_cap?: number | null;
  last_updated?: string | null;
};

/**
 * Fetch markets for our fixed asset list in USD or NGN.
 * vs_currency is provided by CoinGecko (including ngn) — no invented FX.
 */
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

  const coins: MarketCoin[] = SUPPORTED_ASSETS.map((meta) => {
    const row = byId.get(meta.coingeckoId);
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
      marketCap: typeof row?.market_cap === "number" ? row.market_cap : null,
      lastUpdated: row?.last_updated ?? null,
    };
  });

  return {
    coins,
    vsCurrency,
    fetchedAt: new Date().toISOString(),
    delayed: true,
  };
}

export function hasCoingeckoKey(): boolean {
  return Boolean(getApiKey());
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Currency } from "@/lib/currency";

export type ClientMarketCoin = {
  id: string;
  symbol: string;
  name: string;
  mark: string;
  color: string;
  image: string | null;
  currentPrice: number | null;
  priceChange24hPct: number | null;
  marketCap: number | null;
  lastUpdated: string | null;
};

export type MarketState = {
  coins: ClientMarketCoin[];
  loading: boolean;
  error: string | null;
  fetchedAt: string | null;
  delayed: boolean;
  refresh: () => void;
};

export function useMarketCoins(currency: Currency): MarketState {
  const vs = currency === "NGN" ? "ngn" : "usd";
  const [coins, setCoins] = useState<ClientMarketCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [delayed, setDelayed] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/market/coins?vs=${vs}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            body?.message || body?.error || `HTTP ${res.status}`
          );
        }
        return body;
      })
      .then((data) => {
        if (cancelled) return;
        setCoins(Array.isArray(data.coins) ? data.coins : []);
        setFetchedAt(data.fetchedAt ?? null);
        setDelayed(Boolean(data.delayed));
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCoins([]);
        setError(err instanceof Error ? err.message : "Failed to load markets");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vs, tick]);

  return { coins, loading, error, fetchedAt, delayed, refresh };
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SUPPORTED_ASSETS } from "@/lib/assets";
import {
  coinIdForKrakenPair,
  type ConnectionStatus,
  isNewerTick,
  KRAKEN_WS_PAIRS,
  type LiveTicker,
} from "@/lib/live-market";
import { useCurrency } from "./currency-provider";
import { formatMoneyNative } from "@/lib/currency";

type LiveMarketContextValue = {
  status: ConnectionStatus;
  lastUpdateAt: number | null;
  tickers: Record<string, LiveTicker>;
  getTicker: (coinId: string) => LiveTicker | null;
  getPriceUsd: (coinId: string) => number | null;
  formatPrice: (coinId: string) => string;
  providerLabel: string;
};

const LiveMarketContext = createContext<LiveMarketContextValue | null>(null);

const WS_URL = "wss://ws.kraken.com";
const POLL_MS = 45_000;
const MAX_BACKOFF_MS = 30_000;

function parseKrakenTickerMessage(
  msg: unknown
): { pair: string; price: number; high?: number; low?: number; volume?: number } | null {
  if (!Array.isArray(msg) || msg.length < 4) return null;
  // [channelID, data, channelName, pair]
  const channelName = msg[msg.length - 2];
  const pair = msg[msg.length - 1];
  if (channelName !== "ticker" || typeof pair !== "string") return null;
  const data = msg[1] as Record<string, unknown>;
  if (!data || typeof data !== "object") return null;
  // c = last trade closed [price, lot volume]
  const c = data.c as string[] | undefined;
  const price = c?.[0] ? Number(c[0]) : NaN;
  if (!Number.isFinite(price) || price <= 0) return null;
  const h = data.h as string[] | undefined; // today / 24h high
  const l = data.l as string[] | undefined;
  const v = data.v as string[] | undefined; // volume
  return {
    pair,
    price,
    high: h?.[1] ? Number(h[1]) : undefined,
    low: l?.[1] ? Number(l[1]) : undefined,
    volume: v?.[1] ? Number(v[1]) : undefined,
  };
}

export function LiveMarketProvider({ children }: { children: ReactNode }) {
  const { currency } = useCurrency();
  const [status, setStatus] = useState<ConnectionStatus>("delayed");
  const [lastUpdateAt, setLastUpdateAt] = useState<number | null>(null);
  const [tickers, setTickers] = useState<Record<string, LiveTicker>>({});
  const [providerLabel, setProviderLabel] = useState("Connecting…");

  const tickersRef = useRef(tickers);
  tickersRef.current = tickers;
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intentionalClose = useRef(false);

  const mergeTicker = useCallback((next: LiveTicker) => {
    setTickers((prev) => {
      const existing = prev[next.coinId];
      if (existing && !isNewerTick(existing.updatedAt, next.updatedAt)) {
        return prev;
      }
      return { ...prev, [next.coinId]: next };
    });
    setLastUpdateAt(next.updatedAt);
  }, []);

  /** REST snapshot from our CoinGecko-backed API */
  const loadSnapshot = useCallback(async () => {
    try {
      const res = await fetch("/api/market/coins?vs=usd");
      if (!res.ok) throw new Error(`snapshot ${res.status}`);
      const body = await res.json();
      const coins = Array.isArray(body.coins) ? body.coins : [];
      const now = Date.now();
      for (const c of coins) {
        if (typeof c.currentPrice !== "number" || c.currentPrice <= 0) continue;
        mergeTicker({
          coinId: c.id,
          symbol: c.symbol,
          priceUsd: c.currentPrice,
          change24hPct:
            typeof c.priceChange24hPct === "number" ? c.priceChange24hPct : null,
          high24h: typeof c.high24h === "number" ? c.high24h : null,
          low24h: typeof c.low24h === "number" ? c.low24h : null,
          volume24h: typeof c.totalVolume === "number" ? c.totalVolume : null,
          updatedAt: now,
          source: "coingecko",
        });
      }
      setProviderLabel("CoinGecko snapshot · Kraken stream when live");
      return true;
    } catch {
      return false;
    }
  }, [mergeTicker]);

  const startPoll = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      void loadSnapshot().then((ok) => {
        if (ok) {
          setStatus((s) => (s === "live" ? s : "delayed"));
          setProviderLabel("Polling snapshot (delayed)");
        }
      });
    }, POLL_MS);
  }, [loadSnapshot]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const connectWs = useCallback(() => {
    if (typeof window === "undefined") return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    intentionalClose.current = false;
    setStatus("reconnecting");

    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_URL);
    } catch {
      setStatus("delayed");
      startPoll();
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      backoffRef.current = 1000;
      const pairs = Object.values(KRAKEN_WS_PAIRS).filter(Boolean) as string[];
      ws.send(
        JSON.stringify({
          event: "subscribe",
          pair: pairs,
          subscription: { name: "ticker" },
        })
      );
      setStatus("live");
      setProviderLabel("Kraken WebSocket ticker");
      stopPoll();
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as unknown;
        if (msg && typeof msg === "object" && !Array.isArray(msg)) {
          const event = (msg as { event?: string }).event;
          if (event === "heartbeat" || event === "systemStatus" || event === "subscriptionStatus") {
            return;
          }
        }
        const parsed = parseKrakenTickerMessage(msg);
        if (!parsed) return;
        const coinId = coinIdForKrakenPair(parsed.pair);
        if (!coinId) return;
        const meta = SUPPORTED_ASSETS.find((a) => a.coingeckoId === coinId);
        if (!meta) return;
        const prev = tickersRef.current[coinId];
        mergeTicker({
          coinId,
          symbol: meta.symbol,
          priceUsd: parsed.price,
          change24hPct: prev?.change24hPct ?? null,
          high24h: parsed.high ?? prev?.high24h ?? null,
          low24h: parsed.low ?? prev?.low24h ?? null,
          volume24h: parsed.volume ?? prev?.volume24h ?? null,
          updatedAt: Date.now(),
          source: "kraken-ws",
        });
        setStatus("live");
        setProviderLabel("Kraken WebSocket ticker");
      } catch {
        /* ignore malformed */
      }
    };

    ws.onerror = () => {
      /* onclose will handle reconnect */
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (intentionalClose.current) return;
      setStatus("reconnecting");
      startPoll();
      const delay =
        backoffRef.current + Math.floor(Math.random() * 400);
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      window.setTimeout(() => {
        if (!intentionalClose.current) connectWs();
      }, delay);
    };
  }, [mergeTicker, startPoll, stopPoll]);

  useEffect(() => {
    void loadSnapshot().then(() => {
      setStatus((s) => (s === "live" ? s : "delayed"));
    });
    connectWs();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        void loadSnapshot();
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectWs();
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      intentionalClose.current = true;
      document.removeEventListener("visibilitychange", onVis);
      stopPoll();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWs, loadSnapshot, stopPoll]);

  const getTicker = useCallback(
    (coinId: string) => tickers[coinId] ?? null,
    [tickers]
  );

  const getPriceUsd = useCallback(
    (coinId: string) => tickers[coinId]?.priceUsd ?? null,
    [tickers]
  );

  const formatPrice = useCallback(
    (coinId: string) => {
      const t = tickers[coinId];
      if (!t) return "—";
      // Display currency: USD native; NGN needs rate — use formatMoneyNative only for USD
      // For NGN we still show USD price with note via consumer; provider keeps USD
      if (currency === "USD") {
        return formatMoneyNative(t.priceUsd, "USD");
      }
      // Consumers that need NGN should use markets API with vs=ngn; live stream is USD
      return formatMoneyNative(t.priceUsd, "USD");
    },
    [tickers, currency]
  );

  const value = useMemo(
    () => ({
      status,
      lastUpdateAt,
      tickers,
      getTicker,
      getPriceUsd,
      formatPrice,
      providerLabel,
    }),
    [
      status,
      lastUpdateAt,
      tickers,
      getTicker,
      getPriceUsd,
      formatPrice,
      providerLabel,
    ]
  );

  return (
    <LiveMarketContext.Provider value={value}>
      {children}
    </LiveMarketContext.Provider>
  );
}

export function useLiveMarket(): LiveMarketContextValue {
  const ctx = useContext(LiveMarketContext);
  if (!ctx) {
    throw new Error("useLiveMarket must be used within LiveMarketProvider");
  }
  return ctx;
}

/** Compact connection badge for headers */
export function LiveStatusBadge() {
  const { status, lastUpdateAt, providerLabel } = useLiveMarket();
  const color =
    status === "live"
      ? "text-[var(--mx-success)]"
      : status === "reconnecting"
        ? "text-[var(--mx-warning)]"
        : status === "delayed"
          ? "text-[var(--mx-warning)]"
          : "text-[var(--mx-text-soft)]";
  const label =
    status === "live"
      ? "Live"
      : status === "reconnecting"
        ? "Reconnecting"
        : status === "delayed"
          ? "Delayed"
          : "Offline";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${color}`}
      title={providerLabel}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "live"
            ? "bg-[var(--mx-success)] animate-pulse"
            : status === "offline"
              ? "bg-[var(--mx-text-soft)]"
              : "bg-[var(--mx-warning)]"
        }`}
      />
      {label}
      {lastUpdateAt ? (
        <span className="font-normal normal-case text-[var(--mx-text-soft)]">
          {new Date(lastUpdateAt).toLocaleTimeString()}
        </span>
      ) : null}
    </span>
  );
}

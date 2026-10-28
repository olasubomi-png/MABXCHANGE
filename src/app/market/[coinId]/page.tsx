"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowLeftRight, Repeat2 } from "lucide-react";
import { SUPPORTED_ASSETS } from "@/lib/assets";
import { isSupportedCoinId } from "@/lib/coingecko";
import {
  CANDLE_INTERVALS,
  type CandleInterval,
  type OhlcCandle,
} from "@/lib/ohlc";
import { formatChangePct, formatMoneyNative } from "@/lib/currency";
import { CurrencyToggle } from "@/components/currency-toggle";
import { useCurrency } from "@/components/currency-provider";
import { DemoBanner } from "@/components/demo-banner";
import { DemoLabel } from "@/components/ui";

const CandlestickChart = dynamic(
  () =>
    import("@/components/candlestick-chart").then((m) => m.CandlestickChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] animate-pulse items-center justify-center rounded-xl bg-[var(--mx-surface-2)] text-sm text-[var(--mx-text-muted)]">
        Loading chart…
      </div>
    ),
  }
);

type CoinSnap = {
  id: string;
  symbol: string;
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

const INTERVAL_LABELS: Record<CandleInterval, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1D",
  "1w": "1W",
};

export default function MarketCoinPage() {
  const params = useParams();
  const coinId = String(params?.coinId ?? "").toLowerCase();
  const supported = isSupportedCoinId(coinId);
  const meta = SUPPORTED_ASSETS.find((a) => a.coingeckoId === coinId);
  const hasOhlc = Boolean(meta && meta.symbol !== "USDT" && meta.symbol !== "USDC");

  const { currency } = useCurrency();
  const vs = currency === "NGN" ? "ngn" : "usd";

  const [interval, setInterval] = useState<CandleInterval>("1h");
  const [mode, setMode] = useState<"candle" | "line">("candle");
  const [showMa, setShowMa] = useState(true);
  const [showEma, setShowEma] = useState(false);

  const [coin, setCoin] = useState<CoinSnap | null>(null);
  const [candles, setCandles] = useState<OhlcCandle[]>([]);
  const [coinLoading, setCoinLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [coinError, setCoinError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartNote, setChartNote] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const loadCoin = useCallback(() => {
    if (!supported) return;
    setCoinLoading(true);
    setCoinError(null);
    fetch(`/api/market/coin?id=${encodeURIComponent(coinId)}&vs=${vs}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(body?.message || body?.error || `HTTP ${res.status}`);
        return body;
      })
      .then((data) => {
        setCoin(data.coin ?? null);
        setFetchedAt(data.fetchedAt ?? null);
        setCoinLoading(false);
      })
      .catch((err: unknown) => {
        setCoin(null);
        setCoinError(
          err instanceof Error ? err.message : "Failed to load coin"
        );
        setCoinLoading(false);
      });
  }, [coinId, vs, supported]);

  const loadOhlc = useCallback(() => {
    if (!supported || !hasOhlc) {
      setChartLoading(false);
      setChartError(
        hasOhlc ? null : "Candlestick OHLC is not available for this asset"
      );
      setCandles([]);
      return;
    }
    setChartLoading(true);
    setChartError(null);
    fetch(
      `/api/market/ohlc?id=${encodeURIComponent(coinId)}&interval=${interval}&vs=${vs}`
    )
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(body?.message || body?.error || `HTTP ${res.status}`);
        return body;
      })
      .then((data) => {
        setCandles(Array.isArray(data.candles) ? data.candles : []);
        const notes = [data.note, data.fxNote].filter(Boolean).join(" · ");
        setChartNote(notes || null);
        setFetchedAt(data.fetchedAt ?? null);
        setChartLoading(false);
      })
      .catch((err: unknown) => {
        setCandles([]);
        setChartError(
          err instanceof Error ? err.message : "Failed to load OHLC"
        );
        setChartLoading(false);
      });
  }, [coinId, interval, vs, supported, hasOhlc]);

  useEffect(() => {
    loadCoin();
  }, [loadCoin]);

  useEffect(() => {
    loadOhlc();
  }, [loadOhlc]);

  if (!supported || !meta) {
    return (
      <div className="space-y-5">
        <Link
          href="/markets"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--mx-primary)]"
        >
          <ArrowLeft size={16} /> Back to Markets
        </Link>
        <div className="mx-card px-6 py-12 text-center">
          <h1 className="text-lg font-semibold text-[var(--mx-text)]">
            Coin not found
          </h1>
          <p className="mt-2 text-sm text-[var(--mx-text-muted)]">
            This asset is not in the MABXCHANGE supported list.
          </p>
        </div>
      </div>
    );
  }

  const positive =
    coin?.priceChange24hPct !== null &&
    coin?.priceChange24hPct !== undefined &&
    coin.priceChange24hPct >= 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/markets"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--mx-primary)]"
        >
          <ArrowLeft size={16} /> Markets
        </Link>
        <CurrencyToggle variant="default" />
      </div>

      <DemoBanner compact />

      <div className="mx-card flex items-center gap-3 p-4 sm:p-5">
        {coin?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coin.image}
            alt=""
            className="h-12 w-12 rounded-full"
            width={48}
            height={48}
          />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.mark}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-[var(--mx-text)]">
            {meta.name}{" "}
            <span className="text-sm font-medium text-[var(--mx-text-muted)]">
              {meta.symbol}
            </span>
          </h1>
          {coinLoading ? (
            <p className="mt-1 text-sm text-[var(--mx-text-soft)]">Loading…</p>
          ) : coinError ? (
            <p className="mt-1 text-sm text-[var(--mx-warning)]">{coinError}</p>
          ) : (
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--mx-text)]">
                {coin?.currentPrice != null
                  ? formatMoneyNative(coin.currentPrice, currency)
                  : "—"}
              </span>
              <span
                className={`text-sm font-semibold ${
                  coin?.priceChange24hPct == null
                    ? "text-[var(--mx-text-soft)]"
                    : positive
                      ? "text-[var(--mx-success)]"
                      : "text-[var(--mx-danger)]"
                }`}
              >
                {formatChangePct(coin?.priceChange24hPct ?? null)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-card space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {CANDLE_INTERVALS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setInterval(r)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  interval === r
                    ? "bg-[var(--mx-primary)] text-white"
                    : "bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)] hover:bg-[var(--mx-border)]"
                }`}
              >
                {INTERVAL_LABELS[r]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setMode("candle")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                mode === "candle"
                  ? "bg-[var(--mx-primary)] text-white"
                  : "bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)]"
              }`}
            >
              Candles
            </button>
            <button
              type="button"
              onClick={() => setMode("line")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                mode === "line"
                  ? "bg-[var(--mx-primary)] text-white"
                  : "bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)]"
              }`}
            >
              Line
            </button>
            <button
              type="button"
              onClick={() => setShowMa((v) => !v)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                showMa
                  ? "bg-[var(--mx-warning-soft)] text-[var(--mx-warning)]"
                  : "bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)]"
              }`}
            >
              MA20
            </button>
            <button
              type="button"
              onClick={() => setShowEma((v) => !v)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                showEma
                  ? "bg-[rgba(139,92,246,0.2)] text-[#a78bfa]"
                  : "bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)]"
              }`}
            >
              EMA20
            </button>
          </div>
        </div>

        <CandlestickChart
          candles={candles}
          currency={currency}
          interval={interval}
          loading={chartLoading}
          error={chartError}
          note={chartNote}
          showMa={showMa}
          showEma={showEma}
          mode={mode}
        />

        <p className="text-center text-[11px] text-[var(--mx-text-soft)]">
          {fetchedAt
            ? `Updated ${new Date(fetchedAt).toLocaleTimeString()} · Kraken / CoinGecko OHLC`
            : "Market data · Not investment advice"}
        </p>
      </div>

      <div className="mx-card divide-y divide-[var(--mx-border)] overflow-hidden">
        {[
          {
            label: "24h high",
            value:
              coin?.high24h != null
                ? formatMoneyNative(coin.high24h, currency)
                : "—",
          },
          {
            label: "24h low",
            value:
              coin?.low24h != null
                ? formatMoneyNative(coin.low24h, currency)
                : "—",
          },
          {
            label: "Market cap",
            value:
              coin?.marketCap != null
                ? formatMoneyNative(coin.marketCap, currency)
                : "—",
          },
          {
            label: "24h volume",
            value:
              coin?.totalVolume != null
                ? formatMoneyNative(coin.totalVolume, currency)
                : "—",
          },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-sm text-[var(--mx-text-muted)]">
              {row.label}
            </span>
            <span className="text-sm font-semibold text-[var(--mx-text)]">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/trade?symbol=${meta.symbol}`}
          className="mx-btn mx-btn-primary flex items-center justify-center gap-2 py-3"
        >
          <ArrowLeftRight size={16} /> Trade
        </Link>
        <Link
          href={`/swap?from=${meta.symbol}`}
          className="mx-btn mx-btn-secondary flex items-center justify-center gap-2 py-3"
        >
          <Repeat2 size={16} /> Swap
        </Link>
      </div>

      <DemoLabel>
        Market information only · Sandbox trading · No real funds
      </DemoLabel>
    </div>
  );
}

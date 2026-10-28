"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { formatChangePct, formatMoneyNative } from "@/lib/currency";
import { DemoBanner } from "@/components/demo-banner";
import { DemoLabel, PageHeader } from "@/components/ui";
import { CurrencyToggle } from "@/components/currency-toggle";
import { useCurrency } from "@/components/currency-provider";
import { useMarketCoins } from "@/hooks/use-market-coins";
import { useLiveMarket } from "@/components/live-market-provider";

const tabs = ["All", "Top Gainers", "Top Losers"] as const;

export default function MarketsPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const { currency } = useCurrency();
  const { coins, loading, error, fetchedAt, delayed, refresh } =
    useMarketCoins(currency);
  const live = useLiveMarket();

  const list = useMemo(() => {
    let rows = coins.filter((c) => c.symbol !== "USDT" && c.symbol !== "USDC");
    if (tab === "Top Gainers") {
      rows = rows.filter(
        (c) => c.priceChange24hPct !== null && c.priceChange24hPct > 0
      );
    }
    if (tab === "Top Losers") {
      rows = rows.filter(
        (c) => c.priceChange24hPct !== null && c.priceChange24hPct < 0
      );
    }
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.symbol.toLowerCase().includes(s) ||
          c.name.toLowerCase().includes(s)
      );
    }
    return rows;
  }, [coins, q, tab]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Markets"
          subtitle="CoinGecko Demo · Prices may be delayed"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-[var(--mx-border)] bg-[var(--mx-surface-2)] p-2 text-[var(--mx-text-muted)] hover:text-[var(--mx-text)] disabled:opacity-50"
            aria-label="Refresh prices"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <CurrencyToggle variant="default" />
        </div>
      </div>
      <DemoBanner compact />

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mx-text-soft)]"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search coins…"
          className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] py-2.5 pl-10 pr-3 text-sm text-[var(--mx-text)] outline-none placeholder:text-[var(--mx-text-soft)] focus:border-[var(--mx-primary)] focus:ring-2 focus:ring-[var(--mx-primary)]/25"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto mx-scroll-hide">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t
                ? "bg-[var(--mx-primary)] text-white"
                : "bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)] hover:bg-[var(--mx-border)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl mx-banner-warning px-3.5 py-2.5 text-sm">
          {error}
        </div>
      )}

      <div className="mx-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-[var(--mx-border)] px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--mx-text-soft)]">
          <span>Coin</span>
          <span className="text-right">Price ({currency})</span>
          <span className="w-16 text-right">24h</span>
        </div>

        {loading && list.length === 0 ? (
          <div className="space-y-3 px-4 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-[var(--mx-surface-2)]"
              />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--mx-border)]">
            {list.map((a, i) => {
              const liveT = live.getTicker(a.id);
              const changePct = liveT?.change24hPct ?? a.priceChange24hPct;
              const positive =
                changePct !== null && changePct >= 0;
              return (
                <li key={a.symbol}>
                  <Link
                  href={`/market/${a.id}`}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-3.5 transition hover:bg-[var(--mx-surface-2)]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-4 text-xs text-[var(--mx-text-soft)]">
                      {i + 1}
                    </span>
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: a.color }}
                    >
                      {a.mark}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--mx-text)]">
                        {a.name}
                      </p>
                      <p className="text-xs text-[var(--mx-text-muted)]">
                        {a.symbol}
                      </p>
                    </div>
                  </div>
                  <p className="text-right text-sm font-semibold text-[var(--mx-text)]">
                    {(() => {
                      const livePx = live.getPriceUsd(a.id);
                      if (currency === "USD" && livePx != null) {
                        return formatMoneyNative(livePx, "USD");
                      }
                      return a.currentPrice !== null
                        ? formatMoneyNative(a.currentPrice, currency)
                        : "—";
                    })()}
                  </p>
                  <p
                    className={`w-16 text-right text-xs font-semibold ${
                      changePct === null
                        ? "text-[var(--mx-text-soft)]"
                        : positive
                          ? "text-[var(--mx-success)]"
                          : "text-[var(--mx-danger)]"
                    }`}
                  >
                    {formatChangePct(changePct)}
                  </p>
                  </Link>
                </li>
              );
            })}
            {!loading && list.length === 0 && !error && (
              <li className="px-4 py-8 text-center text-sm text-[var(--mx-text-muted)]">
                No coins match your search
              </li>
            )}
          </ul>
        )}

        <div className="border-t border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-4 py-2.5 text-center text-[11px] text-[var(--mx-text-soft)]">
          {fetchedAt
            ? `Updated ${new Date(fetchedAt).toLocaleTimeString()}${delayed ? " · Demo plan (may be delayed)" : ""}`
            : "CoinGecko Demo · Not a trading venue"}
        </div>
      </div>
      <DemoLabel />
    </div>
  );
}

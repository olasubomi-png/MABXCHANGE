"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { SUPPORTED_ASSETS } from "@/lib/assets";
import { formatMoneyNative } from "@/lib/currency";
import { DemoBanner } from "@/components/demo-banner";
import { DemoLabel, PageHeader } from "@/components/ui";
import { useCurrency } from "@/components/currency-provider";
import { useMarketCoins } from "@/hooks/use-market-coins";

function TradePageInner() {
  const { currency } = useCurrency();
  const { coins, loading, error } = useMarketCoins(currency);
  const searchParams = useSearchParams();
  const initialSymbol = (searchParams.get("symbol") || "BTC").toUpperCase();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [symbol, setSymbol] = useState(initialSymbol);
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const tradeable = SUPPORTED_ASSETS.filter(
    (a) => a.symbol !== "USDT" && a.symbol !== "USDC"
  );

  const market = useMemo(
    () => coins.find((c) => c.symbol === symbol),
    [coins, symbol]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(
      "Trading is disabled in this demo. No orders are submitted and no funds move."
    );
  }

  const priceLabel =
    market?.currentPrice != null
      ? formatMoneyNative(market.currentPrice, currency)
      : loading
        ? "Loading…"
        : "—";

  return (
    <div className="space-y-5">
      <PageHeader title="Trade" subtitle="Buy & sell · Sandbox only" />
      <DemoBanner compact />

      {error && (
        <div className="rounded-xl mx-banner-warning px-3.5 py-2.5 text-sm">
          Live price unavailable: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-card space-y-4 p-4 sm:p-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--mx-text-soft)]">
            Select coin
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-3 py-2.5 text-sm text-[var(--mx-text)] outline-none focus:border-[var(--mx-primary)]"
          >
            {tradeable.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.name} ({a.symbol})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              side === "buy"
                ? "bg-[var(--mx-primary)] text-white"
                : "bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)]"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              side === "sell"
                ? "bg-[var(--mx-danger)] text-white"
                : "bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)]"
            }`}
          >
            Sell
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--mx-text-soft)]">
            Amount ({currency})
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-3 py-2.5 text-sm text-[var(--mx-text)] outline-none placeholder:text-[var(--mx-text-soft)] focus:border-[var(--mx-primary)]"
          />
        </div>

        <p className="text-xs text-[var(--mx-text-soft)]">
          Market price: {priceLabel} · You&apos;ll receive (approx.) —
        </p>

        {notice && (
          <div className="rounded-xl mx-banner-warning px-3.5 py-2.5 text-sm">
            {notice}
          </div>
        )}

        <button type="submit" className="mx-btn mx-btn-primary w-full py-3">
          {side === "buy" ? `Buy ${symbol}` : `Sell ${symbol}`}
        </button>

        <p className="text-center text-[11px] text-[var(--mx-text-soft)]">
          Demo account · No real money · Prices from CoinGecko Demo
        </p>
      </form>
      <DemoLabel />
    </div>
  );
}


export default function TradePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--mx-text-muted)]">
          Loading…
        </div>
      }
    >
      <TradePageInner />
    </Suspense>
  );
}

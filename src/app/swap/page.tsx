"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { SUPPORTED_ASSETS } from "@/lib/assets";
import { formatMoneyNative } from "@/lib/currency";
import { DemoBanner } from "@/components/demo-banner";
import { DemoLabel, PageHeader } from "@/components/ui";
import { useCurrency } from "@/components/currency-provider";
import { useMarketCoins } from "@/hooks/use-market-coins";

export default function SwapPage() {
  const { currency } = useCurrency();
  const { coins, loading, error } = useMarketCoins(currency);
  const cryptoAssets = SUPPORTED_ASSETS.filter(
    (a) => a.symbol !== "USDT" && a.symbol !== "USDC"
  );

  const searchParams = useSearchParams();
  const initialFrom = (searchParams.get("from") || "BTC").toUpperCase();
  const [fromSymbol, setFromSymbol] = useState(initialFrom);
  const [toTarget, setToTarget] = useState<"NGN" | "USDT" | "USDC">("NGN");
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const market = useMemo(
    () => coins.find((c) => c.symbol === fromSymbol),
    [coins, fromSymbol]
  );

  const qty = Number(amount);
  const validQty = Number.isFinite(qty) && qty > 0;

  const estimate = useMemo(() => {
    if (!validQty || market?.currentPrice == null) return null;
    const value = qty * market.currentPrice;
    // Price is already in display currency from CoinGecko (usd or ngn)
    if (toTarget === "NGN") {
      if (currency === "NGN") {
        return {
          label: "Estimated NGN (CoinGecko Demo)",
          value: formatMoneyNative(value, "NGN"),
          detail: "Quote uses CoinGecko ngn price · Not executed",
        };
      }
      // Display currency is USD — we cannot invent NGN without ngn feed
      return {
        label: "Estimated value (USD)",
        value: formatMoneyNative(value, "USD"),
        detail:
          "Switch display currency to NGN to see CoinGecko NGN quotes. Not executed.",
      };
    }
    // stablecoins approx 1:1 with USD value of the crypto leg
    const usdApprox =
      currency === "USD" ? value : null; // if NGN display, value is in NGN — avoid false USDT qty
    if (usdApprox === null) {
      return {
        label: `Estimated ${toTarget}`,
        value: "—",
        detail:
          "Switch to USD display for stablecoin estimates when price is in NGN.",
      };
    }
    return {
      label: `Estimated ${toTarget} (sample ~$1)`,
      value: `${usdApprox.toFixed(2)} ${toTarget}`,
      detail: "Illustrative stablecoin parity · Sandbox · Not executed",
    };
  }, [validQty, qty, market, toTarget, currency]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (!validQty) {
      setNotice("Enter a valid amount greater than zero.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setNotice(
        "Swap not executed. Sandbox balance is 0 — insufficient funds. No ledger entry was created."
      );
    }, 400);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Swap"
        subtitle="Crypto → NGN or stables · Sandbox only"
      />
      <DemoBanner compact />

      {error && (
        <div className="rounded-xl mx-banner-warning px-3.5 py-2.5 text-sm">
          Live price unavailable: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-card space-y-4 p-4 sm:p-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--mx-text-soft)]">
            From
          </label>
          <select
            value={fromSymbol}
            onChange={(e) => setFromSymbol(e.target.value)}
            className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-3 py-2.5 text-sm text-[var(--mx-text)] outline-none focus:border-[var(--mx-primary)]"
          >
            {cryptoAssets.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.name} ({a.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--mx-text-soft)]">
            Amount ({fromSymbol})
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
          <p className="mt-1 text-[11px] text-[var(--mx-text-soft)]">
            Market:{" "}
            {market?.currentPrice != null
              ? formatMoneyNative(market.currentPrice, currency)
              : loading
                ? "Loading…"
                : "—"}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--mx-border)] bg-[var(--mx-surface-2)] text-[var(--mx-primary)]">
            <ArrowDownUp size={18} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--mx-text-soft)]">
            To
          </label>
          <select
            value={toTarget}
            onChange={(e) =>
              setToTarget(e.target.value as "NGN" | "USDT" | "USDC")
            }
            className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-3 py-2.5 text-sm text-[var(--mx-text)] outline-none focus:border-[var(--mx-primary)]"
          >
            <option value="NGN">Naira (NGN ₦)</option>
            <option value="USDT">Tether (USDT)</option>
            <option value="USDC">USD Coin (USDC)</option>
          </select>
        </div>

        {estimate && (
          <div className="rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-4 py-3">
            <p className="text-xs text-[var(--mx-text-soft)]">{estimate.label}</p>
            <p className="mt-1 text-lg font-bold text-[var(--mx-text)]">
              {estimate.value}
            </p>
            <p className="mt-1 text-[11px] text-[var(--mx-text-soft)]">
              {estimate.detail}
            </p>
          </div>
        )}

        {notice && (
          <div className="rounded-xl mx-banner-warning px-3.5 py-2.5 text-sm">
            {notice}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mx-btn mx-btn-primary w-full py-3 disabled:opacity-60"
        >
          {submitting ? "Checking…" : "Preview swap (sandbox)"}
        </button>

        <p className="text-center text-[11px] text-[var(--mx-text-soft)]">
          Simulated only · CoinGecko Demo prices · No real conversion
        </p>
      </form>
      <DemoLabel />
    </div>
  );
}

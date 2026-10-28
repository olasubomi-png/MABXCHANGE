"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { SUPPORTED_ASSETS } from "@/lib/assets";
import { SAMPLE_USD_NGN } from "@/lib/currency";
import { DemoBanner } from "@/components/demo-banner";
import { DemoLabel, PageHeader } from "@/components/ui";
import { useCurrency } from "@/components/currency-provider";

/** Parse illustrative sample USD price strings like "$67,432.12" */
function parseSampleUsd(price: string): number {
  const n = Number(price.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function SwapPage() {
  const { format, currency } = useCurrency();
  const cryptoAssets = SUPPORTED_ASSETS.filter(
    (a) => a.symbol !== "USDT" && a.symbol !== "USDC"
  );

  const [fromSymbol, setFromSymbol] = useState("BTC");
  const [toTarget, setToTarget] = useState<"NGN" | "USDT" | "USDC">("NGN");
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fromAsset = cryptoAssets.find((a) => a.symbol === fromSymbol);
  const qty = Number(amount);
  const validQty = Number.isFinite(qty) && qty > 0;

  const estimate = useMemo(() => {
    if (!fromAsset || !validQty) return null;
    const usdPerUnit = parseSampleUsd(fromAsset.samplePrice);
    const usdValue = qty * usdPerUnit;
    if (toTarget === "NGN") {
      return {
        label: "Estimated NGN (sample)",
        value: formatMoneyNgn(usdValue),
        detail: `Sample rate ~ ₦${SAMPLE_USD_NGN.toLocaleString()}/USD · Not live FX`,
      };
    }
    // stablecoins ~ $1
    return {
      label: `Estimated ${toTarget} (sample)`,
      value: `${usdValue.toFixed(2)} ${toTarget}`,
      detail: "Sample quote · Sandbox only · Not executed",
    };
  }, [fromAsset, validQty, qty, toTarget]);

  function formatMoneyNgn(usd: number) {
    const ngn = usd * SAMPLE_USD_NGN;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(ngn);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);

    if (!validQty) {
      setNotice("Enter a valid amount greater than zero.");
      return;
    }

    // Sandbox balances are always 0 — insufficient funds
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setNotice(
        "Swap not executed. Sandbox balance is 0 — insufficient funds. No ledger entry was created and no real conversion occurred."
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
            <p className="mt-1 text-[11px] text-[var(--mx-text-soft)]">
              Display currency preference: {currency} ({format(0)} zero-balance)
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
          Simulated quotes only · No real conversion · Sample FX not live
        </p>
      </form>
      <DemoLabel />
    </div>
  );
}

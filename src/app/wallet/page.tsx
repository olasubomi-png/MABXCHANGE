"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Repeat } from "lucide-react";
import { SUPPORTED_ASSETS } from "@/lib/assets";
import { DemoBanner } from "@/components/demo-banner";
import { DemoLabel, PageHeader } from "@/components/ui";

export default function WalletPage() {
  const [notice, setNotice] = useState<string | null>(null);

  function explain(action: string) {
    setNotice(
      `${action} is unavailable in the demo. No funds move and no backend order is created.`
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Wallet" subtitle="Sandbox balances · Demo only" />
      <DemoBanner compact />

      <div className="mx-card overflow-hidden">
        <div className="bg-gradient-to-br from-[var(--mx-primary)] to-[#1a3fd9] px-5 py-5 text-white">
          <p className="text-sm text-blue-100">Total balance</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">$0.00</p>
          <p className="mt-1 text-xs text-blue-200">+0.00% (24h) · Demo</p>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4">
          {[
            { label: "Deposit", icon: ArrowDownToLine },
            { label: "Withdraw", icon: ArrowUpFromLine },
            { label: "Transfer", icon: Repeat },
          ].map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => explain(a.label)}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] py-3 text-xs font-semibold text-[var(--mx-text)] transition hover:border-[var(--mx-border-strong)]"
            >
              <a.icon size={18} className="text-[var(--mx-primary)]" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="rounded-xl mx-banner-warning px-3.5 py-2.5 text-sm">
          {notice}
        </div>
      )}

      <div className="mx-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--mx-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--mx-text)]">
            Your assets
          </h2>
          <span className="text-[11px] text-[var(--mx-text-soft)]">Demo</span>
        </div>
        <ul className="divide-y divide-[var(--mx-border)]">
          {SUPPORTED_ASSETS.slice(0, 4).map((a) => (
            <li
              key={a.symbol}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: a.color }}
              >
                {a.mark}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--mx-text)]">
                  {a.name}
                </p>
                <p className="text-xs text-[var(--mx-text-muted)]">
                  {a.symbol}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--mx-text)]">
                  0.0000
                </p>
                <p className="text-xs text-[var(--mx-text-soft)]">$0.00</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <DemoLabel />
    </div>
  );
}

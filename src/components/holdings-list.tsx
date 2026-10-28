"use client";

import Link from "next/link";
import { SUPPORTED_ASSETS } from "@/lib/assets";
import { useCurrency } from "./currency-provider";

export function HoldingsList() {
  const { format } = useCurrency();
  const assets = SUPPORTED_ASSETS.filter(
    (a) => a.symbol === "BTC" || a.symbol === "ETH" || a.symbol === "USDT"
  );

  return (
    <div className="mx-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--mx-border)] px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-[var(--mx-text)]">
          Your assets
        </h2>
        <Link
          href="/wallet"
          className="text-xs font-medium text-[var(--mx-primary)] hover:underline"
        >
          View all
        </Link>
      </div>
      <ul className="divide-y divide-[var(--mx-border)]">
        {assets.map((asset) => (
          <li
            key={asset.symbol}
            className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
              style={{ backgroundColor: asset.color }}
              aria-hidden
            >
              {asset.mark}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--mx-text)]">
                {asset.name}
              </p>
              <p className="text-xs text-[var(--mx-text-muted)]">
                {asset.symbol}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--mx-text)]">
                0.0000
              </p>
              <p className="text-xs text-[var(--mx-text-soft)]">{format(0)}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-4 py-3 text-center text-xs text-[var(--mx-text-muted)] sm:px-5">
        Sandbox balances · No live holdings connected
      </div>
    </div>
  );
}

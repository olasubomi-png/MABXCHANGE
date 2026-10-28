"use client";

import Link from "next/link";
import { SUPPORTED_ASSETS } from "@/lib/assets";
import { formatMoneyNative } from "@/lib/currency";
import { useLiveMarket } from "./live-market-provider";

const FEATURED = ["bitcoin", "ethereum", "solana", "ripple"];

export function LiveTickerStrip() {
  const { getTicker, status } = useLiveMarket();

  return (
    <div className="mx-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--mx-border)] px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mx-text-soft)]">
          Markets
        </p>
        <span className="text-[10px] text-[var(--mx-text-soft)]">
          {status === "live" ? "Live" : status}
        </span>
      </div>
      <ul className="divide-y divide-[var(--mx-border)]">
        {FEATURED.map((id) => {
          const meta = SUPPORTED_ASSETS.find((a) => a.coingeckoId === id);
          const t = getTicker(id);
          if (!meta) return null;
          const change = t?.change24hPct;
          const pos = change != null && change >= 0;
          return (
            <li key={id}>
              <Link
                href={`/market/${id}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--mx-surface-2)]"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.mark}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--mx-text)]">
                    {meta.symbol}
                  </p>
                  <p className="text-[11px] text-[var(--mx-text-muted)]">
                    {meta.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--mx-text)]">
                    {t
                      ? formatMoneyNative(t.priceUsd, "USD")
                      : "—"}
                  </p>
                  <p
                    className={`text-[11px] font-medium ${
                      change == null
                        ? "text-[var(--mx-text-soft)]"
                        : pos
                          ? "text-[var(--mx-success)]"
                          : "text-[var(--mx-danger)]"
                    }`}
                  >
                    {change == null
                      ? "—"
                      : `${pos ? "+" : ""}${change.toFixed(2)}%`}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-[var(--mx-border)] px-4 py-2 text-center">
        <Link
          href="/markets"
          className="text-xs font-medium text-[var(--mx-primary)] hover:underline"
        >
          View all markets
        </Link>
      </div>
    </div>
  );
}

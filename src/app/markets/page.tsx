"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SUPPORTED_ASSETS } from "@/lib/assets";
import { DemoBanner } from "@/components/demo-banner";
import { DemoLabel, PageHeader } from "@/components/ui";

const tabs = ["All", "Favorites", "Top Gainers", "Top Losers"] as const;

export default function MarketsPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");

  const list = useMemo(() => {
    let rows = [...SUPPORTED_ASSETS].filter((a) => a.symbol !== "USDT" && a.symbol !== "USDC");
    if (tab === "Top Gainers") rows = rows.filter((a) => a.samplePositive);
    if (tab === "Top Losers") rows = rows.filter((a) => !a.samplePositive);
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter(
        (a) =>
          a.symbol.toLowerCase().includes(s) ||
          a.name.toLowerCase().includes(s)
      );
    }
    return rows;
  }, [q, tab]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Markets"
        subtitle="Sample market figures · Demo only"
      />
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

      <div className="mx-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-[var(--mx-border)] px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--mx-text-soft)]">
          <span>Coin</span>
          <span className="text-right">Price</span>
          <span className="w-16 text-right">24h</span>
        </div>
        <ul className="divide-y divide-[var(--mx-border)]">
          {list.map((a, i) => (
            <li
              key={a.symbol}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-3.5"
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
                {a.samplePrice}
              </p>
              <p
                className={`w-16 text-right text-xs font-semibold ${
                  a.samplePositive
                    ? "text-[var(--mx-success)]"
                    : "text-[var(--mx-danger)]"
                }`}
              >
                {a.sampleChange}
              </p>
            </li>
          ))}
          {list.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-[var(--mx-text-muted)]">
              No coins match your search
            </li>
          )}
        </ul>
        <div className="border-t border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-4 py-2.5 text-center text-[11px] text-[var(--mx-text-soft)]">
          Sample prices for UI preview · Not live market data
        </div>
      </div>
      <DemoLabel />
    </div>
  );
}

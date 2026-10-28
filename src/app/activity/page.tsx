"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Inbox } from "lucide-react";

const typeFilters = ["All", "Buy", "Sell", "Deposit", "Withdraw", "Swap"] as const;
const statusFilters = ["All", "Completed", "Pending", "Failed"] as const;

export default function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState<(typeof typeFilters)[number]>("All");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("All");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--mx-text)]">Activity</h1>
        <p className="mt-1 text-sm text-[var(--mx-text-muted)]">
          Transaction history
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="mx-card p-4">
          <div className="flex items-center gap-2 text-[var(--mx-text-muted)]">
            <ArrowDownLeft size={16} className="text-[var(--mx-success)]" />
            <span className="text-xs font-medium">Total bought</span>
          </div>
          <p className="mt-2 text-xl font-bold text-[var(--mx-text)]">—</p>
          <p className="text-[11px] text-[var(--mx-text-soft)]">No data</p>
        </div>
        <div className="mx-card p-4">
          <div className="flex items-center gap-2 text-[var(--mx-text-muted)]">
            <ArrowUpRight size={16} className="text-[var(--mx-danger)]" />
            <span className="text-xs font-medium">Total sold</span>
          </div>
          <p className="mt-2 text-xl font-bold text-[var(--mx-text)]">—</p>
          <p className="text-[11px] text-[var(--mx-text-soft)]">No data</p>
        </div>
      </div>

      {/* Type filters */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--mx-text-soft)]">
          Type
        </p>
        <div className="mx-scroll-hide flex gap-2 overflow-x-auto pb-1">
          {typeFilters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTypeFilter(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                typeFilter === f
                  ? "bg-[var(--mx-primary)] text-white"
                  : "bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)] hover:bg-[var(--mx-border)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Status filters */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--mx-text-soft)]">
          Status
        </p>
        <div className="mx-scroll-hide flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === f
                  ? "bg-[var(--mx-primary)] text-white"
                  : "bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)] hover:bg-[var(--mx-border)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      <div className="mx-card flex flex-col items-center px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--mx-surface-2)] text-[var(--mx-text-soft)]">
          <Inbox size={28} strokeWidth={1.75} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-[var(--mx-text)]">
          No transactions yet
        </h2>
        <p className="mt-1.5 max-w-xs text-sm text-[var(--mx-text-muted)]">
          When a live backend is connected, your buys, sells, deposits, and swaps will appear
          here. Filters are ready for future data.
        </p>
        <p className="mt-4 rounded-lg mx-banner-warning px-3 py-2 text-xs">
          Currently showing filters for: {typeFilter} · {statusFilter}
        </p>
      </div>
    </div>
  );
}

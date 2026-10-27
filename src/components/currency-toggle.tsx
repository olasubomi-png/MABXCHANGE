"use client";

import { useState } from "react";

export type Currency = "NGN" | "USD";

export function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (c: Currency) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--mx-border)] bg-[var(--mx-surface-2)] p-0.5">
      {(["NGN", "USD"] as Currency[]).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            value === c
              ? "bg-white text-[var(--mx-text)] shadow-sm"
              : "text-[var(--mx-text-muted)] hover:text-[var(--mx-text)]"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function useCurrencyState(initial: Currency = "NGN") {
  return useState<Currency>(initial);
}

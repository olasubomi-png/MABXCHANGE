"use client";

import { useCurrency } from "./currency-provider";
import type { Currency } from "@/lib/currency";

type Props = {
  /** Optional controlled mode; defaults to global preference */
  value?: Currency;
  onChange?: (c: Currency) => void;
  /** Style for use on blue gradient cards */
  variant?: "on-primary" | "default";
};

export function CurrencyToggle({ value, onChange, variant = "on-primary" }: Props) {
  const global = useCurrency();
  const current = value ?? global.currency;
  const set = onChange ?? global.setCurrency;
  const list = global.currencies; // USD first, NGN second

  const isOnPrimary = variant === "on-primary";

  return (
    <div
      className={
        isOnPrimary
          ? "inline-flex rounded-lg border border-white/20 bg-black/20 p-0.5"
          : "inline-flex rounded-lg border border-[var(--mx-border)] bg-[var(--mx-surface-2)] p-0.5"
      }
      role="group"
      aria-label="Display currency"
    >
      {list.map((c) => {
        const active = current === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => set(c)}
            aria-pressed={active}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              isOnPrimary
                ? active
                  ? "bg-white text-[#0B0F19] shadow-sm"
                  : "text-blue-100 hover:text-white"
                : active
                  ? "bg-[var(--mx-primary)] text-white shadow-sm"
                  : "text-[var(--mx-text-muted)] hover:text-[var(--mx-text)]"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

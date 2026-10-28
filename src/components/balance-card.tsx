"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { CurrencyToggle, type Currency } from "./currency-toggle";

export function BalanceCard() {
  const [hidden, setHidden] = useState(false);
  const [currency, setCurrency] = useState<Currency>("NGN");

  return (
    <div className="mx-card-elevated overflow-hidden">
      <div className="bg-gradient-to-br from-[var(--mx-primary)] to-[#1a3fd9] px-5 py-5 text-white sm:px-6 sm:py-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">Total balance</p>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                {hidden ? "••••••" : "—"}
              </p>
              <button
                type="button"
                onClick={() => setHidden((v) => !v)}
                className="rounded-full bg-white/15 p-1.5 transition hover:bg-white/25"
                aria-label={hidden ? "Show balance" : "Hide balance"}
              >
                {hidden ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-blue-200">
              {hidden ? "Balance hidden" : "No balance connected · Demo only"}
            </p>
          </div>
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
      </div>
      <div className="border-t border-white/10 bg-[var(--mx-primary)]/90 px-5 py-3 text-center text-xs text-blue-100 sm:px-6">
        Balances and prices require a connected backend · Currently unavailable
      </div>
    </div>
  );
}

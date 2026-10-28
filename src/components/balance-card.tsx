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
            <p className="text-sm font-medium text-blue-100">
              Total portfolio value
            </p>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                {hidden ? "••••••" : "$0.00"}
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
            <p className="mt-1.5 text-xs text-[var(--mx-success)]">
              {hidden ? "Balance hidden" : "+0.00% (24h) · Demo only"}
            </p>
          </div>
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
        {/* Decorative sparkline placeholder */}
        <svg
          className="mt-4 h-10 w-full opacity-80"
          viewBox="0 0 200 40"
          fill="none"
          aria-hidden
        >
          <path
            d="M0 30 C20 28 30 20 50 22 C70 24 80 10 100 12 C120 14 140 28 160 18 C180 8 190 14 200 10"
            stroke="rgba(0,200,83,0.9)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
      <div className="border-t border-white/10 bg-[var(--mx-primary)]/90 px-5 py-2.5 text-center text-xs text-blue-100">
        No live balance connected · Sandbox portfolio shows $0.00
      </div>
    </div>
  );
}

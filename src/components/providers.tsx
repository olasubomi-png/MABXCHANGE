"use client";

import { type ReactNode } from "react";
import { CurrencyProvider } from "./currency-provider";
import { LiveMarketProvider } from "./live-market-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CurrencyProvider>
      <LiveMarketProvider>{children}</LiveMarketProvider>
    </CurrencyProvider>
  );
}

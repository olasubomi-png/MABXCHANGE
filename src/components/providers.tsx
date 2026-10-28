"use client";

import { type ReactNode } from "react";
import { CurrencyProvider } from "./currency-provider";

export function Providers({ children }: { children: ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}

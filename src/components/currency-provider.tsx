"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENCIES,
  CURRENCY_STORAGE_KEY,
  formatMoney,
  isCurrency,
  type Currency,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (amountUsd: number) => string;
  currencies: Currency[];
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Default USD; hydrate from localStorage after mount to avoid SSR mismatch
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (isCurrency(saved)) setCurrencyState(saved);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const format = useCallback(
    (amountUsd: number) => formatMoney(amountUsd, currency),
    [currency]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      format,
      currencies: CURRENCIES,
    }),
    [currency, setCurrency, format]
  );

  // Suppress unused until consumers need ready flag
  void ready;

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}

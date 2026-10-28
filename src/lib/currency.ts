/**
 * Shared currency preference + formatting.
 * Market prices should be requested from CoinGecko already in the display currency
 * (vs_currency=usd|ngn). formatMoneyNative formats a price in that currency
 * without applying any invented FX rate.
 */

export type Currency = "USD" | "NGN";

export const CURRENCIES: Currency[] = ["USD", "NGN"]; // USD first

export const CURRENCY_STORAGE_KEY = "mabxchange_currency";

export function isCurrency(v: unknown): v is Currency {
  return v === "USD" || v === "NGN";
}

/** Format an amount already denominated in the given currency (from CoinGecko). */
export function formatMoneyNative(
  amount: number,
  currency: Currency
): string {
  try {
    return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: amount >= 1 ? 2 : 6,
    }).format(amount);
  } catch {
    const symbol = currency === "NGN" ? "₦" : "$";
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Format a USD wallet/ledger amount for display.
 * Wallet balances are conceptual USD units at $0 in sandbox.
 * For non-zero balances we only show USD unless a verified NGN price feed
 * is available — we do not invent an FX rate here.
 */
export function formatMoney(
  amountUsd: number,
  currency: Currency
): string {
  if (currency === "USD" || amountUsd === 0) {
    // Zero is zero in any currency
    if (amountUsd === 0) {
      return formatMoneyNative(0, currency);
    }
    return formatMoneyNative(amountUsd, "USD");
  }
  // NGN selected but we have no verified live FX for ledger amounts
  return formatMoneyNative(amountUsd, "USD") + " (NGN rate unavailable)";
}

export function formatQty(qty: number, digits = 4): string {
  return qty.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatChangePct(pct: number | null): string {
  if (pct === null || Number.isNaN(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

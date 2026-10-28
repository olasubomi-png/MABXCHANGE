/**
 * Shared currency preference + formatting.
 * Amounts are stored/thought of in USD units; display converts for NGN.
 *
 * SAMPLE_USD_NGN is an illustrative rate for demo UI only — not a live FX feed.
 */

export type Currency = "USD" | "NGN";

export const CURRENCIES: Currency[] = ["USD", "NGN"]; // USD first

/** Illustrative sample rate for demo formatting only. Not live FX. */
export const SAMPLE_USD_NGN = 1600;

export const CURRENCY_STORAGE_KEY = "mabxchange_currency";

export function isCurrency(v: unknown): v is Currency {
  return v === "USD" || v === "NGN";
}

/**
 * Format a USD-denominated amount for the selected display currency.
 * @param amountUsd amount in US dollars (e.g. 12.5)
 */
export function formatMoney(
  amountUsd: number,
  currency: Currency,
  options?: { compact?: boolean }
): string {
  const value =
    currency === "NGN" ? amountUsd * SAMPLE_USD_NGN : amountUsd;

  try {
    return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: options?.compact ? 2 : 2,
    }).format(value);
  } catch {
    const symbol = currency === "NGN" ? "₦" : "$";
    return `${symbol}${value.toFixed(2)}`;
  }
}

/** Format an integer-like quantity (crypto units) without currency symbol. */
export function formatQty(qty: number, digits = 4): string {
  return qty.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Supported assets. Prices come from CoinGecko via server API — not hardcoded. */

export type AssetSymbol =
  | "BTC"
  | "ETH"
  | "BNB"
  | "SOL"
  | "XRP"
  | "DOGE"
  | "USDT"
  | "USDC";

export interface AssetMeta {
  symbol: AssetSymbol;
  name: string;
  mark: string;
  color: string;
  /** Verified CoinGecko coin id */
  coingeckoId: string;
  /** Binance spot USDT pair for OHLC klines (public API) */
  binanceSymbol: string | null;
}

export const SUPPORTED_ASSETS: AssetMeta[] = [
  { symbol: "BTC", name: "Bitcoin", mark: "₿", color: "#f7931a", coingeckoId: "bitcoin", binanceSymbol: "BTCUSDT" },
  { symbol: "ETH", name: "Ethereum", mark: "Ξ", color: "#627eea", coingeckoId: "ethereum", binanceSymbol: "ETHUSDT" },
  { symbol: "BNB", name: "BNB", mark: "◆", color: "#f3ba2f", coingeckoId: "binancecoin", binanceSymbol: "BNBUSDT" },
  { symbol: "SOL", name: "Solana", mark: "◎", color: "#9945ff", coingeckoId: "solana", binanceSymbol: "SOLUSDT" },
  { symbol: "XRP", name: "XRP", mark: "✕", color: "#23292f", coingeckoId: "ripple", binanceSymbol: "XRPUSDT" },
  { symbol: "DOGE", name: "Dogecoin", mark: "Ð", color: "#c2a633", coingeckoId: "dogecoin", binanceSymbol: "DOGEUSDT" },
  { symbol: "USDT", name: "Tether", mark: "₮", color: "#26a17b", coingeckoId: "tether", binanceSymbol: null },
  { symbol: "USDC", name: "USD Coin", mark: "$", color: "#2775ca", coingeckoId: "usd-coin", binanceSymbol: null },
];

export const COINGECKO_IDS = SUPPORTED_ASSETS.map((a) => a.coingeckoId);

export const DEMO_NOTICE =
  "Demo UI only · Market prices via CoinGecko Demo · No real balances or live trades";

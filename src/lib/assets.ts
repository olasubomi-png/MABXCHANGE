/** Supported assets for the demo UI. No live balances or prices are stored here. */
export type AssetSymbol = "BTC" | "ETH" | "SOL" | "USDT" | "USDC";

export interface AssetMeta {
  symbol: AssetSymbol;
  name: string;
  mark: string;
  color: string;
}

export const SUPPORTED_ASSETS: AssetMeta[] = [
  { symbol: "BTC", name: "Bitcoin", mark: "₿", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", mark: "◆", color: "#627eea" },
  { symbol: "SOL", name: "Solana", mark: "◎", color: "#9945ff" },
  { symbol: "USDT", name: "Tether", mark: "₮", color: "#26a17b" },
  { symbol: "USDC", name: "USD Coin", mark: "$", color: "#2775ca" },
];

export const DEMO_NOTICE =
  "Demo UI only · No real balances, prices, or transactions are connected.";

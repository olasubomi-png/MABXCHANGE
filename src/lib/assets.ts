/** Supported assets for the demo UI. Figures are illustrative sample data only. */

export type AssetSymbol = "BTC" | "ETH" | "BNB" | "SOL" | "XRP" | "DOGE" | "USDT" | "USDC";

export interface AssetMeta {
  symbol: AssetSymbol;
  name: string;
  mark: string;
  color: string;
  /** Illustrative sample price for demo UI only — not live */
  samplePrice: string;
  /** Illustrative 24h change for demo UI only — not live */
  sampleChange: string;
  samplePositive: boolean;
}

export const SUPPORTED_ASSETS: AssetMeta[] = [
  { symbol: "BTC", name: "Bitcoin", mark: "₿", color: "#f7931a", samplePrice: "$67,432.12", sampleChange: "+2.4%", samplePositive: true },
  { symbol: "ETH", name: "Ethereum", mark: "Ξ", color: "#627eea", samplePrice: "$3,245.87", sampleChange: "+1.8%", samplePositive: true },
  { symbol: "BNB", name: "BNB", mark: "◆", color: "#f3ba2f", samplePrice: "$582.21", sampleChange: "−0.9%", samplePositive: false },
  { symbol: "SOL", name: "Solana", mark: "◎", color: "#9945ff", samplePrice: "$142.36", sampleChange: "+3.2%", samplePositive: true },
  { symbol: "XRP", name: "XRP", mark: "✕", color: "#23292f", samplePrice: "$0.52", sampleChange: "+1.1%", samplePositive: true },
  { symbol: "DOGE", name: "Dogecoin", mark: "Ð", color: "#c2a633", samplePrice: "$0.16", sampleChange: "+0.5%", samplePositive: true },
  { symbol: "USDT", name: "Tether", mark: "₮", color: "#26a17b", samplePrice: "$1.00", sampleChange: "+0.0%", samplePositive: true },
  { symbol: "USDC", name: "USD Coin", mark: "$", color: "#2775ca", samplePrice: "$1.00", sampleChange: "+0.0%", samplePositive: true },
];

export const DEMO_NOTICE =
  "Demo UI only · Sample figures are illustrative · No real balances or live trades";

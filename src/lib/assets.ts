/** Supported market assets. Prices come from CoinGecko / Kraken — not hardcoded. */

export type AssetSymbol =
  | "BTC"
  | "ETH"
  | "BNB"
  | "SOL"
  | "XRP"
  | "DOGE"
  | "USDT"
  | "USDC"
  | "ADA"
  | "AVAX"
  | "DOT"
  | "LINK"
  | "LTC"
  | "TRX"
  | "TON"
  | "BCH"
  | "SHIB"
  | "SUI"
  | "XLM"
  | "HBAR"
  | "NEAR"
  | "APT"
  | "UNI"
  | "PEPE"
  | "POL"
  | "ETC"
  | "ATOM"
  | "ICP"
  | "FIL"
  | "CRO"
  | "AAVE"
  | "ARB"
  | "OP"
  | "INJ"
  | "RENDER"
  | "FET"
  | "MKR"
  | "VET"
  | "ALGO"
  | "SEI";

export interface AssetMeta {
  symbol: AssetSymbol;
  name: string;
  mark: string;
  color: string;
  /** Verified CoinGecko coin id */
  coingeckoId: string;
}

export const SUPPORTED_ASSETS: AssetMeta[] = [
  { symbol: "BTC", name: "Bitcoin", mark: "₿", color: "#f7931a", coingeckoId: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", mark: "Ξ", color: "#627eea", coingeckoId: "ethereum" },
  { symbol: "BNB", name: "BNB", mark: "◆", color: "#f3ba2f", coingeckoId: "binancecoin" },
  { symbol: "SOL", name: "Solana", mark: "◎", color: "#9945ff", coingeckoId: "solana" },
  { symbol: "XRP", name: "XRP", mark: "✕", color: "#23292f", coingeckoId: "ripple" },
  { symbol: "DOGE", name: "Dogecoin", mark: "Ð", color: "#c2a633", coingeckoId: "dogecoin" },
  { symbol: "USDT", name: "Tether", mark: "₮", color: "#26a17b", coingeckoId: "tether" },
  { symbol: "USDC", name: "USD Coin", mark: "$", color: "#2775ca", coingeckoId: "usd-coin" },
  { symbol: "ADA", name: "Cardano", mark: "A", color: "#0033ad", coingeckoId: "cardano" },
  { symbol: "AVAX", name: "Avalanche", mark: "A", color: "#e84142", coingeckoId: "avalanche-2" },
  { symbol: "DOT", name: "Polkadot", mark: "●", color: "#e6007a", coingeckoId: "polkadot" },
  { symbol: "LINK", name: "Chainlink", mark: "⬡", color: "#2a5ada", coingeckoId: "chainlink" },
  { symbol: "LTC", name: "Litecoin", mark: "Ł", color: "#345d9d", coingeckoId: "litecoin" },
  { symbol: "TRX", name: "TRON", mark: "T", color: "#ff0013", coingeckoId: "tron" },
  { symbol: "TON", name: "Toncoin", mark: "T", color: "#0098ea", coingeckoId: "the-open-network" },
  { symbol: "BCH", name: "Bitcoin Cash", mark: "₿", color: "#8dc351", coingeckoId: "bitcoin-cash" },
  { symbol: "SHIB", name: "Shiba Inu", mark: "S", color: "#ffa409", coingeckoId: "shiba-inu" },
  { symbol: "SUI", name: "Sui", mark: "S", color: "#4da2ff", coingeckoId: "sui" },
  { symbol: "XLM", name: "Stellar", mark: "*", color: "#14b6e7", coingeckoId: "stellar" },
  { symbol: "HBAR", name: "Hedera", mark: "ℏ", color: "#000000", coingeckoId: "hedera-hashgraph" },
  { symbol: "NEAR", name: "NEAR Protocol", mark: "N", color: "#00c08b", coingeckoId: "near" },
  { symbol: "APT", name: "Aptos", mark: "A", color: "#2dd8a9", coingeckoId: "aptos" },
  { symbol: "UNI", name: "Uniswap", mark: "U", color: "#ff007a", coingeckoId: "uniswap" },
  { symbol: "PEPE", name: "Pepe", mark: "P", color: "#3d8b37", coingeckoId: "pepe" },
  { symbol: "POL", name: "POL (Polygon)", mark: "P", color: "#8247e5", coingeckoId: "polygon-ecosystem-token" },
  { symbol: "ETC", name: "Ethereum Classic", mark: "ξ", color: "#328332", coingeckoId: "ethereum-classic" },
  { symbol: "ATOM", name: "Cosmos", mark: "⚛", color: "#2e3148", coingeckoId: "cosmos" },
  { symbol: "ICP", name: "Internet Computer", mark: "∞", color: "#29abe2", coingeckoId: "internet-computer" },
  { symbol: "FIL", name: "Filecoin", mark: "⨎", color: "#0090ff", coingeckoId: "filecoin" },
  { symbol: "CRO", name: "Cronos", mark: "C", color: "#002d74", coingeckoId: "crypto-com-chain" },
  { symbol: "AAVE", name: "Aave", mark: "A", color: "#b6509e", coingeckoId: "aave" },
  { symbol: "ARB", name: "Arbitrum", mark: "A", color: "#28a0f0", coingeckoId: "arbitrum" },
  { symbol: "OP", name: "Optimism", mark: "O", color: "#ff0420", coingeckoId: "optimism" },
  { symbol: "INJ", name: "Injective", mark: "I", color: "#00f2fe", coingeckoId: "injective-protocol" },
  { symbol: "RENDER", name: "Render", mark: "R", color: "#000000", coingeckoId: "render-token" },
  { symbol: "FET", name: "Artificial Superintelligence Alliance", mark: "F", color: "#1e1e1e", coingeckoId: "fetch-ai" },
  { symbol: "MKR", name: "Maker", mark: "M", color: "#1aab9b", coingeckoId: "maker" },
  { symbol: "VET", name: "VeChain", mark: "V", color: "#15bdff", coingeckoId: "vechain" },
  { symbol: "ALGO", name: "Algorand", mark: "A", color: "#000000", coingeckoId: "algorand" },
  { symbol: "SEI", name: "Sei", mark: "S", color: "#9b1c1c", coingeckoId: "sei-network" },
];

export const COINGECKO_IDS = SUPPORTED_ASSETS.map((a) => a.coingeckoId);

export const DEMO_NOTICE =
  "Market prices via CoinGecko and Kraken · Trading not enabled";

/** Stablecoins without meaningful OHLC chart series in this app */
export const STABLECOIN_SYMBOLS: AssetSymbol[] = ["USDT", "USDC"];

export function isStablecoinSymbol(symbol: string): boolean {
  return STABLECOIN_SYMBOLS.includes(symbol.toUpperCase() as AssetSymbol);
}

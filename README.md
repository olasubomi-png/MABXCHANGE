# MABXCHANGE

Crypto markets interface built with Next.js 16, Neon Auth, Neon PostgreSQL, and Vercel.

## Market data

| Layer | Provider | Notes |
|-------|----------|--------|
| Snapshots, 24h stats, NGN quotes | CoinGecko Demo API | Server-only `COINGECKO_API_KEY` + `x-cg-demo-api-key` |
| Live last price (USD) | Kraken WebSocket ticker | Browser client, no API key |
| Historical OHLC | Kraken REST → CoinGecko OHLC fallback | Server `/api/market/ohlc` |

**Binance is not used** (HTTP 451 / geo restrictions on many hosts).

Live status appears in the header (Live / Reconnecting / Delayed). Polling is labeled **Delayed**, not Live.

### Supported live Kraken pairs

BTC, ETH, SOL, XRP, DOGE, BNB (USD). USDT/USDC have no Kraken ticker in this app.

## Authentication

- Neon Managed Auth (Better Auth) + Google OAuth
- Env: `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `DATABASE_URL`

## Trading, wallet, deposits

**Not enabled.** UI explains that orders, deposits, withdrawals, and swaps are unavailable. Balances stay at zero until a custody/liquidity provider is integrated. No fake fills or ledger success messages.

## Environment variables

```bash
DATABASE_URL=
NEON_AUTH_BASE_URL=
NEON_AUTH_COOKIE_SECRET=
COINGECKO_API_KEY=
```

Never use `NEXT_PUBLIC_` for secrets.

## Development

```bash
npm install
npm run dev
npm run build
```

## License

Private project.

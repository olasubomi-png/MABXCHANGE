# Financial provider integration (not enabled)

MABXCHANGE currently shows **live public market prices** only.  
**Trading, deposits, withdrawals, and custody are not connected.**

## Implemented today

| Area | Status |
|------|--------|
| Auth (Neon Managed Auth, Google) | Connected |
| App user provisioning (`app_users`) | Connected |
| Market snapshots (CoinGecko) | Connected |
| Live tickers (Kraken WS) | Connected |
| OHLC charts (Kraken / CoinGecko) | Connected |
| Order execution | **UI only — blocked** |
| Deposits / withdrawals | **UI only — blocked** |
| Ledger balance changes from market ticks | **Never** |

## Required before real-money operations

1. **Custody / wallet provider** — deposit addresses, withdrawal signing, cold/hot policy  
2. **Liquidity / trading venue** — order routing, fees, settlement  
3. **KYC / identity** — compliance provider and workflow  
4. **Monitoring** — transaction monitoring, sanctions screening  
5. **Explicit production approval** — env flags, legal review  

Do not mark UI actions as successful without a real provider response.

## Suggested adapter shape

```ts
// Future: src/lib/providers/custody.ts
export interface CustodyAdapter {
  createDepositAddress(userId: string, asset: string): Promise<{ address: string }>;
  requestWithdrawal(input: { userId: string; asset: string; amount: string; to: string }): Promise<{ id: string }>;
}
```

Configure credentials only via server env vars (never `NEXT_PUBLIC_*`).

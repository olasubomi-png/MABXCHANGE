# Sandbox ledger (DEMO)

## Scope

- Double-entry style postings with ownership checks and non-negative balances
- Idempotency keys on `ledger_transactions`
- Audit events on successful postings
- Simulated buy / sell / swap via `/api/sandbox/trade` and `/api/sandbox/swap`

## Not in scope

- Real-money deposits, withdrawals, custody, or venue execution
- Creating free balances or fake deposit confirmations
- Cross-user access to accounts

## Balance modes

| Mode | Use |
|------|-----|
| `strict` | Same-asset balanced debit/credit (transfers) |
| `trade` | Multi-asset DEMO trade; value conservation + non-negative balances |

## Applying migration

Use a **Neon branch**, not production reset:

```bash
# Review then apply on branch
psql $DATABASE_URL -f migrations/001_sandbox_ledger_guards.sql
```

## Tests

```bash
npm test
```

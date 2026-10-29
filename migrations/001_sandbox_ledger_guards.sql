-- Additive guards for sandbox ledger (apply on a Neon *branch*, not by wiping production).
-- Safe to re-run: uses IF NOT EXISTS patterns where supported.
-- Does NOT drop data or reset production.

-- Idempotency key unique on ledger transactions (prevents duplicate webhook/trade processing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ledger_transactions_idempotency_key_key'
  ) THEN
    ALTER TABLE ledger_transactions
      ADD CONSTRAINT ledger_transactions_idempotency_key_key UNIQUE (idempotency_key);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'ledger_transactions missing — create table before applying this constraint';
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Prevent negative balances at the database layer when the column is numeric
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_accounts_balance_nonnegative'
  ) THEN
    ALTER TABLE customer_accounts
      ADD CONSTRAINT customer_accounts_balance_nonnegative CHECK (balance >= 0);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'customer_accounts missing';
  WHEN duplicate_object THEN NULL;
END $$;

-- Index for ownership lookups
CREATE INDEX IF NOT EXISTS idx_customer_accounts_user_asset_bucket
  ON customer_accounts (user_id, asset_id, bucket);

CREATE INDEX IF NOT EXISTS idx_ledger_transactions_user_created
  ON ledger_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_created
  ON audit_events (user_id, created_at DESC);

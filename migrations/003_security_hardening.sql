-- 003_security_hardening.sql
-- Additive only. No financial table changes.

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  hit_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS totp_used_steps (
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  time_step BIGINT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, time_step)
);

CREATE INDEX IF NOT EXISTS idx_totp_used_steps_used_at
  ON totp_used_steps (used_at);

-- Optional last_used_step on totp_secrets for quick reads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'totp_secrets' AND column_name = 'last_used_step'
  ) THEN
    ALTER TABLE totp_secrets ADD COLUMN last_used_step BIGINT;
  END IF;
END $$;

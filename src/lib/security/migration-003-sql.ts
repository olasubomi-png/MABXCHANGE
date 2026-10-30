export const SECURITY_MIGRATION_003_SQL = `
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
` as const;

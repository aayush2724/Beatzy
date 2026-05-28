-- 003: Add refresh‑token rotation columns to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_refresh_token
  ON users (refresh_token_hash) WHERE refresh_token_hash IS NOT NULL;

COMMENT ON COLUMN users.refresh_token_hash IS 'SHA‑256 hash of the current refresh token';
COMMENT ON COLUMN users.refresh_token_expires_at IS 'Absolute expiry of the refresh token';

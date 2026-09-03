-- Adds admin-dashboard support: an admin flag + account status/login
-- tracking on users, a subscriptions table (tier + MRR source of truth),
-- and an activity_log feed. Safe to run against the existing production
-- database — every statement is additive and idempotent.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zillow_pulls_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  monthly_amount_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Backfill a free subscription row for every existing user so the admin
-- dashboard's joins/aggregates don't have to special-case "no row yet".
INSERT INTO subscriptions (user_id, tier, status, monthly_amount_cents)
SELECT id, 'free', 'active', 0 FROM users
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON activity_log(created_at DESC);

-- To make yourself an admin, run:
--   UPDATE users SET is_admin = true WHERE email = 'you@example.com';

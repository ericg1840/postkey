-- Email verification. Mirrors the reset-token columns: only a hash of the
-- token is stored, so a database read alone can never produce a usable
-- verification link.
--
-- Existing accounts are grandfathered as verified. They signed up before this
-- existed and have been using the app; retroactively marking them unverified
-- would nag every current user about something they can't be blamed for, and
-- for anyone whose address really was a typo the account is already in use.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token_expires TIMESTAMP;

-- Bounded by a fixed cutoff rather than "everyone currently unverified", so
-- re-running this can never retroactively verify someone who signed up after
-- it shipped and genuinely hasn't confirmed their address yet.
UPDATE users
   SET email_verified_at = COALESCE(created_at, NOW())
 WHERE email_verified_at IS NULL
   AND created_at < TIMESTAMP '2026-09-08';

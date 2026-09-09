-- Sign in with Google. Accounts created via Google never set a local
-- password, so password_hash can no longer be NOT NULL; google_id links the
-- row to Google's stable per-account subject id (their email can change,
-- their `sub` never does).

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- Someone who signs in with Google has already verified that address with
-- Google, so an account created this way needs no separate confirmation.
-- (Existing password accounts are untouched -- this only ever runs at the
-- moment a Google account is created, in application code.)

-- Backs fixed-window rate limiting for auth endpoints (login, signup,
-- password-reset requests). Serverless functions have no shared memory
-- between invocations, so the window state has to live somewhere
-- persistent -- Postgres is the only shared store this app already has.
-- Safe to run against the existing production database.

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL DEFAULT NOW()
);

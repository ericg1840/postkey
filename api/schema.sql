-- Full schema for a fresh Postgres database (Vercel Postgres / Neon / Supabase, etc).
-- This is the combined result of every migration in netlify/database/migrations/ —
-- run this once against a brand-new, empty database to get the same tables.

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  reset_token_hash TEXT,
  reset_token_expires TIMESTAMP
);

CREATE TABLE brand_kits (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL DEFAULT '',
  agent_phone TEXT NOT NULL DEFAULT '',
  agent_email TEXT NOT NULL DEFAULT '',
  brokerage_name TEXT NOT NULL DEFAULT '',
  brokerage_city TEXT NOT NULL DEFAULT '',
  office_phone TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  license_number TEXT NOT NULL DEFAULT '',
  accent_color TEXT NOT NULL DEFAULT '#E0298C',
  script_font TEXT NOT NULL DEFAULT 'Dancing Script',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  headshot_url TEXT,
  logo_url TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

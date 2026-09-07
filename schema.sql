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
  reset_token_expires TIMESTAMP,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  account_status TEXT NOT NULL DEFAULT 'active', -- active | disabled | suspended
  last_login_at TIMESTAMP,
  zillow_pulls_count INTEGER NOT NULL DEFAULT 0
);

-- One row per user; the admin dashboard's source of truth for tier and MRR.
CREATE TABLE subscriptions (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free', -- free | paid
  status TEXT NOT NULL DEFAULT 'active', -- active | canceled
  monthly_amount_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Every trackable user action (signups, logins, bio-page saves,
-- subscription changes, public page views, ...) — powers the admin feed
-- and, later, usage analytics. `details` carries event-specific context
-- as JSON so it stays queryable without a schema change per event type.
CREATE TABLE activity_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX activity_events_created_at_idx ON activity_events(created_at DESC);
CREATE INDEX activity_events_event_type_idx ON activity_events(event_type);

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
  profile_reminder_dismissed BOOLEAN NOT NULL DEFAULT false,
  headshot_url TEXT,
  logo_url TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  -- link-in-bio page settings
  bio_handle TEXT UNIQUE,
  bio_tagline TEXT NOT NULL DEFAULT '',
  bio_bg_color TEXT NOT NULL DEFAULT '#1B2430',
  bio_box_color TEXT NOT NULL DEFAULT '#2E3B4C',
  bio_name_font TEXT NOT NULL DEFAULT '',
  bio_name_size TEXT NOT NULL DEFAULT 'md',
  bio_brokerage TEXT NOT NULL DEFAULT '',
  bio_button_style TEXT NOT NULL DEFAULT 'rounded',
  bio_bg_image_url TEXT,
  bio_bg_tint INTEGER NOT NULL DEFAULT 40
);

-- One row per link on an agent's link-in-bio page.
CREATE TABLE bio_links (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- zillow-specific, unused for other link types
  address TEXT,
  price TEXT,
  beds TEXT,
  baths TEXT,
  photo_url TEXT
);

CREATE INDEX bio_links_user_id_idx ON bio_links(user_id);

-- One row per downloaded post, so an agent can revisit or re-download
-- something they made earlier. image_data holds a data: URL, same
-- pattern as brand_kits.headshot_url/logo_url.
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '',
  headline TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL DEFAULT '',
  image_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX posts_user_id_idx ON posts(user_id, created_at DESC);

-- Content Planner: dated posts (confirmed or still-suggested) and dateless
-- ideas waiting to be scheduled. See migrations/005_content_calendar.sql.
CREATE TABLE content_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  source TEXT NOT NULL DEFAULT 'manual',
  posted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX content_posts_user_id_date_idx ON content_posts(user_id, date);

CREATE TABLE content_ideas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_date TEXT,
  added_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX content_ideas_user_id_idx ON content_ideas(user_id);

-- Fixed-window rate limiting for auth endpoints. See migrations/006_rate_limits.sql.
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL DEFAULT NOW()
);

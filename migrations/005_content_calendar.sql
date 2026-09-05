-- Backs the redesigned Content Planner (agenda/month calendar with
-- confirmed vs. suggested posts, plus a dateless ideas list that can be
-- promoted into a suggested post). Safe to run against the existing
-- production database — every statement is additive and idempotent.

CREATE TABLE IF NOT EXISTS content_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  title TEXT NOT NULL,
  category TEXT NOT NULL,       -- community | listing | promo | bts
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | suggested
  source TEXT NOT NULL DEFAULT 'manual',    -- manual | autofill | idea
  posted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_posts_user_id_date_idx ON content_posts(user_id, date);

CREATE TABLE IF NOT EXISTS content_ideas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_date TEXT,             -- suggested date, nullable
  added_at TIMESTAMP,           -- set once converted to a post
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_ideas_user_id_idx ON content_ideas(user_id);

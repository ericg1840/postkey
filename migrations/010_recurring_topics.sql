-- Recurring content topics — "the 20th of every month, post a this-or-that" —
-- rather than a one-off content_posts row. day_of_month is clamped to the
-- last day of shorter months (e.g. 31 in February lands on the 28th/29th)
-- when a post gets generated for it.
CREATE TABLE content_recurring_topics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX content_recurring_topics_user_id_idx ON content_recurring_topics(user_id);

-- Links a generated content_posts row back to the rule that produced it, so
-- the calendar can tell "one post was already made for this rule this
-- month" apart from a same-titled manual post. SET NULL on delete: removing
-- a rule shouldn't retroactively delete posts already planned from it.
ALTER TABLE content_posts ADD COLUMN recurring_topic_id INTEGER REFERENCES content_recurring_topics(id) ON DELETE SET NULL;

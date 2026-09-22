-- Two unrelated fixes that both need schema.

-- 1. Revocable sessions. Session cookies are signed tokens with a 30-day
-- life, and until now nothing could invalidate one early — changing or
-- resetting a password, or an admin disabling the account, left every
-- existing session working. Each token now carries the session_version it
-- was issued under; bumping this column revokes all of them at once.
-- Defaults to 0, which is what tokens issued before this carry, so applying
-- it signs nobody out.
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

-- 2. Which (recurring topic, month) pairs have already had a post generated.
-- The generator used to decide by looking for the post itself, so dismissing
-- (deleting) a recurring suggestion made it come straight back on the next
-- view of that month, moving one to another day regenerated it on the
-- original day, and two views at once could each insert a copy. Claiming a
-- row here with ON CONFLICT DO NOTHING fixes all three: a month is generated
-- exactly once per topic, whatever happens to the post afterwards.
CREATE TABLE IF NOT EXISTS content_recurring_generated (
  topic_id INTEGER NOT NULL REFERENCES content_recurring_topics(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM
  PRIMARY KEY (topic_id, month)
);

-- Months that were generated before the ledger existed count as done, so
-- nothing already planned (or already dismissed and still present) gets
-- generated a second time.
INSERT INTO content_recurring_generated (topic_id, month)
SELECT DISTINCT recurring_topic_id, substring(date FROM 1 FOR 7)
  FROM content_posts
 WHERE recurring_topic_id IS NOT NULL
ON CONFLICT DO NOTHING;

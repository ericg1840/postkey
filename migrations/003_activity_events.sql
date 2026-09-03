-- Renames activity_log -> activity_events and switches its free-text
-- `detail` column to a structured `details` jsonb column, so the same
-- table that powers the admin feed can also support real analytics
-- queries later (filter/aggregate by event_type + fields inside details).
-- Safe to run against a fresh database (creates activity_events directly)
-- or an existing one (renames the old table in place, preserving rows).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_events') THEN
    ALTER TABLE activity_log RENAME TO activity_events;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS activity_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migrate the old free-text `detail` column into `details` jsonb, if this
-- table came from the rename above rather than a fresh CREATE.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_events' AND column_name = 'detail') THEN
    ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS details JSONB;
    UPDATE activity_events
      SET details = CASE WHEN detail IS NULL OR detail = '' THEN NULL ELSE jsonb_build_object('text', detail) END
      WHERE details IS NULL;
    ALTER TABLE activity_events DROP COLUMN detail;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS activity_events_created_at_idx ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_events_event_type_idx ON activity_events(event_type);
DROP INDEX IF EXISTS activity_log_created_at_idx;

-- Post drafts, so a post roughed out on a phone can be finished on a laptop.
-- Drafts previously lived only in localStorage, which meant they silently did
-- not exist on any other device and vanished if someone cleared site data.
--
-- The id is the client-generated one already in use ("draft-<ts>-<rand>"), so
-- existing local drafts keep their identity when they first sync up rather
-- than being duplicated under new ids.
CREATE TABLE IF NOT EXISTS post_drafts (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  tool TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  type_label TEXT NOT NULL DEFAULT '',
  target_date TEXT,
  -- Everything the form holds except photos, which only ever live in memory
  -- as blobs and are re-added when the draft is finished.
  form JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Client-supplied on write, overwritten with the server's clock on the way
  -- back out, so last-write-wins compares server time rather than trusting
  -- whatever a device's clock says.
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A tombstone rather than a row delete: "the server doesn't have it" can't
  -- distinguish "created offline, never pushed" from "deleted on the phone an
  -- hour ago", and without this a stale second device pushes deleted drafts
  -- back up and they appear to come back from the dead.
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS post_drafts_user_updated_idx ON post_drafts(user_id, updated_at DESC);

-- Saved posts are 1080x1080 PNGs stored as data URLs, so the Post Library
-- list was shipping every one of them in full on a single request -- tens of
-- megabytes for an agent with a normal number of saved posts, just to draw a
-- grid of small thumbnails.
--
-- This column holds a ~400px JPEG of the same graphic (a few tens of KB),
-- generated client-side at save time. The list endpoint returns only these;
-- the full-resolution image is fetched one post at a time, on demand, when
-- someone actually previews, downloads, or shares it.
--
-- Nullable on purpose: rows saved before this migration have no thumbnail,
-- and the Post Library falls back to fetching their full image lazily.
-- Additive and safe to run against the existing production database.

ALTER TABLE posts ADD COLUMN IF NOT EXISTS thumb_data TEXT;

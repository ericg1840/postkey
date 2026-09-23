-- Which saved idea a planner post came from. "Add to plan" (and now
-- auto-fill, which draws on saved ideas) turns an idea into a suggested post
-- and takes it off the ideas list. Without a link back, dismissing that
-- suggestion deleted the post and the idea was gone for good. With it,
-- dismissing a suggestion puts its idea back on the list.
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS idea_id INTEGER REFERENCES content_ideas(id) ON DELETE SET NULL;

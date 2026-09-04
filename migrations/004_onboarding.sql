-- Adds the two columns the new post-signup onboarding flow needs:
-- listing_volume is the optional "how many listings do you manage" answer
-- from the welcome step (for future personalization); checklist_dismissed
-- is set only when a user explicitly clicks "Don't show this again" on the
-- progress checklist, as opposed to just closing it for the session.
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS listing_volume TEXT;
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS checklist_dismissed BOOLEAN NOT NULL DEFAULT false;

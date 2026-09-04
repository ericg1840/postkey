-- Backs the small reminder popup that nudges a user who skipped onboarding
-- to come back and finish their brand profile. Set only when they
-- explicitly click "Don't remind me again" — closing the popup for the
-- session doesn't touch this column, so it reappears on next login.
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS profile_reminder_dismissed BOOLEAN NOT NULL DEFAULT false;

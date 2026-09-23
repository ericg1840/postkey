-- Key Link page redesign.

-- The title shown before the brokerage ("REALTOR® · RE/MAX Main Line").
-- Blank by default: REALTOR® may only be used by NAR members, so it's the
-- agent's choice, not something to assume.
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS bio_title TEXT NOT NULL DEFAULT '';

-- Listing cards: square footage, and a status pill (just_listed |
-- open_house | under_contract | sold). NULL status reads as just_listed.
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS sqft TEXT;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS status TEXT;

-- The page's accent color (still stored as bio_box_color) now defaults to
-- blue for new pages. Existing pages keep whatever they had.
ALTER TABLE brand_kits ALTER COLUMN bio_box_color SET DEFAULT '#003DA5';

-- Key Link page: contact buttons (Call / Text / Email / Save my contact) and
-- licensing disclosures. All three default to off: they publish details the
-- agent entered for their graphics (phone, email, license number), so an
-- existing page must not start showing them until the agent opts in.
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS bio_show_contact BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS bio_show_license BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS bio_show_eho BOOLEAN NOT NULL DEFAULT false;

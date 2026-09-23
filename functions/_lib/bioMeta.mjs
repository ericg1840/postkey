// What link-preview scrapers see for a public /u/<handle> page. Scrapers
// (Facebook, iMessage, LinkedIn, Slack) don't run JavaScript, so the agent's
// name, tagline and photo have to be in the HTML the Worker serves — see
// rewriteBioPage in worker/index.mjs.

// Only raster types a browser renders as an image. The headshot is served
// from our own origin, so anything else (data:text/html, svg with script)
// would be an XSS vector rather than a photo.
const SAFE_IMAGE = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/;

export async function loadBioMeta(db, handle) {
  const clean = String(handle || "").trim().toLowerCase();
  if (!/^[a-z0-9-]{1,40}$/.test(clean)) return null;
  const [row] = await db.sql`
    SELECT k.agent_name, k.bio_tagline, k.bio_brokerage, k.headshot_url
      FROM brand_kits k
      JOIN users u ON u.id = k.user_id
     WHERE k.bio_handle = ${clean} AND u.account_status = 'active'
  `;
  if (!row) return null;
  return {
    handle: clean,
    name: (row.agent_name || "").trim(),
    tagline: (row.bio_tagline || "").trim(),
    brokerage: (row.bio_brokerage || "").trim(),
    headshotUrl: row.headshot_url || "",
  };
}

export function bioShareText(meta) {
  const who = meta.name || "Real estate agent";
  const title = meta.brokerage ? `${who} | ${meta.brokerage}` : who;
  const description = meta.tagline
    || `Listings, contact info and links from ${who}${meta.brokerage ? ` of ${meta.brokerage}` : ""}.`;
  return { title, description: description.slice(0, 200) };
}

// Decodes a stored data-URL headshot into image bytes, or returns null for
// anything that isn't a safe raster image.
export function decodeHeadshot(dataUrl) {
  const m = SAFE_IMAGE.exec(String(dataUrl || ""));
  if (!m) return null;
  const bytes = Buffer.from(m[2].replace(/\s/g, ""), "base64");
  return bytes.length ? { contentType: m[1], bytes } : null;
}

export function hasShareableHeadshot(url) {
  return !!decodeHeadshot(url) || /^https:\/\//i.test(String(url || ""));
}

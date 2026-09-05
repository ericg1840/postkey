import { getDb } from "../_lib/db.mjs";
import { json } from "../_lib/auth.mjs";
import { logEvent } from "../_lib/activity.mjs";

// Unauthenticated — this is what the public /u/:handle page fetches, so it
// only ever returns what's meant to be publicly visible (no email, phone,
// etc. beyond what an agent has explicitly put in a link).
export async function onRequestGet({ request, env }) {
  const handle = new URL(request.url).searchParams.get("handle")?.trim().toLowerCase();
  if (!handle) return json({ error: "Handle is required." }, { status: 400 });

  const db = getDb(env);
  const [kit] = await db.sql`
    SELECT user_id, agent_name, headshot_url, bio_tagline, bio_brokerage, bio_bg_color, bio_box_color, bio_name_font, bio_name_size, bio_button_style, bio_bg_image_url, bio_bg_tint
    FROM brand_kits WHERE bio_handle = ${handle}
  `;
  if (!kit) return json({ error: "Page not found." }, { status: 404 });

  // The page-view log write doesn't gate what the visitor sees, so it runs
  // alongside the links fetch instead of blocking it — one round trip off
  // the critical path of what is this app's highest-traffic read.
  const [, links] = await Promise.all([
    logEvent(db, kit.user_id, "page_view", { handle }),
    db.sql`
      SELECT type, label, url, address, price, beds, baths, photo_url
      FROM bio_links WHERE user_id = ${kit.user_id} ORDER BY sort_order ASC, id ASC
    `,
  ]);

  return json({
    name: kit.agent_name || "",
    headshotUrl: kit.headshot_url || "",
    tagline: kit.bio_tagline || "",
    brokerage: kit.bio_brokerage || "",
    bgColor: kit.bio_bg_color || "#1B2430",
    boxColor: kit.bio_box_color || "#2E3B4C",
    nameFont: kit.bio_name_font || "",
    nameSize: kit.bio_name_size || "md",
    buttonStyle: kit.bio_button_style || "rounded",
    bgImageUrl: kit.bio_bg_image_url || "",
    bgTint: kit.bio_bg_tint ?? 40,
    links: links.map((l) => ({
      type: l.type,
      label: l.label,
      url: l.url,
      address: l.address || "",
      price: l.price || "",
      beds: l.beds || "",
      baths: l.baths || "",
      photoUrl: l.photo_url || "",
    })),
  });
}

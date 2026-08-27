import { getDb } from "../_lib/db.mjs";
import { json } from "../_lib/auth.mjs";

// Unauthenticated — this is what the public /u/:handle page fetches, so it
// only ever returns what's meant to be publicly visible (no email, phone,
// etc. beyond what an agent has explicitly put in a link).
export async function onRequestGet({ request, env }) {
  const handle = new URL(request.url).searchParams.get("handle")?.trim().toLowerCase();
  if (!handle) return json({ error: "Handle is required." }, { status: 400 });

  const db = getDb(env);
  const [kit] = await db.sql`
    SELECT user_id, agent_name, bio_tagline, bio_bg_color, bio_box_color, bio_name_font
    FROM brand_kits WHERE bio_handle = ${handle}
  `;
  if (!kit) return json({ error: "Page not found." }, { status: 404 });

  const links = await db.sql`
    SELECT type, label, url, address, price, beds, baths
    FROM bio_links WHERE user_id = ${kit.user_id} ORDER BY sort_order ASC, id ASC
  `;

  return json({
    name: kit.agent_name || "",
    tagline: kit.bio_tagline || "",
    bgColor: kit.bio_bg_color || "#1B2430",
    boxColor: kit.bio_box_color || "#2E3B4C",
    nameFont: kit.bio_name_font || "",
    links: links.map((l) => ({
      type: l.type,
      label: l.label,
      url: l.url,
      address: l.address || "",
      price: l.price || "",
      beds: l.beds || "",
      baths: l.baths || "",
    })),
  });
}

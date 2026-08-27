import { getDb } from "../_lib/db.mjs";
import { getUserIdFromRequest, json } from "../_lib/auth.mjs";

const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

const LINK_TYPES = new Set(["website", "facebook", "instagram", "zillow", "realtor", "broker", "custom"]);

export async function onRequestGet({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb(env);
  const [kit] = await db.sql`SELECT bio_handle, bio_tagline, bio_bg_color, bio_box_color FROM brand_kits WHERE user_id = ${userId}`;
  const links = await db.sql`SELECT id, type, label, url, address, price, beds, baths FROM bio_links WHERE user_id = ${userId} ORDER BY sort_order ASC, id ASC`;

  return json({
    profile: {
      handle: kit?.bio_handle || "",
      tagline: kit?.bio_tagline || "",
      bgColor: kit?.bio_bg_color || "#1B2430",
      boxColor: kit?.bio_box_color || "#2E3B4C",
    },
    links: links.map((l) => ({
      id: String(l.id),
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

export async function onRequestPut({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, { status: 400 });

  const handle = String(body.handle || "").trim().toLowerCase();
  const tagline = String(body.tagline || "").slice(0, 200);
  const bgColor = String(body.bgColor || "#1B2430");
  const boxColor = String(body.boxColor || "#2E3B4C");
  const links = Array.isArray(body.links) ? body.links : [];

  if (handle && !HANDLE_RE.test(handle)) {
    return json({ error: "Handle can only use lowercase letters, numbers, and hyphens." }, { status: 400 });
  }
  for (const l of links) {
    if (!LINK_TYPES.has(l?.type)) return json({ error: "Invalid link type." }, { status: 400 });
  }

  const db = getDb(env);

  if (handle) {
    const [taken] = await db.sql`SELECT user_id FROM brand_kits WHERE bio_handle = ${handle} AND user_id != ${userId}`;
    if (taken) return json({ error: "That handle is already taken." }, { status: 409 });
  }

  try {
    await db.sql`
      UPDATE brand_kits SET
        bio_handle = ${handle || null},
        bio_tagline = ${tagline},
        bio_bg_color = ${bgColor},
        bio_box_color = ${boxColor},
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  } catch (err) {
    if (err?.code === "23505") return json({ error: "That handle is already taken." }, { status: 409 });
    throw err;
  }

  await db.sql`DELETE FROM bio_links WHERE user_id = ${userId}`;
  for (let i = 0; i < links.length; i++) {
    const l = links[i];
    await db.sql`
      INSERT INTO bio_links (user_id, type, label, url, sort_order, address, price, beds, baths)
      VALUES (
        ${userId}, ${l.type}, ${String(l.label || "").slice(0, 200)}, ${String(l.url || "").slice(0, 2000)}, ${i},
        ${l.address ? String(l.address).slice(0, 200) : null},
        ${l.price ? String(l.price).slice(0, 50) : null},
        ${l.beds ? String(l.beds).slice(0, 20) : null},
        ${l.baths ? String(l.baths).slice(0, 20) : null}
      )
    `;
  }

  return json({ ok: true });
}

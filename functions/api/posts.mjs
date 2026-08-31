import { getDb } from "../_lib/db.mjs";
import { getUserIdFromRequest, json } from "../_lib/auth.mjs";

// Data-URL PNGs land here, same storage pattern as brand_kits' headshot/logo
// — cap comfortably above what the canvas sizes in ListingTool actually
// produce, just to keep one bad request from writing an unbounded row.
const MAX_IMAGE_DATA_LENGTH = 12_000_000;

export async function onRequestGet({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb(env);
  const rows = await db.sql`
    SELECT id, category, headline, template, image_data, created_at
    FROM posts WHERE user_id = ${userId} ORDER BY created_at DESC, id DESC
  `;
  return json({
    posts: rows.map((r) => ({
      id: r.id,
      category: r.category,
      headline: r.headline,
      template: r.template,
      imageData: r.image_data,
      createdAt: r.created_at,
    })),
  });
}

export async function onRequestPost({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, { status: 400 });

  const category = String(body.category || "").slice(0, 60);
  const headline = String(body.headline || "").slice(0, 200);
  const template = String(body.template || "").slice(0, 60);
  const imageData = String(body.imageData || "");
  if (!imageData.startsWith("data:image/")) return json({ error: "Invalid image." }, { status: 400 });
  if (imageData.length > MAX_IMAGE_DATA_LENGTH) return json({ error: "Image too large to save." }, { status: 400 });

  const db = getDb(env);
  const [row] = await db.sql`
    INSERT INTO posts (user_id, category, headline, template, image_data)
    VALUES (${userId}, ${category}, ${headline}, ${template}, ${imageData})
    RETURNING id, category, headline, template, image_data, created_at
  `;
  return json({
    post: {
      id: row.id,
      category: row.category,
      headline: row.headline,
      template: row.template,
      imageData: row.image_data,
      createdAt: row.created_at,
    },
  });
}

export async function onRequestDelete({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid post id." }, { status: 400 });

  const db = getDb(env);
  await db.sql`DELETE FROM posts WHERE id = ${id} AND user_id = ${userId}`;
  return json({ ok: true });
}

import { getDb } from "../../_lib/db.mjs";
import { getUserIdFromRequest, json } from "../../_lib/auth.mjs";

const CATEGORIES = new Set(["community", "listing", "promo", "bts"]);

function toTopic(r) {
  return {
    id: r.id,
    dayOfMonth: r.day_of_month,
    title: r.title,
    category: r.category,
    active: r.active,
  };
}

export async function onRequestGet({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb(env);
  const rows = await db.sql`
    SELECT id, day_of_month, title, category, active
    FROM content_recurring_topics WHERE user_id = ${userId}
    ORDER BY day_of_month ASC, id ASC
  `;
  return json({ topics: rows.map(toTopic) });
}

export async function onRequestPost({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, { status: 400 });

  const dayOfMonth = Number(body.dayOfMonth);
  const title = String(body.title || "").trim().slice(0, 200);
  const category = String(body.category || "");

  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return json({ error: "Day must be between 1 and 31." }, { status: 400 });
  }
  if (!title) return json({ error: "Title is required." }, { status: 400 });
  if (!CATEGORIES.has(category)) return json({ error: "Invalid category." }, { status: 400 });

  const db = getDb(env);
  const [row] = await db.sql`
    INSERT INTO content_recurring_topics (user_id, day_of_month, title, category)
    VALUES (${userId}, ${dayOfMonth}, ${title}, ${category})
    RETURNING id, day_of_month, title, category, active
  `;
  return json({ topic: toTopic(row) });
}

// Only toggles active — day/title/category are cheap to redo as a new rule,
// and this is the field the calendar actually needs to flip live (pausing a
// recurring topic without losing the posts it already generated).
export async function onRequestPatch({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid topic id." }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.active !== "boolean") return json({ error: "Invalid request." }, { status: 400 });

  const db = getDb(env);
  const [row] = await db.sql`
    UPDATE content_recurring_topics SET active = ${body.active}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, day_of_month, title, category, active
  `;
  if (!row) return json({ error: "Topic not found." }, { status: 404 });
  return json({ topic: toTopic(row) });
}

// Posts already generated from this rule are left alone (recurring_topic_id
// is ON DELETE SET NULL) — deleting the rule stops future generation, it
// doesn't retroactively remove what's already on the calendar.
export async function onRequestDelete({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid topic id." }, { status: 400 });

  const db = getDb(env);
  await db.sql`DELETE FROM content_recurring_topics WHERE id = ${id} AND user_id = ${userId}`;
  return json({ ok: true });
}

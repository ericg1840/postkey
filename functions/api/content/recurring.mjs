import { requireUser } from "../../_lib/session.mjs";
import { json } from "../../_lib/auth.mjs";

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
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const rows = await db.sql`
    SELECT id, day_of_month, title, category, active
    FROM content_recurring_topics WHERE user_id = ${userId}
    ORDER BY day_of_month ASC, id ASC
  `;
  return json({ topics: rows.map(toTopic) });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

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

  const [row] = await db.sql`
    INSERT INTO content_recurring_topics (user_id, day_of_month, title, category)
    VALUES (${userId}, ${dayOfMonth}, ${title}, ${category})
    RETURNING id, day_of_month, title, category, active
  `;
  return json({ topic: toTopic(row) });
}

// Any of active / title / dayOfMonth / category; fields left out keep their
// value. Pausing is the common case (flipped live from the planner), but a
// typo in a rule's title shouldn't mean deleting and recreating it.
//
// Edits only reach months that haven't been generated yet: a month is
// generated once per rule (see content_recurring_generated), and the posts
// already made from it belong to the agent now — they may have been edited,
// moved or confirmed, so rewriting them from the rule would undo that.
export async function onRequestPatch({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid topic id." }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, { status: 400 });

  let active = null;
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") return json({ error: "Invalid request." }, { status: 400 });
    active = body.active;
  }

  let dayOfMonth = null;
  if (body.dayOfMonth !== undefined) {
    dayOfMonth = Number(body.dayOfMonth);
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      return json({ error: "Day must be between 1 and 31." }, { status: 400 });
    }
  }

  let title = null;
  if (body.title !== undefined) {
    title = String(body.title || "").trim().slice(0, 200);
    if (!title) return json({ error: "Title is required." }, { status: 400 });
  }

  let category = null;
  if (body.category !== undefined) {
    if (!CATEGORIES.has(body.category)) return json({ error: "Invalid category." }, { status: 400 });
    category = body.category;
  }

  if (active === null && dayOfMonth === null && title === null && category === null) {
    return json({ error: "Invalid request." }, { status: 400 });
  }

  const [row] = await db.sql`
    UPDATE content_recurring_topics SET
      active = COALESCE(${active}, active),
      day_of_month = COALESCE(${dayOfMonth}, day_of_month),
      title = COALESCE(${title}, title),
      category = COALESCE(${category}, category)
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
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid topic id." }, { status: 400 });

  await db.sql`DELETE FROM content_recurring_topics WHERE id = ${id} AND user_id = ${userId}`;
  return json({ ok: true });
}

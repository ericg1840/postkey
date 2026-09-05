import { getDb } from "../../_lib/db.mjs";
import { getUserIdFromRequest, json } from "../../_lib/auth.mjs";

const CATEGORIES = new Set(["community", "listing", "promo", "bts"]);

function toIdea(r) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    targetDate: r.target_date,
    added: !!r.added_at,
  };
}

// Only unconverted ideas — once one is turned into a post via
// /api/content/posts?source=idea, it's done being an "idea" and drops out
// of this list rather than lingering as a disabled row.
export async function onRequestGet({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb(env);
  const rows = await db.sql`
    SELECT id, title, category, target_date, added_at
    FROM content_ideas WHERE user_id = ${userId} AND added_at IS NULL
    ORDER BY target_date ASC NULLS LAST, id ASC
  `;
  return json({ ideas: rows.map(toIdea) });
}

// "Add to plan" — promotes an idea into a suggested content_post (still
// needs confirming on the calendar, same as an auto-fill suggestion) and
// marks the idea converted so it drops off this list.
export async function onRequestPatch({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid idea id." }, { status: 400 });

  const db = getDb(env);
  const [idea] = await db.sql`
    SELECT id, title, category, target_date, added_at
    FROM content_ideas WHERE id = ${id} AND user_id = ${userId}
  `;
  if (!idea) return json({ error: "Idea not found." }, { status: 404 });
  if (idea.added_at) return json({ error: "Idea already added." }, { status: 400 });

  const date = idea.target_date || new Date().toISOString().slice(0, 10);
  const [post] = await db.sql`
    INSERT INTO content_posts (user_id, date, title, category, status, source)
    VALUES (${userId}, ${date}, ${idea.title}, ${idea.category}, 'suggested', 'idea')
    RETURNING id, date, title, category, status, source, posted
  `;
  await db.sql`UPDATE content_ideas SET added_at = NOW() WHERE id = ${id}`;

  return json({
    idea: toIdea({ ...idea, added_at: new Date() }),
    post: {
      id: post.id, date: post.date, title: post.title, category: post.category,
      status: post.status, source: post.source, posted: post.posted,
    },
  });
}

export async function onRequestPost({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, { status: 400 });

  const title = String(body.title || "").trim().slice(0, 200);
  const category = String(body.category || "");
  const targetDate = body.targetDate ? String(body.targetDate) : null;
  if (!title) return json({ error: "Title is required." }, { status: 400 });
  if (!CATEGORIES.has(category)) return json({ error: "Invalid category." }, { status: 400 });

  const db = getDb(env);
  const [row] = await db.sql`
    INSERT INTO content_ideas (user_id, title, category, target_date)
    VALUES (${userId}, ${title}, ${category}, ${targetDate})
    RETURNING id, title, category, target_date, added_at
  `;
  return json({ idea: toIdea(row) });
}

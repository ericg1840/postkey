import { getDb } from "../../_lib/db.mjs";
import { getUserIdFromRequest, json } from "../../_lib/auth.mjs";

const CATEGORIES = new Set(["community", "listing", "promo", "bts"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toPost(r) {
  return {
    id: r.id,
    date: r.date,
    title: r.title,
    category: r.category,
    status: r.status,
    source: r.source,
    posted: r.posted,
  };
}

export async function onRequestGet({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const month = new URL(request.url).searchParams.get("month") || "";
  const db = getDb(env);

  // Profile's "every post you've scheduled" list wants every post
  // regardless of month, so `month` is optional — the calendar itself
  // always passes one to keep its own queries scoped to what's on screen.
  if (!month) {
    const rows = await db.sql`
      SELECT id, date, title, category, status, source, posted
      FROM content_posts WHERE user_id = ${userId} ORDER BY date ASC, id ASC
    `;
    return json({ posts: rows.map(toPost) });
  }

  if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: "Invalid month." }, { status: 400 });

  const rows = await db.sql`
    SELECT id, date, title, category, status, source, posted
    FROM content_posts
    WHERE user_id = ${userId} AND date LIKE ${month + "-%"}
    ORDER BY date ASC, id ASC
  `;
  return json({ posts: rows.map(toPost) });
}

export async function onRequestPost({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, { status: 400 });

  const date = String(body.date || "");
  const title = String(body.title || "").trim().slice(0, 200);
  const category = String(body.category || "");
  const status = body.status === "suggested" ? "suggested" : "confirmed";
  const source = ["manual", "autofill", "idea"].includes(body.source) ? body.source : "manual";

  if (!DATE_RE.test(date)) return json({ error: "Invalid date." }, { status: 400 });
  if (!title) return json({ error: "Title is required." }, { status: 400 });
  if (!CATEGORIES.has(category)) return json({ error: "Invalid category." }, { status: 400 });

  const db = getDb(env);
  const [row] = await db.sql`
    INSERT INTO content_posts (user_id, date, title, category, status, source)
    VALUES (${userId}, ${date}, ${title}, ${category}, ${status}, ${source})
    RETURNING id, date, title, category, status, source, posted
  `;
  return json({ post: toPost(row) });
}

export async function onRequestPatch({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid post id." }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, { status: 400 });

  let status = null;
  if (body.status !== undefined) {
    if (body.status !== "confirmed" && body.status !== "suggested") {
      return json({ error: "Invalid status." }, { status: 400 });
    }
    status = body.status;
  }

  let title = null;
  if (body.title !== undefined) {
    title = String(body.title || "").trim().slice(0, 200);
    if (!title) return json({ error: "Title is required." }, { status: 400 });
  }

  let date = null;
  if (body.date !== undefined) {
    if (!DATE_RE.test(body.date)) return json({ error: "Invalid date." }, { status: 400 });
    date = body.date;
  }

  let category = null;
  if (body.category !== undefined) {
    if (!CATEGORIES.has(body.category)) return json({ error: "Invalid category." }, { status: 400 });
    category = body.category;
  }

  const posted = body.posted !== undefined ? !!body.posted : null;

  // Single statement covering every field the request touched — COALESCE
  // falls back to the existing column value for anything left null above,
  // so one UPDATE (plus the RETURNING) replaces what used to be up to
  // five sequential round trips per save.
  const db = getDb(env);
  const [row] = await db.sql`
    UPDATE content_posts SET
      status = COALESCE(${status}, status),
      posted = COALESCE(${posted}, posted),
      title = COALESCE(${title}, title),
      date = COALESCE(${date}, date),
      category = COALESCE(${category}, category)
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, date, title, category, status, source, posted
  `;
  if (!row) return json({ error: "Post not found." }, { status: 404 });
  return json({ post: toPost(row) });
}

export async function onRequestDelete({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid post id." }, { status: 400 });

  const db = getDb(env);
  await db.sql`DELETE FROM content_posts WHERE id = ${id} AND user_id = ${userId}`;
  return json({ ok: true });
}

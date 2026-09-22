import { requireUser } from "../../_lib/session.mjs";
import { json } from "../../_lib/auth.mjs";
import { logEvent } from "../../_lib/activity.mjs";

const CATEGORIES = new Set(["community", "listing", "promo", "bts"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Materializes each active recurring topic into a suggested post for the
// requested month — run the first time someone looks at that month rather
// than on a cron, since there's no scheduler wired up for this Worker.
// day_of_month is clamped to the month's actual last day (the 31st in
// February lands on the 28th/29th) rather than being skipped.
//
// One statement: claim (topic, month) in content_recurring_generated, and
// insert a post only for the claims that were new. Deciding by the ledger
// rather than by "is the post still there" is what keeps a dismissed or
// moved suggestion from being regenerated, and the primary key on the ledger
// is what keeps two simultaneous views from each inserting a copy.
export async function generateRecurringPosts(db, userId, month) {
  const [year, mo] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mo, 0).getDate();

  await db.sql`
    WITH claimed AS (
      INSERT INTO content_recurring_generated (topic_id, month)
      SELECT id, ${month} FROM content_recurring_topics
       WHERE user_id = ${userId} AND active = true
      ON CONFLICT DO NOTHING
      RETURNING topic_id
    )
    INSERT INTO content_posts (user_id, date, title, category, status, source, recurring_topic_id)
    SELECT ${userId},
           ${month} || '-' || lpad(LEAST(t.day_of_month, ${daysInMonth})::text, 2, '0'),
           t.title, t.category, 'suggested', 'recurring', t.id
      FROM claimed c
      JOIN content_recurring_topics t ON t.id = c.topic_id
  `;
}

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
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const month = new URL(request.url).searchParams.get("month") || "";

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

  await generateRecurringPosts(db, userId, month);

  const rows = await db.sql`
    SELECT id, date, title, category, status, source, posted
    FROM content_posts
    WHERE user_id = ${userId} AND date LIKE ${month + "-%"}
    ORDER BY date ASC, id ASC
  `;
  return json({ posts: rows.map(toPost) });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

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

  const [row] = await db.sql`
    INSERT INTO content_posts (user_id, date, title, category, status, source)
    VALUES (${userId}, ${date}, ${title}, ${category}, ${status}, ${source})
    RETURNING id, date, title, category, status, source, posted
  `;
  await logEvent(db, userId, "content_post_added", { category, status, source }).catch(() => {});
  return json({ post: toPost(row) });
}

export async function onRequestPatch({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

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
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid post id." }, { status: 400 });

  await db.sql`DELETE FROM content_posts WHERE id = ${id} AND user_id = ${userId}`;
  return json({ ok: true });
}

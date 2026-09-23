import { requireUser } from "../../_lib/session.mjs";
import { json } from "../../_lib/auth.mjs";
import { logEvent } from "../../_lib/activity.mjs";

const CATEGORIES = new Set(["community", "listing", "promo", "bts"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

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
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid idea id." }, { status: 400 });

  const [idea] = await db.sql`
    SELECT id, title, category, target_date, added_at
    FROM content_ideas WHERE id = ${id} AND user_id = ${userId}
  `;
  if (!idea) return json({ error: "Idea not found." }, { status: 404 });
  if (idea.added_at) return json({ error: "Idea already added." }, { status: 400 });

  // The target date becomes the post's date, which the calendar places by
  // string match — so an idea with no usable date (none set, or saved before
  // the POST validated it) lands on today rather than nowhere. "Today" is
  // the client's local date when it sends one, since the Worker only knows
  // UTC (the same trap autofill.mjs's resolveToday guards against).
  const body = await request.json().catch(() => ({}));
  const date = DATE_RE.test(idea.target_date || "")
    ? idea.target_date
    : DATE_RE.test(body?.today || "") ? body.today : new Date().toISOString().slice(0, 10);

  // Claiming the idea (added_at IS NULL -> NOW()) and creating the post in
  // one statement means a double-click, or two tabs, can't turn one idea
  // into two posts: only one claim matches, and the other inserts nothing.
  const [post] = await db.sql`
    WITH claimed AS (
      UPDATE content_ideas SET added_at = NOW()
       WHERE id = ${id} AND user_id = ${userId} AND added_at IS NULL
      RETURNING title, category
    )
    INSERT INTO content_posts (user_id, date, title, category, status, source)
    SELECT ${userId}, ${date}, title, category, 'suggested', 'idea' FROM claimed
    RETURNING id, date, title, category, status, source, posted
  `;
  if (!post) return json({ error: "Idea already added." }, { status: 400 });

  return json({
    idea: toIdea({ ...idea, added_at: new Date() }),
    post: {
      id: post.id, date: post.date, title: post.title, category: post.category,
      status: post.status, source: post.source, posted: post.posted,
    },
  });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, { status: 400 });

  const title = String(body.title || "").trim().slice(0, 200);
  const category = String(body.category || "");
  const targetDate = body.targetDate ? String(body.targetDate) : null;
  if (!title) return json({ error: "Title is required." }, { status: 400 });
  if (targetDate !== null && !DATE_RE.test(targetDate)) return json({ error: "Invalid date." }, { status: 400 });
  if (!CATEGORIES.has(category)) return json({ error: "Invalid category." }, { status: 400 });

  const [row] = await db.sql`
    INSERT INTO content_ideas (user_id, title, category, target_date)
    VALUES (${userId}, ${title}, ${category}, ${targetDate})
    RETURNING id, title, category, target_date, added_at
  `;
  await logEvent(db, userId, "content_idea_added", { category }).catch(() => {});
  return json({ idea: toIdea(row) });
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return json({ error: "Invalid idea id." }, { status: 400 });

  await db.sql`DELETE FROM content_ideas WHERE id = ${id} AND user_id = ${userId}`;
  return json({ ok: true });
}

import { getDb } from "../_lib/db.mjs";
import { getUserIdFromRequest, json } from "../_lib/auth.mjs";
import { logEvent } from "../_lib/activity.mjs";

// Data-URL PNGs land here, same storage pattern as brand_kits' headshot/logo
// — cap comfortably above what the canvas sizes in ListingTool actually
// produce, just to keep one bad request from writing an unbounded row.
const MAX_IMAGE_DATA_LENGTH = 12_000_000;

// The grid thumbnail is a ~400px JPEG of the same graphic — tens of KB
// against the full image's megabytes. Capped well above that so a legitimate
// one is never rejected, low enough that it can't quietly become a second
// full-size image.
const MAX_THUMB_DATA_LENGTH = 400_000;

// Post images are stored as data URLs in Postgres, so the Post Library is
// the fastest-growing thing in the database — an unbounded history meant one
// enthusiastic user could fill the whole instance and break saving for
// everyone at once. The library is a convenience (the agent already
// downloaded the file), so the oldest entries age out rather than the save
// failing. Deliberately generous: at a post a day this is over three months
// of history, so a normal user should never reach it.
export const MAX_POSTS_PER_USER = 100;

// Trims a user's history back to the newest MAX_POSTS_PER_USER rows and
// returns how many were removed. Ordered by created_at with id as the
// tiebreak so two posts saved in the same second still have a stable, and
// correct, notion of which one is older.
export async function pruneOldPosts(db, userId, max = MAX_POSTS_PER_USER) {
  const removed = await db.sql`
    DELETE FROM posts
     WHERE user_id = ${userId}
       AND id NOT IN (
         SELECT id FROM posts
          WHERE user_id = ${userId}
          ORDER BY created_at DESC, id DESC
          LIMIT ${max}
       )
    RETURNING id
  `;
  return removed.length;
}

// `?id=N` returns that one post's full-resolution image; without it, the
// listing returns metadata plus thumbnails only. Full images are megabytes
// each as data URLs, so returning every one of them to draw a grid of
// thumbnails meant a single request in the tens of megabytes.
export async function onRequestGet({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb(env);
  const idParam = new URL(request.url).searchParams.get("id");

  if (idParam !== null) {
    const id = Number(idParam);
    if (!Number.isInteger(id)) return json({ error: "Invalid post id." }, { status: 400 });
    const [row] = await db.sql`
      SELECT image_data FROM posts WHERE id = ${id} AND user_id = ${userId}
    `;
    if (!row) return json({ error: "Post not found." }, { status: 404 });
    return json({ imageData: row.image_data });
  }

  const rows = await db.sql`
    SELECT id, category, headline, template, thumb_data, created_at
    FROM posts WHERE user_id = ${userId} ORDER BY created_at DESC, id DESC
  `;
  return json({
    posts: rows.map((r) => ({
      id: r.id,
      category: r.category,
      headline: r.headline,
      template: r.template,
      // Null for posts saved before thumbnails existed — the Post Library
      // falls back to fetching those full images one at a time.
      thumbData: r.thumb_data,
      createdAt: r.created_at,
    })),
    // Sent with the listing rather than hardcoded in the client, so the cap
    // lives in exactly one place and the UI can't drift from what the server
    // actually enforces.
    limit: MAX_POSTS_PER_USER,
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

  // Optional: an older client (or a tainted canvas that only got as far as
  // the full image) can still save without one — the listing just falls back
  // to fetching that post's full image on demand.
  const thumbRaw = String(body.thumbData || "");
  const thumbData = thumbRaw.startsWith("data:image/") && thumbRaw.length <= MAX_THUMB_DATA_LENGTH ? thumbRaw : null;

  const db = getDb(env);
  const [row] = await db.sql`
    INSERT INTO posts (user_id, category, headline, template, image_data, thumb_data)
    VALUES (${userId}, ${category}, ${headline}, ${template}, ${imageData}, ${thumbData})
    RETURNING id, category, headline, template, thumb_data, created_at
  `;

  await logEvent(db, userId, "post_created", { category, template, headline }).catch(() => {});

  // After the insert, so the post the agent just made is always the one
  // that's kept. A failure here must not fail the save — the row is already
  // committed, and the next save will trim it anyway.
  let pruned = 0;
  try {
    pruned = await pruneOldPosts(db, userId);
  } catch (err) {
    console.error("Pruning old posts failed", err);
  }

  return json({
    post: {
      id: row.id,
      category: row.category,
      headline: row.headline,
      template: row.template,
      thumbData: row.thumb_data,
      createdAt: row.created_at,
    },
    // Lets the Post Library reconcile without a refetch when the save pushed
    // something off the end of the history.
    pruned,
    limit: MAX_POSTS_PER_USER,
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

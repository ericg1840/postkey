import { getDb } from "../_lib/db.mjs";
import { getUserIdFromRequest, json } from "../_lib/auth.mjs";

// Drafts hold form fields only — no photos, which never leave memory — so a
// legitimate one is a couple of KB. Capped well above that so a real draft is
// never rejected, low enough that this can't become a place to stash data.
const MAX_FORM_BYTES = 100_000;

// Same reasoning as the Post Library cap: bounded so one account can't grow
// without limit. Far more than anyone plans in a sitting.
export const MAX_DRAFTS_PER_USER = 100;

// How long a delete is remembered. The tombstone only has to outlive the
// gap between a delete on one device and the next sync on another; a month
// covers a laptop that sat closed over a holiday. Past that the row is
// pruned, since resurrecting a draft nobody has opened in a month is a far
// smaller problem than keeping tombstones forever.
const TOMBSTONE_RETENTION_DAYS = 30;

function toDraft(row) {
  return {
    id: row.id,
    tool: row.tool,
    label: row.label,
    typeLabel: row.type_label,
    date: row.target_date,
    form: row.form || {},
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function onRequestGet({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb(env);
  const rows = await db.sql`
    SELECT id, tool, label, type_label, target_date, form, updated_at, deleted_at
      FROM post_drafts
     WHERE user_id = ${userId}
     ORDER BY updated_at DESC
  `;

  return json({
    drafts: rows.filter((r) => !r.deleted_at).map(toDraft),
    // Sent alongside rather than silently dropped: the client needs to know
    // which ids were deleted elsewhere so it can drop its own stale copies.
    deleted: rows.filter((r) => r.deleted_at).map((r) => r.id),
    limit: MAX_DRAFTS_PER_USER,
  });
}

export async function onRequestPut({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = String(body?.id || "").slice(0, 80);
  if (!id) return json({ error: "Invalid draft id." }, { status: 400 });

  const form = body?.form && typeof body.form === "object" ? body.form : {};
  const serialized = JSON.stringify(form);
  if (serialized.length > MAX_FORM_BYTES) {
    return json({ error: "That draft is too large to save." }, { status: 400 });
  }

  const tool = String(body?.tool || "").slice(0, 40);
  const label = String(body?.label || "").slice(0, 200);
  const typeLabel = String(body?.typeLabel || "").slice(0, 80);
  const targetDate = body?.date ? String(body.date).slice(0, 20) : null;

  const db = getDb(env);

  // Only counts against the cap when it's a new draft — editing one you
  // already have must never fail because you're at the limit.
  const [existing] = await db.sql`SELECT id FROM post_drafts WHERE user_id = ${userId} AND id = ${id}`;
  if (!existing) {
    const [{ count }] = await db.sql`
      SELECT COUNT(*)::int AS count FROM post_drafts WHERE user_id = ${userId} AND deleted_at IS NULL
    `;
    if (count >= MAX_DRAFTS_PER_USER) {
      return json(
        { error: `You can keep ${MAX_DRAFTS_PER_USER} drafts at a time. Finish or delete one to save another.` },
        { status: 409 }
      );
    }
  }

  // updated_at is the server's clock, not the client's: last-write-wins is
  // only meaningful if both sides are measured the same way, and a device
  // with a skewed clock would otherwise win or lose every conflict.
  //
  // Re-saving clears deleted_at, so a draft deleted and then saved again
  // under the same id comes back rather than staying invisible.
  const [row] = await db.sql`
    INSERT INTO post_drafts (user_id, id, tool, label, type_label, target_date, form, updated_at, deleted_at)
    VALUES (${userId}, ${id}, ${tool}, ${label}, ${typeLabel}, ${targetDate}, ${serialized}::jsonb, NOW(), NULL)
    ON CONFLICT (user_id, id) DO UPDATE SET
      tool = EXCLUDED.tool,
      label = EXCLUDED.label,
      type_label = EXCLUDED.type_label,
      target_date = EXCLUDED.target_date,
      form = EXCLUDED.form,
      updated_at = NOW(),
      deleted_at = NULL
    RETURNING id, tool, label, type_label, target_date, form, updated_at
  `;

  return json({ draft: toDraft(row) });
}

export async function onRequestDelete({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Invalid draft id." }, { status: 400 });

  const db = getDb(env);
  // Tombstone rather than DELETE, so another device that still has this draft
  // learns it was removed instead of pushing it back up.
  await db.sql`
    UPDATE post_drafts SET deleted_at = NOW(), form = '{}'::jsonb
     WHERE user_id = ${userId} AND id = ${id}
  `;

  // Cheap enough to do on the way past, and keeps tombstones from
  // accumulating for the life of the account. make_interval() rather than
  // INTERVAL '<n> days' because a bind parameter inside a string literal is
  // not a parameter — it's the literal text "$1".
  //
  // Failing to prune must not fail the delete: the tombstone is already
  // written, which is the part that matters, and the next delete tries again.
  try {
    await db.sql`
      DELETE FROM post_drafts
       WHERE user_id = ${userId}
         AND deleted_at IS NOT NULL
         AND deleted_at < NOW() - make_interval(days => ${TOMBSTONE_RETENTION_DAYS})
    `;
  } catch (err) {
    console.error("Pruning draft tombstones failed", err);
  }

  return json({ ok: true });
}

import { requireAdmin } from "../../_lib/admin.mjs";
import { json } from "../../_lib/auth.mjs";

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin.error) return admin.error;
  const { db } = admin;

  const rows = await db.sql`
    SELECT a.id, a.event_type, a.details, a.created_at, u.email
    FROM activity_events a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT 20
  `;

  return json({
    events: rows.map((r) => ({
      id: r.id,
      eventType: r.event_type,
      details: r.details,
      email: r.email,
      createdAt: r.created_at,
    })),
  });
}

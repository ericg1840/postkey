import { requireAdmin } from "../../_lib/admin.mjs";
import { json } from "../../_lib/auth.mjs";

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin.error) return admin.error;
  const { db } = admin;

  const [[{ total_users }], [{ active_subscribers }], [{ mrr_cents }], [{ new_signups }]] = await Promise.all([
    db.sql`SELECT COUNT(*)::int AS total_users FROM users`,
    db.sql`SELECT COUNT(*)::int AS active_subscribers FROM subscriptions WHERE status = 'active' AND tier <> 'free'`,
    db.sql`SELECT COALESCE(SUM(monthly_amount_cents), 0)::int AS mrr_cents FROM subscriptions WHERE status = 'active'`,
    db.sql`SELECT COUNT(*)::int AS new_signups FROM users WHERE created_at >= date_trunc('month', now())`,
  ]);

  return json({
    totalUsers: total_users,
    activeSubscribers: active_subscribers,
    mrrCents: mrr_cents,
    newSignupsThisMonth: new_signups,
  });
}

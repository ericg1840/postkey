import { requireAdmin } from "../../_lib/admin.mjs";
import { json } from "../../_lib/auth.mjs";

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin.error) return admin.error;
  const { db } = admin;

  const [
    [{ total_users }],
    [{ active_subscribers }],
    [{ mrr_cents }],
    [{ new_signups }],
    [{ dau_7 }],
    [{ wau_30 }],
    [{ posts_total }],
    [{ posts_this_week }],
    [{ onboarded_count }],
    [{ bio_pages }],
    [{ public_views_week }],
    [{ zillow_pulls_total }],
  ] = await Promise.all([
    db.sql`SELECT COUNT(*)::int AS total_users FROM users`,
    db.sql`SELECT COUNT(*)::int AS active_subscribers FROM subscriptions WHERE status = 'active' AND tier <> 'free'`,
    db.sql`SELECT COALESCE(SUM(monthly_amount_cents), 0)::int AS mrr_cents FROM subscriptions WHERE status = 'active'`,
    db.sql`SELECT COUNT(*)::int AS new_signups FROM users WHERE created_at >= date_trunc('month', now())`,
    // Distinct users with any activity in the last 7 days
    db.sql`SELECT COUNT(DISTINCT user_id)::int AS dau_7 FROM activity_events WHERE user_id IS NOT NULL AND created_at >= now() - interval '7 days'`,
    // Distinct users with any activity in the last 30 days
    db.sql`SELECT COUNT(DISTINCT user_id)::int AS wau_30 FROM activity_events WHERE user_id IS NOT NULL AND created_at >= now() - interval '30 days'`,
    db.sql`SELECT COUNT(*)::int AS posts_total FROM posts`,
    db.sql`SELECT COUNT(*)::int AS posts_this_week FROM posts WHERE created_at >= now() - interval '7 days'`,
    db.sql`SELECT COUNT(*)::int AS onboarded_count FROM brand_kits WHERE onboarded = true`,
    db.sql`SELECT COUNT(*)::int AS bio_pages FROM brand_kits WHERE bio_handle IS NOT NULL AND bio_handle <> ''`,
    db.sql`SELECT COUNT(*)::int AS public_views_week FROM activity_events WHERE event_type = 'page_view' AND created_at >= now() - interval '7 days'`,
    db.sql`SELECT COALESCE(SUM(zillow_pulls_count), 0)::int AS zillow_pulls_total FROM users`,
  ]);

  const onboardedPct = total_users > 0 ? Math.round((onboarded_count / total_users) * 100) : 0;

  return json({
    totalUsers: total_users,
    activeSubscribers: active_subscribers,
    mrrCents: mrr_cents,
    newSignupsThisMonth: new_signups,
    // Product engagement
    activeUsers7d: dau_7,
    activeUsers30d: wau_30,
    postsTotal: posts_total,
    postsThisWeek: posts_this_week,
    onboardedCount: onboarded_count,
    onboardedPct,
    bioPages: bio_pages,
    publicViewsThisWeek: public_views_week,
    zillowPullsTotal: zillow_pulls_total,
  });
}

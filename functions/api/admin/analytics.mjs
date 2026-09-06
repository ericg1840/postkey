import { requireAdmin } from "../../_lib/admin.mjs";
import { json } from "../../_lib/auth.mjs";

// Every event type worth surfacing as a "feature" in the usage
// breakdown below, with the human label shown in the dashboard. Anything
// logged via logEvent() that isn't a real feature-usage signal (auth,
// billing, admin actions) is left out on purpose.
const FEATURE_LABELS = {
  listing_created: "Listing Tool",
  link_updated: "Key Link page edits",
  post_created: "Posts downloaded",
  content_post_added: "Content Calendar posts",
  content_idea_added: "Content Calendar ideas",
  page_view: "Public Key Link page views",
};

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin.error) return admin.error;
  const { db } = admin;

  const [
    [{ total_signups }],
    [{ onboarded }],
    [{ created_first_post }],
    [{ became_paid }],
    featureRows,
    [{ home_viewers }],
    [{ signup_page_viewers }],
    [{ tracked_signups }],
    topPageRows,
  ] = await Promise.all([
    db.sql`SELECT COUNT(*)::int AS total_signups FROM users`,
    db.sql`SELECT COUNT(*)::int AS onboarded FROM brand_kits WHERE onboarded = true`,
    db.sql`SELECT COUNT(DISTINCT user_id)::int AS created_first_post FROM posts`,
    db.sql`SELECT COUNT(*)::int AS became_paid FROM subscriptions WHERE tier = 'paid' AND status = 'active'`,
    db.sql`
      SELECT event_type, COUNT(*)::int AS event_count, COUNT(DISTINCT user_id)::int AS user_count
      FROM activity_events
      WHERE event_type = ANY(${Object.keys(FEATURE_LABELS)}) AND created_at >= now() - interval '30 days'
      GROUP BY event_type
    `,
    // Marketing-site funnel: anonymous visitors are joined to a completed
    // signup by the anonId the browser beacon sends on every pageview and
    // that AuthContext.signup() attaches to the signup event's details.
    db.sql`
      SELECT COUNT(DISTINCT details->>'anonId')::int AS home_viewers
      FROM activity_events
      WHERE event_type = 'marketing_page_view' AND details->>'path' = 'home' AND created_at >= now() - interval '30 days'
    `,
    db.sql`
      SELECT COUNT(DISTINCT details->>'anonId')::int AS signup_page_viewers
      FROM activity_events
      WHERE event_type = 'marketing_page_view' AND details->>'path' = 'signup' AND created_at >= now() - interval '30 days'
    `,
    db.sql`
      SELECT COUNT(*)::int AS tracked_signups
      FROM activity_events
      WHERE event_type = 'signup' AND details->>'anonId' IS NOT NULL AND created_at >= now() - interval '30 days'
    `,
    db.sql`
      SELECT details->>'path' AS path, COUNT(*)::int AS views, COUNT(DISTINCT details->>'anonId')::int AS visitors
      FROM activity_events
      WHERE event_type = 'marketing_page_view' AND created_at >= now() - interval '30 days'
      GROUP BY details->>'path'
      ORDER BY views DESC
    `,
  ]);

  // A simple, ordered signup -> activation -> retention -> revenue funnel.
  // Each stage's count can never exceed the stage before it in practice
  // (onboarding/posting/paying all require an account), so pct is safe to
  // compute straight off total_signups.
  const funnelStages = [
    { key: "signed_up", label: "Signed up", count: total_signups },
    { key: "onboarded", label: "Completed onboarding", count: onboarded },
    { key: "created_post", label: "Created a post", count: created_first_post },
    { key: "paid", label: "Became a paid subscriber", count: became_paid },
  ];
  const funnel = funnelStages.map((stage, i) => ({
    ...stage,
    pctOfTotal: total_signups > 0 ? Math.round((stage.count / total_signups) * 100) : 0,
    pctOfPrevious: i === 0 || funnelStages[i - 1].count === 0
      ? 100
      : Math.round((stage.count / funnelStages[i - 1].count) * 100),
  }));

  const byType = Object.fromEntries(featureRows.map((r) => [r.event_type, r]));
  const featureUsage = Object.entries(FEATURE_LABELS)
    .map(([eventType, label]) => ({
      eventType,
      label,
      events30d: byType[eventType]?.event_count ?? 0,
      users30d: byType[eventType]?.user_count ?? 0,
    }))
    .sort((a, b) => b.events30d - a.events30d);

  const marketingStages = [
    { key: "viewed_home", label: "Viewed the homepage", count: home_viewers },
    { key: "viewed_signup", label: "Opened the signup form", count: signup_page_viewers },
    { key: "signed_up", label: "Completed signup", count: tracked_signups },
  ];
  const marketingFunnel = marketingStages.map((stage, i) => ({
    ...stage,
    pctOfTotal: home_viewers > 0 ? Math.round((stage.count / home_viewers) * 100) : 0,
    pctOfPrevious: i === 0 || marketingStages[i - 1].count === 0
      ? 100
      : Math.round((stage.count / marketingStages[i - 1].count) * 100),
  }));

  const PAGE_LABELS = { home: "Homepage", about: "About", privacy: "Privacy policy", terms: "Terms", login: "Log in", signup: "Sign up" };
  const topPages = topPageRows.map((r) => ({ path: r.path, label: PAGE_LABELS[r.path] || r.path, views: r.views, visitors: r.visitors }));

  return json({ funnel, featureUsage, marketingFunnel, topPages });
}

import { requireAdmin } from "../../_lib/admin.mjs";
import { json } from "../../_lib/auth.mjs";

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin.error) return admin.error;
  const { db } = admin;

  const userId = Number(new URL(request.url).searchParams.get("userId"));
  if (!Number.isInteger(userId)) return json({ error: "Invalid user id." }, { status: 400 });

  const [user] = await db.sql`
    SELECT u.id, u.email, u.full_name, u.created_at, u.last_login_at, u.account_status, u.zillow_pulls_count,
           COALESCE(s.tier, 'free') AS tier
    FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id
    WHERE u.id = ${userId}
  `;
  if (!user) return json({ error: "User not found." }, { status: 404 });

  const [{ posts_count }] = await db.sql`SELECT COUNT(*)::int AS posts_count FROM posts WHERE user_id = ${userId}`;
  const recentPosts = await db.sql`
    SELECT category, headline, created_at FROM posts WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 10
  `;
  const recentEvents = await db.sql`
    SELECT event_type, detail, created_at FROM activity_log WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 10
  `;

  return json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      signupDate: user.created_at,
      lastLoginAt: user.last_login_at,
      accountStatus: user.account_status,
      tier: user.tier,
    },
    listingsCreated: posts_count,
    zillowPullsUsed: user.zillow_pulls_count,
    recentPosts: recentPosts.map((p) => ({ category: p.category, headline: p.headline, createdAt: p.created_at })),
    recentEvents: recentEvents.map((e) => ({ eventType: e.event_type, detail: e.detail, createdAt: e.created_at })),
  });
}

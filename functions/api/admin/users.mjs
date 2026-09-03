import { requireAdmin } from "../../_lib/admin.mjs";
import { json } from "../../_lib/auth.mjs";

const PAGE_SIZE = 50;

// Empty-string filters are always passed as query params (rather than
// conditionally omitted) so this stays a single parameterized statement —
// simpler and safer than building the WHERE clause out of string pieces.
export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin.error) return admin.error;
  const { db } = admin;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const tier = url.searchParams.get("tier") || "";
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db.sql`
    SELECT u.id, u.email, u.created_at, u.last_login_at, u.account_status,
           COALESCE(s.tier, 'free') AS tier, COUNT(*) OVER()::int AS total_count
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    WHERE (${q} = '' OR u.email ILIKE ${"%" + q + "%"})
      AND (${tier} = '' OR COALESCE(s.tier, 'free') = ${tier})
      AND (${status} = '' OR u.account_status = ${status})
    ORDER BY u.created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  return json({
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      signupDate: r.created_at,
      lastLoginAt: r.last_login_at,
      tier: r.tier,
      accountStatus: r.account_status,
    })),
    page,
    pageSize: PAGE_SIZE,
    totalCount: rows[0]?.total_count ?? 0,
  });
}

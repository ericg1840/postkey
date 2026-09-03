import { requireAdmin } from "../../_lib/admin.mjs";

function csvCell(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin.error) return admin.error;
  const { db } = admin;

  const rows = await db.sql`
    SELECT u.email, u.created_at, u.last_login_at, u.account_status,
           COALESCE(s.tier, 'free') AS tier, COALESCE(s.monthly_amount_cents, 0) AS monthly_amount_cents
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    ORDER BY u.created_at DESC
  `;

  const header = ["Email", "Signup Date", "Last Login", "Subscription Tier", "Monthly Amount (USD)", "Account Status"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.email,
        r.created_at ? new Date(r.created_at).toISOString() : "",
        r.last_login_at ? new Date(r.last_login_at).toISOString() : "",
        r.tier,
        (r.monthly_amount_cents / 100).toFixed(2),
        r.account_status,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  return new Response(lines.join("\n") + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="postkey-users-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

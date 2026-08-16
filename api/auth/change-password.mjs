import { getDb } from "../_lib/db.mjs";
import { getUserIdFromRequest, verifyPassword, hashPassword, json } from "../_lib/auth.mjs";

export async function POST(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = body?.currentPassword || "";
  const newPassword = body?.newPassword || "";

  if (newPassword.length < 8) return json({ error: "New password must be at least 8 characters." }, { status: 400 });

  const db = getDb();
  const [user] = await db.sql`SELECT password_hash FROM users WHERE id = ${userId}`;
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    return json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const passwordHash = hashPassword(newPassword);
  await db.sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;

  return json({ ok: true });
}

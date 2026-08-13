import { getDb } from "./_lib/db.mjs";
import { hashPassword, verifyResetToken, json } from "./_lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const body = await req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const token = body?.token || "";
  const newPassword = body?.newPassword || "";

  if (newPassword.length < 8) return json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const db = getDb();
  const [user] = await db.sql`SELECT id, reset_token_hash, reset_token_expires FROM users WHERE email = ${email}`;
  if (!user || !verifyResetToken(token, user.reset_token_hash, user.reset_token_expires)) {
    return json({ error: "That reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = hashPassword(newPassword);
  await db.sql`
    UPDATE users SET password_hash = ${passwordHash}, reset_token_hash = NULL, reset_token_expires = NULL
    WHERE id = ${user.id}
  `;

  return json({ ok: true });
};

export const config = { path: "/api/auth/reset-password" };

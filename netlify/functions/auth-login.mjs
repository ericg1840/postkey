import { getDb } from "./_lib/db.mjs";
import { verifyPassword, createSessionToken, sessionCookie, json } from "./_lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const body = await req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";

  const db = getDb();
  const [user] = await db.sql`SELECT id, email, full_name, password_hash FROM users WHERE email = ${email}`;
  if (!user || !verifyPassword(password, user.password_hash)) {
    return json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const token = createSessionToken(user.id);
  return json(
    { user: { id: user.id, email: user.email, fullName: user.full_name } },
    { status: 200, headers: { "Set-Cookie": sessionCookie(token) } }
  );
};

export const config = { path: "/api/auth/login" };

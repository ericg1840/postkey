import { getDb } from "./_lib/db.mjs";
import { hashPassword, createSessionToken, sessionCookie, json } from "./_lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const body = await req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";
  const fullName = (body?.fullName || "").trim();

  if (!email || !email.includes("@")) return json({ error: "Enter a valid email." }, { status: 400 });
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (!fullName) return json({ error: "Enter your name." }, { status: 400 });

  const db = getDb();
  const existing = await db.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) return json({ error: "An account with that email already exists." }, { status: 409 });

  const passwordHash = hashPassword(password);
  const [user] = await db.sql`
    INSERT INTO users (email, password_hash, full_name)
    VALUES (${email}, ${passwordHash}, ${fullName})
    RETURNING id, email, full_name
  `;
  await db.sql`INSERT INTO brand_kits (user_id, agent_name) VALUES (${user.id}, ${fullName})`;

  const token = createSessionToken(user.id);
  return json(
    { user: { id: user.id, email: user.email, fullName: user.full_name } },
    { status: 201, headers: { "Set-Cookie": sessionCookie(token) } }
  );
};

export const config = { path: "/api/auth/signup" };

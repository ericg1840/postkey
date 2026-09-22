import { requireUser } from "../../_lib/session.mjs";
import { verifyPassword, hashPassword, createSessionToken, sessionCookie, json, MAX_PASSWORD_LENGTH } from "../../_lib/auth.mjs";
import { checkRateLimit } from "../../_lib/rateLimit.mjs";

export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const body = await request.json().catch(() => null);
  const currentPassword = body?.currentPassword || "";
  const newPassword = body?.newPassword || "";

  if (newPassword.length < 8) return json({ error: "New password must be at least 8 characters." }, { status: 400 });
  if (newPassword.length > MAX_PASSWORD_LENGTH) return json({ error: `New password must be ${MAX_PASSWORD_LENGTH} characters or fewer.` }, { status: 400 });

  // A stolen session cookie shouldn't be a free oracle for guessing the
  // account's real password.
  if (!(await checkRateLimit(db, `change-password:user:${userId}`, { max: 5, windowMinutes: 15 }))) {
    return json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  const [user] = await db.sql`SELECT password_hash FROM users WHERE id = ${userId}`;
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    return json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const passwordHash = hashPassword(newPassword);
  // Bumping session_version signs out every other device — the point of
  // changing a password is often that someone else has it. This device gets
  // a fresh cookie under the new version so it stays signed in.
  const [updated] = await db.sql`
    UPDATE users SET password_hash = ${passwordHash}, session_version = session_version + 1
    WHERE id = ${userId}
    RETURNING session_version
  `;

  const token = createSessionToken(userId, env, updated.session_version);
  return json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(token) } });
}

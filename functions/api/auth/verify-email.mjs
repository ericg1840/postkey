import { getDb } from "../../_lib/db.mjs";
import { verifyHashedToken, json } from "../../_lib/auth.mjs";
import { logEvent } from "../../_lib/activity.mjs";

// Confirms an emailed link. Deliberately unauthenticated: someone clicking
// the link from their phone's mail app may not have a session there, and
// possession of the token is the proof that matters.
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const token = body?.token || "";
  if (!email || !token) return json({ error: "That confirmation link is incomplete." }, { status: 400 });

  const db = getDb(env);
  const [user] = await db.sql`
    SELECT id, email_verified_at, verify_token_hash, verify_token_expires
    FROM users WHERE email = ${email}
  `;

  // Already done — clicking the link a second time (or from a second device)
  // should read as success, not as a broken link.
  if (user?.email_verified_at) return json({ ok: true, alreadyVerified: true });

  if (!user || !verifyHashedToken(token, user.verify_token_hash, user.verify_token_expires)) {
    return json({ error: "That confirmation link is invalid or has expired. Send yourself a new one from the banner in the app." }, { status: 400 });
  }

  await db.sql`
    UPDATE users
       SET email_verified_at = NOW(), verify_token_hash = NULL, verify_token_expires = NULL
     WHERE id = ${user.id}
  `;
  await logEvent(db, user.id, "email_verified", { email }).catch(() => {});

  return json({ ok: true });
}

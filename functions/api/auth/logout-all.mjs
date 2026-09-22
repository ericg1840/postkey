import { clearSessionCookie, json } from "../../_lib/auth.mjs";
import { requireUser } from "../../_lib/session.mjs";
import { logEvent } from "../../_lib/activity.mjs";

// "Log out of all devices": bumping session_version invalidates every
// session cookie issued for this account, this one included — for when a
// phone is lost or a shared computer was left signed in. A normal logout
// only clears the cookie in the browser it's clicked in.
export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  await db.sql`UPDATE users SET session_version = session_version + 1 WHERE id = ${userId}`;
  await logEvent(db, userId, "logout_all").catch(() => {});

  return json({ ok: true }, { status: 200, headers: { "Set-Cookie": clearSessionCookie() } });
}

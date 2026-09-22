import { getDb } from "./db.mjs";
import { getSessionFromRequest, json } from "./auth.mjs";

// The one gate every signed-in endpoint goes through. A valid signature only
// proves the cookie was issued by us at some point; this also confirms the
// account still exists, is still active, and that the session hasn't been
// revoked since (session_version is bumped on password change/reset and when
// an admin disables the account). Costs one indexed primary-key read.
export async function loadSessionUser(request, env, db = getDb(env)) {
  const session = getSessionFromRequest(request, env);
  if (!session) return null;
  const [user] = await db.sql`
    SELECT id, email, full_name, is_admin, account_status, email_verified_at, session_version
    FROM users WHERE id = ${session.uid}
  `;
  if (!user) return null;
  if (user.account_status && user.account_status !== "active") return null;
  if ((user.session_version ?? 0) !== session.sv) return null;
  return user;
}

// Returns { userId, user, db } for a live session, or { error } holding the
// 401 response to return as-is.
export async function requireUser(request, env) {
  const db = getDb(env);
  const user = await loadSessionUser(request, env, db);
  if (!user) return { error: json({ error: "Not signed in." }, { status: 401 }) };
  return { userId: user.id, user, db };
}

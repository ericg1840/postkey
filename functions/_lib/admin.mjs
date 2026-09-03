import { getDb } from "./db.mjs";
import { getUserIdFromRequest, json } from "./auth.mjs";

// Shared gate for every /api/admin/* endpoint. Resolves the caller's own
// session (same cookie as the rest of the app — there's no separate admin
// login) and confirms the is_admin flag on their row before returning a db
// handle, so a non-admin request never gets far enough to run a query.
export async function requireAdmin(request, env) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return { error: json({ error: "Not signed in." }, { status: 401 }) };

  const db = getDb(env);
  const [user] = await db.sql`SELECT id, is_admin FROM users WHERE id = ${userId}`;
  if (!user || !user.is_admin) return { error: json({ error: "Forbidden." }, { status: 403 }) };

  return { db, adminId: user.id };
}

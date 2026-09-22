import { json } from "./auth.mjs";
import { requireUser } from "./session.mjs";

// Shared gate for every /api/admin/* endpoint. Resolves the caller's own
// session (same cookie as the rest of the app — there's no separate admin
// login) and confirms the is_admin flag on their row before returning a db
// handle, so a non-admin request never gets far enough to run a query.
export async function requireAdmin(request, env) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth;
  const { user, db } = auth;
  if (!user.is_admin) return { error: json({ error: "Forbidden." }, { status: 403 }) };

  return { db, adminId: user.id };
}

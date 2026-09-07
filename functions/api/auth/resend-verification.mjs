import { getDb } from "../../_lib/db.mjs";
import { getUserIdFromRequest, createVerifyToken, json } from "../../_lib/auth.mjs";
import { checkRateLimit } from "../../_lib/rateLimit.mjs";
import { sendVerificationEmail, verifyUrl } from "../../_lib/verifyEmail.mjs";
import { logEvent } from "../../_lib/activity.mjs";

// Signed-in only: this sends mail to the address on the account, so the
// session is what authorises it and there's no way to aim it at someone else.
export async function onRequestPost({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb(env);

  // Without this, the banner's button is a one-click way to send yourself
  // (and our sending reputation) unlimited mail.
  if (!(await checkRateLimit(db, `verify-resend:user:${userId}`, { max: 5, windowMinutes: 60 }))) {
    return json({ error: "We've sent that a few times already — check your spam folder, or try again later." }, { status: 429 });
  }

  const [user] = await db.sql`SELECT id, email, full_name, email_verified_at FROM users WHERE id = ${userId}`;
  if (!user) return json({ error: "Not signed in." }, { status: 401 });
  if (user.email_verified_at) return json({ ok: true, alreadyVerified: true });

  const { token, tokenHash, expires } = createVerifyToken();
  await db.sql`
    UPDATE users SET verify_token_hash = ${tokenHash}, verify_token_expires = ${expires.toISOString()}
    WHERE id = ${user.id}
  `;

  const origin = new URL(request.url).origin;
  try {
    await sendVerificationEmail(user.email, (user.full_name || "").split(/\s+/)[0] || "there", verifyUrl(origin, user.email, token), env);
  } catch (err) {
    console.error("Verification email failed", err);
    await logEvent(db, user.id, "verification_email_failed", { error: err.message }).catch(() => {});
    return json({ error: "Couldn't send that email. Please try again shortly." }, { status: 502 });
  }

  return json({ ok: true });
}

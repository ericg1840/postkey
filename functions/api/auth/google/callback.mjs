import { getDb } from "../../../_lib/db.mjs";
import { parseCookies, createSessionToken, sessionCookie } from "../../../_lib/auth.mjs";
import { fetchGoogleProfile, STATE_COOKIE_NAME, clearStateCookie } from "../../../_lib/googleAuth.mjs";
import { logEvent } from "../../../_lib/activity.mjs";

// Two cookies need to be set on the same response (clear the spent oauth
// state, set the new session) -- a plain object literal can only hold one
// value per header name, so this appends both onto a real Headers instance.
function redirectTo(location, cookies) {
  const headers = new Headers({ Location: location });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function redirectHome(origin, sessionCookieValue) {
  return redirectTo(`${origin}/`, [clearStateCookie(), sessionCookieValue]);
}

function redirectWithError(origin, message) {
  return redirectTo(`${origin}/?authError=${encodeURIComponent(message)}`, [clearStateCookie()]);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = parseCookies(request)[STATE_COOKIE_NAME];

  if (url.searchParams.get("error")) {
    // The user declined the consent screen, or Google reported another
    // problem before ever issuing a code -- not a bug on our end.
    return redirectWithError(origin, "Google sign-in was cancelled.");
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithError(origin, "Google sign-in failed. Please try again.");
  }

  let profile;
  try {
    profile = await fetchGoogleProfile({ env, origin, code });
  } catch (err) {
    console.error("Google sign-in failed", err);
    return redirectWithError(origin, "Google sign-in failed. Please try again.");
  }

  const db = getDb(env);

  const [byGoogleId] = await db.sql`SELECT id, account_status FROM users WHERE google_id = ${profile.googleId}`;
  let user = byGoogleId;

  if (!user) {
    // Same email as an existing password account -- link them instead of
    // creating a duplicate, since MAX_PASSWORD_LENGTH-scoped rate limits
    // and the unique email constraint both assume one row per address.
    const [byEmail] = await db.sql`SELECT id, account_status FROM users WHERE email = ${profile.email}`;
    if (byEmail) {
      await db.sql`UPDATE users SET google_id = ${profile.googleId} WHERE id = ${byEmail.id}`;
      user = byEmail;
      await logEvent(db, user.id, "google_account_linked", { email: profile.email });
    } else {
      const fullName = profile.fullName.slice(0, 120);
      const [created] = await db.sql`
        INSERT INTO users (email, full_name, google_id, email_verified_at)
        VALUES (${profile.email}, ${fullName}, ${profile.googleId}, NOW())
        RETURNING id, account_status
      `;
      user = created;
      await db.sql`INSERT INTO brand_kits (user_id, agent_name) VALUES (${user.id}, ${fullName})`;
      await db.sql`INSERT INTO subscriptions (user_id, tier, status, monthly_amount_cents) VALUES (${user.id}, 'free', 'active', 0)`;
      await logEvent(db, user.id, "signup", { email: profile.email, method: "google" });
    }
  }

  if (user.account_status && user.account_status !== "active") {
    return redirectWithError(origin, "This account has been disabled. Contact support if you think this is a mistake.");
  }

  await db.sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;
  await logEvent(db, user.id, "login", { method: "google" });

  const token = createSessionToken(user.id, env);
  return redirectHome(origin, sessionCookie(token));
}

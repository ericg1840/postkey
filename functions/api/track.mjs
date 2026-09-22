import { getDb } from "../_lib/db.mjs";
import { logEvent } from "../_lib/activity.mjs";
import { json } from "../_lib/auth.mjs";
import { checkRateLimit, getClientIp } from "../_lib/rateLimit.mjs";

// Only marketing-site screens App.jsx actually beacons from — anything else
// gets dropped rather than polluting the top-of-funnel breakdown with
// arbitrary strings.
const KNOWN_PATHS = new Set(["home", "about", "privacy", "terms", "login", "signup"]);

// Public, unauthenticated beacon for anonymous marketing pageviews (no
// session cookie exists yet for a logged-out visitor). Deliberately quiet
// about what it rejects — a bad beacon shouldn't surface as a client error.
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const path = String(body?.path || "");
  const anonId = String(body?.anonId || "");
  const referrer = String(body?.referrer || "").slice(0, 300);

  if (KNOWN_PATHS.has(path) && /^[a-zA-Z0-9-]{1,64}$/.test(anonId)) {
    const db = getDb(env);
    // Anonymous and unauthenticated, so without a cap anyone could loop this
    // and grow activity_events without bound. Far above what a person
    // clicking around the marketing site sends.
    try {
      if (await checkRateLimit(db, `track:ip:${getClientIp(request)}`, { max: 60, windowMinutes: 10 })) {
        await logEvent(db, null, "marketing_page_view", { path, anonId, referrer });
      }
    } catch {
      // A beacon never surfaces an error — see above.
    }
  }

  return json({ ok: true });
}

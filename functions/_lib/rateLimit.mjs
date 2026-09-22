// Fixed-window rate limiting for auth endpoints, backed by Postgres.
// Serverless functions have no memory shared between invocations, so an
// in-process counter would reset (and protect nothing) on every cold
// start -- Postgres is the only persistent store this app already has.
//
// `key` scopes one limit (e.g. "login:ip:1.2.3.4" or "signup:email:x@y.com")
// so different actions/identifiers never share a counter. Returns true if
// the request is allowed, false if the caller is over the limit for the
// current window.
export async function checkRateLimit(db, key, { max, windowMinutes }) {
  const [row] = await db.sql`
    INSERT INTO rate_limits (key, attempts, window_start)
    VALUES (${key}, 1, NOW())
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE
        WHEN rate_limits.window_start < NOW() - (${windowMinutes} * INTERVAL '1 minute')
          THEN 1
        ELSE rate_limits.attempts + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < NOW() - (${windowMinutes} * INTERVAL '1 minute')
          THEN NOW()
        ELSE rate_limits.window_start
      END
    RETURNING attempts
  `;
  maybePruneRateLimits(db);
  return row.attempts <= max;
}

// Every distinct key (one per IP, per email, ...) leaves a row behind, and
// nothing else ever removes them. Once in a while, sweep out rows whose
// window is long over — no limit here spans more than an hour, so a day is
// comfortably past any of them. Fire-and-forget: a failed sweep only means
// the next one does the work.
const PRUNE_PROBABILITY = 0.01;
export function maybePruneRateLimits(db, random = Math.random) {
  if (random() >= PRUNE_PROBABILITY) return;
  Promise.resolve(db.sql`DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day'`)
    .catch((err) => console.error("Pruning rate_limits failed", err));
}

// Cloudflare sets cf-connecting-ip itself, overwriting anything the client
// sent, so it's the only header here a caller can't choose. x-forwarded-for
// is deliberately NOT consulted: Cloudflare appends to whatever the client
// supplied, so its first entry is attacker-controlled — sending a fresh fake
// one per request would give every request its own rate-limit bucket.
// Without the header (local dev, tests) everyone shares one constant bucket
// rather than bypassing rate limiting entirely.
export function getClientIp(request) {
  return request.headers.get("cf-connecting-ip")?.trim() || "unknown";
}

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
  return row.attempts <= max;
}

// Vercel (and most proxies) set x-forwarded-for to "client, proxy1, proxy2";
// the first entry is the original caller. Falls back to x-real-ip, then a
// constant so a request with neither header still gets *a* shared limit
// instead of bypassing rate limiting entirely.
export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

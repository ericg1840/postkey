// Anonymous marketing-site pageview tracking. Fires a fire-and-forget beacon
// to /api/track so the admin dashboard can see top-of-funnel traffic
// (landing -> signup page -> completed signup) without any auth cookie —
// these routes are shown to logged-out visitors, so there's no user_id yet.
const ANON_ID_KEY = "pk_anon_id";

export function getAnonId() {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    // Private browsing / storage disabled — fine to skip tracking, this is
    // best-effort analytics, not something the app depends on.
    return null;
  }
}

export function trackPageView(path) {
  const anonId = getAnonId();
  if (!anonId) return;
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({ path, anonId, referrer: document.referrer || "" }),
  }).catch(() => {});
}

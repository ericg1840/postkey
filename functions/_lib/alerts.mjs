import { sendEmail, escapeHtml } from "./email.mjs";

// Deliberately not backed by the rate_limits table: the errors most worth
// hearing about are the ones where the database is unreachable, and a
// throttle that needs a query would go silent in exactly that case. An
// in-memory window per isolate can't be exact — Cloudflare may run several,
// so a burst can produce a few duplicates — but over-alerting slightly is
// the right failure direction for something whose job is to not miss an
// outage.
const COOLDOWN_MS = 15 * 60 * 1000;
const lastAlertAt = new Map();

// Same route failing the same way is one incident, not a hundred emails.
export function alertKeyFor(pathname, error) {
  return `${pathname}::${(error?.message || String(error || "")).slice(0, 120)}`;
}

export function shouldAlert(key, now = Date.now(), cooldownMs = COOLDOWN_MS) {
  const previous = lastAlertAt.get(key);
  if (previous !== undefined && now - previous < cooldownMs) return false;
  lastAlertAt.set(key, now);
  // The map is only ever as large as the set of distinct recent failures;
  // drop anything past its cooldown so a long-lived isolate can't grow one
  // entry per unique error string forever.
  for (const [k, at] of lastAlertAt) {
    if (now - at >= cooldownMs) lastAlertAt.delete(k);
  }
  return true;
}

// Best-effort by contract: every caller sends this without awaiting the
// response, and it swallows its own failures. An alert that could itself
// break a request would be worse than no alert.
export async function sendErrorAlert({ env, ref, pathname, method, error }) {
  const to = env?.ALERT_EMAIL;
  if (!to) return; // not configured — nothing to do, and not an error
  if (!shouldAlert(alertKeyFor(pathname, error))) return;

  const message = error?.message || String(error || "unknown error");
  const stack = error?.stack || "";

  try {
    await sendEmail(
      {
        to,
        subject: `PostKey 500: ${pathname}`,
        html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#1B2430;">
          <p style="margin:0 0 12px;"><strong>${escapeHtml(method || "")} ${escapeHtml(pathname)}</strong> returned a 500.</p>
          <p style="margin:0 0 12px;">Reference <code>${escapeHtml(ref)}</code> — this is what the user was shown, so it matches any report they send you.</p>
          <p style="margin:0 0 4px;">Error:</p>
          <pre style="background:#F1EFE8;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-word;">${escapeHtml(message)}</pre>
          ${stack ? `<p style="margin:12px 0 4px;">Stack:</p><pre style="background:#F1EFE8;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-word;font-size:12px;">${escapeHtml(stack)}</pre>` : ""}
          <p style="margin:12px 0 0;color:#697386;">Further alerts for this same route and error are suppressed for 15 minutes.</p>
        </div>`,
        text: `${method || ""} ${pathname} returned a 500.\n\nReference: ${ref}\n\n${message}\n\n${stack}`,
      },
      env,
    );
  } catch (err) {
    // Nothing useful left to do — the alert channel itself is down.
    console.error("Error alert failed to send", err);
  }
}

export async function sendEmail({ to, subject, html, text }, env) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const from = env.RESEND_FROM_EMAIL || "PostKey <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    // Resend's error body names the actual problem (unverified domain,
    // invalid API key, rate limit, ...) — a bare status code isn't enough
    // to debug from the welcome_email_failed activity event alone.
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${body || "no response body"}`);
  }
}

// Anything a user typed (their name, their email address) that gets dropped
// into an email's HTML has to go through this first — a signup name like
// `<a href="...">` would otherwise render as real markup inside a message
// sent from our own domain.
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Hidden preview text shown next to the subject line in inbox lists. Padded
// with invisible characters so the client doesn't fall through into
// rendering the email's actual visible content as the preview instead.
export function preheader(text) {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${text}${"&nbsp;&zwnj;".repeat(40)}</div>`;
}

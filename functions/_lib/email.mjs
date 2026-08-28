export async function sendEmail({ to, subject, html, text }, env) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const from = env.RESEND_FROM_EMAIL || "PostKey <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend API error: ${res.status}`);
}

// Hidden preview text shown next to the subject line in inbox lists. Padded
// with invisible characters so the client doesn't fall through into
// rendering the email's actual visible content as the preview instead.
export function preheader(text) {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${text}${"&nbsp;&zwnj;".repeat(40)}</div>`;
}

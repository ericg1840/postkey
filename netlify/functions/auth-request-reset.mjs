import { getDb } from "./_lib/db.mjs";
import { createResetToken, json } from "./_lib/auth.mjs";

async function sendResetEmail(toEmail, resetUrl) {
  const apiKey = Netlify.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const from = Netlify.env.get("RESEND_FROM_EMAIL") || "PostKey <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject: "Reset your PostKey password",
      html: `
        <p>Someone requested a password reset for this PostKey account.</p>
        <p><a href="${resetUrl}">Click here to set a new password</a>. This link expires in 1 hour.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    }),
  });
  if (!res.ok) throw new Error(`Resend API error: ${res.status}`);
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const body = await req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const genericResponse = json({ ok: true, message: "If an account exists for that email, a reset link is on its way." });

  if (!email) return genericResponse;

  const db = getDb();
  const [user] = await db.sql`SELECT id FROM users WHERE email = ${email}`;
  if (!user) return genericResponse; // don't reveal whether the account exists

  const { token, tokenHash, expires } = createResetToken();
  await db.sql`
    UPDATE users SET reset_token_hash = ${tokenHash}, reset_token_expires = ${expires.toISOString()}
    WHERE id = ${user.id}
  `;

  const origin = new URL(req.url).origin;
  const resetUrl = `${origin}/?resetToken=${token}&resetEmail=${encodeURIComponent(email)}`;

  try {
    await sendResetEmail(email, resetUrl);
  } catch (err) {
    return json({ error: "Couldn't send the reset email. Please try again shortly." }, { status: 502 });
  }

  return genericResponse;
};

export const config = { path: "/api/auth/request-reset" };

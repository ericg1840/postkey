import { getDb } from "./_lib/db.mjs";
import { createResetToken, json } from "./_lib/auth.mjs";
import { sendEmail } from "./_lib/email.mjs";

async function sendResetEmail(toEmail, resetUrl) {
  await sendEmail({
    to: toEmail,
    subject: "Reset your PostKey password",
    html: `
      <div style="background:#FDFBF7;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #EAE4D8;">
          <div style="padding:40px 40px 32px;text-align:left;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="width:26px;height:26px;background:#1B2430;border-radius:7px;text-align:center;vertical-align:middle;font-size:13px;line-height:26px;">&#128273;</td>
                <td style="padding-left:12px;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;color:#1B2430;">PostKey</td>
              </tr>
            </table>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#1B2430;">
              Someone requested a password reset for this PostKey account.
            </p>
            <div style="text-align:center;margin:0 0 24px;">
              <a href="${resetUrl}" style="display:inline-block;background:#0043FF;color:#FFFFFF;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:999px;">
                Set a new password
              </a>
            </div>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#697386;">
              This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
        <p style="text-align:center;color:#9AA3B2;font-size:12px;margin:24px 0 0;">PostKey &middot; Branded social graphics for real estate agents</p>
      </div>
    `,
  });
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

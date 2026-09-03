import { requireAdmin, logActivity } from "../../_lib/admin.mjs";
import { createResetToken, json } from "../../_lib/auth.mjs";
import { sendEmail, preheader } from "../../_lib/email.mjs";

const VALID_TIERS = new Set(["free", "paid"]);
const TIER_MONTHLY_CENTS = { free: 0, paid: 1900 };
const VALID_STATUSES = new Set(["active", "disabled", "suspended"]);

async function sendAdminResetEmail(toEmail, resetUrl, env) {
  await sendEmail(
    {
      to: toEmail,
      subject: "Reset your PostKey password",
      html: `
      <meta charset="utf-8">
      ${preheader("This link expires in 1 hour. If you didn't request this, ignore this email.")}
      <div style="background:#FDFBF7;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #EAE4D8;">
          <div style="padding:40px 40px 32px;text-align:left;">
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#1B2430;">
              A PostKey admin has triggered a password reset for the account at <strong>${toEmail}</strong>.
            </p>
            <div style="text-align:center;margin:0 0 16px;">
              <a href="${resetUrl}" style="display:inline-block;background:#0043FF;color:#FFFFFF;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:999px;">
                Set a new password
              </a>
            </div>
            <p style="margin:0;font-size:12px;color:#9AA3B2;text-align:center;">Or paste this into your browser: <a href="${resetUrl}" style="color:#0043FF;">${resetUrl}</a></p>
          </div>
        </div>
      </div>
    `,
      text: `A PostKey admin has triggered a password reset for the account at ${toEmail}.\n\nSet a new password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    },
    env
  );
}

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin.error) return admin.error;
  const { db } = admin;

  const body = await request.json().catch(() => null);
  const userId = Number(body?.userId);
  const action = body?.action;
  if (!Number.isInteger(userId) || !action) return json({ error: "Invalid request." }, { status: 400 });

  const [targetUser] = await db.sql`SELECT id, email, account_status FROM users WHERE id = ${userId}`;
  if (!targetUser) return json({ error: "User not found." }, { status: 404 });

  if (action === "set_tier") {
    const tier = body?.tier;
    if (!VALID_TIERS.has(tier)) return json({ error: "Invalid tier." }, { status: 400 });
    await db.sql`
      INSERT INTO subscriptions (user_id, tier, status, monthly_amount_cents, updated_at)
      VALUES (${userId}, ${tier}, 'active', ${TIER_MONTHLY_CENTS[tier]}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET tier = ${tier}, monthly_amount_cents = ${TIER_MONTHLY_CENTS[tier]}, updated_at = NOW()
    `;
    await logActivity(db, { userId, eventType: tier === "free" ? "downgrade" : "upgrade", detail: `${targetUser.email} moved to ${tier}` });
    return json({ ok: true });
  }

  if (action === "set_status") {
    const status = body?.status;
    if (!VALID_STATUSES.has(status)) return json({ error: "Invalid status." }, { status: 400 });
    await db.sql`UPDATE users SET account_status = ${status} WHERE id = ${userId}`;
    await logActivity(db, { userId, eventType: "status_change", detail: `${targetUser.email}: ${targetUser.account_status} -> ${status}` });
    return json({ ok: true });
  }

  if (action === "reset_password") {
    const { token, tokenHash, expires } = createResetToken();
    await db.sql`
      UPDATE users SET reset_token_hash = ${tokenHash}, reset_token_expires = ${expires.toISOString()} WHERE id = ${userId}
    `;
    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/?resetToken=${token}&resetEmail=${encodeURIComponent(targetUser.email)}`;
    try {
      await sendAdminResetEmail(targetUser.email, resetUrl, env);
    } catch {
      return json({ error: "Couldn't send the reset email. Please try again shortly." }, { status: 502 });
    }
    await logActivity(db, { userId, eventType: "password_reset_triggered", detail: `Admin triggered a password reset for ${targetUser.email}` });
    return json({ ok: true });
  }

  return json({ error: "Unknown action." }, { status: 400 });
}

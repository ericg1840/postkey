import { sendEmail, preheader, escapeHtml } from "./email.mjs";

// The link the welcome and resend emails both point at. App.jsx picks these
// params up on load and posts them to /api/auth/verify-email.
export function verifyUrl(origin, email, token) {
  return `${origin}/?verifyToken=${token}&verifyEmail=${encodeURIComponent(email)}`;
}

export async function sendVerificationEmail(toEmail, firstName, url, env) {
  const safeName = escapeHtml(firstName);
  await sendEmail(
    {
      to: toEmail,
      subject: "Confirm your email for PostKey",
      html: `
      <meta charset="utf-8">
      ${preheader("One click and your account is confirmed.")}
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
              Hi ${safeName}, confirm this is your email address so we can reach you about your account &mdash; password resets included.
            </p>
            <div style="text-align:center;margin:0 0 16px;">
              <a href="${url}" style="display:inline-block;background:#0043FF;color:#FFFFFF;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:999px;">
                Confirm my email
              </a>
            </div>
            <p style="margin:0 0 24px;font-size:12px;color:#9AA3B2;text-align:center;">Or paste this into your browser: <a href="${url}" style="color:#0043FF;">${url}</a></p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#697386;">
              This link works for 7 days. If you didn't create a PostKey account, you can ignore this email.
            </p>
          </div>
        </div>
        <p style="text-align:center;color:#9AA3B2;font-size:12px;margin:24px 0 0;">PostKey &middot; Branded social graphics for real estate agents</p>
      </div>
    `,
      text: `Hi ${firstName}, confirm this is your email address so we can reach you about your account -- password resets included.

Confirm your email: ${url}

This link works for 7 days. If you didn't create a PostKey account, you can ignore this email.`,
    },
    env,
  );
}

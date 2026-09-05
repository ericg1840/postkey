import { getDb } from "../../_lib/db.mjs";
import { hashPassword, createSessionToken, sessionCookie, json } from "../../_lib/auth.mjs";
import { sendEmail, preheader } from "../../_lib/email.mjs";
import { logEvent } from "../../_lib/activity.mjs";
import { checkRateLimit, getClientIp } from "../../_lib/rateLimit.mjs";

async function sendWelcomeEmail(toEmail, firstName, appUrl, env) {
  await sendEmail(
    {
      to: toEmail,
      subject: "Welcome to PostKey!",
      html: `
      <meta charset="utf-8">
      ${preheader(`Set up your brand kit, ${firstName} &mdash; your first post is a couple of minutes away.`)}
      <div style="background:#FDFBF7;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #EAE4D8;">
          <div style="padding:40px 40px 8px;text-align:center;">
            <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td style="width:26px;height:26px;background:#E0298C;border-radius:7px;text-align:center;vertical-align:middle;font-size:13px;line-height:26px;">&#128247;</td>
                <td style="width:6px;line-height:1px;font-size:1px;">&nbsp;</td>
                <td style="width:26px;height:26px;background:#E8792E;border-radius:7px;text-align:center;vertical-align:middle;font-size:12px;line-height:26px;color:#FFFFFF;">&#9654;</td>
                <td style="width:6px;line-height:1px;font-size:1px;">&nbsp;</td>
                <td style="width:26px;height:26px;background:#0043FF;border-radius:7px;text-align:center;vertical-align:middle;font-size:13px;line-height:26px;">&#128172;</td>
                <td style="padding-left:12px;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;color:#1B2430;">PostKey</td>
              </tr>
            </table>
            <p style="margin:0 0 18px;font-size:15px;color:#1B2430;text-align:left;">Hey ${firstName},</p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#1B2430;text-align:left;">
              Welcome to PostKey! We built this so you never have to stare at a blank screen wondering what to post &mdash; set up your brand once, and every graphic comes out looking like you.
            </p>
          </div>
          <div style="text-align:center;padding:0 40px 8px;">
            <a href="${appUrl}" style="display:inline-block;background:#0043FF;color:#FFFFFF;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:999px;">
              Set Up My Brand Kit &rarr;
            </a>
          </div>
          <div style="text-align:center;padding:0 40px 32px;">
            <p style="margin:0;font-size:12px;color:#9AA3B2;">Or paste this into your browser: <a href="${appUrl}" style="color:#0043FF;">${appUrl}</a></p>
          </div>
          <div style="border-top:1px solid #EFEAE0;padding:28px 40px 32px;text-align:left;">
            <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1B2430;">Here's how to get your first post out the door:</p>
            <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.9;color:#1B2430;">
              <li>Add your logo, headshot, and colors to your brand kit</li>
              <li>Create a Just Listed or Just Sold post in the Listings tool</li>
              <li>Browse the Community tab for market updates and local posts</li>
            </ul>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#697386;">
              That's it &mdash; most agents have their first post ready in a couple of minutes.
            </p>
            <p style="margin:0;font-size:15px;color:#1B2430;">
              Thanks for joining,<br />The PostKey Team
            </p>
          </div>
        </div>
        <p style="text-align:center;color:#9AA3B2;font-size:12px;margin:24px 0 0;">PostKey &middot; Branded social graphics for real estate agents</p>
      </div>
    `,
      text: `Hey ${firstName},

Welcome to PostKey! We built this so you never have to stare at a blank screen wondering what to post -- set up your brand once, and every graphic comes out looking like you.

Set up your brand kit: ${appUrl}

Here's how to get your first post out the door:
- Add your logo, headshot, and colors to your brand kit
- Create a Just Listed or Just Sold post in the Listings tool
- Browse the Community tab for market updates and local posts

That's it -- most agents have their first post ready in a couple of minutes.

Thanks for joining,
The PostKey Team`,
    },
    env
  );
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";
  const fullName = (body?.fullName || "").trim();

  if (!email || !email.includes("@")) return json({ error: "Enter a valid email." }, { status: 400 });
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (!fullName) return json({ error: "Enter your name." }, { status: 400 });

  const db = getDb(env);

  // Caps how many accounts one source can create in a stretch -- signup
  // spam/abuse rather than credential attacks, so a looser limit than login.
  const ip = getClientIp(request);
  if (!(await checkRateLimit(db, `signup:ip:${ip}`, { max: 8, windowMinutes: 60 }))) {
    return json({ error: "Too many signups from this connection. Please try again later." }, { status: 429 });
  }

  const existing = await db.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) return json({ error: "An account with that email already exists." }, { status: 409 });

  const passwordHash = hashPassword(password);
  const [user] = await db.sql`
    INSERT INTO users (email, password_hash, full_name)
    VALUES (${email}, ${passwordHash}, ${fullName})
    RETURNING id, email, full_name
  `;
  await db.sql`INSERT INTO brand_kits (user_id, agent_name) VALUES (${user.id}, ${fullName})`;
  await db.sql`INSERT INTO subscriptions (user_id, tier, status, monthly_amount_cents) VALUES (${user.id}, 'free', 'active', 0)`;
  await logEvent(db, user.id, "signup", { email: user.email });

  const token = createSessionToken(user.id, env);

  try {
    const firstName = fullName.split(/\s+/)[0];
    await sendWelcomeEmail(user.email, firstName, new URL(request.url).origin, env);
  } catch (err) {
    // Never let a flaky email provider block or fail an otherwise-successful
    // signup — but a silent failure here is invisible to everyone (no error
    // page, no reset-style message), so log it instead of swallowing it.
    console.error("Welcome email failed", err);
    await logEvent(db, user.id, "welcome_email_failed", { error: err.message }).catch(() => {});
  }

  return json(
    { user: { id: user.id, email: user.email, fullName: user.full_name } },
    { status: 201, headers: { "Set-Cookie": sessionCookie(token) } }
  );
}

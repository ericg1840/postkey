import { getDb } from "../../_lib/db.mjs";
import { hashPassword, createSessionToken, sessionCookie, json } from "../../_lib/auth.mjs";
import { sendEmail } from "../../_lib/email.mjs";

async function sendWelcomeEmail(toEmail, firstName, appUrl, env) {
  await sendEmail(
    {
      to: toEmail,
      subject: "Welcome to PostKey!",
      html: `
      <div style="background:#F4F5F7;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #E3EAF2;">
          <div style="padding:36px 40px 8px;text-align:center;">
            <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="width:30px;height:30px;background:#1B2430;border-radius:8px;text-align:center;vertical-align:middle;">
                  <span style="font-size:15px;line-height:30px;color:#FFFFFF;">&#128273;</span>
                </td>
                <td style="padding-left:8px;font-size:19px;font-weight:700;color:#1B2430;">PostKey</td>
              </tr>
            </table>
            <p style="margin:0 0 18px;font-size:15px;color:#1B2430;text-align:left;">Hey ${firstName},</p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#1B2430;text-align:left;">
              Welcome to PostKey! We built this so you never have to stare at a blank screen wondering what to post — set up your brand once, and every graphic comes out looking like you.
            </p>
          </div>
          <div style="text-align:center;padding:0 40px 32px;">
            <a href="${appUrl}" style="display:inline-block;background:#0043FF;color:#FFFFFF;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:8px;">
              Set Up My Brand Kit &rarr;
            </a>
          </div>
          <div style="padding:0 40px 8px;text-align:left;">
            <p style="margin:0 0 12px;font-size:15px;color:#1B2430;">Here's how to get your first post out the door:</p>
            <ul style="margin:0 0 28px;padding-left:20px;font-size:15px;line-height:1.9;color:#1B2430;">
              <li>Add your logo, headshot, and colors to your brand kit</li>
              <li>Create a Just Listed or Just Sold post in the Listings tool</li>
              <li>Browse the Community tab for market updates and local posts</li>
            </ul>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#1B2430;">
              That's it — most agents have their first post ready in a couple of minutes.
            </p>
            <p style="margin:0;font-size:15px;color:#1B2430;">
              Thanks for joining,<br />The PostKey Team
            </p>
          </div>
        </div>
        <p style="text-align:center;color:#9AA3B2;font-size:12px;margin:24px 0 0;">PostKey &middot; Branded social graphics for real estate agents</p>
      </div>
    `,
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
  const existing = await db.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) return json({ error: "An account with that email already exists." }, { status: 409 });

  const passwordHash = hashPassword(password);
  const [user] = await db.sql`
    INSERT INTO users (email, password_hash, full_name)
    VALUES (${email}, ${passwordHash}, ${fullName})
    RETURNING id, email, full_name
  `;
  await db.sql`INSERT INTO brand_kits (user_id, agent_name) VALUES (${user.id}, ${fullName})`;

  const token = createSessionToken(user.id, env);

  try {
    const firstName = fullName.split(/\s+/)[0];
    await sendWelcomeEmail(user.email, firstName, new URL(request.url).origin, env);
  } catch (err) {
    // Never let a flaky email provider block or fail an otherwise-successful signup.
  }

  return json(
    { user: { id: user.id, email: user.email, fullName: user.full_name } },
    { status: 201, headers: { "Set-Cookie": sessionCookie(token) } }
  );
}

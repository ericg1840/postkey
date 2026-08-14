import { getDb } from "./_lib/db.mjs";
import { hashPassword, createSessionToken, sessionCookie, json } from "./_lib/auth.mjs";
import { sendEmail } from "./_lib/email.mjs";

async function sendWelcomeEmail(toEmail, firstName, appUrl) {
  await sendEmail({
    to: toEmail,
    subject: "Welcome to PostKey!",
    html: `
      <p>Hi ${firstName},</p>
      <p>Welcome to PostKey — glad to have you.</p>
      <p>Next up: set up your brand kit (logo, headshot, colors, and contact info) and you'll be ready to create your first branded post in a couple of minutes.</p>
      <p><a href="${appUrl}">Head back to PostKey to get started →</a></p>
      <p>— The PostKey team</p>
    `,
  });
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const body = await req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";
  const fullName = (body?.fullName || "").trim();

  if (!email || !email.includes("@")) return json({ error: "Enter a valid email." }, { status: 400 });
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (!fullName) return json({ error: "Enter your name." }, { status: 400 });

  const db = getDb();
  const existing = await db.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) return json({ error: "An account with that email already exists." }, { status: 409 });

  const passwordHash = hashPassword(password);
  const [user] = await db.sql`
    INSERT INTO users (email, password_hash, full_name)
    VALUES (${email}, ${passwordHash}, ${fullName})
    RETURNING id, email, full_name
  `;
  await db.sql`INSERT INTO brand_kits (user_id, agent_name) VALUES (${user.id}, ${fullName})`;

  const token = createSessionToken(user.id);

  try {
    const firstName = fullName.split(/\s+/)[0];
    await sendWelcomeEmail(user.email, firstName, new URL(req.url).origin);
  } catch (err) {
    // Never let a flaky email provider block or fail an otherwise-successful signup.
  }

  return json(
    { user: { id: user.id, email: user.email, fullName: user.full_name } },
    { status: 201, headers: { "Set-Cookie": sessionCookie(token) } }
  );
};

export const config = { path: "/api/auth/signup" };

import { getDb } from "./_lib/db.mjs";
import { getUserIdFromRequest, json } from "./_lib/auth.mjs";

export default async (req) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return json({ user: null }, { status: 200 });

  const db = getDb();
  const [user] = await db.sql`SELECT id, email, full_name FROM users WHERE id = ${userId}`;
  if (!user) return json({ user: null }, { status: 200 });

  const [kit] = await db.sql`SELECT * FROM brand_kits WHERE user_id = ${userId}`;
  return json({
    user: { id: user.id, email: user.email, fullName: user.full_name },
    brandKit: kit
      ? {
          agentName: kit.agent_name,
          agentPhone: kit.agent_phone,
          agentEmail: kit.agent_email,
          brokerageName: kit.brokerage_name,
          brokerageCity: kit.brokerage_city,
          officePhone: kit.office_phone,
          website: kit.website,
          licenseNumber: kit.license_number,
          accentColor: kit.accent_color,
          scriptFont: kit.script_font,
          headshotUrl: kit.headshot_url,
          logoUrl: kit.logo_url,
          onboarded: kit.onboarded,
        }
      : null,
  });
};

export const config = { path: "/api/auth/me" };

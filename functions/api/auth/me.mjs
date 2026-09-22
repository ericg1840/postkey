import { getDb } from "../../_lib/db.mjs";
import { json } from "../../_lib/auth.mjs";
import { loadSessionUser } from "../../_lib/session.mjs";

export async function onRequestGet({ request, env }) {
  // A disabled/suspended account, or a session revoked by a password
  // change, is logged out immediately, even mid-session.
  const db = getDb(env);
  const user = await loadSessionUser(request, env, db);
  if (!user) return json({ user: null }, { status: 200 });
  const userId = user.id;

  const [kit] = await db.sql`SELECT * FROM brand_kits WHERE user_id = ${userId}`;
  return json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      isAdmin: user.is_admin,
      emailVerified: !!user.email_verified_at,
    },
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
          profileReminderDismissed: kit.profile_reminder_dismissed,
        }
      : null,
  });
}

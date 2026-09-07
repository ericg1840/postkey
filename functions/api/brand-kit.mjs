import { getDb } from "../_lib/db.mjs";
import { getUserIdFromRequest, json } from "../_lib/auth.mjs";

// The headshot/logo are stored as data URLs and handed back on every
// /api/auth/me, so an oversized one slows down every page load for that
// agent. The uploader downscales to 640px before it ever gets here (see
// useAgentAsset in shared.jsx) — this is the backstop that keeps one odd
// client from writing an unbounded row anyway.
const MAX_ASSET_DATA_LENGTH = 2_000_000;

export async function onRequestPut({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb(env);
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, { status: 400 });
  for (const field of ["headshotUrl", "logoUrl"]) {
    if (typeof body[field] === "string" && body[field].length > MAX_ASSET_DATA_LENGTH) {
      return json({ error: "That image is too large. Try a smaller file." }, { status: 400 });
    }
  }
  const {
    agentName = "",
    agentPhone = "",
    agentEmail = "",
    brokerageName = "",
    brokerageCity = "",
    officePhone = "",
    website = "",
    licenseNumber = "",
    accentColor = "#E0298C",
    scriptFont = "Dancing Script",
    headshotUrl = null,
    logoUrl = null,
    onboarded,
    profileReminderDismissed,
  } = body;

  await db.sql`
    UPDATE brand_kits SET
      agent_name = ${agentName},
      agent_phone = ${agentPhone},
      agent_email = ${agentEmail},
      brokerage_name = ${brokerageName},
      brokerage_city = ${brokerageCity},
      office_phone = ${officePhone},
      website = ${website},
      license_number = ${licenseNumber},
      accent_color = ${accentColor},
      script_font = ${scriptFont},
      headshot_url = ${headshotUrl},
      logo_url = ${logoUrl},
      onboarded = COALESCE(${onboarded ?? null}, onboarded),
      profile_reminder_dismissed = COALESCE(${profileReminderDismissed ?? null}, profile_reminder_dismissed),
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb(env);
  const [kit] = await db.sql`SELECT * FROM brand_kits WHERE user_id = ${userId}`;
  return json({ brandKit: kit || null });
}

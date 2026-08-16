import { getDb } from "./_lib/db.mjs";
import { getUserIdFromRequest, json } from "./_lib/auth.mjs";

export async function PUT(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb();
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, { status: 400 });
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
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;
  return json({ ok: true });
}

export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb();
  const [kit] = await db.sql`SELECT * FROM brand_kits WHERE user_id = ${userId}`;
  return json({ brandKit: kit || null });
}

import { getDb } from "./_lib/db.mjs";
import { getUserIdFromRequest, json } from "./_lib/auth.mjs";

export default async (req) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const db = getDb();

  if (req.method === "PUT") {
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
        headshot_url = ${headshotUrl},
        logo_url = ${logoUrl},
        onboarded = COALESCE(${onboarded ?? null}, onboarded),
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;
    return json({ ok: true });
  }

  if (req.method === "GET") {
    const [kit] = await db.sql`SELECT * FROM brand_kits WHERE user_id = ${userId}`;
    return json({ brandKit: kit || null });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};

export const config = { path: "/api/brand-kit" };

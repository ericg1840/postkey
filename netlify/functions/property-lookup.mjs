import { json } from "./_lib/auth.mjs";

// Looks up public-record property details (city, lot size, year built, sqft,
// beds/baths) from RentCast so the description form doesn't need them typed
// in by hand. Requires RENTCAST_API_KEY to be set — without it, lookups are
// disabled rather than the app failing to build/run.
export default async (req) => {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, { status: 405 });

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) return json({ error: "Address lookup isn't configured." }, { status: 501 });

  const address = new URL(req.url).searchParams.get("address")?.trim();
  if (!address) return json({ error: "Address is required." }, { status: 400 });

  const rentcastRes = await fetch(
    `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}`,
    { headers: { "X-Api-Key": apiKey, Accept: "application/json" } }
  );

  if (rentcastRes.status === 404) return json({ error: "No public record found for that address." }, { status: 404 });
  if (!rentcastRes.ok) return json({ error: "Address lookup failed. Try again in a moment." }, { status: 502 });

  const [property] = await rentcastRes.json().catch(() => []);
  if (!property) return json({ error: "No public record found for that address." }, { status: 404 });

  return json({
    city: property.city || "",
    yearBuilt: property.yearBuilt ? String(property.yearBuilt) : "",
    lotSize: property.lotSize ? `${Number(property.lotSize).toLocaleString()} sqft` : "",
    sqft: property.squareFootage ? Number(property.squareFootage).toLocaleString() : "",
    beds: property.bedrooms ? String(property.bedrooms) : "",
    baths: property.bathrooms ? String(property.bathrooms) : "",
  });
};

export const config = { path: "/api/property-lookup" };

import { requireUser } from "../_lib/session.mjs";
import { json } from "../_lib/auth.mjs";

// Server-side fetch + parse of a Zillow listing page so the link-in-bio
// editor can show a live address/price/beds/baths without the agent typing
// them in. Restricted to zillow.com so this endpoint can't be used as an
// open URL-fetching proxy. Zillow does run bot protection, so this can fail
// on some requests — callers should treat manual entry as the fallback path,
// not an edge case (see profile/BioEditorPage.jsx).
export function isZillowUrl(raw) {
  try {
    const u = new URL(raw);
    return /(^|\.)zillow\.com$/i.test(u.hostname) && u.protocol === "https:";
  } catch {
    return false;
  }
}

// Redirects are followed by hand so every hop is re-checked against
// isZillowUrl — fetch()'s own redirect following would happily go wherever a
// zillow.com redirect pointed, which made the host check above a formality.
const MAX_REDIRECTS = 5;
// A listing page is a few hundred KB; this only exists so a huge or
// never-ending response can't hold the Worker's memory and CPU.
export const MAX_HTML_BYTES = 3_000_000;

export async function fetchZillow(url, fetchImpl = fetch) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetchImpl(current, {
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (res.status < 300 || res.status >= 400) return res;
    const location = res.headers.get("location");
    if (!location) return res;
    const next = new URL(location, current).toString();
    if (!isZillowUrl(next)) throw new Error("Redirected off zillow.com");
    current = next;
  }
  throw new Error("Too many redirects");
}

// Reads at most maxBytes of the body, cancelling the rest.
export async function readCapped(res, maxBytes = MAX_HTML_BYTES) {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error("Response too large");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function pickJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, raw] of blocks) {
    try {
      const data = JSON.parse(raw.trim());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item?.["@type"] === "SingleFamilyResidence" || item?.["@type"] === "Product" || item?.address) {
          return item;
        }
      }
    } catch {
      // not valid JSON, or not the block we want — keep looking
    }
  }
  return null;
}

function metaContent(html, property) {
  const m = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`, "i"));
  return m ? m[1] : "";
}

const fmtNumber = (n) => Math.round(n).toLocaleString("en-US");

// Pulls what a listing card shows out of a Zillow page: JSON-LD first
// (structured, when Zillow includes it), then the page's embedded JSON and
// og: tags as fallbacks. Every field is a display string, "" when unknown.
export function parseListing(html) {
  const listing = pickJsonLd(html);
  const addr = listing?.address && typeof listing.address === "object" ? listing.address : null;

  // "419 Tall Oaks Dr, Wayne, PA" — the street plus town and state when
  // Zillow gives them separately, else whatever single line it has.
  const composed = addr?.streetAddress
    ? [addr.streetAddress, addr.addressLocality, addr.addressRegion].filter(Boolean).join(", ")
    : "";
  const ogTitle = metaContent(html, "og:title");
  const address = composed || listing?.name || ogTitle.split(" | ")[0] || "";

  const rawPrice = Number(listing?.offers?.price || html.match(/"price"\s*:\s*(\d+)/)?.[1]);
  const price = Number.isFinite(rawPrice) && rawPrice > 0 ? `$${fmtNumber(rawPrice)}` : "";
  const beds = String(listing?.numberOfRooms || html.match(/"bedrooms"\s*:\s*(\d+)/)?.[1] || "");
  const baths = String(html.match(/"bathrooms"\s*:\s*([\d.]+)/)?.[1] || "");
  const rawSqft = Number(
    listing?.floorSize?.value
      || String(listing?.floorSize || "").replace(/[^\d.]/g, "")
      || html.match(/"livingArea(?:Value)?"\s*:\s*(\d+)/)?.[1],
  );
  const sqft = Number.isFinite(rawSqft) && rawSqft > 0 ? fmtNumber(rawSqft) : "";

  return { address, price, beds, baths, sqft, photoUrl: metaContent(html, "og:image") || "" };
}

export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const body = await request.json().catch(() => null);
  const url = body?.url?.trim();
  if (!url || !isZillowUrl(url)) return json({ error: "Enter a valid zillow.com listing URL." }, { status: 400 });

  let res;
  try {
    res = await fetchZillow(url);
  } catch {
    return json({ error: "Couldn't reach Zillow. Enter the details manually." }, { status: 502 });
  }

  if (!res.ok) {
    return json({ error: "Zillow blocked this request. Enter the details manually." }, { status: 502 });
  }

  let html;
  try {
    html = await readCapped(res);
  } catch {
    return json({ error: "Couldn't read that listing. Enter the details manually." }, { status: 502 });
  }
  const { address, price, beds, baths, sqft, photoUrl } = parseListing(html);
  if (!address) {
    return json({ error: "Couldn't read that listing. Enter the details manually." }, { status: 422 });
  }

  await db.sql`UPDATE users SET zillow_pulls_count = zillow_pulls_count + 1 WHERE id = ${userId}`;

  return json({ address, price, beds, baths, sqft, photoUrl });
}

import { getUserIdFromRequest, json } from "../_lib/auth.mjs";

// Server-side fetch + parse of a Zillow listing page so the link-in-bio
// editor can show a live address/price/beds/baths without the agent typing
// them in. Restricted to zillow.com so this endpoint can't be used as an
// open URL-fetching proxy. Zillow does run bot protection, so this can fail
// on some requests — callers should treat manual entry as the fallback path,
// not an edge case (see profile/BioEditorPage.jsx).
function isZillowUrl(raw) {
  try {
    const u = new URL(raw);
    return /(^|\.)zillow\.com$/i.test(u.hostname) && u.protocol === "https:";
  } catch {
    return false;
  }
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

export async function onRequestPost({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const url = body?.url?.trim();
  if (!url || !isZillowUrl(url)) return json({ error: "Enter a valid zillow.com listing URL." }, { status: 400 });

  let res;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    return json({ error: "Couldn't reach Zillow. Enter the details manually." }, { status: 502 });
  }

  if (!res.ok) {
    return json({ error: "Zillow blocked this request. Enter the details manually." }, { status: 502 });
  }

  const html = await res.text();
  const listing = pickJsonLd(html);

  const ogTitle = metaContent(html, "og:title");
  const ogImage = metaContent(html, "og:image");

  const address = listing?.name || listing?.address?.streetAddress || ogTitle.split(" | ")[0] || "";
  const price = listing?.offers?.price
    ? `$${Number(listing.offers.price).toLocaleString()}`
    : (html.match(/"price"\s*:\s*(\d+)/)?.[1] && `$${Number(html.match(/"price"\s*:\s*(\d+)/)[1]).toLocaleString()}`) || "";
  const beds = listing?.numberOfRooms || html.match(/"bedrooms"\s*:\s*(\d+)/)?.[1] || "";
  const baths = html.match(/"bathrooms"\s*:\s*([\d.]+)/)?.[1] || "";

  if (!address) {
    return json({ error: "Couldn't read that listing. Enter the details manually." }, { status: 422 });
  }

  return json({
    address,
    price: String(price || ""),
    beds: String(beds || ""),
    baths: String(baths || ""),
    photoUrl: ogImage || "",
  });
}

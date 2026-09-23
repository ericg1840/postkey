import { getDb } from "../_lib/db.mjs";
import { loadBioMeta, decodeHeadshot } from "../_lib/bioMeta.mjs";

// Serves an agent's headshot as a real image for link previews (og:image).
// Headshots are stored as data URLs, which no scraper will accept, so this
// decodes one back into bytes. Public, like the page it belongs to, and only
// for active accounts with a public handle.
export async function onRequestGet({ request, env }) {
  const handle = new URL(request.url).searchParams.get("handle");
  const meta = await loadBioMeta(getDb(env), handle);
  if (!meta) return new Response("Not found", { status: 404 });

  if (/^https:\/\//i.test(meta.headshotUrl)) {
    return Response.redirect(meta.headshotUrl, 302);
  }
  const image = decodeHeadshot(meta.headshotUrl);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(image.bytes, {
    headers: {
      "Content-Type": image.contentType,
      // Scrapers fetch this once per share; an hour keeps it cheap while a
      // new headshot still shows up the same day.
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

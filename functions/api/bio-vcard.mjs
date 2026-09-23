import { getDb } from "../_lib/db.mjs";
import { decodeHeadshot } from "../_lib/bioMeta.mjs";
import { buildVCard } from "../_lib/vcard.mjs";

// Past this the photo is dropped rather than bloating the contact card —
// headshots are downscaled to 640px on upload, so a real one is well under.
const MAX_PHOTO_BYTES = 400_000;

// "Jane Doe.vcf" — what the contact shows up as in Downloads/Files. Kept to
// characters every OS accepts in a filename, falling back to the handle.
export function vcardFilename(name, handle) {
  const clean = String(name || "").replace(/[^A-Za-z0-9 .'-]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
  return `${clean || handle}.vcf`;
}

// "Save my contact" on a public Key Link page. Served from here rather than
// built in the browser because iOS Safari handles a real text/vcard response
// (it opens the add-contact sheet) far more reliably than a blob download.
// Only for pages whose agent has switched contact details on.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const handle = String(url.searchParams.get("handle") || "").trim().toLowerCase();
  if (!/^[a-z0-9-]{1,40}$/.test(handle)) return new Response("Not found", { status: 404 });

  const db = getDb(env);
  const [kit] = await db.sql`
    SELECT k.agent_name, k.agent_phone, k.agent_email, k.website, k.license_number,
           k.bio_brokerage, k.brokerage_name, k.headshot_url, k.bio_show_contact, k.bio_show_license
      FROM brand_kits k
      JOIN users u ON u.id = k.user_id
     WHERE k.bio_handle = ${handle} AND u.account_status = 'active'
  `;
  if (!kit || !kit.bio_show_contact) return new Response("Not found", { status: 404 });

  const image = decodeHeadshot(kit.headshot_url);
  const photo = image && image.bytes.length <= MAX_PHOTO_BYTES && /^image\/(jpeg|png)$/.test(image.contentType)
    ? { type: image.contentType === "image/png" ? "PNG" : "JPEG", base64: image.bytes.toString("base64") }
    : null;

  const card = buildVCard({
    name: kit.agent_name,
    org: kit.bio_brokerage || kit.brokerage_name,
    phone: kit.agent_phone,
    email: kit.agent_email,
    website: kit.website,
    pageUrl: `${url.origin}/u/${handle}`,
    license: kit.bio_show_license ? kit.license_number : "",
    photo,
  });

  return new Response(card, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${vcardFilename(kit.agent_name, handle)}"`,
      "Cache-Control": "no-store",
    },
  });
}

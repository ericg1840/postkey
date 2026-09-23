// "Save my contact" on a Key Link page: a vCard 3.0 file, which both iOS and
// Android open straight into the contacts app. 3.0 rather than 4.0 because
// it's what iOS Contacts imports most reliably, including the photo.

// Digits only, keeping a leading "+" for international numbers — the form
// tel:/sms: links and phone apps expect ("(555) 123-4567" -> "5551234567").
export function normalizePhone(raw) {
  const s = String(raw || "").trim();
  const digits = s.replace(/[^\d]/g, "");
  if (digits.length < 7) return "";
  return s.startsWith("+") ? `+${digits}` : digits;
}

// Values can't contain raw commas, semicolons, backslashes or newlines —
// those are vCard syntax.
function esc(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\;");
}

// RFC 2425 folding: lines longer than 75 octets continue on the next line
// after a single space. Matters for the base64 photo, which is thousands of
// characters long.
function fold(line) {
  const out = [];
  let rest = line;
  let first = true;
  while (rest.length > (first ? 75 : 74)) {
    const n = first ? 75 : 74;
    out.push((first ? "" : " ") + rest.slice(0, n));
    rest = rest.slice(n);
    first = false;
  }
  out.push((first ? "" : " ") + rest);
  return out.join("\r\n");
}

function splitName(full) {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { given: parts[0] || "", family: "" };
  return { given: parts.slice(0, -1).join(" "), family: parts[parts.length - 1] };
}

/**
 * @param {object} c
 * @param {string} c.name
 * @param {string} [c.org]       brokerage
 * @param {string} [c.phone]
 * @param {string} [c.email]
 * @param {string} [c.website]   the agent's own site
 * @param {string} [c.pageUrl]   their Key Link page
 * @param {string} [c.license]
 * @param {{ type: "JPEG"|"PNG", base64: string }} [c.photo]
 */
export function buildVCard(c) {
  const name = String(c.name || "").trim() || "Real estate agent";
  const { given, family } = splitName(name);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(family)};${esc(given)};;;`,
    `FN:${esc(name)}`,
    "TITLE:Real Estate Agent",
  ];
  if (c.org) lines.push(`ORG:${esc(c.org)}`);
  const phone = normalizePhone(c.phone);
  if (phone) lines.push(`TEL;TYPE=CELL,VOICE:${phone}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(c.email)}`);
  if (c.website) lines.push(`URL:${esc(/^https?:\/\//i.test(c.website) ? c.website : `https://${c.website}`)}`);
  if (c.pageUrl) lines.push(`URL:${esc(c.pageUrl)}`);
  if (c.license) lines.push(`NOTE:${esc(`License #${c.license}`)}`);
  if (c.photo?.base64) lines.push(`PHOTO;ENCODING=b;TYPE=${c.photo.type}:${c.photo.base64}`);
  lines.push("END:VCARD");
  return lines.map(fold).join("\r\n") + "\r\n";
}

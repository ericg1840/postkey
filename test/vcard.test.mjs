import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildVCard, normalizePhone } from "../functions/_lib/vcard.mjs";

describe("normalizePhone", () => {
  test("strips formatting", () => {
    assert.equal(normalizePhone("(555) 123-4567"), "5551234567");
    assert.equal(normalizePhone("555.123.4567"), "5551234567");
  });
  test("keeps a leading + for international numbers", () => {
    assert.equal(normalizePhone("+1 555 123 4567"), "+15551234567");
  });
  test("rejects things that aren't phone numbers", () => {
    assert.equal(normalizePhone(""), "");
    assert.equal(normalizePhone("call me"), "");
    assert.equal(normalizePhone("12"), "");
  });
});

describe("buildVCard", () => {
  const card = buildVCard({
    name: "Mary Ann Doe", org: "Coastal Living Realty", phone: "(555) 123-4567",
    email: "mary@example.com", website: "maryann.com", pageUrl: "https://postkey.example/u/mary", license: "SA123",
  });
  const lines = card.split("\r\n");

  test("is a vCard 3.0 with CRLF line endings", () => {
    assert.equal(lines[0], "BEGIN:VCARD");
    assert.equal(lines[1], "VERSION:3.0");
    assert.ok(card.endsWith("END:VCARD\r\n"));
    assert.doesNotMatch(card.replace(/\r\n/g, ""), /\n/);
  });

  test("splits the name into given and family", () => {
    assert.ok(lines.includes("N:Doe;Mary Ann;;;"));
    assert.ok(lines.includes("FN:Mary Ann Doe"));
  });

  test("includes contact details in dialable form", () => {
    assert.ok(lines.includes("TEL;TYPE=CELL,VOICE:5551234567"));
    assert.ok(lines.includes("EMAIL;TYPE=INTERNET:mary@example.com"));
    assert.ok(lines.includes("URL:https://maryann.com"));
    assert.ok(lines.includes("URL:https://postkey.example/u/mary"));
    assert.ok(lines.includes("NOTE:License #SA123"));
  });

  // A brokerage like "Smith, Jones; Co" must not break the card's structure.
  test("escapes vCard syntax characters in values", () => {
    const c = buildVCard({ name: "A B", org: "Smith, Jones; Co\\x" });
    assert.match(c, /ORG:Smith\\, Jones\; Co\\\\x/);
  });

  test("folds long lines to 75 characters", () => {
    const c = buildVCard({ name: "A B", photo: { type: "JPEG", base64: "A".repeat(500) } });
    for (const line of c.split("\r\n")) assert.ok(line.length <= 75, `line too long: ${line.length}`);
    // Unfolding gives back the original photo data.
    const unfolded = c.replace(/\r\n /g, "");
    assert.match(unfolded, new RegExp(`PHOTO;ENCODING=b;TYPE=JPEG:${"A".repeat(500)}\\r\\n`));
  });

  test("omits fields that weren't provided", () => {
    const c = buildVCard({ name: "Solo" });
    assert.doesNotMatch(c, /TEL|EMAIL|ORG|URL|PHOTO|NOTE/);
    assert.match(c, /N:;Solo;;;/);
  });
});

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { fetchZillow, readCapped, isZillowUrl } from "../functions/api/listings-fetch.mjs";

const redirect = (location, status = 302) => new Response(null, { status, headers: { location } });

describe("fetchZillow", () => {
  test("never lets fetch() follow redirects on its own", async () => {
    const seen = [];
    await fetchZillow("https://www.zillow.com/homedetails/1", async (url, init) => {
      seen.push(init.redirect);
      return new Response("ok");
    });
    assert.deepEqual(seen, ["manual"]);
  });

  test("follows a redirect that stays on zillow.com", async () => {
    const urls = [];
    const res = await fetchZillow("https://www.zillow.com/a", async (url) => {
      urls.push(url);
      return urls.length === 1 ? redirect("/b") : new Response("done");
    });
    assert.deepEqual(urls, ["https://www.zillow.com/a", "https://www.zillow.com/b"]);
    assert.equal(await res.text(), "done");
  });

  test("refuses a redirect off zillow.com", async () => {
    await assert.rejects(
      fetchZillow("https://www.zillow.com/a", async () => redirect("https://evil.example/")),
      /off zillow/,
    );
  });

  test("refuses a downgrade to http", async () => {
    await assert.rejects(
      fetchZillow("https://www.zillow.com/a", async () => redirect("http://www.zillow.com/a")),
      /off zillow/,
    );
  });

  test("gives up on a redirect loop", async () => {
    await assert.rejects(
      fetchZillow("https://www.zillow.com/a", async () => redirect("https://www.zillow.com/a")),
      /Too many redirects/,
    );
  });
});

describe("readCapped", () => {
  test("returns a body under the cap", async () => {
    assert.equal(await readCapped(new Response("hello"), 100), "hello");
  });

  test("rejects a body over the cap", async () => {
    await assert.rejects(readCapped(new Response("x".repeat(101)), 100), /too large/);
  });
});

test("isZillowUrl only accepts https zillow.com hosts", () => {
  assert.equal(isZillowUrl("https://www.zillow.com/x"), true);
  assert.equal(isZillowUrl("https://zillow.com.evil.example/x"), false);
  assert.equal(isZillowUrl("https://notzillow.com/x"), false);
});

import { parseListing } from "../functions/api/listings-fetch.mjs";

describe("parseListing", () => {
  const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;

  test("builds street, town and state from structured data", () => {
    const html = ld({
      "@type": "SingleFamilyResidence",
      name: "419 Tall Oaks Dr, Wayne, PA 19087",
      address: { streetAddress: "419 Tall Oaks Dr", addressLocality: "Wayne", addressRegion: "PA" },
      numberOfRooms: 4,
      floorSize: { value: 2150 },
      offers: { price: 649000 },
    }) + '<meta property="og:image" content="https://photos.zillowstatic.com/x.jpg">' + '"bathrooms": 2.5';
    assert.deepEqual(parseListing(html), {
      address: "419 Tall Oaks Dr, Wayne, PA",
      price: "$649,000",
      beds: "4",
      baths: "2.5",
      sqft: "2,150",
      photoUrl: "https://photos.zillowstatic.com/x.jpg",
    });
  });

  test("falls back to the page's embedded JSON for square footage", () => {
    const html = '<meta property="og:title" content="12 Elm St | Zillow">"livingArea": 1840';
    const out = parseListing(html);
    assert.equal(out.address, "12 Elm St");
    assert.equal(out.sqft, "1,840");
  });

  test("unknown fields are empty strings", () => {
    assert.deepEqual(parseListing("<html></html>"), { address: "", price: "", beds: "", baths: "", sqft: "", photoUrl: "" });
  });
});

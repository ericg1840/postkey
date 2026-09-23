import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { decodeHeadshot, bioShareText, loadBioMeta, hasShareableHeadshot } from "../functions/_lib/bioMeta.mjs";
import { rewriteBioPage } from "../worker/index.mjs";

const PNG = "data:image/png;base64," + Buffer.from("fake-png-bytes").toString("base64");

describe("decodeHeadshot", () => {
  test("decodes a raster data URL", () => {
    const img = decodeHeadshot(PNG);
    assert.equal(img.contentType, "image/png");
    assert.equal(img.bytes.toString(), "fake-png-bytes");
  });

  // Served from our own origin, so anything a browser would execute must be refused.
  test("refuses HTML, SVG and anything that isn't a base64 raster image", () => {
    assert.equal(decodeHeadshot("data:text/html;base64,PHNjcmlwdD4="), null);
    assert.equal(decodeHeadshot("data:image/svg+xml;base64,PHN2Zz4="), null);
    assert.equal(decodeHeadshot("data:image/png,rawbytes"), null);
    assert.equal(decodeHeadshot("https://example.com/me.png"), null);
    assert.equal(decodeHeadshot(null), null);
  });

  test("https headshots are shareable too", () => {
    assert.equal(hasShareableHeadshot("https://cdn.example/me.jpg"), true);
    assert.equal(hasShareableHeadshot("http://cdn.example/me.jpg"), false);
    assert.equal(hasShareableHeadshot(""), false);
  });
});

describe("bioShareText", () => {
  test("names the agent and brokerage", () => {
    assert.deepEqual(bioShareText({ name: "Jane Doe", brokerage: "Coastal Realty", tagline: "Homes by the sea." }), {
      title: "Jane Doe | Coastal Realty",
      description: "Homes by the sea.",
    });
  });

  test("falls back to a generated description", () => {
    assert.equal(bioShareText({ name: "Jane Doe", brokerage: "", tagline: "" }).description, "Listings, contact info and links from Jane Doe.");
  });
});

describe("loadBioMeta", () => {
  test("rejects malformed handles without querying", async () => {
    let queried = false;
    const db = { sql: () => { queried = true; return Promise.resolve([]); } };
    assert.equal(await loadBioMeta(db, "../etc"), null);
    assert.equal(queried, false);
  });

  test("only matches active accounts", async () => {
    let text = "";
    const db = { sql: (strings) => { text = strings.join("?"); return Promise.resolve([]); } };
    await loadBioMeta(db, "Jane-Doe");
    assert.match(text, /account_status = 'active'/);
  });
});

// Minimal HTMLRewriter stand-in: runs each handler once over a fake element
// and records what it set.
function installFakeRewriter() {
  const seen = {};
  globalThis.HTMLRewriter = class {
    constructor() { this.handlers = []; }
    on(selector, handler) { this.handlers.push([selector, handler]); return this; }
    transform(res) {
      for (const [selector, handler] of this.handlers) {
        handler.element({
          setAttribute: (_n, v) => { seen[selector] = v; },
          setInnerContent: (v) => { seen[selector] = v; },
          remove: () => { seen[selector] = "REMOVED"; },
        });
      }
      return res;
    }
  };
  return seen;
}

describe("rewriteBioPage", () => {
  afterEach(() => { delete globalThis.HTMLRewriter; });
  const html = () => new Response("<html></html>", { headers: { "content-type": "text/html" } });
  const env = { DATABASE_URL: "postgres://unused" };

  test("uses the agent's name, tagline and headshot", async () => {
    const seen = installFakeRewriter();
    const lookup = async () => ({ handle: "jane", name: "Jane Doe", brokerage: "Coastal", tagline: "Hi!", headshotUrl: PNG });
    await rewriteBioPage(html(), new Request("https://x.test/u/jane"), env, lookup);
    assert.equal(seen.title, "Jane Doe | Coastal");
    assert.equal(seen['meta[property="og:description"]'], "Hi!");
    assert.equal(seen['meta[property="og:image"]'], "/api/bio-headshot?handle=jane");
    assert.equal(seen['meta[name="twitter:card"]'], "summary");
    assert.equal(seen['meta[property="og:image:width"]'], "REMOVED");
  });

  test("without a headshot, keeps the generic banner image", async () => {
    const seen = installFakeRewriter();
    const lookup = async () => ({ handle: "jane", name: "Jane", brokerage: "", tagline: "", headshotUrl: "" });
    await rewriteBioPage(html(), new Request("https://x.test/u/jane"), env, lookup);
    assert.equal(seen['meta[property="og:image"]'], "/og-image.png");
    assert.equal(seen['meta[name="twitter:card"]'], "summary_large_image");
  });

  test("an unknown handle gets a 404 status", async () => {
    installFakeRewriter();
    const res = await rewriteBioPage(html(), new Request("https://x.test/u/nobody"), env, async () => null);
    assert.equal(res.status, 404);
  });

  test("a lookup failure serves the generic page rather than an error", async () => {
    installFakeRewriter();
    const original = html();
    const res = await rewriteBioPage(original, new Request("https://x.test/u/jane"), env, async () => { throw new Error("db down"); });
    assert.equal(res, original);
  });

  test("leaves every other page alone", async () => {
    installFakeRewriter();
    const original = html();
    assert.equal(await rewriteBioPage(original, new Request("https://x.test/about"), env, async () => { throw new Error("should not run"); }), original);
  });
});

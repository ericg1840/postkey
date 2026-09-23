import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { absolutizeShareTags } from "../worker/index.mjs";

// Workers' HTMLRewriter doesn't exist in Node. This stand-in records the
// selectors and handlers, then runs each handler over a fake element holding
// the attribute value index.html ships with.
function installFakeRewriter(initial) {
  const results = {};
  globalThis.HTMLRewriter = class {
    constructor() { this.handlers = []; }
    on(selector, handler) { this.handlers.push([selector, handler]); return this; }
    transform(response) {
      for (const [selector, handler] of this.handlers) {
        const el = {
          getAttribute: () => initial[selector],
          setAttribute: (_name, value) => { results[selector] = value; },
        };
        handler.element(el);
      }
      return response;
    }
  };
  return results;
}

describe("absolutizeShareTags", () => {
  afterEach(() => { delete globalThis.HTMLRewriter; });

  test("makes image and page URLs absolute on the requesting origin", () => {
    const results = installFakeRewriter({
      'meta[property="og:image"]': "/og-image.png",
      'meta[name="twitter:image"]': "/og-image.png",
      'meta[property="og:url"]': "/",
    });
    const html = new Response("<html></html>", { headers: { "content-type": "text/html; charset=utf-8" } });
    absolutizeShareTags(html, new Request("https://postkey.example/about"));
    assert.equal(results['meta[property="og:image"]'], "https://postkey.example/og-image.png");
    assert.equal(results['meta[name="twitter:image"]'], "https://postkey.example/og-image.png");
    assert.equal(results['meta[property="og:url"]'], "https://postkey.example/about");
  });

  // Reset and verify links carry one-time tokens in the query string; they
  // must never end up in a tag a link-preview scraper will fetch and cache.
  test("og:url drops the query string", () => {
    const results = installFakeRewriter({ 'meta[property="og:url"]': "/" });
    const html = new Response("", { headers: { "content-type": "text/html" } });
    absolutizeShareTags(html, new Request("https://postkey.example/?resetToken=secret&resetEmail=a%40b.c"));
    assert.equal(results['meta[property="og:url"]'], "https://postkey.example/");
  });

  test("leaves non-HTML responses alone", () => {
    installFakeRewriter({});
    const png = new Response("x", { headers: { "content-type": "image/png" } });
    assert.equal(absolutizeShareTags(png, new Request("https://postkey.example/og-image.png")), png);
  });

  test("passes through where HTMLRewriter doesn't exist", () => {
    const html = new Response("", { headers: { "content-type": "text/html" } });
    assert.equal(absolutizeShareTags(html, new Request("https://postkey.example/")), html);
  });
});

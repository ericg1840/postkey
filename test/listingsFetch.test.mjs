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

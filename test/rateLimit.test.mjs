import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { checkRateLimit, getClientIp } from "../functions/_lib/rateLimit.mjs";

// db.sql is a tagged template, so the stub takes (strings, ...values) and
// hands back whatever attempts count the test wants. The fixed-window reset
// itself lives in the SQL and isn't exercised here -- what these cover is the
// JS around it: the allow/deny boundary, and that the key and window reach
// the query intact so two different limits can't share a counter.
function stubDb(attempts) {
  const calls = [];
  return {
    calls,
    sql: (strings, ...values) => {
      calls.push({ text: strings.join("?"), values });
      return Promise.resolve([{ attempts }]);
    },
  };
}

describe("checkRateLimit", () => {
  test("allows a first attempt", async () => {
    assert.equal(await checkRateLimit(stubDb(1), "login:ip:1.2.3.4", { max: 20, windowMinutes: 15 }), true);
  });

  test("allows the attempt that lands exactly on the limit", async () => {
    // Off-by-one guard: the limit is inclusive, so the 20th of 20 is allowed.
    assert.equal(await checkRateLimit(stubDb(20), "login:ip:1.2.3.4", { max: 20, windowMinutes: 15 }), true);
  });

  test("denies the attempt after the limit", async () => {
    assert.equal(await checkRateLimit(stubDb(21), "login:ip:1.2.3.4", { max: 20, windowMinutes: 15 }), false);
  });

  test("stays denied well past the limit", async () => {
    assert.equal(await checkRateLimit(stubDb(5000), "login:ip:1.2.3.4", { max: 20, windowMinutes: 15 }), false);
  });

  test("the key and window are passed to the query as bound values", async () => {
    const db = stubDb(1);
    await checkRateLimit(db, "signup:ip:9.9.9.9", { max: 8, windowMinutes: 60 });
    const { values } = db.calls[0];
    assert.ok(values.includes("signup:ip:9.9.9.9"), "key should be bound into the statement");
    assert.ok(values.includes(60), "window length should be bound into the statement");
    // Never interpolated into the SQL text itself.
    assert.doesNotMatch(db.calls[0].text, /9\.9\.9\.9/);
  });

  test("different limits use different keys", async () => {
    const db = stubDb(1);
    await checkRateLimit(db, "login:ip:1.1.1.1", { max: 20, windowMinutes: 15 });
    await checkRateLimit(db, "login:email:a@b.com", { max: 8, windowMinutes: 15 });
    assert.notDeepEqual(db.calls[0].values, db.calls[1].values);
  });
});

describe("getClientIp", () => {
  const req = (headers) => new Request("https://example.com/", { headers });

  test("takes the original caller from x-forwarded-for", () => {
    assert.equal(getClientIp(req({ "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" })), "203.0.113.7");
  });

  test("handles a single-entry x-forwarded-for", () => {
    assert.equal(getClientIp(req({ "x-forwarded-for": "203.0.113.7" })), "203.0.113.7");
  });

  test("trims surrounding whitespace", () => {
    assert.equal(getClientIp(req({ "x-forwarded-for": "  203.0.113.7 , 70.41.3.18" })), "203.0.113.7");
  });

  test("falls back to x-real-ip", () => {
    assert.equal(getClientIp(req({ "x-real-ip": "198.51.100.4" })), "198.51.100.4");
  });

  test("prefers x-forwarded-for over x-real-ip", () => {
    assert.equal(
      getClientIp(req({ "x-forwarded-for": "203.0.113.7", "x-real-ip": "198.51.100.4" })),
      "203.0.113.7",
    );
  });

  // With neither header, everyone shares the "unknown" bucket. That's
  // deliberate: a shared limit is the safe failure, since returning a unique
  // value per request would let anyone opt out of rate limiting entirely.
  test("falls back to a single shared bucket when no header is present", () => {
    assert.equal(getClientIp(req({})), "unknown");
    assert.equal(getClientIp(req({})), getClientIp(req({})));
  });
});

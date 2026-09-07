import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { shouldAlert, alertKeyFor, sendErrorAlert } from "../functions/_lib/alerts.mjs";

const COOLDOWN = 15 * 60 * 1000;
let n = 0;
const uniqueKey = () => `key-${n++}`;

describe("alertKeyFor", () => {
  test("same route and same error is one incident", () => {
    assert.equal(
      alertKeyFor("/api/auth/me", new Error("boom")),
      alertKeyFor("/api/auth/me", new Error("boom")),
    );
  });

  test("different routes are different incidents", () => {
    assert.notEqual(alertKeyFor("/api/a", new Error("boom")), alertKeyFor("/api/b", new Error("boom")));
  });

  test("different errors on one route are different incidents", () => {
    assert.notEqual(alertKeyFor("/api/a", new Error("one")), alertKeyFor("/api/a", new Error("two")));
  });

  test("copes with a thrown non-Error", () => {
    assert.equal(typeof alertKeyFor("/api/a", "just a string"), "string");
    assert.equal(typeof alertKeyFor("/api/a", null), "string");
    assert.equal(typeof alertKeyFor("/api/a", undefined), "string");
  });

  test("a huge error message doesn't make an unbounded key", () => {
    assert.ok(alertKeyFor("/api/a", new Error("x".repeat(10_000))).length < 300);
  });
});

describe("shouldAlert", () => {
  test("the first occurrence alerts", () => {
    assert.equal(shouldAlert(uniqueKey(), 1_000_000), true);
  });

  // The whole point: a route failing on every request is one email, not one
  // per request.
  test("repeats inside the cooldown are suppressed", () => {
    const key = uniqueKey();
    const t0 = 1_000_000;
    assert.equal(shouldAlert(key, t0), true);
    assert.equal(shouldAlert(key, t0 + 1), false);
    assert.equal(shouldAlert(key, t0 + COOLDOWN - 1), false);
  });

  test("it alerts again once the cooldown has passed", () => {
    const key = uniqueKey();
    const t0 = 2_000_000;
    assert.equal(shouldAlert(key, t0), true);
    assert.equal(shouldAlert(key, t0 + COOLDOWN), true);
  });

  test("a burst of 100 identical failures sends exactly one alert", () => {
    const key = uniqueKey();
    const t0 = 3_000_000;
    let sent = 0;
    for (let i = 0; i < 100; i++) if (shouldAlert(key, t0 + i)) sent += 1;
    assert.equal(sent, 1);
  });

  test("distinct failures each alert — one noisy route can't mask another", () => {
    const t0 = 4_000_000;
    assert.equal(shouldAlert(uniqueKey(), t0), true);
    assert.equal(shouldAlert(uniqueKey(), t0), true);
  });
});

describe("sendErrorAlert", () => {
  // No ALERT_EMAIL is the normal state locally and on any environment that
  // hasn't configured one; it must be a quiet no-op rather than a throw
  // inside the error handler itself.
  test("does nothing, and throws nothing, when no recipient is configured", async () => {
    await sendErrorAlert({ env: {}, ref: "abc", pathname: "/api/x", method: "GET", error: new Error("boom") });
    await sendErrorAlert({ env: undefined, ref: "abc", pathname: "/api/x", method: "GET", error: new Error("boom") });
  });

  // It runs inside the 500 handler, so it must never be able to throw —
  // here the mail provider is misconfigured, which makes sendEmail throw.
  test("swallows a failure of the alert channel itself", async () => {
    await sendErrorAlert({
      env: { ALERT_EMAIL: "ops@example.com" }, // no RESEND_API_KEY -> sendEmail throws
      ref: "def",
      pathname: `/api/unique-${n++}`,
      method: "POST",
      error: new Error("boom"),
    });
  });
});

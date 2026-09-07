import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { resolveToday } from "../functions/api/content/autofill.mjs";

// A Worker only knows UTC, so the planner sends its own local date and this
// decides how far that's trusted. Real timezones run UTC-12 to UTC+14, which
// puts a local date at most one day either side of the UTC one.
describe("resolveToday", () => {
  const UTC_TODAY = "2026-09-07";

  test("accepts a local date a day behind UTC (the Americas, late evening)", () => {
    assert.equal(resolveToday("2026-09-06", UTC_TODAY), "2026-09-06");
  });

  test("accepts a local date a day ahead of UTC (Kiritimati, early morning)", () => {
    assert.equal(resolveToday("2026-09-08", UTC_TODAY), "2026-09-08");
  });

  test("accepts the UTC date itself", () => {
    assert.equal(resolveToday(UTC_TODAY, UTC_TODAY), UTC_TODAY);
  });

  test("rejects anything more than a day out, in either direction", () => {
    assert.equal(resolveToday("2026-09-05", UTC_TODAY), UTC_TODAY);
    assert.equal(resolveToday("2026-09-09", UTC_TODAY), UTC_TODAY);
    assert.equal(resolveToday("1999-01-01", UTC_TODAY), UTC_TODAY);
    assert.equal(resolveToday("2030-01-01", UTC_TODAY), UTC_TODAY);
  });

  test("works across a month boundary", () => {
    assert.equal(resolveToday("2026-08-31", "2026-09-01"), "2026-08-31");
    assert.equal(resolveToday("2026-09-01", "2026-08-31"), "2026-09-01");
  });

  test("works across a year boundary", () => {
    assert.equal(resolveToday("2025-12-31", "2026-01-01"), "2025-12-31");
  });

  // An older client sends no date at all; it should behave exactly as before.
  test("falls back to UTC when nothing usable is supplied", () => {
    for (const raw of [undefined, null, "", "not-a-date", "2026-9-7", "20260907", 20260907, {}, []]) {
      assert.equal(resolveToday(raw, UTC_TODAY), UTC_TODAY, `raw: ${JSON.stringify(raw)}`);
    }
  });

  test("rejects a well-formed but impossible date", () => {
    assert.equal(resolveToday("2026-13-45", UTC_TODAY), UTC_TODAY);
  });
});

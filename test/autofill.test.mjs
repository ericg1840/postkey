import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { resolveToday, planSuggestions, listingSubject } from "../functions/api/content/autofill.mjs";

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

describe("listingSubject", () => {
  test("keeps the address, drops the old status", () => {
    assert.equal(listingSubject("419 Tall Oaks Dr — Just Listed"), "419 Tall Oaks Dr");
    assert.equal(listingSubject("12 Main St - Sold"), "12 Main St");
    assert.equal(listingSubject("56 Founders Way | Open House"), "56 Founders Way");
  });

  test("a hyphenated word isn't a separator", () => {
    assert.equal(listingSubject("Open-house weekend"), "Open-house weekend");
  });
});

describe("planSuggestions", () => {
  const base = { month: "2026-10", today: "2026-10-01", existing: [] };

  test("with nothing of the agent's own, spreads up to four generic prompts", () => {
    const out = planSuggestions(base);
    assert.equal(out.length, 4);
    assert.deepEqual(out.map((s) => s.date), ["2026-10-01", "2026-10-04", "2026-10-07", "2026-10-10"]);
    assert.ok(out.every((s) => s.source === "autofill" && s.ideaId === null));
  });

  test("never suggests a past or already-planned day", () => {
    const out = planSuggestions({ ...base, today: "2026-10-20", existing: [{ date: "2026-10-20", title: "Mine" }] });
    assert.ok(out.every((s) => s.date > "2026-10-20"));
  });

  test("a saved idea with a date this month lands on that date", () => {
    const out = planSuggestions({ ...base, ideas: [{ id: 5, title: "Fall festival", category: "community", targetDate: "2026-10-17" }] });
    const idea = out.find((s) => s.ideaId === 5);
    assert.equal(idea.date, "2026-10-17");
    assert.equal(idea.source, "idea");
  });

  test("an idea dated outside this month (or on a taken day) is left alone", () => {
    const out = planSuggestions({
      ...base,
      existing: [{ date: "2026-10-09", title: "Mine" }],
      ideas: [
        { id: 1, title: "Next month", category: "community", targetDate: "2026-11-02" },
        { id: 2, title: "Clashes", category: "community", targetDate: "2026-10-09" },
      ],
    });
    assert.ok(!out.some((s) => s.ideaId === 1 || s.ideaId === 2));
  });

  test("undated ideas come before listing follow-ups, which come before generic prompts", () => {
    const out = planSuggestions({
      ...base,
      ideas: [{ id: 3, title: "Coffee shop tour", category: "community", targetDate: null }],
      recentListings: ["419 Tall Oaks Dr — Just Listed"],
    });
    assert.equal(out[0].ideaId, 3);
    assert.match(out[1].title, /^Follow-up: 419 Tall Oaks Dr/);
    assert.equal(out[1].category, "listing");
    assert.equal(out[2].source, "autofill");
    assert.equal(out[2].ideaId, null);
  });

  test("follows up on each listing once, and at most two of them", () => {
    const out = planSuggestions({
      ...base,
      recentListings: ["1 A St — Just Listed", "1 A St — Price drop", "2 B St — Sold", "3 C St — Just Listed"],
    });
    const followUps = out.filter((s) => s.title.startsWith("Follow-up"));
    assert.deepEqual(followUps.map((s) => listingSubject(s.title.replace("Follow-up: ", ""))), ["1 A St", "2 B St"]);
  });

  test("doesn't repeat a follow-up or prompt that's already on the month", () => {
    const existing = [
      { date: "2026-10-02", title: "Follow-up: 1 A St — open house, price or status update" },
      { date: "2026-10-03", title: "Local favorite: a spot worth recommending" },
    ];
    const out = planSuggestions({ ...base, existing, recentListings: ["1 A St — Just Listed"] });
    const titles = out.map((s) => s.title);
    assert.ok(!titles.some((t) => t.startsWith("Follow-up: 1 A St")));
    assert.ok(!titles.includes("Local favorite: a spot worth recommending"));
  });

  test("returns nothing once the month is full", () => {
    assert.deepEqual(planSuggestions({ ...base, today: "2026-11-01" }), []);
  });
});

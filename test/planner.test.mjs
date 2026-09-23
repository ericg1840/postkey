import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { groupAgendaDays, formatDateRange, monthWeeks, weekIndexOf } from "../src/lib/planner.mjs";

const day = (date, { posts = [], holiday } = {}) => ({ date, posts, holiday });
const shape = (items) => items.map((i) => (i.type === "day" ? i.day.date : i.days.map((d) => d.date)));

describe("groupAgendaDays", () => {
  test("collapses a run of empty days into one gap", () => {
    const days = [day("2026-10-01", { posts: [{}] }), day("2026-10-02"), day("2026-10-03"), day("2026-10-04"), day("2026-10-05", { posts: [{}] })];
    assert.deepEqual(shape(groupAgendaDays(days, "2026-09-23")), [
      "2026-10-01", ["2026-10-02", "2026-10-03", "2026-10-04"], "2026-10-05",
    ]);
  });

  test("leaves a single empty day as its own row", () => {
    const days = [day("2026-10-01", { posts: [{}] }), day("2026-10-02"), day("2026-10-03", { posts: [{}] })];
    assert.deepEqual(shape(groupAgendaDays(days, "2026-09-23")), ["2026-10-01", "2026-10-02", "2026-10-03"]);
  });

  test("never folds today or a holiday into a gap", () => {
    const days = [day("2026-10-10"), day("2026-10-11"), day("2026-10-12", { holiday: "Columbus Day" }), day("2026-10-13"), day("2026-10-14")];
    assert.deepEqual(shape(groupAgendaDays(days, "2026-10-13")), [
      ["2026-10-10", "2026-10-11"], "2026-10-12", "2026-10-13", "2026-10-14",
    ]);
  });

  test("handles a trailing run and an empty month", () => {
    assert.deepEqual(shape(groupAgendaDays([day("2026-10-30"), day("2026-10-31")], "2026-09-23")), [["2026-10-30", "2026-10-31"]]);
    assert.deepEqual(groupAgendaDays([], "2026-09-23"), []);
  });
});

describe("formatDateRange", () => {
  test("drops the repeated month within one month", () => {
    assert.equal(formatDateRange("2026-10-03", "2026-10-06"), "Oct 3 – 6");
  });

  test("names both months across a boundary", () => {
    assert.equal(formatDateRange("2026-10-30", "2026-11-02"), "Oct 30 – Nov 2");
  });
});

describe("monthWeeks / weekIndexOf", () => {
  test("pads the first and last weeks with nulls (Sep 2026 starts on a Tuesday)", () => {
    const weeks = monthWeeks("2026-09");
    assert.equal(weeks.length, 5);
    assert.deepEqual(weeks[0].slice(0, 3), [null, null, "2026-09-01"]);
    assert.deepEqual(weeks[4], ["2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30", null, null, null]);
    assert.ok(weeks.every((w) => w.length === 7));
  });

  test("a month can span six weeks", () => {
    assert.equal(monthWeeks("2026-08").length, 6); // Sat the 1st, 31 days
  });

  test("weekIndexOf finds the row a date sits in", () => {
    for (const key of ["2026-09-01", "2026-09-05", "2026-09-06", "2026-09-23", "2026-09-30", "2026-08-31"]) {
      const weeks = monthWeeks(key.slice(0, 7));
      assert.ok(weeks[weekIndexOf(key)].includes(key), key);
    }
  });
});

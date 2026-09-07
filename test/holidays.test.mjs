import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { holidaysForYear, holidaysByDate, upcomingHolidays } from "../src/lib/holidays.mjs";

const on = (year, name) => holidaysForYear(year).find((h) => h.name === name)?.date;

describe("fixed-date holidays", () => {
  test("land on their date every year", () => {
    assert.equal(on(2026, "New Year's Day"), "2026-01-01");
    assert.equal(on(2026, "Independence Day"), "2026-07-04");
    assert.equal(on(2026, "Christmas"), "2026-12-25");
    assert.equal(on(2027, "Halloween"), "2027-10-31");
    assert.equal(on(2027, "Juneteenth"), "2027-06-19");
  });
});

describe("nth-weekday holidays", () => {
  // Checked against the actual 2026 calendar.
  test("2026", () => {
    assert.equal(on(2026, "Martin Luther King Jr. Day"), "2026-01-19"); // 3rd Mon Jan
    assert.equal(on(2026, "Presidents' Day"), "2026-02-16"); // 3rd Mon Feb
    assert.equal(on(2026, "Mother's Day"), "2026-05-10"); // 2nd Sun May
    assert.equal(on(2026, "Father's Day"), "2026-06-21"); // 3rd Sun Jun
    assert.equal(on(2026, "Labor Day"), "2026-09-07"); // 1st Mon Sep
    assert.equal(on(2026, "Thanksgiving"), "2026-11-26"); // 4th Thu Nov
  });

  test("2027", () => {
    assert.equal(on(2027, "Martin Luther King Jr. Day"), "2027-01-18");
    assert.equal(on(2027, "Labor Day"), "2027-09-06");
    assert.equal(on(2027, "Thanksgiving"), "2027-11-25");
  });

  // The last-weekday case is the one that breaks if you assume "5th if it
  // exists, else 4th" — May 2026 has five Mondays, May 2027 has five too,
  // but May 2028 has four.
  test("Memorial Day is the last Monday of May, not simply the 4th or 5th", () => {
    assert.equal(on(2026, "Memorial Day"), "2026-05-25");
    assert.equal(on(2027, "Memorial Day"), "2027-05-31");
    assert.equal(on(2028, "Memorial Day"), "2028-05-29");
  });

  test("a month where the 1st is already the target weekday", () => {
    // Sep 2025 starts on a Monday, so Labor Day is the 1st itself.
    assert.equal(on(2025, "Labor Day"), "2025-09-01");
  });
});

describe("Easter", () => {
  // Published dates — the computus is easy to get subtly wrong, and these
  // span both the March and April cases.
  test("matches known dates", () => {
    assert.equal(on(2024, "Easter"), "2024-03-31");
    assert.equal(on(2025, "Easter"), "2025-04-20");
    assert.equal(on(2026, "Easter"), "2026-04-05");
    assert.equal(on(2027, "Easter"), "2027-03-28");
    assert.equal(on(2030, "Easter"), "2030-04-21");
  });
});

describe("holidaysForYear", () => {
  test("returns every holiday, in date order, all within the year", () => {
    const list = holidaysForYear(2026);
    assert.ok(list.length >= 15);
    const dates = list.map((h) => h.date);
    assert.deepEqual(dates, [...dates].sort());
    for (const h of list) assert.match(h.date, /^2026-\d{2}-\d{2}$/);
  });

  test("every entry has a name", () => {
    for (const h of holidaysForYear(2026)) assert.ok(h.name.length > 0);
  });
});

describe("upcomingHolidays", () => {
  test("returns the next ones on or after the given day", () => {
    const next = upcomingHolidays("2026-11-01", 3);
    assert.deepEqual(next.map((h) => h.name), ["Veterans Day", "Thanksgiving", "Christmas"]);
  });

  test("includes a holiday falling on the given day itself", () => {
    assert.equal(upcomingHolidays("2026-12-25", 1)[0].name, "Christmas");
  });

  // From late December the next holidays are in January, so this has to cross
  // the year boundary rather than returning nothing.
  test("rolls into the following year", () => {
    const next = upcomingHolidays("2026-12-26", 2);
    assert.deepEqual(next.map((h) => h.date), ["2026-12-31", "2027-01-01"]);
  });

  test("respects the requested count", () => {
    assert.equal(upcomingHolidays("2026-01-01", 5).length, 5);
    assert.equal(upcomingHolidays("2026-01-01", 1).length, 1);
  });
});

describe("holidaysByDate", () => {
  test("looks a holiday up by its date key", () => {
    const map = holidaysByDate(2026);
    assert.equal(map.get("2026-11-26"), "Thanksgiving");
    assert.equal(map.get("2026-07-04"), "Independence Day");
    assert.equal(map.get("2026-07-05"), undefined);
  });

  test("covers the following year too, for a December month view", () => {
    assert.equal(holidaysByDate(2026).get("2027-01-01"), "New Year's Day");
  });
});

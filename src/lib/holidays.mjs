// Holidays worth planning a post around, computed rather than hardcoded so
// the planner keeps working in future years without anyone editing a list.
//
// Everything here works in local calendar terms — dates are built with
// `new Date(y, m - 1, d)` and read back with the local getters, never through
// toISOString(), which would shift the day for anyone west of Greenwich (the
// same trap that made autofill skip the current day).

const WEEKDAY = { SUN: 0, MON: 1, THU: 4 };

// The n-th given weekday of a month, e.g. the 4th Thursday of November.
function nthWeekdayOf(year, month, weekday, n) {
  const first = new Date(year, month - 1, 1);
  const shift = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month - 1, 1 + shift + (n - 1) * 7);
}

// The last given weekday of a month, e.g. the last Monday of May.
function lastWeekdayOf(year, month, weekday) {
  // Day 0 of the following month is the last day of this one.
  const last = new Date(year, month, 0);
  const shift = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month - 1, last.getDate() - shift);
}

// Anonymous Gregorian computus. Easter is the one date here that can't be
// expressed as "nth weekday of month" — it moves across March and April.
function easterFor(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function toDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// `on` returns the date for a given year. Fixed-date holidays are a plain
// (y) => new Date(...); the rest compute their weekday.
const HOLIDAYS = [
  { name: "New Year's Day", on: (y) => new Date(y, 0, 1) },
  { name: "Martin Luther King Jr. Day", on: (y) => nthWeekdayOf(y, 1, WEEKDAY.MON, 3) },
  { name: "Valentine's Day", on: (y) => new Date(y, 1, 14) },
  { name: "Presidents' Day", on: (y) => nthWeekdayOf(y, 2, WEEKDAY.MON, 3) },
  { name: "St. Patrick's Day", on: (y) => new Date(y, 2, 17) },
  { name: "Easter", on: easterFor },
  { name: "Mother's Day", on: (y) => nthWeekdayOf(y, 5, WEEKDAY.SUN, 2) },
  { name: "Memorial Day", on: (y) => lastWeekdayOf(y, 5, WEEKDAY.MON) },
  { name: "Father's Day", on: (y) => nthWeekdayOf(y, 6, WEEKDAY.SUN, 3) },
  { name: "Juneteenth", on: (y) => new Date(y, 5, 19) },
  { name: "Independence Day", on: (y) => new Date(y, 6, 4) },
  { name: "Labor Day", on: (y) => nthWeekdayOf(y, 9, WEEKDAY.MON, 1) },
  { name: "Halloween", on: (y) => new Date(y, 9, 31) },
  { name: "Veterans Day", on: (y) => new Date(y, 10, 11) },
  { name: "Thanksgiving", on: (y) => nthWeekdayOf(y, 11, WEEKDAY.THU, 4) },
  { name: "Christmas", on: (y) => new Date(y, 11, 25) },
  { name: "New Year's Eve", on: (y) => new Date(y, 11, 31) },
];

export function holidaysForYear(year) {
  return HOLIDAYS.map((h) => ({ name: h.name, date: toDateKey(h.on(year)) })).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
}

// Keyed by date so a calendar cell can ask "is anything on this day?" without
// scanning. Spans two years, since the next holiday from late December is in
// the following one.
export function holidaysByDate(year) {
  const map = new Map();
  for (const h of [...holidaysForYear(year), ...holidaysForYear(year + 1)]) {
    if (!map.has(h.date)) map.set(h.date, h.name);
  }
  return map;
}

// The next `count` holidays on or after `fromDateKey` — what the planner
// shows so an agent can see what's coming and plan around it.
export function upcomingHolidays(fromDateKey, count = 4) {
  const year = Number(fromDateKey.slice(0, 4));
  return [...holidaysForYear(year), ...holidaysForYear(year + 1)]
    .filter((h) => h.date >= fromDateKey)
    .slice(0, count);
}

// Pure helpers for the Planner (src/ContentCalendar.jsx), kept out of the
// component so they can be tested without a DOM.

// The agenda lists every day of the month, and in a thinly planned month
// that's a wall of identical "No post planned" rows the agent has to scroll
// past to find anything. Runs of two or more empty days collapse into a
// single "gap" row instead. A day stays on its own row when it has posts,
// is a holiday (worth seeing by name), or is today (the anchor the agent is
// looking for).
//
// `days` is [{ date, posts, holiday }] in date order. Returns a list of
// { type: "day", day } and { type: "gap", days } entries.
export function groupAgendaDays(days, todayKey) {
  const out = [];
  let run = [];
  const flush = () => {
    if (run.length === 1) out.push({ type: "day", day: run[0] });
    else if (run.length > 1) out.push({ type: "gap", days: run });
    run = [];
  };
  for (const day of days) {
    const empty = day.posts.length === 0 && !day.holiday && day.date !== todayKey;
    if (empty) {
      run.push(day);
    } else {
      flush();
      out.push({ type: "day", day });
    }
  }
  flush();
  return out;
}

// "Oct 3 – 6", or "Oct 30 – Nov 2" if a range ever spans months.
export function formatDateRange(fromIso, toIso) {
  const from = new Date(fromIso + "T00:00:00");
  const to = new Date(toIso + "T00:00:00");
  const fromLabel = from.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const toLabel = from.getMonth() === to.getMonth()
    ? String(to.getDate())
    : to.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fromLabel} – ${toLabel}`;
}

function pad2(n) { return String(n).padStart(2, "0"); }

// The month's calendar grid as Sunday-first weeks: each week is seven date
// keys, with null for the days that belong to the neighbouring months. The
// week view pages through these, so it never needs another month's posts.
export function monthWeeks(monthKey) {
  const [year, mo] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, mo, 0).getDate();
  const cells = Array(new Date(year, mo - 1, 1).getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${monthKey}-${pad2(d)}`);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// Which of monthWeeks(month of dateKey) holds dateKey.
export function weekIndexOf(dateKey) {
  const [year, mo, day] = dateKey.split("-").map(Number);
  return Math.floor((new Date(year, mo - 1, 1).getDay() + day - 1) / 7);
}

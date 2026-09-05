import { getDb } from "../../_lib/db.mjs";
import { getUserIdFromRequest, json } from "../../_lib/auth.mjs";

// A light rotating pool of generic prompts, cycled per open day so a
// month with nothing planned yet still gets a few concrete starting
// points — these are suggestions, not real posts, and stay in
// status:'suggested' until the agent explicitly confirms one.
const SUGGESTION_POOL = [
  { title: "Local favorite: a spot worth recommending", category: "community" },
  { title: "Quick market update for your area", category: "listing" },
  { title: "Behind the scenes: a day in the life", category: "bts" },
  { title: "Client shoutout or recent success story", category: "community" },
  { title: "Seasonal promo — remind people you're open for business", category: "promo" },
];

function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}

export async function onRequestPost({ request, env }) {
  const userId = getUserIdFromRequest(request, env);
  if (!userId) return json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const month = /^\d{4}-\d{2}$/.test(body.month) ? body.month : new Date().toISOString().slice(0, 7);

  const db = getDb(env);
  const existing = await db.sql`
    SELECT date FROM content_posts WHERE user_id = ${userId} AND date LIKE ${month + "-%"}
  `;
  const takenDates = new Set(existing.map((r) => r.date));

  const [year, mo] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mo, 0).getDate();
  const today = toDateKey(new Date());

  const openDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${month}-${String(d).padStart(2, "0")}`;
    if (dateKey < today) continue;
    if (takenDates.has(dateKey)) continue;
    openDays.push(dateKey);
  }

  // Spread suggestions out (every 3rd open day) instead of filling every
  // single gap, and cap at 4 so autofill reads as a nudge, not a takeover.
  const picks = [];
  for (let i = 0; i < openDays.length && picks.length < 4; i += 3) {
    picks.push(openDays[i]);
  }

  if (picks.length === 0) return json({ posts: [] });

  const rows = await Promise.all(picks.map((dateKey, i) => {
    const suggestion = SUGGESTION_POOL[i % SUGGESTION_POOL.length];
    return db.sql`
      INSERT INTO content_posts (user_id, date, title, category, status, source)
      VALUES (${userId}, ${dateKey}, ${suggestion.title}, ${suggestion.category}, 'suggested', 'autofill')
      RETURNING id, date, title, category, status, source, posted
    `.then(([row]) => row);
  }));

  return json({
    posts: rows.map((r) => ({
      id: r.id, date: r.date, title: r.title, category: r.category,
      status: r.status, source: r.source, posted: r.posted,
    })),
  });
}

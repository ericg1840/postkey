import { requireUser } from "../../_lib/session.mjs";
import { json } from "../../_lib/auth.mjs";

// Generic prompts, used once there's nothing of the agent's own to suggest
// (see planSuggestions). These are suggestions, not real posts, and stay in
// status:'suggested' until the agent explicitly confirms one.
const SUGGESTION_POOL = [
  { title: "Local favorite: a spot worth recommending", category: "community" },
  { title: "Quick market update for your area", category: "listing" },
  { title: "Behind the scenes: a day in the life", category: "bts" },
  { title: "Client shoutout or recent success story", category: "community" },
  { title: "Seasonal promo — remind people you're open for business", category: "promo" },
];

// Spread suggestions out (every 3rd open day) instead of filling every
// single gap, and cap them so autofill reads as a nudge, not a takeover.
const MAX_SUGGESTIONS = 4;
const SPREAD = 3;
// Enough listing follow-ups to be useful without crowding out ideas and
// variety.
const MAX_FOLLOW_UPS = 2;

// "419 Tall Oaks Dr — Just Listed" -> "419 Tall Oaks Dr": the address (or
// whatever leads the title) is what a follow-up is about, not the old status.
export function listingSubject(title) {
  return String(title || "").split(/\s+[—–|-]\s+/)[0].trim();
}

// Decides what auto-fill adds, and where. Pure, so it can be tested without a
// database. In order of preference, since the agent's own material beats a
// generic prompt:
//   1. Saved ideas with a target date on an open day this month go on that day.
//   2. The remaining picks (every SPREAD-th open day) take, in turn: saved
//      ideas without a date (oldest first), a follow-up on a recent listing,
//      then the generic pool — skipping any title already on the month.
//
// `ideas` are unconverted ideas ({ id, title, category, targetDate }),
// `recentListings` are titles of recently planned listing posts (newest
// first), `existing` is the month's posts ({ date, title }).
export function planSuggestions({ month, today, existing, ideas = [], recentListings = [] }) {
  const [year, mo] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mo, 0).getDate();
  const takenDates = new Set(existing.map((p) => p.date));
  const takenTitles = new Set(existing.map((p) => p.title.toLowerCase()));

  const openDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${month}-${String(d).padStart(2, "0")}`;
    if (dateKey >= today && !takenDates.has(dateKey)) openDays.push(dateKey);
  }

  const out = [];
  const add = (s) => {
    out.push(s);
    takenDates.add(s.date);
    takenTitles.add(s.title.toLowerCase());
  };

  const usedIdeas = new Set();
  for (const idea of ideas) {
    if (out.length >= MAX_SUGGESTIONS) break;
    if (!idea.targetDate || !openDays.includes(idea.targetDate) || takenDates.has(idea.targetDate)) continue;
    usedIdeas.add(idea.id);
    add({ date: idea.targetDate, title: idea.title, category: idea.category, source: "idea", ideaId: idea.id });
  }

  const queue = [];
  for (const idea of ideas) {
    if (!usedIdeas.has(idea.id) && !idea.targetDate) {
      queue.push({ title: idea.title, category: idea.category, source: "idea", ideaId: idea.id });
    }
  }
  const subjects = new Set();
  for (const title of recentListings) {
    const subject = listingSubject(title);
    if (!subject || subjects.has(subject.toLowerCase()) || subjects.size >= MAX_FOLLOW_UPS) continue;
    subjects.add(subject.toLowerCase());
    // Already followed up on this month (by title), so don't repeat it.
    if ([...takenTitles].some((t) => t.includes(subject.toLowerCase()) && t.startsWith("follow-up"))) continue;
    queue.push({ title: `Follow-up: ${subject} — open house, price or status update`, category: "listing", source: "autofill" });
  }
  queue.push(...SUGGESTION_POOL.map((s) => ({ ...s, source: "autofill" })));

  const remaining = openDays.filter((d) => !takenDates.has(d));
  for (let i = 0; i < remaining.length && out.length < MAX_SUGGESTIONS; i += SPREAD) {
    let next;
    while ((next = queue.shift()) && takenTitles.has(next.title.toLowerCase()));
    if (!next) break;
    add({ date: remaining[i], ...next, ideaId: next.ideaId ?? null });
  }

  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function toUtcDateKey(d) {
  return d.toISOString().slice(0, 10);
}

// Which day counts as "today" depends on where the agent is, and a Worker
// only knows UTC — so for anyone west of Greenwich, the UTC date has already
// rolled over for the last hours of their evening and autofill would skip
// the day they're looking at. The client sends its own local date instead.
//
// Only trusted within a day of the server's own date: every real timezone
// (UTC-12 through UTC+14) puts the local date within one day of the UTC one,
// so this keeps a stray or bogus value from planting suggestions on
// arbitrary past dates, while accepting every genuine offset.
export function resolveToday(raw, utcToday) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw || "")) return utcToday;
  const offsetDays = Math.abs(Date.parse(`${raw}T00:00:00Z`) - Date.parse(`${utcToday}T00:00:00Z`)) / 86_400_000;
  return Number.isFinite(offsetDays) && offsetDays <= 1 ? raw : utcToday;
}

export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const { userId, db } = auth;

  const body = await request.json().catch(() => ({}));
  const month = /^\d{4}-\d{2}$/.test(body.month) ? body.month : new Date().toISOString().slice(0, 7);
  const today = resolveToday(body.today, toUtcDateKey(new Date()));
  // Listings from roughly the last two months are the ones still worth a
  // follow-up (open house, price change, under contract, sold).
  const since = toUtcDateKey(new Date(Date.parse(`${today}T00:00:00Z`) - 60 * 86_400_000));

  const [existing, ideaRows, listingRows] = await Promise.all([
    db.sql`SELECT date, title FROM content_posts WHERE user_id = ${userId} AND date LIKE ${month + "-%"}`,
    db.sql`
      SELECT id, title, category, target_date FROM content_ideas
       WHERE user_id = ${userId} AND added_at IS NULL
       ORDER BY created_at ASC, id ASC LIMIT 20
    `,
    db.sql`
      SELECT title FROM content_posts
       WHERE user_id = ${userId} AND category = 'listing' AND status = 'confirmed'
         AND source <> 'autofill' AND date >= ${since} AND date <= ${today}
       ORDER BY date DESC, id DESC LIMIT 10
    `,
  ]);

  const picks = planSuggestions({
    month,
    today,
    existing,
    ideas: ideaRows.map((r) => ({ id: r.id, title: r.title, category: r.category, targetDate: r.target_date })),
    recentListings: listingRows.map((r) => r.title),
  });
  if (picks.length === 0) return json({ posts: [] });

  const rows = await Promise.all(picks.map((pick) => {
    if (pick.ideaId) {
      // Same claim-then-insert as "Add to plan" (ideas.mjs): if the idea was
      // converted some other way meanwhile, nothing is inserted for it.
      return db.sql`
        WITH claimed AS (
          UPDATE content_ideas SET added_at = NOW()
           WHERE id = ${pick.ideaId} AND user_id = ${userId} AND added_at IS NULL
          RETURNING id, title, category
        )
        INSERT INTO content_posts (user_id, date, title, category, status, source, idea_id)
        SELECT ${userId}, ${pick.date}, title, category, 'suggested', 'idea', id FROM claimed
        RETURNING id, date, title, category, status, source, posted
      `.then(([row]) => row);
    }
    return db.sql`
      INSERT INTO content_posts (user_id, date, title, category, status, source)
      VALUES (${userId}, ${pick.date}, ${pick.title}, ${pick.category}, 'suggested', 'autofill')
      RETURNING id, date, title, category, status, source, posted
    `.then(([row]) => row);
  }));

  return json({
    posts: rows.filter(Boolean).map((r) => ({
      id: r.id, date: r.date, title: r.title, category: r.category,
      status: r.status, source: r.source, posted: r.posted,
    })),
  });
}

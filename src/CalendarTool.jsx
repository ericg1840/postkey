import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";
import {
  UI, ACCENT, WHITE, mixWithWhite, TopNav, writePostHandoff,
  loadCalendarEntries, saveCalendarEntries, genCalendarEntryId,
} from "./shared.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

// Purely a planning/tracking calendar — PostKey has no social API
// integration, so nothing here actually publishes anything. It just helps
// people decide what to post and when, then remember whether they did.

const POST_TYPES = [
  { key: "listing", label: "Listing", color: "#0043FF", emoji: "🏡" },
  { key: "community", label: "Community", color: "#E0298C", emoji: "📍" },
  { key: "other", label: "Other", color: "#697386", emoji: "💬" },
];
const typeInfo = (key) => POST_TYPES.find((t) => t.key === key) || POST_TYPES[2];

// A light, rotating pool of post ideas sprinkled onto open days so a month
// with nothing planned yet still feels useful — these are prompts, not
// real posts, and are styled dashed/muted in the grid to make that obvious.
// "Weekend Open House" is kept separate and only ever suggested on a
// Saturday/Sunday — open houses don't happen on a Tuesday.
const SUGGESTIONS = [
  { title: "Local Favorite", type: "community" },
  { title: "Seller Tip", type: "community" },
  { title: "Home Maintenance", type: "community" },
  { title: "Client Love", type: "community" },
];
const WEEKEND_SUGGESTION = { title: "Weekend Open House", type: "listing" };

// Deterministic (not random) so a suggestion doesn't jump around on every
// re-render. Weekends get their own once-every-other-Saturday cadence;
// weekdays cycle through the general pool every 4th day.
function suggestionForDate(date) {
  const day = date.getDate();
  const weekday = date.getDay();
  if (weekday === 6) return day % 4 < 2 ? WEEKEND_SUGGESTION : null; // Saturday, every other week
  if (weekday === 0) return null; // Sunday: skip, Saturday already covers the weekend
  if (day % 4 !== 1) return null;
  return SUGGESTIONS[Math.floor(day / 4) % SUGGESTIONS.length];
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// The rough split a healthy, varied posting habit tends toward — shown
// alongside the actual mix so "Community 100%" reads as a gap, not just a
// number.
const TARGET_MIX = { listing: 0.4, community: 0.4, other: 0.2 };

const VIEW_MODES = ["month", "week", "day"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function CalendarTool({ onSwitchTool, onGoHome }) {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState(() => loadCalendarEntries());
  const [viewMode, setViewMode] = useState("month");
  // What the grid/strip/agenda is currently centered on — a month for Month
  // view, a week for Week view, a single day for Day view. Prev/Next and
  // Today all act relative to this one date regardless of mode.
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [editing, setEditing] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [activeFilters, setActiveFilters] = useState(() => new Set(POST_TYPES.map((t) => t.key)));
  const [highlightOpenDays, setHighlightOpenDays] = useState(false);

  // Writes localStorage synchronously instead of via a useEffect on
  // `entries`: createPost immediately switches tools in the same update,
  // which unmounts this component before a state-driven effect would get
  // a chance to run, silently dropping the save.
  const commitEntries = (next) => {
    setEntries(next);
    saveCalendarEntries(next);
  };

  const year = focusDate.getFullYear();
  const month = focusDate.getMonth();
  const today = new Date();
  const todayKey = toDateKey(today);

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Always 42 cells (6 full weeks) so the grid height never jumps between months.
  const monthCells = [];
  for (let i = 0; i < startWeekday; i++) {
    monthCells.push({ date: new Date(year, month, i - startWeekday + 1), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    monthCells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (monthCells.length < 42) {
    monthCells.push({ date: new Date(year, month, monthCells.length - startWeekday + 1), inMonth: false });
  }

  const viewWeekStart = addDays(focusDate, -focusDate.getDay());
  const viewWeekDays = Array.from({ length: 7 }, (_, i) => addDays(viewWeekStart, i));

  const entriesByDate = {};
  entries.forEach((e) => { (entriesByDate[e.date] ||= []).push(e); });

  const toggleFilter = (key) => setActiveFilters((prev) => {
    const next = new Set(prev);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key); // always leave at least one type visible
    } else {
      next.add(key);
    }
    return next;
  });

  // Clicking a stat like "3 listing posts" isolates the grid to just that
  // type; clicking it again (or the same stat) restores every type.
  const isolateFilter = (key) => setActiveFilters((prev) => (
    prev.size === 1 && prev.has(key) ? new Set(POST_TYPES.map((t) => t.key)) : new Set([key])
  ));

  const goPrev = () => {
    if (viewMode === "month") setFocusDate(new Date(year, month - 1, 1));
    else if (viewMode === "week") setFocusDate(addDays(focusDate, -7));
    else setFocusDate(addDays(focusDate, -1));
  };
  const goNext = () => {
    if (viewMode === "month") setFocusDate(new Date(year, month + 1, 1));
    else if (viewMode === "week") setFocusDate(addDays(focusDate, 7));
    else setFocusDate(addDays(focusDate, 1));
  };
  const goToday = () => setFocusDate(new Date());

  const openNewEntry = (dateKey, overrides = {}) => setEditing({ date: dateKey, title: "", type: "listing", notes: "", time: "", done: false, ...overrides });
  // Ideas saved without a date (e.g. from Community's "Need inspiration"
  // card) get today's date as a default the moment they're opened, so the
  // modal always has something valid to show/save — picking a different
  // date is just editing that default like any other field.
  const openEditEntry = (entry) => setEditing({ time: "", ...entry, date: entry.date || todayKey });
  const openSuggestion = (dateKey, suggestion) => openNewEntry(dateKey, { title: suggestion.title, type: suggestion.type });

  const upsert = (prev, entry) => (
    entry.id
      ? prev.map((e) => (e.id === entry.id ? entry : e))
      : [...prev, { ...entry, id: genCalendarEntryId() }]
  );

  const saveEntry = () => {
    if (!editing.title.trim()) return;
    commitEntries(upsert(entries, editing));
    setEditing(null);
  };

  const deleteEntry = () => {
    commitEntries(entries.filter((e) => e.id !== editing.id));
    setEditing(null);
  };

  // Saves the entry (so it's on the calendar either way) and jumps into
  // whichever tool makes that kind of post, prefilled with its title.
  const createPost = () => {
    if (!editing.title.trim()) return;
    commitEntries(upsert(entries, editing));
    const targetTool = editing.type === "listing" ? "listings" : "community";
    const field = editing.type === "listing" ? "address" : "subject";
    writePostHandoff({ tool: targetTool, field, value: editing.title });
    setEditing(null);
    onSwitchTool(targetTool);
  };

  const moveEntry = (id, dateKey) => {
    commitEntries(entries.map((e) => (e.id === id ? { ...e, date: dateKey } : e)));
  };

  // ---- Content mix + month-at-a-glance for the month currently in view ----
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEntries = entries.filter((e) => e.date && e.date.startsWith(monthPrefix));
  const mixCounts = POST_TYPES.map((t) => ({ ...t, count: monthEntries.filter((e) => e.type === t.key).length }));
  const mixTotal = monthEntries.length;
  const monthListingCount = mixCounts.find((t) => t.key === "listing").count;
  const monthCommunityCount = mixCounts.find((t) => t.key === "community").count;
  // Only days from today through the end of the viewed month — a day that's
  // already passed can't be "filled".
  const remainingMonthDays = monthCells.filter((c) => c.inMonth && toDateKey(c.date) >= todayKey).map((c) => c.date);
  const monthOpenDays = remainingMonthDays.filter((d) => (entriesByDate[toDateKey(d)] || []).length === 0);

  let mixTip = null;
  let mixAddType = null;
  if (mixTotal >= 3) {
    const top = mixCounts.reduce((a, b) => (b.count > a.count ? b : a), mixCounts[0]);
    const actual = top.count / mixTotal;
    // Only ever suggest adding a Listing or Community post — "Other" isn't
    // a real content category worth nudging someone toward.
    const under = mixCounts
      .filter((t) => t.key !== "other")
      .sort((a, b) => (a.count / mixTotal - TARGET_MIX[a.key]) - (b.count / mixTotal - TARGET_MIX[b.key]))[0];
    if (actual - TARGET_MIX[top.key] >= 0.2 && under.key !== top.key) {
      mixTip = `You've posted mostly ${top.label} lately — try adding a ${under.label} post this month.`;
      mixAddType = under.key;
    }
  }

  // Turns a set of still-empty days into real, saved entries drawn from the
  // community suggestion pool, spread across the month instead of stacked
  // into one week. Saturdays are always skipped — that's where real open
  // houses go, and she may not know which listings have one yet, so this
  // never invents one; it just leaves the day open with a light "Weekend
  // Open House" suggestion she can fill in once she does know. Shared by
  // "Fill my month" and "Plan next month".
  const fillDaysSpread = (days) => {
    let idx = 0;
    const additions = [];
    days.forEach((d) => {
      const dateKey = toDateKey(d);
      if (dateKey < todayKey) return;
      if (d.getDay() === 6) return;
      if ((entriesByDate[dateKey] || []).length > 0) return;
      const sugg = SUGGESTIONS[idx % SUGGESTIONS.length];
      idx += 1;
      additions.push({ id: genCalendarEntryId(), date: dateKey, title: sugg.title, type: sugg.type, notes: "", time: "", done: false });
    });
    if (additions.length) commitEntries([...entries, ...additions]);
  };
  const fillMonth = () => fillDaysSpread(remainingMonthDays);
  const fillNextMonth = () => {
    const nm = new Date(year, month + 1, 1);
    const lastDay = new Date(nm.getFullYear(), nm.getMonth() + 1, 0).getDate();
    fillDaysSpread(Array.from({ length: lastDay }, (_, i) => new Date(nm.getFullYear(), nm.getMonth(), i + 1)));
  };

  // ---- Left panel: what's coming up, what's still unplanned this month,
  // and ideas saved without a date yet (e.g. from Community's "Need
  // inspiration" card) waiting to be scheduled. ----
  const upNext = entries.filter((e) => e.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const monthIdeas = remainingMonthDays
    .map((d) => ({ date: d, suggestion: suggestionForDate(d) }))
    .filter(({ date, suggestion }) => suggestion && (entriesByDate[toDateKey(date)] || []).length === 0)
    .slice(0, 5);
  const savedIdeas = entries.filter((e) => !e.date);

  // ---- Header label: what the nav row shows for the current mode ----
  let headerLabel;
  if (viewMode === "month") {
    headerLabel = `${MONTH_NAMES[month]} ${year}`;
  } else if (viewMode === "week") {
    const s = viewWeekDays[0], e = viewWeekDays[6];
    headerLabel = s.getMonth() === e.getMonth()
      ? `${MONTH_NAMES[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
      : `${MONTH_NAMES[s.getMonth()].slice(0, 3)} ${s.getDate()} – ${MONTH_NAMES[e.getMonth()].slice(0, 3)} ${e.getDate()}, ${e.getFullYear()}`;
  } else {
    headerLabel = focusDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  // One cell renderer shared by Month (42 cells) and Week (7 cells) — same
  // entries/suggestion/empty-state/drag-drop logic, just a taller minHeight
  // for the single-row Week strip so it doesn't look cramped.
  const renderCell = (date, inMonth, i, tall) => {
    const dateKey = toDateKey(date);
    const dayEntries = (entriesByDate[dateKey] || []).filter((e) => activeFilters.has(e.type));
    const isToday = dateKey === todayKey;
    const visible = dayEntries.slice(0, tall ? 6 : 3);
    const overflow = dayEntries.length - visible.length;
    const isDragOver = dragOverDate === dateKey;
    const suggestion = inMonth && dayEntries.length === 0 && dateKey >= todayKey ? suggestionForDate(date) : null;
    const isEmpty = inMonth && dayEntries.length === 0 && !suggestion;
    const isOpenHighlight = highlightOpenDays && inMonth && dayEntries.length === 0 && dateKey >= todayKey;
    return (
      <div
        key={i}
        className="group relative p-1.5 sm:p-2 flex flex-col gap-1.5"
        style={{
          minHeight: tall ? "16rem" : "8.5rem",
          borderRight: (i + 1) % 7 !== 0 ? `1px solid ${UI.line}` : "none",
          borderTop: i >= 7 ? `1px solid ${UI.line}` : "none",
          background: isDragOver ? mixWithWhite(ACCENT, 0.92) : isOpenHighlight ? mixWithWhite("#E8792E", 0.9) : inMonth ? UI.card : UI.stone,
          boxShadow: isDragOver ? `inset 0 0 0 2px ${ACCENT}` : isOpenHighlight ? `inset 0 0 0 2px #E8792E` : "none",
          transition: "background 0.1s, box-shadow 0.1s",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOverDate(dateKey); }}
        onDragLeave={() => setDragOverDate((d) => (d === dateKey ? null : d))}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          if (id) moveEntry(id, dateKey);
          setDragOverDate(null);
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="flex items-center justify-center font-body text-xs font-semibold rounded-full flex-shrink-0"
            style={{
              width: 24, height: 24,
              background: isToday ? ACCENT : "transparent",
              color: isToday ? WHITE : inMonth ? UI.ink : UI.inkSoft,
            }}
          >
            {date.getDate()}
          </span>
          <button
            type="button"
            onClick={() => openNewEntry(dateKey)}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 18, height: 18, background: UI.stone, color: UI.inkSoft }}
            aria-label="Add a post to this day"
          >
            <Plus size={11} />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {visible.map((entry) => {
            const t = typeInfo(entry.type);
            return (
              <button
                key={entry.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", entry.id);
                  e.dataTransfer.effectAllowed = "move";
                  setDraggingId(entry.id);
                }}
                onDragEnd={() => { setDraggingId(null); setDragOverDate(null); }}
                onClick={() => openEditEntry(entry)}
                className="text-left rounded-lg transition"
                style={{
                  background: mixWithWhite(t.color, 0.85),
                  padding: "0.4rem 0.55rem",
                  fontSize: "0.72rem",
                  lineHeight: 1.3,
                  opacity: draggingId === entry.id ? 0.4 : 1,
                  cursor: "grab",
                }}
              >
                <span className="flex items-center gap-1.5">
                  <span className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: t.color }} />
                  <span
                    className="truncate font-semibold"
                    style={{ textDecoration: entry.done ? "line-through" : "none", color: entry.done ? UI.inkSoft : UI.ink }}
                  >
                    {entry.title}
                  </span>
                </span>
                <span className="block truncate" style={{ color: UI.inkSoft, marginLeft: "0.9rem" }}>
                  {entry.time ? `${entry.time} · ` : ""}{entry.done ? "Posted" : "Planned"}
                </span>
              </button>
            );
          })}
          {overflow > 0 && (
            <span className="font-body px-1.5" style={{ fontSize: "0.68rem", color: UI.inkSoft }}>+{overflow} more</span>
          )}
          {suggestion && (
            <button
              type="button"
              onClick={() => openSuggestion(dateKey, suggestion)}
              className="text-left rounded-lg transition"
              style={{
                border: `1px dashed ${UI.line}`,
                padding: "0.4rem 0.55rem",
                fontSize: "0.7rem",
                lineHeight: 1.3,
                color: UI.inkSoft,
              }}
            >
              <span className="block truncate italic">✨ {suggestion.title}</span>
              <span className="block font-mono" style={{ fontSize: "0.6rem", letterSpacing: "0.03em" }}>SUGGESTED</span>
            </button>
          )}
          {isEmpty && (
            <button
              type="button"
              onClick={() => openNewEntry(dateKey)}
              className="opacity-0 group-hover:opacity-100 transition text-center rounded-lg border border-dashed font-body text-xs font-semibold"
              style={{ borderColor: UI.line, color: UI.inkSoft, padding: "0.4rem 0" }}
            >
              + Add post
            </button>
          )}
        </div>
      </div>
    );
  };

  // ---- Day view data ----
  const dayKey = toDateKey(focusDate);
  const dayEntries = (entriesByDate[dayKey] || []).filter((e) => activeFilters.has(e.type));
  const daySuggestion = dayEntries.length === 0 && dayKey >= todayKey ? suggestionForDate(focusDate) : null;

  return (
    <div className="min-h-screen" style={{ background: UI.page, color: UI.ink }}>
      <TopNav active="calendar" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-10">
        <div className="mb-4 sm:mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold" style={{ color: UI.ink, fontSize: "1.85rem" }}>Content Planner</h1>
            <p className="font-body text-sm mt-1" style={{ color: UI.inkSoft }}>Plan your content, stay consistent, and always know what's next — publishing still happens on your social platforms.</p>
          </div>
          <button
            type="button"
            onClick={() => openNewEntry(todayKey)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-body font-semibold text-sm transition flex-shrink-0"
            style={{ background: ACCENT, color: WHITE }}
          >
            <Plus size={15} /> Plan a post
          </button>
        </div>

        {/* MONTH-AT-A-GLANCE + CONTENT MIX */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className="rounded-2xl border p-4" style={{ borderColor: UI.line, background: UI.card, boxShadow: "0 1px 3px rgba(27,36,48,0.05)" }}>
            <h3 className="font-body text-sm font-semibold mb-2" style={{ color: UI.ink }}>Your month</h3>
            <ul className="font-body text-sm grid gap-1" style={{ color: UI.inkSoft }}>
              <li>{mixTotal} post{mixTotal === 1 ? "" : "s"} planned</li>
              <li>
                <button
                  type="button"
                  onClick={() => isolateFilter("listing")}
                  className="text-left underline-offset-2 hover:underline"
                  style={{ color: activeFilters.size === 1 && activeFilters.has("listing") ? UI.ink : UI.inkSoft, fontWeight: activeFilters.size === 1 && activeFilters.has("listing") ? 700 : 400 }}
                >
                  {monthListingCount} listing post{monthListingCount === 1 ? "" : "s"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => isolateFilter("community")}
                  className="text-left underline-offset-2 hover:underline"
                  style={{ color: activeFilters.size === 1 && activeFilters.has("community") ? UI.ink : UI.inkSoft, fontWeight: activeFilters.size === 1 && activeFilters.has("community") ? 700 : 400 }}
                >
                  {monthCommunityCount} community post{monthCommunityCount === 1 ? "" : "s"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setHighlightOpenDays((s) => !s)}
                  className="text-left underline-offset-2 hover:underline"
                  style={{ color: highlightOpenDays ? ACCENT : UI.inkSoft, fontWeight: highlightOpenDays ? 700 : 400 }}
                >
                  {monthOpenDays.length} open day{monthOpenDays.length === 1 ? "" : "s"}
                </button>
              </li>
            </ul>
            <button
              type="button"
              onClick={fillMonth}
              disabled={monthOpenDays.length === 0}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg font-body text-sm font-semibold transition disabled:opacity-40"
              style={{ background: ACCENT, color: WHITE }}
            >
              ✨ Fill my month
            </button>
            <p className="font-body text-xs mt-2" style={{ color: UI.inkSoft }}>Leaves Saturdays open — add your open houses once you know them.</p>
          </div>

          <div className="rounded-2xl border p-4" style={{ borderColor: UI.line, background: UI.card, boxShadow: "0 1px 3px rgba(27,36,48,0.05)" }}>
            <h3 className="font-body text-sm font-semibold mb-2" style={{ color: UI.ink }}>{MONTH_NAMES[month]} content mix</h3>
            {mixTotal === 0 ? (
              <p className="font-body text-sm" style={{ color: UI.inkSoft }}>No posts logged yet this month.</p>
            ) : (
              <>
                <div className="flex rounded-full overflow-hidden mb-2" style={{ height: 8, background: UI.stone }}>
                  {mixCounts.filter((t) => t.count > 0).map((t) => (
                    <span key={t.key} style={{ width: `${(t.count / mixTotal) * 100}%`, background: t.color }} />
                  ))}
                </div>
                <p className="font-body text-sm" style={{ color: UI.inkSoft }}>
                  {mixCounts.filter((t) => t.count > 0).map((t) => `${t.label} ${Math.round((t.count / mixTotal) * 100)}%`).join(" · ")}
                </p>
                <p className="font-mono mt-2" style={{ fontSize: "0.68rem", color: UI.inkSoft, letterSpacing: "0.02em" }}>
                  Suggested: {POST_TYPES.map((t) => `${Math.round(TARGET_MIX[t.key] * 100)}% ${t.label}`).join(" · ")}
                </p>
                {mixTip && (
                  <div className="mt-2">
                    <p className="font-body text-xs mb-2" style={{ color: UI.ink }}>{mixTip}</p>
                    <button
                      type="button"
                      onClick={() => openNewEntry(todayKey, { type: mixAddType })}
                      className="px-3 py-1.5 rounded-lg border font-body text-xs font-semibold transition"
                      style={{ borderColor: ACCENT, color: ACCENT }}
                    >
                      Add a {typeInfo(mixAddType).label} post
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* NAV + VIEW SWITCHER + FILTERS */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: UI.stone }}>
              {VIEW_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  className="px-3 py-1.5 rounded-full font-body text-xs font-semibold capitalize transition"
                  style={{
                    background: viewMode === m ? UI.card : "transparent",
                    color: viewMode === m ? UI.ink : UI.inkSoft,
                    boxShadow: viewMode === m ? "0 1px 3px rgba(27,36,48,0.15)" : "none",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={goPrev} className="p-2 rounded-lg border transition" style={{ borderColor: UI.line }} aria-label="Previous">
                <ChevronLeft size={16} color={UI.ink} />
              </button>
              <h2 className="font-body text-base font-semibold text-center" style={{ color: UI.ink, minWidth: "9rem" }}>
                {headerLabel}
              </h2>
              <button type="button" onClick={goNext} className="p-2 rounded-lg border transition" style={{ borderColor: UI.line }} aria-label="Next">
                <ChevronRight size={16} color={UI.ink} />
              </button>
              <button type="button" onClick={goToday} className="ml-1 px-3 py-1.5 rounded-lg border font-body text-xs font-semibold transition" style={{ borderColor: UI.line, color: UI.ink }}>
                Today
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {POST_TYPES.map((t) => {
              const active = activeFilters.has(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => toggleFilter(t.key)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-body text-xs font-semibold transition"
                  style={{
                    borderColor: active ? t.color : UI.line,
                    background: active ? mixWithWhite(t.color, 0.88) : "transparent",
                    color: active ? UI.ink : UI.inkSoft,
                  }}
                >
                  <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: t.color }} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* LEFT PANEL + CALENDAR */}
        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* LEFT PANEL */}
          <div className="grid gap-4 order-2 lg:order-1">
            <div className="rounded-2xl border p-4" style={{ borderColor: UI.line, background: UI.card, boxShadow: "0 1px 3px rgba(27,36,48,0.05)" }}>
              <h3 className="font-body text-sm font-semibold" style={{ color: UI.ink }}>Upcoming events</h3>
              <p className="font-body text-xs mt-0.5 mb-3" style={{ color: UI.inkSoft }}>Don't miss scheduled posts</p>
              {upNext.length === 0 ? (
                <p className="font-body text-xs" style={{ color: UI.inkSoft }}>Nothing planned yet — pick a day on the calendar to get started.</p>
              ) : (
                <ul className="grid gap-3">
                  {upNext.map((entry) => {
                    const t = typeInfo(entry.type);
                    const label = new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    return (
                      <li key={entry.id}>
                        <button type="button" onClick={() => openEditEntry(entry)} className="text-left w-full">
                          <span className="flex items-center gap-1.5">
                            <span className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: t.color }} />
                            <span className="font-mono" style={{ fontSize: "0.68rem", color: UI.inkSoft }}>{label}{entry.time ? ` · ${entry.time}` : ""}</span>
                          </span>
                          <span
                            className="block font-body text-sm font-semibold mt-0.5"
                            style={{ marginLeft: "0.9rem", color: UI.ink, textDecoration: entry.done ? "line-through" : "none" }}
                          >
                            {entry.title}
                          </span>
                          <span className="block font-body text-xs" style={{ marginLeft: "0.9rem", color: UI.inkSoft }}>{t.label} post</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {savedIdeas.length > 0 && (
              <div className="rounded-2xl border p-4" style={{ borderColor: UI.line, background: UI.card, boxShadow: "0 1px 3px rgba(27,36,48,0.05)" }}>
                <h3 className="font-body text-sm font-semibold mb-1" style={{ color: UI.ink }}>Saved ideas</h3>
                <p className="font-body text-xs mb-3" style={{ color: UI.inkSoft }}>Not scheduled yet — click one to give it a date.</p>
                <ul className="grid gap-2">
                  {savedIdeas.map((entry) => {
                    const t = typeInfo(entry.type);
                    return (
                      <li key={entry.id}>
                        <button type="button" onClick={() => openEditEntry(entry)} className="text-left w-full font-body text-xs" style={{ color: UI.ink }}>
                          {t.emoji} {entry.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border p-4" style={{ borderColor: UI.line, background: UI.card, boxShadow: "0 1px 3px rgba(27,36,48,0.05)" }}>
              <h3 className="font-body text-sm font-semibold mb-3" style={{ color: UI.ink }}>Ideas for this month</h3>
              {monthIdeas.length === 0 ? (
                monthOpenDays.length === 0 ? (
                  <div>
                    <p className="font-body text-sm font-semibold" style={{ color: UI.ink }}>You're covered this month ✓</p>
                    <p className="font-body text-xs mt-1 mb-3" style={{ color: UI.inkSoft }}>Want to get ahead?</p>
                    <button
                      type="button"
                      onClick={fillNextMonth}
                      className="px-3 py-1.5 rounded-lg border font-body text-xs font-semibold transition"
                      style={{ borderColor: ACCENT, color: ACCENT }}
                    >
                      Plan next month
                    </button>
                  </div>
                ) : (
                  <p className="font-body text-xs" style={{ color: UI.inkSoft }}>No specific ideas for your open days — try "Fill my month" above.</p>
                )
              ) : (
                <ul className="grid gap-2">
                  {monthIdeas.map(({ date, suggestion }) => {
                    const dateKey = toDateKey(date);
                    const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    return (
                      <li key={dateKey}>
                        <button type="button" onClick={() => openSuggestion(dateKey, suggestion)} className="text-left w-full font-body text-xs" style={{ color: UI.inkSoft }}>
                          <span className="font-mono font-semibold">{label}</span>{" — "}✨ {suggestion.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* CALENDAR */}
          <div className="rounded-2xl border overflow-hidden order-1 lg:order-2" style={{ borderColor: UI.line, background: UI.card, boxShadow: "0 1px 3px rgba(27,36,48,0.05)" }}>
            {viewMode === "day" ? (
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-body text-sm font-semibold" style={{ color: UI.ink }}>
                    {dayEntries.length} post{dayEntries.length === 1 ? "" : "s"} planned
                  </h3>
                  <button
                    type="button"
                    onClick={() => openNewEntry(dayKey)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition"
                    style={{ background: ACCENT, color: WHITE }}
                  >
                    <Plus size={13} /> Add post
                  </button>
                </div>
                {dayEntries.length === 0 && !daySuggestion && (
                  <p className="font-body text-sm mb-2" style={{ color: UI.inkSoft }}>Nothing planned for this day yet.</p>
                )}
                <div className="grid gap-2">
                  {dayEntries.map((entry) => {
                    const t = typeInfo(entry.type);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => openEditEntry(entry)}
                        className="text-left rounded-xl p-3 transition"
                        style={{ background: mixWithWhite(t.color, 0.85) }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: t.color }} />
                          <span
                            className="font-body text-sm font-semibold"
                            style={{ color: entry.done ? UI.inkSoft : UI.ink, textDecoration: entry.done ? "line-through" : "none" }}
                          >
                            {entry.title}
                          </span>
                        </span>
                        <span className="block font-body text-xs mt-1" style={{ marginLeft: "1.25rem", color: UI.inkSoft }}>
                          {t.label} post{entry.time ? ` · ${entry.time}` : ""} · {entry.done ? "Posted" : "Planned"}
                        </span>
                      </button>
                    );
                  })}
                  {daySuggestion && dayEntries.length === 0 && (
                    <button
                      type="button"
                      onClick={() => openSuggestion(dayKey, daySuggestion)}
                      className="text-left rounded-xl p-3 transition"
                      style={{ border: `1px dashed ${UI.line}`, color: UI.inkSoft }}
                    >
                      <span className="block italic">✨ {daySuggestion.title}</span>
                      <span className="block font-mono mt-0.5" style={{ fontSize: "0.68rem", letterSpacing: "0.03em" }}>SUGGESTED</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${UI.line}` }}>
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="py-2 text-center font-mono text-xs font-semibold" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>
                      {w.slice(0, 3).toUpperCase()}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {viewMode === "week"
                    ? viewWeekDays.map((date, i) => renderCell(date, true, i, true))
                    : monthCells.map(({ date, inMonth }, i) => renderCell(date, inMonth, i, false))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {editing && (
        <EntryModal
          editing={editing}
          setEditing={setEditing}
          onSave={saveEntry}
          onDelete={editing.id ? deleteEntry : null}
          onCreatePost={createPost}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EntryModal({ editing, setEditing, onSave, onDelete, onCreatePost, onClose }) {
  const dateLabel = new Date(`${editing.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(27,36,48,0.45)", zIndex: 100 }}
      onClick={onClose}
    >
      <div
        className="rounded-lg w-full"
        style={{ maxWidth: 420, background: UI.card, boxShadow: "0 20px 50px rgba(27,36,48,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="font-display font-bold text-base" style={{ color: UI.ink }}>{editing.id ? "Edit post" : "Plan a post"}</h2>
            <p className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>{dateLabel}</p>
          </div>
          <button onClick={onClose} style={{ color: UI.inkSoft }} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="px-6 py-4 grid gap-4">
          <label className="block">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>TITLE</span>
            <input
              className="input"
              value={editing.title}
              onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
              placeholder="419 Tall Oaks Dr — Just Listed"
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>DATE</span>
              <input
                type="date"
                className="input"
                value={editing.date}
                onChange={(e) => setEditing((f) => ({ ...f, date: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>TIME (optional)</span>
              <input
                className="input"
                value={editing.time}
                onChange={(e) => setEditing((f) => ({ ...f, time: e.target.value }))}
                placeholder="10 AM"
              />
            </label>
          </div>

          <div>
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>TYPE</span>
            <div className="grid grid-cols-3 gap-2">
              {POST_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setEditing((f) => ({ ...f, type: t.key }))}
                  className="flex items-center justify-center gap-1.5 p-2 rounded border font-body text-xs font-semibold transition"
                  style={{ borderColor: editing.type === t.key ? t.color : UI.line, background: editing.type === t.key ? mixWithWhite(t.color, 0.88) : "transparent" }}
                >
                  <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>NOTES (optional)</span>
            <textarea
              className="input"
              rows={3}
              value={editing.notes}
              onChange={(e) => setEditing((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Open house at 11am, remember the new sign photo"
            />
          </label>

          {editing.id && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!editing.done}
                onChange={(e) => setEditing((f) => ({ ...f, done: e.target.checked }))}
                className="flex-shrink-0"
              />
              <span className="font-body text-sm" style={{ color: UI.ink }}>Mark as posted</span>
            </label>
          )}
        </div>

        <div className="px-6 pb-5 grid gap-2">
          <button
            type="button"
            onClick={onCreatePost}
            disabled={!editing.title.trim()}
            className="w-full py-2.5 rounded-lg border font-body font-semibold text-sm transition disabled:opacity-50"
            style={{ borderColor: ACCENT, color: ACCENT }}
          >
            Create this post →
          </button>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 py-2.5 px-3 rounded-lg border font-body text-xs font-semibold transition"
                style={{ borderColor: UI.line, color: "#C0392B" }}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={!editing.title.trim()}
              className="flex-1 py-2.5 rounded-lg font-body font-semibold text-sm transition disabled:opacity-50"
              style={{ background: ACCENT, color: WHITE }}
            >
              {editing.id ? "Save changes" : "Add to calendar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

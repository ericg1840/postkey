import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Sparkles } from "lucide-react";
import { UI, ACCENT, WHITE, mixWithWhite, TopNav, writePostHandoff } from "./shared.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

// Purely a planning/tracking calendar — PostKey has no social API
// integration, so nothing here actually publishes anything. It just helps
// people decide what to post and when, then remember whether they did.
const STORAGE_KEY = "postkey_calendar_entries";

const POST_TYPES = [
  { key: "listing", label: "Listing", color: "#0043FF", emoji: "🏡" },
  { key: "community", label: "Community", color: "#E0298C", emoji: "📍" },
  { key: "other", label: "Other", color: "#697386", emoji: "💬" },
];
const typeInfo = (key) => POST_TYPES.find((t) => t.key === key) || POST_TYPES[2];

// A light, rotating pool of post ideas sprinkled onto open days so a month
// with nothing planned yet still feels useful — these are prompts, not
// real posts, and are styled dashed/muted in the grid to make that obvious.
const SUGGESTIONS = [
  { title: "Local Favorite", type: "community" },
  { title: "Seller Tip", type: "community" },
  { title: "Weekend Open House", type: "listing" },
  { title: "Home Maintenance", type: "community" },
  { title: "Client Love", type: "community" },
];

// Deterministic (not random) so a suggestion doesn't jump around on every
// re-render — every 4th day of the month cycles through the pool.
function suggestionForDate(date) {
  const day = date.getDate();
  if (day % 4 !== 1) return null;
  return SUGGESTIONS[Math.floor(day / 4) % SUGGESTIONS.length];
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable (private browsing, etc) — entries just won't persist across refreshes.
  }
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

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function CalendarTool({ onSwitchTool, onGoHome }) {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState(() => loadEntries());
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [editing, setEditing] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [activeFilters, setActiveFilters] = useState(() => new Set(POST_TYPES.map((t) => t.key)));

  // Writes localStorage synchronously instead of via a useEffect on
  // `entries`: createPost immediately switches tools in the same update,
  // which unmounts this component before a state-driven effect would get
  // a chance to run, silently dropping the save.
  const commitEntries = (next) => {
    setEntries(next);
    saveEntries(next);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();
  const todayKey = toDateKey(today);

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Always 42 cells (6 full weeks) so the grid height never jumps between months.
  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ date: new Date(year, month, i - startWeekday + 1), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month, cells.length - startWeekday + 1), inMonth: false });
  }

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

  const goPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => { const d = new Date(); d.setDate(1); setViewDate(d); };

  const openNewEntry = (dateKey, overrides = {}) => setEditing({ date: dateKey, title: "", type: "listing", notes: "", time: "", done: false, ...overrides });
  const openEditEntry = (entry) => setEditing({ time: "", ...entry });
  const openSuggestion = (dateKey, suggestion) => openNewEntry(dateKey, { title: suggestion.title, type: suggestion.type });

  const upsert = (prev, entry) => (
    entry.id
      ? prev.map((e) => (e.id === entry.id ? entry : e))
      : [...prev, { ...entry, id: genId() }]
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

  // ---- Week-at-a-glance: the real calendar week containing today, not
  // necessarily the month currently being viewed. ----
  const weekStart = addDays(today, -today.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEntries = weekDays.flatMap((d) => entriesByDate[toDateKey(d)] || []);
  const weekListingCount = weekEntries.filter((e) => e.type === "listing").length;
  const weekCommunityCount = weekEntries.filter((e) => e.type === "community").length;
  const openDayCount = weekDays.filter((d) => (entriesByDate[toDateKey(d)] || []).length === 0).length;

  // Turns this week's still-empty days into real, saved entries drawn from
  // the suggestion pool — an instant balanced week instead of a blank one.
  const fillWeek = () => {
    let idx = 0;
    const additions = [];
    weekDays.forEach((d) => {
      const dateKey = toDateKey(d);
      if (dateKey < todayKey) return;
      if ((entriesByDate[dateKey] || []).length > 0) return;
      const sugg = SUGGESTIONS[idx % SUGGESTIONS.length];
      idx += 1;
      additions.push({ id: genId(), date: dateKey, title: sugg.title, type: sugg.type, notes: "", time: "", done: false });
    });
    if (additions.length) commitEntries([...entries, ...additions]);
  };

  // ---- Content mix for the viewed month ----
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEntries = entries.filter((e) => e.date.startsWith(monthPrefix));
  const mixCounts = POST_TYPES.map((t) => ({ ...t, count: monthEntries.filter((e) => e.type === t.key).length }));
  const mixTotal = monthEntries.length;
  let mixTip = null;
  if (mixTotal >= 3) {
    const top = mixCounts.reduce((a, b) => (b.count > a.count ? b : a), mixCounts[0]);
    if (top.count / mixTotal >= 0.6) {
      const other = mixCounts.find((t) => t.key !== top.key && t.count <= top.count) || mixCounts.find((t) => t.key !== top.key);
      mixTip = `You've posted mostly ${top.label} lately — try adding a ${other.label} post this week.`;
    }
  }

  // ---- Sidebar: what's coming up, and what's still unplanned this week ----
  const upNext = entries.filter((e) => e.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const weekIdeas = weekDays
    .filter((d) => toDateKey(d) >= todayKey)
    .map((d) => ({ date: d, suggestion: suggestionForDate(d) }))
    .filter(({ date, suggestion }) => suggestion && (entriesByDate[toDateKey(date)] || []).length === 0)
    .slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: UI.stone, color: UI.ink }}>
      <TopNav active="calendar" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-10">
        <div className="mb-4 sm:mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold" style={{ color: UI.ink, fontSize: "1.85rem" }}>Content Planner</h1>
            <p className="font-body text-sm mt-1" style={{ color: UI.inkSoft }}>Here's your plan for the month — this tracks it, it doesn't publish anything for you.</p>
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

        {/* WEEK-AT-A-GLANCE + CONTENT MIX */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className="rounded-2xl border p-4" style={{ borderColor: UI.line, background: UI.card }}>
            <h3 className="font-body text-sm font-semibold mb-2" style={{ color: UI.ink }}>Your week</h3>
            <ul className="font-body text-sm grid gap-1" style={{ color: UI.inkSoft }}>
              <li>{weekEntries.length} post{weekEntries.length === 1 ? "" : "s"} planned</li>
              <li>{weekListingCount} listing post{weekListingCount === 1 ? "" : "s"}</li>
              <li>{weekCommunityCount} community post{weekCommunityCount === 1 ? "" : "s"}</li>
              <li>{openDayCount} open day{openDayCount === 1 ? "" : "s"}</li>
            </ul>
            <button
              type="button"
              onClick={fillWeek}
              disabled={openDayCount === 0}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-body text-xs font-semibold transition disabled:opacity-40"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              <Sparkles size={13} /> Fill my week
            </button>
          </div>

          <div className="rounded-2xl border p-4" style={{ borderColor: UI.line, background: UI.card }}>
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
                {mixTip && <p className="font-body text-xs mt-2" style={{ color: UI.ink }}>{mixTip}</p>}
              </>
            )}
          </div>
        </div>

        {/* MONTH NAV + FILTERS */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={goPrevMonth} className="p-2 rounded-lg border transition" style={{ borderColor: UI.line }} aria-label="Previous month">
              <ChevronLeft size={16} color={UI.ink} />
            </button>
            <h2 className="font-body text-base font-semibold text-center" style={{ color: UI.ink, minWidth: "9rem" }}>
              {MONTH_NAMES[month]} {year}
            </h2>
            <button type="button" onClick={goNextMonth} className="p-2 rounded-lg border transition" style={{ borderColor: UI.line }} aria-label="Next month">
              <ChevronRight size={16} color={UI.ink} />
            </button>
            <button type="button" onClick={goToday} className="ml-1 px-3 py-1.5 rounded-lg border font-body text-xs font-semibold transition" style={{ borderColor: UI.line, color: UI.ink }}>
              Today
            </button>
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

        {/* CALENDAR + SIDEBAR */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: UI.line, background: UI.card }}>
            <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${UI.line}` }}>
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-2 text-center font-mono text-xs font-semibold" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>
                  {w.slice(0, 3).toUpperCase()}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map(({ date, inMonth }, i) => {
                const dateKey = toDateKey(date);
                const dayEntries = (entriesByDate[dateKey] || []).filter((e) => activeFilters.has(e.type));
                const isToday = dateKey === todayKey;
                const visible = dayEntries.slice(0, 3);
                const overflow = dayEntries.length - visible.length;
                const isDragOver = dragOverDate === dateKey;
                const suggestion = inMonth && dayEntries.length === 0 && dateKey >= todayKey ? suggestionForDate(date) : null;
                return (
                  <div
                    key={i}
                    className="group relative p-1.5 sm:p-2 flex flex-col gap-1"
                    style={{
                      minHeight: "7.5rem",
                      borderRight: (i + 1) % 7 !== 0 ? `1px solid ${UI.line}` : "none",
                      borderTop: i >= 7 ? `1px solid ${UI.line}` : "none",
                      background: isDragOver ? mixWithWhite(ACCENT, 0.92) : inMonth ? UI.card : UI.stone,
                      boxShadow: isDragOver ? `inset 0 0 0 2px ${ACCENT}` : "none",
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
                          width: 22, height: 22,
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
                    <div className="flex flex-col gap-1">
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
                            className="text-left rounded px-1.5 py-1 font-body transition"
                            style={{
                              background: mixWithWhite(t.color, 0.85),
                              fontSize: "0.7rem",
                              lineHeight: 1.25,
                              textDecoration: entry.done ? "line-through" : "none",
                              color: entry.done ? UI.inkSoft : UI.ink,
                              opacity: draggingId === entry.id ? 0.4 : 1,
                              cursor: "grab",
                            }}
                          >
                            <span className="block truncate font-semibold">{t.emoji} {entry.title}</span>
                            {entry.time && <span className="block truncate" style={{ color: UI.inkSoft }}>{entry.time}</span>}
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
                          className="text-left rounded px-1.5 py-1 font-body transition"
                          style={{
                            border: `1px dashed ${UI.line}`,
                            fontSize: "0.68rem",
                            lineHeight: 1.25,
                            color: UI.inkSoft,
                            fontStyle: "italic",
                          }}
                        >
                          ✨ {suggestion.title}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="grid gap-4">
            <div className="rounded-2xl border p-4" style={{ borderColor: UI.line, background: UI.card }}>
              <h3 className="font-body text-sm font-semibold mb-3" style={{ color: UI.ink }}>Up next</h3>
              {upNext.length === 0 ? (
                <p className="font-body text-xs" style={{ color: UI.inkSoft }}>Nothing planned yet — pick a day on the calendar to get started.</p>
              ) : (
                <ul className="grid gap-2">
                  {upNext.map((entry) => {
                    const t = typeInfo(entry.type);
                    const label = new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    return (
                      <li key={entry.id}>
                        <button type="button" onClick={() => openEditEntry(entry)} className="text-left w-full font-body text-xs" style={{ color: UI.ink }}>
                          <span className="font-mono font-semibold" style={{ color: UI.inkSoft }}>{label}</span>{" — "}
                          {t.emoji} {entry.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: UI.line, background: UI.card }}>
              <h3 className="font-body text-sm font-semibold mb-3" style={{ color: UI.ink }}>Ideas for this week</h3>
              {weekIdeas.length === 0 ? (
                <p className="font-body text-xs" style={{ color: UI.inkSoft }}>You're all set for this week.</p>
              ) : (
                <ul className="grid gap-2">
                  {weekIdeas.map(({ date, suggestion }) => {
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

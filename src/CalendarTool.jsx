import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";
import { UI, ACCENT, WHITE, mixWithWhite, TopNav, writePostHandoff } from "./shared.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

// Purely a planning/tracking calendar — PostKey has no social API
// integration, so nothing here actually publishes anything. It just helps
// people decide what to post and when, then remember whether they did.
const STORAGE_KEY = "postkey_calendar_entries";

const POST_TYPES = [
  { key: "listing", label: "Listing", color: "#0043FF" },
  { key: "community", label: "Community", color: "#E0298C" },
  { key: "other", label: "Other", color: "#697386" },
];
const typeInfo = (key) => POST_TYPES.find((t) => t.key === key) || POST_TYPES[2];

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
  const todayKey = toDateKey(new Date());

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

  const goPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => { const d = new Date(); d.setDate(1); setViewDate(d); };

  const openNewEntry = (dateKey) => setEditing({ date: dateKey, title: "", type: "listing", notes: "", done: false });
  const openEditEntry = (entry) => setEditing({ ...entry });

  const upsert = (prev, entry) => (
    entry.id
      ? prev.map((e) => (e.id === entry.id ? entry : e))
      : [...prev, { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }]
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

  return (
    <div className="min-h-screen" style={{ background: UI.stone, color: UI.ink }}>
      <TopNav active="calendar" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-10">
        <div className="mb-4 sm:mb-6">
          <h1 className="font-display font-bold" style={{ color: UI.ink, fontSize: "1.85rem" }}>Posting Calendar</h1>
          <p className="font-body text-sm mt-1" style={{ color: UI.inkSoft }}>Plan what you'll post and when — this tracks your plan, it doesn't publish anything for you.</p>
        </div>

        {/* MONTH NAV */}
        <div className="flex items-center justify-between mb-4 sm:mb-5 flex-wrap gap-3">
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
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {POST_TYPES.map((t) => (
              <div key={t.key} className="flex items-center gap-1.5">
                <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: t.color }} />
                <span className="font-body text-xs" style={{ color: UI.inkSoft }}>{t.label}</span>
              </div>
            ))}
            <button type="button" onClick={goToday} className="px-3 py-1.5 rounded-lg border font-body text-xs font-semibold transition" style={{ borderColor: UI.line, color: UI.ink }}>
              Today
            </button>
          </div>
        </div>

        {/* CALENDAR GRID */}
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
              const dayEntries = entriesByDate[dateKey] || [];
              const isToday = dateKey === todayKey;
              const visible = dayEntries.slice(0, 3);
              const overflow = dayEntries.length - visible.length;
              const isDragOver = dragOverDate === dateKey;
              return (
                <div
                  key={i}
                  className="group relative p-1.5 sm:p-2 flex flex-col gap-1"
                  style={{
                    minHeight: "5.75rem",
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
                          className="text-left rounded px-1.5 py-1 font-body transition flex items-center gap-1"
                          style={{
                            background: mixWithWhite(t.color, 0.85),
                            fontSize: "0.68rem",
                            lineHeight: 1.15,
                            textDecoration: entry.done ? "line-through" : "none",
                            color: entry.done ? UI.inkSoft : UI.ink,
                            opacity: draggingId === entry.id ? 0.4 : 1,
                            cursor: "grab",
                          }}
                        >
                          <span className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: t.color }} />
                          <span className="truncate">{entry.title}</span>
                        </button>
                      );
                    })}
                    {overflow > 0 && (
                      <span className="font-body px-1.5" style={{ fontSize: "0.68rem", color: UI.inkSoft }}>+{overflow} more</span>
                    )}
                  </div>
                </div>
              );
            })}
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

          <label className="block">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>DATE</span>
            <input
              type="date"
              className="input"
              value={editing.date}
              onChange={(e) => setEditing((f) => ({ ...f, date: e.target.value }))}
            />
          </label>

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

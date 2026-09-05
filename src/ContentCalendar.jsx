import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Sparkles, Info, X, Pencil, Trash2 } from "lucide-react";
import { UI, ACCENT, WHITE, mixWithWhite, TopNav, writePostHandoff } from "./shared.jsx";
import { useAuth, api } from "./auth/AuthContext.jsx";

// Purely a planning/tracking calendar — PostKey has no social API
// integration, so nothing here actually publishes anything. It just helps
// an agent decide what to post and when.

const CATEGORIES = {
  community: { label: "Community", color: "#0F9D58" },
  listing: { label: "Listing", color: ACCENT },
  promo: { label: "Promo", color: "#E8792E" },
  bts: { label: "Behind the scenes", color: "#7B3FE4" },
};
const CATEGORY_KEYS = Object.keys(CATEGORIES);
// Only these two categories map to a tool PostKey can actually build the
// post in — Promo/Behind-the-scenes have nowhere to hand off to yet.
const HANDOFF_TOOL = { listing: "listings", community: "community" };
const HANDOFF_FIELD = { listing: "address", community: "subject" };

function pad2(n) { return String(n).padStart(2, "0"); }
function toDateKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function monthKeyOf(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

function formatDay(iso, todayKey) {
  const d = new Date(iso + "T00:00:00");
  return {
    num: `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getDate()}`,
    dow: iso === todayKey ? "Today" : d.toLocaleDateString("en-US", { weekday: "long" }),
  };
}

function CategoryDot({ category, size = 8 }) {
  const c = CATEGORIES[category] || CATEGORIES.community;
  return (
    <span className="inline-block rounded-full flex-shrink-0" style={{ width: size, height: size, backgroundColor: c.color }} />
  );
}

export function ContentCalendar({ onSwitchTool, onGoHome }) {
  const { user, logout } = useAuth();
  const [view, setView] = useState("agenda");
  const [focusMonth, setFocusMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [autofillNoteOpen, setAutofillNoteOpen] = useState(false);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  const today = new Date();
  const todayKey = toDateKey(today);
  const monthKey = monthKeyOf(focusMonth);

  const loadPosts = useCallback(async () => {
    try {
      const data = await api(`/api/content/posts?month=${monthKey}`);
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message || "Couldn't load your content calendar.");
    }
  }, [monthKey]);

  const loadIdeas = useCallback(async () => {
    try {
      const data = await api("/api/content/ideas");
      setIdeas(data.ideas || []);
    } catch {
      // Ideas are a secondary panel — a failed load there shouldn't block the calendar itself.
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([loadPosts(), loadIdeas()]).finally(() => setLoading(false));
  }, [loadPosts, loadIdeas]);

  const confirmedPosts = useMemo(() => posts.filter((p) => p.status === "confirmed"), [posts]);
  const confirmedCount = confirmedPosts.length;

  const daysInMonth = new Date(focusMonth.getFullYear(), focusMonth.getMonth() + 1, 0).getDate();
  const monthDayDates = Array.from({ length: daysInMonth }, (_, i) => new Date(focusMonth.getFullYear(), focusMonth.getMonth(), i + 1));
  const openDaysCount = monthDayDates.filter((d) => toDateKey(d) >= todayKey && !posts.some((p) => p.date === toDateKey(d))).length;

  const breakdown = useMemo(() => {
    const counts = {};
    confirmedPosts.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count, pct: Math.round((count / total) * 100) }));
  }, [confirmedPosts]);
  const topCategory = breakdown[0]?.category;

  async function runAutofill() {
    setAutofillNoteOpen(true);
    setAutofillLoading(true);
    try {
      await api("/api/content/autofill", { method: "POST", body: JSON.stringify({ month: monthKey }) });
      await loadPosts();
    } catch (err) {
      setError(err.message || "Couldn't generate suggestions.");
    } finally {
      setAutofillLoading(false);
    }
  }

  async function confirmSuggested(id) {
    const prev = posts;
    setPosts((cur) => cur.map((p) => (p.id === id ? { ...p, status: "confirmed" } : p)));
    try {
      await api(`/api/content/posts?id=${id}`, { method: "PATCH", body: JSON.stringify({ status: "confirmed" }) });
    } catch (err) {
      setPosts(prev);
      setError(err.message || "Couldn't confirm that post.");
    }
  }

  async function dismissSuggested(id) {
    const prev = posts;
    setPosts((cur) => cur.filter((p) => p.id !== id));
    try {
      await api(`/api/content/posts?id=${id}`, { method: "DELETE" });
    } catch (err) {
      setPosts(prev);
      setError(err.message || "Couldn't dismiss that post.");
    }
  }

  async function addIdeaToPlan(idea) {
    const prevIdeas = ideas;
    setIdeas((cur) => cur.filter((i) => i.id !== idea.id));
    try {
      const data = await api(`/api/content/ideas?id=${idea.id}`, { method: "PATCH" });
      setPosts((cur) => [...cur, data.post]);
    } catch (err) {
      setIdeas(prevIdeas);
      setError(err.message || "Couldn't add that idea to your plan.");
    }
  }

  const agendaDates = monthDayDates.filter((d) => toDateKey(d) >= (monthKey === monthKeyOf(today) ? todayKey : "0000-00-00"));
  const days = agendaDates.map((date) => {
    const dateKey = toDateKey(date);
    return { date: dateKey, ...formatDay(dateKey, todayKey), posts: posts.filter((p) => p.date === dateKey) };
  });

  function openNewPost(dateKey) {
    setEditing({ date: dateKey || todayKey, title: "", category: "listing" });
  }
  function openEditPost(post) {
    setEditing({ ...post });
  }

  async function savePost() {
    if (!editing.title.trim()) return;
    try {
      if (editing.id) {
        await api(`/api/content/posts?id=${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: editing.title.trim(), date: editing.date, category: editing.category, posted: !!editing.posted }),
        });
      } else {
        const data = await api("/api/content/posts", {
          method: "POST",
          body: JSON.stringify({ date: editing.date, title: editing.title.trim(), category: editing.category, status: "confirmed" }),
        });
        setPosts((cur) => [...cur, data.post]);
      }
      setEditing(null);
      loadPosts();
    } catch (err) {
      setError(err.message || "Couldn't save that post.");
    }
  }

  async function deletePost() {
    try {
      await api(`/api/content/posts?id=${editing.id}`, { method: "DELETE" });
      setPosts((cur) => cur.filter((p) => p.id !== editing.id));
      setEditing(null);
    } catch (err) {
      setError(err.message || "Couldn't delete that post.");
    }
  }

  function createPostInTool() {
    if (!editing.title.trim()) return;
    const tool = HANDOFF_TOOL[editing.category];
    if (!tool) return;
    writePostHandoff({ tool, field: HANDOFF_FIELD[editing.category], value: editing.title.trim() });
    const save = editing.id
      ? api(`/api/content/posts?id=${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: editing.title.trim(), date: editing.date, category: editing.category, posted: !!editing.posted }),
        })
      : api("/api/content/posts", {
          method: "POST",
          body: JSON.stringify({ date: editing.date, title: editing.title.trim(), category: editing.category, status: "confirmed" }),
        });
    save.finally(() => {
      setEditing(null);
      onSwitchTool(tool);
    });
  }

  return (
    <div className="min-h-dvh" style={{ background: UI.page, color: UI.ink }}>
      <TopNav active="calendar" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />

      <main className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
        <div className="mb-4 sm:mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold" style={{ color: UI.ink, fontSize: "1.85rem" }}>Content calendar</h1>
            <p className="font-body text-sm mt-1" style={{ color: UI.inkSoft }}>
              Plan your content and stay consistent — publishing still happens on your social platforms.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFocusMonth((m) => addMonths(m, -1))} className="press-fx flex items-center justify-center rounded-lg" style={{ border: `2px solid ${UI.ink}`, width: 44, height: 44 }} aria-label="Previous month">
              <ChevronLeft size={16} color={UI.ink} />
            </button>
            <h2 className="font-body text-sm font-semibold text-center" style={{ minWidth: "9rem" }}>
              {focusMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <button type="button" onClick={() => setFocusMonth((m) => addMonths(m, 1))} className="press-fx flex items-center justify-center rounded-lg" style={{ border: `2px solid ${UI.ink}`, width: 44, height: 44 }} aria-label="Next month">
              <ChevronRight size={16} color={UI.ink} />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg p-3 mb-4 font-body text-sm" style={{ background: mixWithWhite("#C0392B", 0.9), color: "#C0392B" }}>
            {error}
          </div>
        )}

        {/* View toggle */}
        <div className="flex rounded-lg p-1 mb-4" style={{ background: UI.stone, border: `2px solid ${UI.ink}` }}>
          {["agenda", "month"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="press-fx flex-1 font-body text-sm font-bold rounded-md capitalize transition"
              style={{ minHeight: 44, background: view === v ? ACCENT : "transparent", color: view === v ? WHITE : UI.inkSoft }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-2xl p-4 mb-4" style={{ border: `2px solid ${UI.ink}`, background: UI.card }}>
          <button className="w-full flex items-start justify-between text-left" onClick={() => setSummaryOpen((v) => !v)}>
            <div>
              <div className="font-body text-sm font-semibold" style={{ color: UI.ink }}>
                {confirmedCount} post{confirmedCount === 1 ? "" : "s"} planned <span className="mx-1.5" style={{ color: UI.line }}>·</span> {openDaysCount} open day{openDaysCount === 1 ? "" : "s"}
              </div>
              <div className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>Open days have no post scheduled yet</div>
            </div>
            <ChevronDown size={18} style={{ color: UI.inkSoft, flexShrink: 0, transform: summaryOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {summaryOpen && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${UI.line}` }}>
              <div className="font-body text-xs mb-2" style={{ color: UI.inkSoft }}>
                {topCategory ? `Your planned content is mostly ${CATEGORIES[topCategory].label}` : "No posts planned yet"}
              </div>
              {breakdown.map(({ category, count, pct }) => (
                <div key={category} className="flex items-center gap-2 py-1 font-body text-sm">
                  <CategoryDot category={category} />
                  <span className="flex-1" style={{ color: UI.ink }}>{CATEGORIES[category].label}</span>
                  <span className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[80px]" style={{ background: UI.stone }}>
                    <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CATEGORIES[category].color }} />
                  </span>
                  <span className="tabular-nums w-4 text-right" style={{ color: UI.inkSoft }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3.5 mb-2">
          <button
            onClick={() => openNewPost(todayKey)}
            className="press-fx flex-1 rounded-lg font-body text-sm font-bold transition"
            style={{ minHeight: 44, background: ACCENT, color: WHITE, border: `2.5px solid ${UI.ink}`, boxShadow: `3px 3px 0 ${UI.ink}` }}
          >
            + Plan a post
          </button>
          <button
            onClick={runAutofill}
            disabled={autofillLoading}
            className="press-fx flex items-center justify-center gap-1 font-body text-sm font-semibold whitespace-nowrap disabled:opacity-50 px-1"
            style={{ color: ACCENT, minHeight: 44 }}
          >
            {autofillLoading ? "Filling…" : "Auto-fill month"}
            <Info size={14} />
          </button>
        </div>

        {autofillNoteOpen && (
          <div className="flex items-start gap-2 rounded-lg p-3 mb-4" style={{ background: mixWithWhite(ACCENT, 0.93), border: `1px solid ${mixWithWhite(ACCENT, 0.5)}` }}>
            <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <p className="font-body text-xs leading-relaxed flex-1" style={{ color: UI.ink }}>
              Auto-fill adds suggested posts to your open days. Nothing is scheduled until you confirm each one below.
            </p>
            <button onClick={() => setAutofillNoteOpen(false)} className="press-fx flex items-center justify-center flex-shrink-0" style={{ color: UI.inkSoft, width: 44, height: 44, margin: "-12px -12px -12px 0" }}>
              <X size={13} />
            </button>
          </div>
        )}

        {loading ? (
          <p className="font-body text-sm" style={{ color: UI.inkSoft }}>Loading…</p>
        ) : view === "agenda" ? (
          <div>
            <h3 className="font-body text-[13px] font-semibold mb-2.5" style={{ color: UI.ink }}>Upcoming posts</h3>
            {days.map((day) => (
              <div key={day.date} className="py-0.5" style={{ borderTop: `1px solid ${UI.line}` }}>
                <div className="flex items-baseline gap-2 py-2">
                  <span className="font-body text-[13.5px] font-semibold" style={{ color: day.date === todayKey ? ACCENT : UI.ink }}>{day.num}</span>
                  <span className="font-body text-xs" style={{ color: UI.inkSoft }}>{day.dow}</span>
                </div>

                {day.posts.length === 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="font-body text-sm" style={{ color: UI.inkSoft }}>No post planned</span>
                    <button onClick={() => openNewPost(day.date)} className="press-fx flex items-center justify-center font-body text-xs font-bold px-2" style={{ color: ACCENT, minHeight: 44 }}>+ Add</button>
                  </div>
                )}

                {day.posts.map((post) => (
                  post.status === "suggested" ? (
                    <div key={post.id} className="relative flex items-start gap-2.5 rounded-lg p-2.5 my-1.5" style={{ background: mixWithWhite(ACCENT, 0.94), border: `1.5px dashed ${ACCENT}` }}>
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-sm font-medium leading-snug" style={{ color: UI.ink }}>{post.title}</div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-body text-xs" style={{ color: UI.inkSoft }}>
                            <CategoryDot category={post.category} />
                            {CATEGORIES[post.category].label}
                          </span>
                          <span className="inline-flex items-center gap-1 font-body text-[10.5px] font-bold rounded px-1.5 py-0.5" style={{ background: ACCENT, color: WHITE }}>
                            <Sparkles size={9} /> Suggested
                          </span>
                        </div>
                        <div className="flex gap-1.5 mt-1.5">
                          <button onClick={() => confirmSuggested(post.id)} className="press-fx font-body text-xs font-bold rounded-md px-2.5" style={{ minHeight: 44, background: ACCENT, color: WHITE }}>Confirm</button>
                          <button onClick={() => dismissSuggested(post.id)} className="press-fx font-body text-xs font-bold rounded-md px-2.5" style={{ minHeight: 44, border: `1px solid ${UI.line}`, color: UI.ink, background: UI.card }}>Dismiss</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={post.id} className="flex items-start gap-2.5 py-2">
                      <span className="w-[3px] self-stretch rounded mt-0.5" style={{ background: CATEGORIES[post.category].color }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-sm font-medium leading-snug" style={{ color: post.posted ? UI.inkSoft : UI.ink, textDecoration: post.posted ? "line-through" : "none" }}>{post.title}</div>
                        <span className="inline-flex items-center gap-1.5 font-body text-xs mt-1" style={{ color: UI.inkSoft }}>
                          <CategoryDot category={post.category} />
                          {CATEGORIES[post.category].label}
                        </span>
                      </div>
                      <button onClick={() => openEditPost(post)} className="press-fx flex items-center justify-center flex-shrink-0" style={{ color: UI.inkSoft, width: 44, height: 44, margin: "-10px -10px -10px 0" }} aria-label="Edit post">
                        <Pencil size={15} />
                      </button>
                    </div>
                  )
                ))}
              </div>
            ))}
            {days.length === 0 && <p className="font-body text-sm" style={{ color: UI.inkSoft }}>Nothing left this month.</p>}
          </div>
        ) : (
          <MonthView posts={posts} focusMonth={focusMonth} todayKey={todayKey} onDayClick={openNewPost} />
        )}

        {/* Ideas */}
        <h3 className="font-body text-[13px] font-semibold mt-6 mb-2.5" style={{ color: UI.ink }}>Ideas for this month</h3>
        {ideas.length === 0 ? (
          <p className="font-body text-sm" style={{ color: UI.inkSoft }}>No saved ideas yet.</p>
        ) : ideas.map((idea) => (
          <div key={idea.id} className="flex items-center gap-3 rounded-xl p-3 mb-2" style={{ border: `1px solid ${UI.line}` }}>
            <div className="flex-1 min-w-0">
              <div className="font-body text-[13.5px] font-medium leading-snug" style={{ color: UI.ink }}>{idea.title}</div>
              <span className="inline-flex items-center gap-1.5 font-body text-xs mt-1" style={{ color: UI.inkSoft }}>
                <CategoryDot category={idea.category} />
                {CATEGORIES[idea.category].label}
              </span>
            </div>
            <button
              onClick={() => addIdeaToPlan(idea)}
              className="press-fx font-body text-xs font-bold rounded-md px-2.5 whitespace-nowrap flex-shrink-0"
              style={{ minHeight: 44, border: `1px solid ${ACCENT}`, color: ACCENT, background: UI.card }}
            >
              Add to plan
            </button>
          </div>
        ))}
      </main>

      {editing && (
        <PostModal
          editing={editing}
          setEditing={setEditing}
          onSave={savePost}
          onDelete={editing.id ? deletePost : null}
          onCreatePost={HANDOFF_TOOL[editing.category] ? createPostInTool : null}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function MonthView({ posts, focusMonth, todayKey, onDayClick }) {
  const year = focusMonth.getFullYear(), month = focusMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach((p) => {
      const day = Number(p.date.split("-")[2]);
      (map[day] ||= []).push(p);
    });
    return map;
  }, [posts]);

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="rounded-xl overflow-hidden" style={{ border: `2px solid ${UI.ink}` }}>
        <div className="grid grid-cols-7" style={{ background: UI.stone }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center font-mono text-[10.5px] py-1.5" style={{ color: UI.inkSoft }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const dayPosts = d ? postsByDay[d] || [] : [];
            const dateKey = d ? `${year}-${pad2(month + 1)}-${pad2(d)}` : null;
            const isToday = dateKey === todayKey;
            const tint = dayPosts[0] ? CATEGORIES[dayPosts[0].category].color + "14" : undefined;
            return (
              <button
                type="button"
                key={i}
                disabled={!d}
                onClick={() => d && onDayClick(dateKey)}
                className="aspect-square flex flex-col items-center justify-center gap-1"
                style={{
                  borderTop: `1px solid ${UI.line}`,
                  borderRight: (i + 1) % 7 === 0 ? "none" : `1px solid ${UI.line}`,
                  background: isToday ? mixWithWhite(ACCENT, 0.9) : tint,
                }}
              >
                {d && (
                  <>
                    <span className="text-xs" style={{ fontWeight: isToday ? 700 : 400, color: isToday ? ACCENT : UI.ink }}>{d}</span>
                    {dayPosts.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        {dayPosts.slice(0, 3).map((p) => <CategoryDot key={p.id} category={p.category} size={5} />)}
                        {dayPosts.length > 1 && <span className="font-bold" style={{ fontSize: "8.5px", color: UI.inkSoft, marginLeft: 2 }}>{dayPosts.length}</span>}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="font-body text-xs text-center mt-2.5" style={{ color: UI.inkSoft }}>Tap a day to plan a post there</p>
    </div>
  );
}

function PostModal({ editing, setEditing, onSave, onDelete, onCreatePost, onClose }) {
  const dateLabel = new Date(`${editing.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="modal-backdrop fixed inset-0 flex items-end sm:items-center justify-center sm:p-6" style={{ background: "rgba(27,36,48,0.45)", zIndex: 100 }} onClick={onClose}>
      <div
        className="modal-sheet rounded-t-2xl sm:rounded-2xl w-full"
        style={{ maxWidth: 420, background: UI.card, border: `2.5px solid ${UI.ink}`, boxShadow: "0 20px 50px rgba(27,36,48,0.25)", maxHeight: "90dvh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="font-display font-bold text-base" style={{ color: UI.ink }}>{editing.id ? "Edit post" : "Plan a post"}</h2>
            <p className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>{dateLabel}</p>
          </div>
          <button onClick={onClose} className="press-fx flex items-center justify-center" style={{ color: UI.inkSoft, minWidth: 44, minHeight: 44, margin: "-13px -13px -13px 0" }} aria-label="Close"><X size={18} /></button>
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
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>CATEGORY</span>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_KEYS.map((key) => {
                const c = CATEGORIES[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditing((f) => ({ ...f, category: key }))}
                    className="press-fx flex items-center justify-center gap-1.5 rounded-lg font-body text-xs font-bold transition"
                    style={{
                      minHeight: 44,
                      borderStyle: "solid",
                      borderWidth: editing.category === key ? 2 : 1.5,
                      borderColor: editing.category === key ? c.color : UI.line,
                      background: editing.category === key ? mixWithWhite(c.color, 0.88) : "transparent",
                    }}
                  >
                    <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: c.color }} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {editing.id && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!editing.posted}
                onChange={(e) => setEditing((f) => ({ ...f, posted: e.target.checked }))}
                className="flex-shrink-0"
              />
              <span className="font-body text-sm" style={{ color: UI.ink }}>Mark as posted</span>
            </label>
          )}
        </div>

        <div className="px-6 pb-5 grid gap-2">
          {onCreatePost && (
            <button
              type="button"
              onClick={onCreatePost}
              disabled={!editing.title.trim()}
              className="press-fx w-full rounded-lg font-body font-bold text-sm transition disabled:opacity-50"
              style={{ minHeight: 44, border: `2px solid ${ACCENT}`, color: ACCENT }}
            >
              Create this post →
            </button>
          )}
          <div className="flex items-center gap-2">
            {onDelete && (
              <button type="button" onClick={onDelete} className="press-fx flex items-center gap-1.5 px-3 rounded-lg font-body text-xs font-semibold transition" style={{ minHeight: 44, border: `1.5px solid ${UI.line}`, color: "#C0392B" }}>
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={!editing.title.trim()}
              className="press-fx flex-1 rounded-lg font-body font-bold text-sm transition disabled:opacity-50"
              style={{ minHeight: 44, background: ACCENT, color: WHITE, border: `2px solid ${UI.ink}`, boxShadow: `2px 2px 0 ${UI.ink}` }}
            >
              {editing.id ? "Save changes" : "Add to calendar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

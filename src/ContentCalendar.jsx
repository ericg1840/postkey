import { useState, useEffect, useMemo, useCallback, useRef, useSyncExternalStore } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Sparkles, Info, X, Pencil, Trash2, PartyPopper, Repeat, Circle, CheckCircle2, Check } from "lucide-react";
import { UI, ACCENT, WHITE, mixWithWhite, TopNav, writePostHandoff } from "./shared.jsx";
import { holidaysByDate, upcomingHolidays } from "./lib/holidays.mjs";
import { groupAgendaDays, formatDateRange, monthWeeks, weekIndexOf } from "./lib/planner.mjs";
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

// "Thu, Nov 26 · in 12 days" — the countdown is the part that makes a
// holiday actionable, since "is that soon enough to still plan for?" is the
// actual question being asked.
function formatHolidayDate(iso, todayKey) {
  const d = new Date(iso + "T00:00:00");
  const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const days = Math.round((Date.parse(iso + "T00:00:00") - Date.parse(todayKey + "T00:00:00")) / 86_400_000);
  if (days <= 0) return `${label} · today`;
  if (days === 1) return `${label} · tomorrow`;
  return `${label} · in ${days} days`;
}

function formatDay(iso, todayKey) {
  const d = new Date(iso + "T00:00:00");
  return {
    num: `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getDate()}`,
    dow: iso === todayKey ? "Today" : d.toLocaleDateString("en-US", { weekday: "long" }),
  };
}

function formatShortDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// "20th", "1st", "22nd" — for labeling a recurring topic's day of month.
function ordinal(n) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function CategoryDot({ category, size = 8, hollow = false }) {
  const c = CATEGORIES[category] || CATEGORIES.community;
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: hollow ? "transparent" : c.color, border: hollow ? `1.5px solid ${c.color}` : "none" }}
    />
  );
}

function categoryLabel(category) {
  return (CATEGORIES[category] || CATEGORIES.community).label;
}

// The week view needs room for seven columns of post cards, so it's only
// offered on screens at least this wide (Tailwind's `sm`).
const WIDE_QUERY = "(min-width: 640px)";
function subscribeWide(onChange) {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function useIsWide() {
  return useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches, () => false);
}

// Drag-to-move, shared by the agenda, week and month views. Native HTML5
// drag and drop, so it's a mouse/trackpad nicety — on touch screens the
// date field in the edit sheet is how a post moves.
const DRAG_TYPE = "application/x-postkey-post";
function postDragProps(post) {
  return {
    draggable: true,
    onDragStart: (e) => {
      e.dataTransfer.setData(DRAG_TYPE, String(post.id));
      e.dataTransfer.effectAllowed = "move";
    },
  };
}

export function ContentCalendar({ onSwitchTool, onGoHome }) {
  const { user, logout } = useAuth();
  const [view, setView] = useState("agenda");
  const [focusMonth, setFocusMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [autofillNote, setAutofillNote] = useState("");
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [recurringTopics, setRecurringTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [editingIdea, setEditingIdea] = useState(null);
  const [showEarlier, setShowEarlier] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [weekIndex, setWeekIndex] = useState(() => weekIndexOf(toDateKey(new Date())));
  const [dropTarget, setDropTarget] = useState(null);
  const isWide = useIsWide();
  const activeView = view === "week" && !isWide ? "agenda" : view;

  const today = new Date();
  const todayKey = toDateKey(today);
  const monthKey = monthKeyOf(focusMonth);
  const isCurrentMonth = monthKey === todayKey.slice(0, 7);

  function goToMonth(next) {
    setFocusMonth(next);
    // The week containing today when landing on the current month,
    // otherwise the month's first week.
    const nextKey = monthKeyOf(next);
    setWeekIndex(nextKey === todayKey.slice(0, 7) ? weekIndexOf(todayKey) : 0);
    setSelectedDay(null);
    setShowEarlier(false);
    setAutofillNote("");
  }

  // Holidays are computed, not fetched — they're deterministic, so there's
  // nothing to store or keep in sync.
  const holidayLookup = useMemo(() => holidaysByDate(focusMonth.getFullYear()), [focusMonth]);
  // Scoped to whatever month is on screen — not always "today" — so paging
  // forward to December actually surfaces Christmas instead of whatever's
  // nearest to the real current date. Within the current month, still start
  // from today rather than the 1st, so an already-passed holiday this month
  // doesn't linger in the list.
  const nextHolidays = useMemo(() => {
    const planned = new Set(posts.map((p) => p.date));
    const monthStart = `${monthKey}-01`;
    const monthEnd = `${monthKey}-31`;
    const lowerBound = monthKey === todayKey.slice(0, 7) ? todayKey : monthStart;
    return upcomingHolidays(lowerBound, 40)
      .filter((h) => h.date >= todayKey && h.date <= monthEnd && !planned.has(h.date))
      .slice(0, 3);
  }, [monthKey, todayKey, posts]);

  // Paging through months quickly leaves several loads in flight, and they
  // can finish out of order — without this, a slow response for a month
  // already paged away from would overwrite the one on screen.
  const currentMonthRef = useRef(monthKey);
  useEffect(() => {
    currentMonthRef.current = monthKey;
  }, [monthKey]);

  const loadPosts = useCallback(async () => {
    try {
      const data = await api(`/api/content/posts?month=${monthKey}`);
      if (currentMonthRef.current !== monthKey) return;
      setPosts(data.posts || []);
    } catch (err) {
      if (currentMonthRef.current !== monthKey) return;
      setError(err.message || "Couldn't load your content calendar.");
    }
  }, [monthKey]);

  const loadIdeas = useCallback(async () => {
    try {
      const data = await api("/api/content/ideas");
      setIdeas(data.ideas || []);
    } catch (err) {
      // Ideas are a secondary panel — a failed load there shouldn't block the
      // calendar itself, but it must not vanish silently either: that's how
      // the recurring-topics route went missing unnoticed.
      console.error("Loading content ideas failed", err);
    }
  }, []);

  const loadRecurringTopics = useCallback(async () => {
    try {
      const data = await api("/api/content/recurring");
      setRecurringTopics(data.topics || []);
    } catch (err) {
      // Same secondary-panel treatment as ideas — don't block the calendar over this.
      console.error("Loading recurring topics failed", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([loadPosts(), loadIdeas(), loadRecurringTopics()]).finally(() => setLoading(false));
  }, [loadPosts, loadIdeas, loadRecurringTopics]);

  const confirmedPosts = useMemo(() => posts.filter((p) => p.status === "confirmed"), [posts]);
  const confirmedCount = confirmedPosts.length;
  const postedCount = confirmedPosts.filter((p) => p.posted).length;
  const suggestedCount = posts.length - confirmedCount;

  const daysInMonth = new Date(focusMonth.getFullYear(), focusMonth.getMonth() + 1, 0).getDate();
  const monthDayKeys = Array.from({ length: daysInMonth }, (_, i) => `${monthKey}-${pad2(i + 1)}`);
  const plannedDates = new Set(posts.map((p) => p.date));
  const openDaysCount = monthDayKeys.filter((k) => k >= todayKey && !plannedDates.has(k)).length;

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
    setAutofillNote("");
    setAutofillLoading(true);
    try {
      // Send our own local date: the server runs in UTC, and picking open
      // days by the UTC date would skip the day the agent is actually
      // looking at for anyone west of Greenwich late in their evening.
      const data = await api("/api/content/autofill", { method: "POST", body: JSON.stringify({ month: monthKey, today: todayKey }) });
      const added = data.posts?.length || 0;
      setAutofillNote(
        added === 0
          ? "No open days left to fill this month."
          : `Added ${added} suggestion${added === 1 ? "" : "s"} to your open days. Nothing is planned until you confirm each one.`,
      );
      // Auto-fill draws on saved ideas, so the ones it used leave that list.
      await Promise.all([loadPosts(), loadIdeas()]);
    } catch (err) {
      setError(err.message || "Couldn't generate suggestions.");
    } finally {
      setAutofillLoading(false);
    }
  }

  async function patchPost(id, changes, failMessage) {
    const prev = posts;
    setPosts((cur) => cur.map((p) => (p.id === id ? { ...p, ...changes } : p)));
    try {
      await api(`/api/content/posts?id=${id}`, { method: "PATCH", body: JSON.stringify(changes) });
    } catch (err) {
      setPosts(prev);
      setError(err.message || failMessage);
    }
  }

  async function movePost(id, date) {
    const post = posts.find((p) => p.id === id);
    if (!post || post.date === date) return;
    await patchPost(id, { date }, "Couldn't move that post.");
  }

  // Handlers for anything a post can be dropped on — a day in any view.
  function dropProps(dateKey) {
    return {
      onDragOver: (e) => {
        if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dropTarget !== dateKey) setDropTarget(dateKey);
      },
      onDragLeave: (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget((t) => (t === dateKey ? null : t));
      },
      onDrop: (e) => {
        e.preventDefault();
        setDropTarget(null);
        const id = Number(e.dataTransfer.getData(DRAG_TYPE));
        if (Number.isInteger(id)) movePost(id, dateKey);
      },
    };
  }

  function confirmSuggested(id) {
    return patchPost(id, { status: "confirmed" }, "Couldn't confirm that post.");
  }

  function togglePosted(post) {
    return patchPost(post.id, { posted: !post.posted }, "Couldn't update that post.");
  }

  async function dismissSuggested(post) {
    const prev = posts;
    setPosts((cur) => cur.filter((p) => p.id !== post.id));
    try {
      await api(`/api/content/posts?id=${post.id}`, { method: "DELETE" });
      // Dismissing a suggestion made from a saved idea puts the idea back.
      if (post.source === "idea") loadIdeas();
    } catch (err) {
      setPosts(prev);
      setError(err.message || "Couldn't dismiss that post.");
    }
  }

  async function addIdeaToPlan(idea) {
    const prevIdeas = ideas;
    setIdeas((cur) => cur.filter((i) => i.id !== idea.id));
    try {
      // The new post can land in any month (the idea's own date), so reload
      // rather than appending it to a list that's scoped to this one.
      await api(`/api/content/ideas?id=${idea.id}`, { method: "PATCH", body: JSON.stringify({ today: todayKey }) });
      await loadPosts();
    } catch (err) {
      setIdeas(prevIdeas);
      setError(err.message || "Couldn't add that idea to your plan.");
    }
  }

  async function saveIdea() {
    const title = editingIdea.title.trim();
    if (!title) return;
    try {
      const data = await api("/api/content/ideas", {
        method: "POST",
        body: JSON.stringify({ title, category: editingIdea.category, targetDate: editingIdea.targetDate || null }),
      });
      setIdeas((cur) => [...cur, data.idea]);
      setEditingIdea(null);
    } catch (err) {
      setError(err.message || "Couldn't save that idea.");
    }
  }

  async function deleteIdea(id) {
    const prev = ideas;
    setIdeas((cur) => cur.filter((i) => i.id !== id));
    try {
      await api(`/api/content/ideas?id=${id}`, { method: "DELETE" });
    } catch (err) {
      setIdeas(prev);
      setError(err.message || "Couldn't delete that idea.");
    }
  }

  function openNewRecurring() {
    setEditingRecurring({ dayOfMonth: "1", title: "", category: "community" });
  }

  function openEditRecurring(topic) {
    setEditingRecurring({ ...topic, dayOfMonth: String(topic.dayOfMonth) });
  }

  async function saveRecurring() {
    if (!editingRecurring.title.trim()) return;
    // Kept as a string while typing so the field can be cleared and retyped;
    // only clamped to a real day here.
    const dayOfMonth = Math.min(31, Math.max(1, Math.round(Number(editingRecurring.dayOfMonth)) || 1));
    const fields = { dayOfMonth, title: editingRecurring.title.trim(), category: editingRecurring.category };
    try {
      if (editingRecurring.id) {
        // Edits apply to months not generated yet — posts already on the
        // calendar are left as they are, so only the list needs updating.
        const data = await api(`/api/content/recurring?id=${editingRecurring.id}`, { method: "PATCH", body: JSON.stringify(fields) });
        setRecurringTopics((cur) => cur.map((t) => (t.id === data.topic.id ? data.topic : t)).sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.id - b.id));
        setEditingRecurring(null);
        return;
      }
      await api("/api/content/recurring", { method: "POST", body: JSON.stringify(fields) });
      setEditingRecurring(null);
      // A new rule may cover a day already in the currently-viewed month —
      // reload both so it shows up immediately instead of on next fetch.
      await Promise.all([loadRecurringTopics(), loadPosts()]);
    } catch (err) {
      setError(err.message || "Couldn't save that recurring topic.");
    }
  }

  async function toggleRecurring(topic) {
    const prev = recurringTopics;
    setRecurringTopics((cur) => cur.map((t) => (t.id === topic.id ? { ...t, active: !t.active } : t)));
    try {
      await api(`/api/content/recurring?id=${topic.id}`, { method: "PATCH", body: JSON.stringify({ active: !topic.active }) });
    } catch (err) {
      setRecurringTopics(prev);
      setError(err.message || "Couldn't update that recurring topic.");
    }
  }

  async function deleteRecurring(id) {
    const prev = recurringTopics;
    setRecurringTopics((cur) => cur.filter((t) => t.id !== id));
    try {
      await api(`/api/content/recurring?id=${id}`, { method: "DELETE" });
    } catch (err) {
      setRecurringTopics(prev);
      setError(err.message || "Couldn't delete that recurring topic.");
    }
  }

  function dayInfo(dateKey) {
    return {
      date: dateKey,
      ...formatDay(dateKey, todayKey),
      posts: posts.filter((p) => p.date === dateKey),
      holiday: holidayLookup.get(dateKey),
    };
  }

  // In the current month the agenda starts at today, but posts from earlier
  // in the month still need marking as posted — they're one tap away rather
  // than only reachable from the Profile page.
  const earlierDays = isCurrentMonth
    ? monthDayKeys.filter((k) => k < todayKey).map(dayInfo).filter((d) => d.posts.length > 0)
    : [];
  const earlierPostCount = earlierDays.reduce((n, d) => n + d.posts.length, 0);
  const days = monthDayKeys.filter((k) => !isCurrentMonth || k >= todayKey).map(dayInfo);
  const agendaItems = groupAgendaDays(days, todayKey);

  function openNewPost(dateKey) {
    setEditing({ date: dateKey || todayKey, title: "", category: "listing" });
  }

  // Prefills the holiday's name as the title so the agent starts from
  // "Thanksgiving" rather than a blank field, and defaults to Community —
  // a holiday post is a community one far more often than a listing.
  function openHolidayPost(holiday) {
    setEditing({ date: holiday.date, title: holiday.name, category: "community" });
  }
  function openEditPost(post) {
    setEditing({ ...post });
  }

  // Saving an edit to a suggestion also confirms it — adjusting the title or
  // date is the agent deciding to keep it.
  function postBody() {
    const body = { title: editing.title.trim(), date: editing.date, category: editing.category };
    if (editing.id) {
      body.posted = !!editing.posted;
      if (editing.status === "suggested") body.status = "confirmed";
    } else {
      body.status = "confirmed";
    }
    return body;
  }

  function persistPost() {
    return editing.id
      ? api(`/api/content/posts?id=${editing.id}`, { method: "PATCH", body: JSON.stringify(postBody()) })
      : api("/api/content/posts", { method: "POST", body: JSON.stringify(postBody()) });
  }

  async function savePost() {
    if (!editing.title.trim()) return;
    try {
      await persistPost();
      setEditing(null);
      await loadPosts();
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

  async function createPostInTool() {
    if (!editing.title.trim()) return;
    const tool = HANDOFF_TOOL[editing.category];
    if (!tool) return;
    try {
      await persistPost();
    } catch (err) {
      // Stay put rather than leave the planner with the entry silently unsaved.
      setError(err.message || "Couldn't save that post.");
      setEditing(null);
      return;
    }
    writePostHandoff({ tool, field: HANDOFF_FIELD[editing.category], value: editing.title.trim() });
    setEditing(null);
    onSwitchTool(tool);
  }

  const rowHandlers = { onConfirm: confirmSuggested, onDismiss: dismissSuggested, onEdit: openEditPost, onTogglePosted: togglePosted };
  const dnd = { dropProps, dropTarget, enabled: isWide };
  const selected = selectedDay && selectedDay.startsWith(monthKey) ? dayInfo(selectedDay) : null;

  return (
    <div className="min-h-dvh" style={{ background: UI.page, color: UI.ink }}>
      <TopNav active="calendar" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />

      <main className={`${activeView === "week" ? "max-w-5xl" : "max-w-3xl"} mx-auto px-3 sm:px-6 py-4 sm:py-10`}>
        <div className="mb-4">
          <h1 className="font-display font-bold" style={{ color: UI.ink, fontSize: "1.85rem" }}>Planner</h1>
          <p className="font-body text-sm mt-1" style={{ color: UI.inkSoft }}>
            Plan your content and stay consistent — publishing still happens on your social platforms.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
          <button type="button" onClick={() => goToMonth(addMonths(focusMonth, -1))} className="press-fx flex items-center justify-center rounded-lg" style={{ border: `2px solid ${UI.ink}`, width: 44, height: 44 }} aria-label="Previous month">
            <ChevronLeft size={16} color={UI.ink} />
          </button>
          <h2 className="font-body text-sm font-semibold text-center" style={{ minWidth: "9rem" }} aria-live="polite">
            {focusMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button type="button" onClick={() => goToMonth(addMonths(focusMonth, 1))} className="press-fx flex items-center justify-center rounded-lg" style={{ border: `2px solid ${UI.ink}`, width: 44, height: 44 }} aria-label="Next month">
            <ChevronRight size={16} color={UI.ink} />
          </button>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => goToMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="press-fx font-body text-xs font-bold px-3 rounded-lg"
              style={{ minHeight: 44, color: ACCENT, border: `1.5px solid ${UI.line}` }}
            >
              Today
            </button>
          )}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg p-3 mb-4 font-body text-sm" style={{ background: mixWithWhite("#C0392B", 0.9), color: "#C0392B" }}>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="press-fx flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, margin: "-12px -12px -12px 0" }} aria-label="Dismiss error">
              <X size={14} />
            </button>
          </div>
        )}

        {/* View toggle */}
        <div className="flex rounded-lg p-1 mb-4" style={{ background: UI.stone, border: `2px solid ${UI.ink}` }} role="tablist">
          {(isWide ? ["agenda", "week", "month"] : ["agenda", "month"]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={activeView === v}
              onClick={() => setView(v)}
              className="press-fx flex-1 font-body text-sm font-bold rounded-md capitalize transition"
              style={{ minHeight: 44, background: activeView === v ? ACCENT : "transparent", color: activeView === v ? WHITE : UI.inkSoft }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-2xl p-4 mb-4" style={{ border: `2px solid ${UI.ink}`, background: UI.card }}>
          <button className="w-full flex items-start justify-between text-left" onClick={() => setSummaryOpen((v) => !v)} aria-expanded={summaryOpen}>
            <div>
              <div className="font-body text-sm font-semibold" style={{ color: UI.ink }}>
                {confirmedCount} planned
                <span className="mx-1.5" style={{ color: UI.line }}>·</span>
                {postedCount} posted
                <span className="mx-1.5" style={{ color: UI.line }}>·</span>
                {openDaysCount} open day{openDaysCount === 1 ? "" : "s"}
              </div>
              <div className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>
                {suggestedCount > 0
                  ? `${suggestedCount} suggestion${suggestedCount === 1 ? "" : "s"} waiting for you to confirm`
                  : "Open days have no post scheduled yet"}
              </div>
            </div>
            <ChevronDown size={18} style={{ color: UI.inkSoft, flexShrink: 0, transform: summaryOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {summaryOpen && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${UI.line}` }}>
              <div className="font-body text-xs mb-2" style={{ color: UI.inkSoft }}>
                {topCategory ? `Your planned content is mostly ${categoryLabel(topCategory)}` : "No posts planned yet"}
              </div>
              {breakdown.map(({ category, count, pct }) => (
                <div key={category} className="flex items-center gap-2 py-1 font-body text-sm">
                  <CategoryDot category={category} />
                  <span className="flex-1" style={{ color: UI.ink }}>{categoryLabel(category)}</span>
                  <span className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[80px]" style={{ background: UI.stone }}>
                    <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CATEGORIES[category]?.color }} />
                  </span>
                  <span className="tabular-nums w-4 text-right" style={{ color: UI.inkSoft }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming holidays — the ones with nothing planned yet, since a
            holiday already covered isn't a prompt to act on. */}
        {nextHolidays.length > 0 && (
          <div className="rounded-2xl p-4 mb-4" style={{ border: `2px solid ${UI.ink}`, background: UI.card }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 26, height: 26, background: mixWithWhite(ACCENT, 0.85) }}>
                <PartyPopper size={14} style={{ color: ACCENT }} />
              </span>
              <div>
                <h3 className="font-display font-bold text-[15px] leading-tight" style={{ color: UI.ink }}>Post-worthy days ahead</h3>
                <p className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>Nothing planned for these yet — worth grabbing before they pass.</p>
              </div>
            </div>
            {nextHolidays.map((holiday) => (
              <div
                key={holiday.date}
                className="flex items-center gap-2 py-1.5"
                style={{ borderTop: `1px solid ${UI.line}` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-body text-sm font-medium truncate" style={{ color: UI.ink }}>{holiday.name}</div>
                  <div className="font-body text-xs" style={{ color: UI.inkSoft }}>{formatHolidayDate(holiday.date, todayKey)}</div>
                </div>
                <button
                  onClick={() => openHolidayPost(holiday)}
                  className="press-fx font-body text-xs font-bold px-3 rounded-full flex-shrink-0"
                  style={{ minHeight: 40, background: UI.stone, color: ACCENT }}
                >
                  Plan it
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3.5 mb-2">
          <button
            onClick={() => openNewPost(selected?.date && selected.date >= todayKey ? selected.date : todayKey)}
            className="press-fx flex-1 rounded-lg font-body text-sm font-bold transition"
            style={{ minHeight: 44, background: ACCENT, color: WHITE, border: `2.5px solid ${UI.ink}`, boxShadow: `3px 3px 0 ${UI.ink}` }}
          >
            + Plan a post
          </button>
          <button
            onClick={runAutofill}
            disabled={autofillLoading || openDaysCount === 0}
            className="press-fx flex items-center justify-center gap-1 font-body text-sm font-semibold whitespace-nowrap disabled:opacity-50 px-1"
            style={{ color: ACCENT, minHeight: 44 }}
            title="Adds up to 4 suggested posts to open days — nothing is planned until you confirm each one"
          >
            <Sparkles size={14} />
            {autofillLoading ? "Filling…" : "Auto-fill month"}
          </button>
        </div>

        {autofillNote && (
          <div className="flex items-start gap-2 rounded-lg p-3 mb-4" role="status" style={{ background: mixWithWhite(ACCENT, 0.93), border: `1px solid ${mixWithWhite(ACCENT, 0.5)}` }}>
            <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <p className="font-body text-xs leading-relaxed flex-1" style={{ color: UI.ink }}>{autofillNote}</p>
            <button onClick={() => setAutofillNote("")} className="press-fx flex items-center justify-center flex-shrink-0" style={{ color: UI.inkSoft, width: 44, height: 44, margin: "-12px -12px -12px 0" }} aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>
        )}

        {loading ? (
          <p className="font-body text-sm" style={{ color: UI.inkSoft }}>Loading…</p>
        ) : activeView === "agenda" ? (
          <div>
            <h3 className="font-body text-[13px] font-semibold mb-2.5" style={{ color: UI.ink }}>{isCurrentMonth ? "Upcoming posts" : "Posts this month"}</h3>

            {earlierPostCount > 0 && (
              <div className="mb-1">
                <button
                  onClick={() => setShowEarlier((v) => !v)}
                  className="press-fx flex items-center gap-1 font-body text-xs font-bold"
                  style={{ color: ACCENT, minHeight: 44 }}
                  aria-expanded={showEarlier}
                >
                  <ChevronDown size={14} style={{ transform: showEarlier ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  {showEarlier ? "Hide" : "Show"} earlier this month ({earlierPostCount} post{earlierPostCount === 1 ? "" : "s"})
                </button>
                {showEarlier && earlierDays.map((day) => (
                  <AgendaDay key={day.date} day={day} todayKey={todayKey} onAdd={null} handlers={rowHandlers} dnd={dnd} />
                ))}
              </div>
            )}

            {agendaItems.map((item) => (
              item.type === "day" ? (
                <AgendaDay key={item.day.date} day={item.day} todayKey={todayKey} onAdd={openNewPost} handlers={rowHandlers} dnd={dnd} />
              ) : (
                <div key={item.days[0].date} className="flex items-center justify-between py-1" style={{ borderTop: `1px solid ${UI.line}` }}>
                  <span className="font-body text-sm" style={{ color: UI.inkSoft }}>
                    <span className="font-semibold" style={{ color: UI.ink }}>{formatDateRange(item.days[0].date, item.days[item.days.length - 1].date)}</span>
                    <span className="mx-1.5" style={{ color: UI.line }}>·</span>
                    {item.days.length} open days
                  </span>
                  {item.days[item.days.length - 1].date >= todayKey ? (
                    <button onClick={() => openNewPost(item.days.find((d) => d.date >= todayKey).date)} className="press-fx flex items-center justify-center font-body text-xs font-bold px-2" style={{ color: ACCENT, minHeight: 44 }}>+ Add</button>
                  ) : <span style={{ minHeight: 44 }} />}
                </div>
              )
            ))}
            {days.length === 0 && <p className="font-body text-sm" style={{ color: UI.inkSoft }}>Nothing left this month.</p>}
          </div>
        ) : activeView === "week" ? (
          <WeekView
            posts={posts}
            focusMonth={focusMonth}
            weekIndex={weekIndex}
            setWeekIndex={setWeekIndex}
            todayKey={todayKey}
            holidayLookup={holidayLookup}
            onAdd={openNewPost}
            handlers={rowHandlers}
            dnd={dnd}
          />
        ) : (
          <>
            <MonthView
              posts={posts}
              focusMonth={focusMonth}
              todayKey={todayKey}
              holidayLookup={holidayLookup}
              selectedDay={selected?.date}
              onDayClick={setSelectedDay}
              dnd={dnd}
            />
            {selected ? (
              <div className="rounded-xl p-3 mt-3" style={{ border: `1.5px solid ${UI.line}`, background: UI.card }}>
                <AgendaDay day={selected} todayKey={todayKey} onAdd={openNewPost} handlers={rowHandlers} dnd={dnd} bare />
                {selected.posts.length > 0 && (
                  <button onClick={() => openNewPost(selected.date)} className="press-fx font-body text-xs font-bold px-1" style={{ color: ACCENT, minHeight: 44 }}>+ Add another post</button>
                )}
              </div>
            ) : (
              <p className="font-body text-xs text-center mt-2.5" style={{ color: UI.inkSoft }}>
                {isWide ? "Click a day to see or plan its posts, or drag a post onto another day to move it" : "Tap a day to see or plan its posts"}
              </p>
            )}
          </>
        )}

        {/* Ideas */}
        <div className="flex items-center justify-between mt-6 mb-2.5">
          <h3 className="font-body text-[13px] font-semibold" style={{ color: UI.ink }}>Saved ideas</h3>
          <button onClick={() => setEditingIdea({ title: "", category: "community", targetDate: "" })} className="press-fx font-body text-xs font-bold px-1" style={{ color: ACCENT, minHeight: 44 }}>+ Add</button>
        </div>
        {ideas.length === 0 ? (
          <p className="font-body text-sm" style={{ color: UI.inkSoft }}>
            No saved ideas yet — jot down anything you want to post about someday, and add it to your plan when you're ready.
          </p>
        ) : ideas.map((idea) => (
          <div key={idea.id} className="flex items-center gap-3 rounded-xl p-3 mb-2" style={{ border: `1px solid ${UI.line}` }}>
            <div className="flex-1 min-w-0">
              <div className="font-body text-[13.5px] font-medium leading-snug" style={{ color: UI.ink }}>{idea.title}</div>
              <span className="inline-flex items-center gap-1.5 font-body text-xs mt-1" style={{ color: UI.inkSoft }}>
                <CategoryDot category={idea.category} />
                {categoryLabel(idea.category)}
                {idea.targetDate && ` · ${formatShortDate(idea.targetDate)}`}
              </span>
            </div>
            <button
              onClick={() => addIdeaToPlan(idea)}
              className="press-fx font-body text-xs font-bold rounded-md px-2.5 whitespace-nowrap flex-shrink-0"
              style={{ minHeight: 44, border: `1px solid ${ACCENT}`, color: ACCENT, background: UI.card }}
              title={idea.targetDate ? `Adds a suggestion on ${formatShortDate(idea.targetDate)}` : "Adds a suggestion for today"}
            >
              Add to plan
            </button>
            <button onClick={() => deleteIdea(idea.id)} className="press-fx flex items-center justify-center flex-shrink-0" style={{ color: UI.inkSoft, width: 44, height: 44, margin: "-10px -10px -10px 0" }} aria-label="Delete idea">
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {/* Recurring topics */}
        <div className="flex items-center justify-between mt-6 mb-2.5">
          <h3 className="font-body text-[13px] font-semibold" style={{ color: UI.ink }}>Recurring topics</h3>
          <button onClick={openNewRecurring} className="press-fx font-body text-xs font-bold px-1" style={{ color: ACCENT, minHeight: 44 }}>+ Add</button>
        </div>
        {recurringTopics.length === 0 ? (
          <p className="font-body text-sm" style={{ color: UI.inkSoft }}>
            No recurring topics yet — e.g. "the 20th of every month, post a this-or-that."
          </p>
        ) : recurringTopics.map((topic) => (
          <div key={topic.id} className="flex items-center gap-3 rounded-xl p-3 mb-2" style={{ border: `1px solid ${UI.line}`, opacity: topic.active ? 1 : 0.55 }}>
            <Repeat size={15} className="flex-shrink-0" style={{ color: UI.inkSoft }} />
            <div className="flex-1 min-w-0">
              <div className="font-body text-[13.5px] font-medium leading-snug" style={{ color: UI.ink }}>{topic.title}</div>
              <span className="inline-flex items-center gap-1.5 font-body text-xs mt-1" style={{ color: UI.inkSoft }}>
                <CategoryDot category={topic.category} />
                {categoryLabel(topic.category)} · {ordinal(topic.dayOfMonth)} of every month
              </span>
            </div>
            <button
              onClick={() => toggleRecurring(topic)}
              className="press-fx font-body text-xs font-bold rounded-md px-2.5 whitespace-nowrap flex-shrink-0"
              style={{ minHeight: 44, border: `1px solid ${UI.line}`, color: UI.ink, background: UI.card }}
            >
              {topic.active ? "Pause" : "Resume"}
            </button>
            <button onClick={() => openEditRecurring(topic)} className="press-fx flex items-center justify-center flex-shrink-0" style={{ color: UI.inkSoft, width: 44, height: 44, margin: "-10px 0" }} aria-label="Edit recurring topic">
              <Pencil size={15} />
            </button>
            <button onClick={() => deleteRecurring(topic.id)} className="press-fx flex items-center justify-center flex-shrink-0" style={{ color: UI.inkSoft, width: 44, height: 44, margin: "-10px -10px -10px 0" }} aria-label="Delete recurring topic">
              <Trash2 size={15} />
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

      {editingRecurring && (
        <RecurringTopicModal
          editing={editingRecurring}
          setEditing={setEditingRecurring}
          onSave={saveRecurring}
          onClose={() => setEditingRecurring(null)}
        />
      )}

      {editingIdea && (
        <IdeaModal
          editing={editingIdea}
          setEditing={setEditingIdea}
          onSave={saveIdea}
          onClose={() => setEditingIdea(null)}
        />
      )}
    </div>
  );
}

// One day's block in the agenda — also reused as the detail panel under the
// month grid, so a post can be confirmed, edited or ticked off from either view.
function AgendaDay({ day, todayKey, onAdd, handlers, dnd, bare = false }) {
  const isDrop = dnd?.dropTarget === day.date;
  return (
    <div
      className="py-0.5 rounded-md"
      style={{ ...(bare ? {} : { borderTop: `1px solid ${UI.line}` }), ...(isDrop ? { background: mixWithWhite(ACCENT, 0.9) } : {}) }}
      {...(dnd?.enabled ? dnd.dropProps(day.date) : {})}
    >
      <div className="flex items-baseline gap-2 py-2 flex-wrap">
        <span className="font-body text-[13.5px] font-semibold" style={{ color: day.date === todayKey ? ACCENT : UI.ink }}>{day.num}</span>
        <span className="font-body text-xs" style={{ color: UI.inkSoft }}>{day.dow}</span>
        {day.holiday && (
          <span
            className="font-body text-[11px] font-semibold rounded-full px-2 py-0.5"
            style={{ background: mixWithWhite(ACCENT, 0.9), color: ACCENT }}
          >
            {day.holiday}
          </span>
        )}
      </div>

      {day.posts.length === 0 && (
        <div className="flex items-center justify-between py-2">
          <span className="font-body text-sm" style={{ color: UI.inkSoft }}>No post planned</span>
          {onAdd && day.date >= todayKey && (
            <button onClick={() => onAdd(day.date)} className="press-fx flex items-center justify-center font-body text-xs font-bold px-2" style={{ color: ACCENT, minHeight: 44 }}>+ Add</button>
          )}
        </div>
      )}

      {day.posts.map((post) => <PostRow key={post.id} post={post} draggable={!!dnd?.enabled} {...handlers} />)}
    </div>
  );
}

function PostRow({ post, draggable, onConfirm, onDismiss, onEdit, onTogglePosted }) {
  const color = CATEGORIES[post.category]?.color || UI.inkSoft;
  const drag = draggable ? { ...postDragProps(post), style: { cursor: "grab" } } : {};
  if (post.status === "suggested") {
    return (
      <div {...drag} className="relative flex items-start gap-2.5 rounded-lg p-2.5 my-1.5" style={{ ...drag.style, background: mixWithWhite(ACCENT, 0.94), border: `1.5px dashed ${ACCENT}` }}>
        <div className="flex-1 min-w-0">
          <div className="font-body text-sm font-medium leading-snug" style={{ color: UI.ink }}>{post.title}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 font-body text-xs" style={{ color: UI.inkSoft }}>
              <CategoryDot category={post.category} />
              {categoryLabel(post.category)}
            </span>
            <span className="inline-flex items-center gap-1 font-body text-[10.5px] font-bold rounded px-1.5 py-0.5" style={{ background: ACCENT, color: WHITE }}>
              {post.source === "recurring" ? <Repeat size={9} /> : <Sparkles size={9} />}
              {post.source === "recurring" ? "Recurring" : post.source === "idea" ? "From your ideas" : "Suggested"}
            </span>
          </div>
          <div className="flex gap-1.5 mt-1.5">
            <button onClick={() => onConfirm(post.id)} className="press-fx font-body text-xs font-bold rounded-md px-2.5" style={{ minHeight: 44, background: ACCENT, color: WHITE }}>Confirm</button>
            <button onClick={() => onDismiss(post)} className="press-fx font-body text-xs font-bold rounded-md px-2.5" style={{ minHeight: 44, border: `1px solid ${UI.line}`, color: UI.ink, background: UI.card }}>Dismiss</button>
          </div>
        </div>
        <button onClick={() => onEdit(post)} className="press-fx flex items-center justify-center flex-shrink-0" style={{ color: UI.inkSoft, width: 44, height: 44, margin: "-10px -10px -10px 0" }} aria-label="Edit suggestion">
          <Pencil size={15} />
        </button>
      </div>
    );
  }
  return (
    <div {...drag} className="flex items-start gap-2.5 py-2">
      <span className="w-[3px] self-stretch rounded mt-0.5" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="font-body text-sm font-medium leading-snug" style={{ color: post.posted ? UI.inkSoft : UI.ink, textDecoration: post.posted ? "line-through" : "none" }}>{post.title}</div>
        <span className="inline-flex items-center gap-1.5 font-body text-xs mt-1" style={{ color: UI.inkSoft }}>
          <CategoryDot category={post.category} />
          {categoryLabel(post.category)}
          {post.posted && " · Posted"}
        </span>
      </div>
      <button
        onClick={() => onTogglePosted(post)}
        className="press-fx flex items-center justify-center flex-shrink-0"
        style={{ color: post.posted ? "#0F9D58" : UI.inkSoft, width: 44, height: 44, margin: "-10px 0" }}
        aria-pressed={!!post.posted}
        aria-label={post.posted ? "Mark as not posted" : "Mark as posted"}
        title={post.posted ? "Posted" : "Mark as posted"}
      >
        {post.posted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>
      <button onClick={() => onEdit(post)} className="press-fx flex items-center justify-center flex-shrink-0" style={{ color: UI.inkSoft, width: 44, height: 44, margin: "-10px -10px -10px 0" }} aria-label="Edit post">
        <Pencil size={15} />
      </button>
    </div>
  );
}

function usePostsByDate(posts) {
  // Keyed by the full date, not the day number, so a post that's briefly in
  // the list from another month can never be drawn on the wrong day.
  return useMemo(() => {
    const map = {};
    posts.forEach((p) => { (map[p.date] ||= []).push(p); });
    return map;
  }, [posts]);
}

function dayAriaLabel(dateKey, holiday, count) {
  const date = new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return `${date}${holiday ? `, ${holiday}` : ""}, ${count ? `${count} post${count === 1 ? "" : "s"}` : "nothing planned"}`;
}

// A post's title as a one-line chip — what the month grid shows per post on
// wider screens, where there's room for more than a dot. Draggable there.
function PostChip({ post, draggable }) {
  const color = CATEGORIES[post.category]?.color || UI.inkSoft;
  const suggested = post.status === "suggested";
  return (
    <span
      {...(draggable ? postDragProps(post) : {})}
      className="block truncate rounded px-1 font-body text-[10.5px] leading-[16px] text-left"
      style={{
        background: suggested ? UI.card : mixWithWhite(color, 0.85),
        border: suggested ? `1px dashed ${color}` : "1px solid transparent",
        color: post.posted ? UI.inkSoft : UI.ink,
        textDecoration: post.posted ? "line-through" : "none",
        cursor: draggable ? "grab" : undefined,
      }}
      title={post.title}
    >
      {post.title}
    </span>
  );
}

function MonthView({ posts, focusMonth, todayKey, holidayLookup, selectedDay, onDayClick, dnd }) {
  const postsByDate = usePostsByDate(posts);
  const cells = monthWeeks(monthKeyOf(focusMonth)).flat();

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `2px solid ${UI.ink}` }}>
      <div className="grid grid-cols-7" style={{ background: UI.stone }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center font-mono text-[10.5px] py-1.5" style={{ color: UI.inkSoft }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((dateKey, i) => {
          const cellStyle = {
            borderTop: `1px solid ${UI.line}`,
            borderRight: (i + 1) % 7 === 0 ? "none" : `1px solid ${UI.line}`,
          };
          if (!dateKey) return <div key={i} className="aspect-square" style={cellStyle} />;

          const d = Number(dateKey.slice(8));
          const dayPosts = postsByDate[dateKey] || [];
          const holiday = holidayLookup.get(dateKey);
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDay;
          const isPast = dateKey < todayKey;
          const isDrop = dnd?.dropTarget === dateKey;
          const firstConfirmed = dayPosts.find((p) => p.status === "confirmed");
          const tint = firstConfirmed ? (CATEGORIES[firstConfirmed.category]?.color || UI.inkSoft) + "14" : undefined;
          // A div rather than a <button>: the chips inside are draggable, and
          // Firefox won't start a drag from inside a button.
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => onDayClick(dateKey)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDayClick(dateKey); } }}
              aria-label={dayAriaLabel(dateKey, holiday, dayPosts.length)}
              aria-pressed={isSelected}
              title={holiday || undefined}
              className="aspect-square flex flex-col items-center justify-center gap-1 relative cursor-pointer overflow-hidden sm:items-stretch sm:justify-start sm:gap-0.5 sm:p-1"
              style={{
                ...cellStyle,
                background: isDrop ? mixWithWhite(ACCENT, 0.8) : isToday ? mixWithWhite(ACCENT, 0.9) : tint,
                boxShadow: isSelected || isDrop ? `inset 0 0 0 2px ${ACCENT}` : "none",
              }}
              {...(dnd?.enabled ? dnd.dropProps(dateKey) : {})}
            >
              <span className="text-xs sm:px-0.5" style={{ fontWeight: isToday ? 700 : 400, color: isToday ? ACCENT : isPast ? UI.inkSoft : UI.ink }}>{d}</span>
              {holiday && (
                <span className="absolute rounded-full" style={{ top: 4, right: 4, width: 5, height: 5, background: ACCENT }} />
              )}
              {dayPosts.length > 0 && (
                <>
                  <div className="flex items-center gap-0.5 sm:hidden">
                    {dayPosts.slice(0, 3).map((p) => <CategoryDot key={p.id} category={p.category} size={5} hollow={p.status === "suggested"} />)}
                    {dayPosts.length > 1 && <span className="font-bold" style={{ fontSize: "8.5px", color: UI.inkSoft, marginLeft: 2 }}>{dayPosts.length}</span>}
                  </div>
                  <div className="hidden sm:flex flex-col gap-0.5 min-w-0">
                    {dayPosts.slice(0, 2).map((p) => <PostChip key={p.id} post={p} draggable={!!dnd?.enabled} />)}
                    {dayPosts.length > 2 && (
                      <span className="font-body text-[10px] font-bold px-0.5" style={{ color: UI.inkSoft }}>+{dayPosts.length - 2} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Seven columns of post cards for one week of the month on screen — the
// view for arranging a week, with room to read titles and drag between days.
// Pages through this month's weeks only; the month arrows move further.
function WeekView({ posts, focusMonth, weekIndex, setWeekIndex, todayKey, holidayLookup, onAdd, handlers, dnd }) {
  const postsByDate = usePostsByDate(posts);
  const weeks = monthWeeks(monthKeyOf(focusMonth));
  const index = Math.min(Math.max(weekIndex, 0), weeks.length - 1);
  const week = weeks[index];
  const inMonth = week.filter(Boolean);
  const navButton = { border: `1.5px solid ${UI.line}`, width: 36, height: 36 };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setWeekIndex(index - 1)} disabled={index === 0} className="press-fx flex items-center justify-center rounded-lg disabled:opacity-30" style={navButton} aria-label="Previous week">
          <ChevronLeft size={15} color={UI.ink} />
        </button>
        <span className="font-body text-sm font-semibold" style={{ color: UI.ink }}>
          Week of {formatDateRange(inMonth[0], inMonth[inMonth.length - 1])}
        </span>
        <button type="button" onClick={() => setWeekIndex(index + 1)} disabled={index === weeks.length - 1} className="press-fx flex items-center justify-center rounded-lg disabled:opacity-30" style={navButton} aria-label="Next week">
          <ChevronRight size={15} color={UI.ink} />
        </button>
      </div>

      <div className="grid grid-cols-7 rounded-xl overflow-hidden" style={{ border: `2px solid ${UI.ink}` }}>
        {week.map((dateKey, i) => {
          const colStyle = { borderRight: i === 6 ? "none" : `1px solid ${UI.line}`, minHeight: 280 };
          if (!dateKey) return <div key={i} style={{ ...colStyle, background: UI.stone }} />;

          const date = new Date(dateKey + "T00:00:00");
          const dayPosts = postsByDate[dateKey] || [];
          const holiday = holidayLookup.get(dateKey);
          const isToday = dateKey === todayKey;
          const isDrop = dnd?.dropTarget === dateKey;
          return (
            <div
              key={dateKey}
              className="flex flex-col min-w-0"
              style={{ ...colStyle, background: isDrop ? mixWithWhite(ACCENT, 0.88) : isToday ? mixWithWhite(ACCENT, 0.95) : UI.card }}
              aria-label={dayAriaLabel(dateKey, holiday, dayPosts.length)}
              {...(dnd?.enabled ? dnd.dropProps(dateKey) : {})}
            >
              <div className="px-2 py-1.5" style={{ background: UI.stone, borderBottom: `1px solid ${UI.line}` }}>
                <div className="font-mono text-[10.5px] uppercase" style={{ color: UI.inkSoft }}>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                <div className="font-body text-sm font-bold" style={{ color: isToday ? ACCENT : dateKey < todayKey ? UI.inkSoft : UI.ink }}>{date.getDate()}</div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 p-1.5">
                {holiday && (
                  <span className="font-body text-[10.5px] font-semibold rounded px-1.5 py-0.5 truncate" style={{ background: mixWithWhite(ACCENT, 0.9), color: ACCENT }} title={holiday}>
                    {holiday}
                  </span>
                )}
                {dayPosts.map((post) => <WeekCard key={post.id} post={post} draggable={!!dnd?.enabled} {...handlers} />)}
                {dateKey >= todayKey && (
                  <button
                    type="button"
                    onClick={() => onAdd(dateKey)}
                    className="press-fx mt-auto rounded-md font-body text-xs font-bold"
                    style={{ minHeight: 32, color: ACCENT, border: `1px dashed ${UI.line}` }}
                    aria-label={`Plan a post on ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="font-body text-xs text-center mt-2.5" style={{ color: UI.inkSoft }}>Drag a post onto another day to move it</p>
    </div>
  );
}

function WeekCard({ post, draggable, onConfirm, onDismiss, onEdit, onTogglePosted }) {
  const color = CATEGORIES[post.category]?.color || UI.inkSoft;
  const suggested = post.status === "suggested";
  const iconButton = { width: 28, height: 28 };
  return (
    <div
      {...(draggable ? postDragProps(post) : {})}
      className="rounded-md p-1.5"
      style={{
        background: suggested ? mixWithWhite(ACCENT, 0.94) : mixWithWhite(color, 0.9),
        border: suggested ? `1.5px dashed ${ACCENT}` : `1px solid ${mixWithWhite(color, 0.6)}`,
        cursor: draggable ? "grab" : undefined,
      }}
    >
      <button type="button" onClick={() => onEdit(post)} className="block w-full text-left" title="Edit">
        <span
          className="block font-body text-xs font-medium leading-snug line-clamp-3 break-words"
          style={{ color: post.posted ? UI.inkSoft : UI.ink, textDecoration: post.posted ? "line-through" : "none" }}
        >
          {post.title}
        </span>
        <span className="flex items-center gap-1 mt-1 font-body text-[10.5px] truncate" style={{ color: UI.inkSoft }}>
          <CategoryDot category={post.category} size={6} hollow={suggested} />
          {suggested ? "Suggested" : categoryLabel(post.category)}
        </span>
      </button>
      <div className="flex justify-end gap-0.5 mt-0.5">
        {suggested ? (
          <>
            <button type="button" onClick={() => onConfirm(post.id)} className="press-fx flex items-center justify-center rounded" style={{ ...iconButton, color: WHITE, background: ACCENT }} aria-label="Confirm suggestion" title="Confirm">
              <Check size={14} />
            </button>
            <button type="button" onClick={() => onDismiss(post)} className="press-fx flex items-center justify-center rounded" style={{ ...iconButton, color: UI.inkSoft }} aria-label="Dismiss suggestion" title="Dismiss">
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onTogglePosted(post)}
            className="press-fx flex items-center justify-center"
            style={{ ...iconButton, color: post.posted ? "#0F9D58" : UI.inkSoft }}
            aria-pressed={!!post.posted}
            aria-label={post.posted ? "Mark as not posted" : "Mark as posted"}
            title={post.posted ? "Posted" : "Mark as posted"}
          >
            {post.posted ? <CheckCircle2 size={15} /> : <Circle size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

// Shared bottom-sheet / dialog chrome for the planner's modals. The body is a
// form so Enter in a text field saves, and Escape closes like the backdrop does.
function ModalShell({ title, subtitle, onClose, onSubmit, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop fixed inset-0 flex items-end sm:items-center justify-center sm:p-6" style={{ background: "rgba(27,36,48,0.45)", zIndex: 100 }} onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-sheet rounded-t-2xl sm:rounded-2xl w-full"
        style={{ maxWidth: 420, background: UI.card, border: `2.5px solid ${UI.ink}`, boxShadow: "0 20px 50px rgba(27,36,48,0.25)", maxHeight: "90dvh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="font-display font-bold text-base" style={{ color: UI.ink }}>{title}</h2>
            {subtitle && <p className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="press-fx flex items-center justify-center" style={{ color: UI.inkSoft, minWidth: 44, minHeight: 44, margin: "-13px -13px -13px 0" }} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </form>
    </div>
  );
}

function FieldLabel({ children }) {
  return <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>{children}</span>;
}

function CategoryPicker({ value, onChange }) {
  return (
    <div>
      <FieldLabel>CATEGORY</FieldLabel>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Category">
        {CATEGORY_KEYS.map((key) => {
          const c = CATEGORIES[key];
          const on = value === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(key)}
              className="press-fx flex items-center justify-center gap-1.5 rounded-lg font-body text-xs font-bold transition"
              style={{
                minHeight: 44,
                borderStyle: "solid",
                borderWidth: on ? 2 : 1.5,
                borderColor: on ? c.color : UI.line,
                background: on ? mixWithWhite(c.color, 0.88) : "transparent",
              }}
            >
              <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: c.color }} />
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const PRIMARY_BUTTON_STYLE = { minHeight: 44, background: ACCENT, color: WHITE, border: `2px solid ${UI.ink}`, boxShadow: `2px 2px 0 ${UI.ink}` };

function RecurringTopicModal({ editing, setEditing, onSave, onClose }) {
  return (
    <ModalShell title={editing.id ? "Edit recurring topic" : "Recurring topic"} subtitle="Repeats every month, on the same day" onClose={onClose} onSubmit={onSave}>
      <div className="px-6 py-4 grid gap-4">
        <label className="block">
          <FieldLabel>TITLE</FieldLabel>
          <input
            className="input"
            value={editing.title}
            onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
            placeholder="This or That"
            maxLength={200}
            autoFocus
          />
        </label>

        <label className="block">
          <FieldLabel>DAY OF MONTH</FieldLabel>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            className="input"
            value={editing.dayOfMonth}
            onChange={(e) => setEditing((f) => ({ ...f, dayOfMonth: e.target.value }))}
          />
          <span className="font-body text-xs mt-1 block" style={{ color: UI.inkSoft }}>
            In shorter months, this lands on the last day instead.
          </span>
        </label>

        <CategoryPicker value={editing.category} onChange={(category) => setEditing((f) => ({ ...f, category }))} />
      </div>

      <div className="px-6 pb-5">
        {editing.id && (
          <p className="font-body text-xs mb-3" style={{ color: UI.inkSoft }}>
            Changes apply to months you haven't opened yet. Posts already on your calendar stay as they are.
          </p>
        )}
        <button type="submit" disabled={!editing.title.trim()} className="press-fx w-full rounded-lg font-body font-bold text-sm transition disabled:opacity-50" style={PRIMARY_BUTTON_STYLE}>
          {editing.id ? "Save changes" : "Add recurring topic"}
        </button>
      </div>
    </ModalShell>
  );
}

function IdeaModal({ editing, setEditing, onSave, onClose }) {
  return (
    <ModalShell title="Save an idea" subtitle="Keep it here until you're ready to plan it" onClose={onClose} onSubmit={onSave}>
      <div className="px-6 py-4 grid gap-4">
        <label className="block">
          <FieldLabel>IDEA</FieldLabel>
          <input
            className="input"
            value={editing.title}
            onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
            placeholder="Best coffee shops near downtown"
            maxLength={200}
            autoFocus
          />
        </label>

        <label className="block">
          <FieldLabel>TARGET DATE (OPTIONAL)</FieldLabel>
          <input
            type="date"
            className="input"
            value={editing.targetDate}
            onChange={(e) => setEditing((f) => ({ ...f, targetDate: e.target.value }))}
          />
        </label>

        <CategoryPicker value={editing.category} onChange={(category) => setEditing((f) => ({ ...f, category }))} />
      </div>

      <div className="px-6 pb-5">
        <button type="submit" disabled={!editing.title.trim()} className="press-fx w-full rounded-lg font-body font-bold text-sm transition disabled:opacity-50" style={PRIMARY_BUTTON_STYLE}>
          Save idea
        </button>
      </div>
    </ModalShell>
  );
}

function PostModal({ editing, setEditing, onSave, onDelete, onCreatePost, onClose }) {
  const dateLabel = editing.date
    ? new Date(`${editing.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    : "";
  const isSuggestion = editing.status === "suggested";
  const canSave = !!editing.title.trim() && /^\d{4}-\d{2}-\d{2}$/.test(editing.date || "");
  const title = !editing.id ? "Plan a post" : isSuggestion ? "Edit suggestion" : "Edit post";
  return (
    <ModalShell title={title} subtitle={dateLabel} onClose={onClose} onSubmit={() => canSave && onSave()}>
      <div className="px-6 py-4 grid gap-4">
        <label className="block">
          <FieldLabel>TITLE</FieldLabel>
          <input
            className="input"
            value={editing.title}
            onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
            placeholder="419 Tall Oaks Dr — Just Listed"
            maxLength={200}
            autoFocus
          />
        </label>

        <label className="block">
          <FieldLabel>DATE</FieldLabel>
          <input
            type="date"
            className="input"
            value={editing.date}
            onChange={(e) => setEditing((f) => ({ ...f, date: e.target.value }))}
          />
        </label>

        <CategoryPicker value={editing.category} onChange={(category) => setEditing((f) => ({ ...f, category }))} />

        {editing.id && !isSuggestion && (
          <label className="flex items-center gap-2 cursor-pointer" style={{ minHeight: 44 }}>
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
            disabled={!canSave}
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
          <button type="submit" disabled={!canSave} className="press-fx flex-1 rounded-lg font-body font-bold text-sm transition disabled:opacity-50" style={PRIMARY_BUTTON_STYLE}>
            {!editing.id ? "Add to calendar" : isSuggestion ? "Confirm & save" : "Save changes"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

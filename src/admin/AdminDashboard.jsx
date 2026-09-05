import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Users, CreditCard, DollarSign, UserPlus, Download, MoreVertical, X, ArrowLeft } from "lucide-react";
import { UI, ACCENT, WHITE, ERROR } from "../shared.jsx";
import { api } from "../auth/AuthContext.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

function formatCents(cents) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Turns an event_type + its JSON details blob into one short, readable
// line — every event type logged by functions/_lib/activity.mjs's
// logEvent() has a case here.
function describeEvent(eventType, details) {
  const d = details || {};
  switch (eventType) {
    case "signup": return "created their account";
    case "login": return "logged in";
    case "link_updated": return `saved ${d.linkCount ?? 0} link${d.linkCount === 1 ? "" : "s"} on their Key Link page`;
    case "listing_created": return `added a listing${d.address ? ` — ${d.address}` : ""}`;
    case "subscription_changed": return `${d.change || "changed plan"}: ${d.fromTier || "?"} → ${d.toTier || "?"}`;
    case "status_change": return `account status: ${d.from || "?"} → ${d.to || "?"}`;
    case "password_reset_triggered": return "password reset email sent";
    case "account_deleted": return "account deleted by admin";
    case "page_view": return `viewed their public Key Link page${d.handle ? ` (/u/${d.handle})` : ""}`;
    case "welcome_email_failed": return `welcome email failed to send${d.error ? ` — ${d.error}` : ""}`;
    default: return "";
  }
}

const STATUS_COLORS = {
  active: { bg: "#E4F5E9", fg: "#1E7A44" },
  disabled: { bg: "#F5E4E4", fg: "#B23A3A" },
  suspended: { bg: "#FBF0DA", fg: "#9A6A0C" },
};

function StatusPill({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.active;
  return (
    <span
      className="font-body text-[0.65rem] font-semibold rounded-full px-2.5 py-1 capitalize"
      style={{ background: c.bg, color: c.fg }}
    >
      {status}
    </span>
  );
}

function TierPill({ tier }) {
  return (
    <span
      className="font-body text-[0.65rem] font-semibold rounded-full px-2.5 py-1 capitalize"
      style={{ background: tier === "paid" ? "#E3EAFF" : UI.stone, color: tier === "paid" ? "#1D3FBF" : UI.inkSoft }}
    >
      {tier}
    </span>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border p-5 flex items-start gap-4" style={{ background: UI.card, borderColor: UI.line }}>
      <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 40, height: 40, background: UI.stone }}>
        <Icon size={18} color={UI.ink} />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[0.65rem] uppercase tracking-wide" style={{ color: UI.inkSoft }}>{label}</p>
        <p className="font-display font-bold text-2xl truncate" style={{ color: UI.ink }}>{value}</p>
      </div>
    </div>
  );
}

function ActionsMenu({ user, onAction }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (menuRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    // Any ancestor scrolling (the table's own horizontal scroll included)
    // would leave a portaled menu pointing at empty space — closing it is
    // simpler and safer than tracking the button's position live.
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  const choose = (action, extra) => {
    setOpen(false);
    onAction(user, action, extra);
  };

  const toggleOpen = () => {
    if (!open) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 200;
      setPos({
        top: rect.bottom + 4,
        left: Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={buttonRef}
        aria-label="Actions"
        onClick={toggleOpen}
        className="flex items-center justify-center rounded-lg transition hover:opacity-70"
        style={{ width: 40, height: 40, color: UI.ink }}
      >
        <MoreVertical size={16} />
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="rounded-xl border overflow-hidden py-1 font-body text-sm"
          style={{
            position: "fixed", top: pos.top, left: pos.left, zIndex: 50,
            background: WHITE, borderColor: UI.line, minWidth: 200, boxShadow: "0 8px 24px rgba(27,36,48,0.18)",
          }}
        >
          <div className="px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-wide" style={{ color: UI.inkSoft }}>Set tier</div>
          {["free", "paid"].map((t) => (
            <button
              key={t}
              onClick={() => choose("set_tier", t)}
              disabled={user.tier === t}
              className="w-full text-left px-3 py-2 capitalize disabled:opacity-40"
              style={{ color: UI.ink }}
              onMouseEnter={(e) => (e.currentTarget.style.background = UI.stone)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {t}
            </button>
          ))}
          <div className="my-1 border-t" style={{ borderColor: UI.line }} />
          {user.accountStatus !== "active" && (
            <button onClick={() => choose("set_status", "active")} className="w-full text-left px-3 py-2" style={{ color: UI.ink }}
              onMouseEnter={(e) => (e.currentTarget.style.background = UI.stone)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              Reactivate account
            </button>
          )}
          {user.accountStatus !== "disabled" && (
            <button onClick={() => choose("set_status", "disabled")} className="w-full text-left px-3 py-2" style={{ color: ERROR }}
              onMouseEnter={(e) => (e.currentTarget.style.background = UI.stone)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              Disable account
            </button>
          )}
          {user.accountStatus !== "suspended" && (
            <button onClick={() => choose("set_status", "suspended")} className="w-full text-left px-3 py-2" style={{ color: ERROR }}
              onMouseEnter={(e) => (e.currentTarget.style.background = UI.stone)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              Suspend account
            </button>
          )}
          <div className="my-1 border-t" style={{ borderColor: UI.line }} />
          <button onClick={() => choose("reset_password")} className="w-full text-left px-3 py-2" style={{ color: UI.ink }}
            onMouseEnter={(e) => (e.currentTarget.style.background = UI.stone)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            Send password reset email
          </button>
          <button onClick={() => choose("view_activity")} className="w-full text-left px-3 py-2" style={{ color: UI.ink }}
            onMouseEnter={(e) => (e.currentTarget.style.background = UI.stone)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            View activity
          </button>
          <div className="my-1 border-t" style={{ borderColor: UI.line }} />
          <button onClick={() => choose("confirm_delete")} className="w-full text-left px-3 py-2 font-semibold" style={{ color: ERROR }}
            onMouseEnter={(e) => (e.currentTarget.style.background = UI.stone)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            Delete account
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

function UserActivityModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api(`/api/admin/user-activity?userId=${userId}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: "rgba(27,36,48,0.55)" }} onClick={onClose}>
      <div
        className="modal-sheet rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85dvh] sm:max-h-[80vh] overflow-y-auto p-6"
        style={{ background: WHITE, paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg" style={{ color: UI.ink }}>User activity</h3>
          <button onClick={onClose} aria-label="Close" className="press-fx flex items-center justify-center" style={{ color: UI.inkSoft, width: 44, height: 44, margin: "-12px -12px -12px 0" }}><X size={20} /></button>
        </div>

        {error && <p className="font-body text-sm" style={{ color: ERROR }}>{error}</p>}
        {!error && !data && <p className="font-body text-sm" style={{ color: UI.inkSoft }}>Loading…</p>}

        {data && (
          <div className="grid gap-5">
            <div>
              <p className="font-body text-sm font-semibold" style={{ color: UI.ink }}>{data.user.email}</p>
              <p className="font-body text-xs" style={{ color: UI.inkSoft }}>
                {data.user.fullName} · Signed up {formatDate(data.user.signupDate)} · Last login {formatDateTime(data.user.lastLoginAt)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: UI.stone }}>
                <p className="font-mono text-[0.6rem] uppercase" style={{ color: UI.inkSoft }}>Listings created</p>
                <p className="font-display font-bold text-xl" style={{ color: UI.ink }}>{data.listingsCreated}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: UI.stone }}>
                <p className="font-mono text-[0.6rem] uppercase" style={{ color: UI.inkSoft }}>Zillow pulls used</p>
                <p className="font-display font-bold text-xl" style={{ color: UI.ink }}>{data.zillowPullsUsed}</p>
              </div>
            </div>

            <div>
              <p className="font-body text-xs font-semibold mb-2" style={{ color: UI.ink }}>Recent posts</p>
              {data.recentPosts.length === 0 && <p className="font-body text-xs" style={{ color: UI.inkSoft }}>No posts yet.</p>}
              <ul className="grid gap-1.5">
                {data.recentPosts.map((p, i) => (
                  <li key={i} className="font-body text-xs flex justify-between gap-2" style={{ color: UI.ink }}>
                    <span className="truncate">{p.headline || p.category}</span>
                    <span className="flex-shrink-0" style={{ color: UI.inkSoft }}>{formatDate(p.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-body text-xs font-semibold mb-2" style={{ color: UI.ink }}>Recent events</p>
              {data.recentEvents.length === 0 && <p className="font-body text-xs" style={{ color: UI.inkSoft }}>No events yet.</p>}
              <ul className="grid gap-1.5">
                {data.recentEvents.map((e, i) => (
                  <li key={i} className="font-body text-xs flex justify-between gap-2" style={{ color: UI.ink }}>
                    <span className="truncate">
                      <span className="font-semibold capitalize">{e.eventType.replace(/_/g, " ")}</span>
                      {" — "}{describeEvent(e.eventType, e.details)}
                    </span>
                    <span className="flex-shrink-0" style={{ color: UI.inkSoft }}>{formatDate(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteAccountModal({ user, onClose, onDeleted }) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const matches = confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

  const submit = async () => {
    if (!matches || busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/user-action", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, action: "delete_account", confirmEmail: user.email }),
      });
      onDeleted();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: "rgba(27,36,48,0.55)" }} onClick={onClose}>
      <div className="modal-sheet rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6" style={{ background: WHITE, paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-lg" style={{ color: ERROR }}>Delete account</h3>
          <button onClick={onClose} aria-label="Close" className="press-fx flex items-center justify-center" style={{ color: UI.inkSoft, width: 44, height: 44, margin: "-12px -12px -12px 0" }}><X size={20} /></button>
        </div>
        <p className="font-body text-sm mb-4" style={{ color: UI.ink }}>
          This permanently deletes <strong>{user.email}</strong> and everything tied to it — brand kit, Key Link page, and posts. This can't be undone.
        </p>
        <label className="block mb-4">
          <span className="font-mono text-[0.65rem] uppercase tracking-wide" style={{ color: UI.inkSoft }}>
            Type the email to confirm
          </span>
          <input
            type="text"
            autoFocus
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={user.email}
            className="w-full mt-1.5 rounded-lg px-3 py-2 font-body text-sm border"
            style={{ borderColor: UI.line, color: UI.ink }}
          />
        </label>
        {error && <p className="font-body text-sm mb-3" style={{ color: ERROR }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="press-fx font-body text-sm font-semibold rounded-full px-4" style={{ color: UI.inkSoft, minHeight: 44 }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!matches || busy}
            className="press-fx font-body text-sm font-semibold rounded-full px-4 disabled:opacity-40"
            style={{ background: ERROR, color: WHITE, minHeight: 44 }}
          >
            {busy ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityFeed({ refreshKey }) {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api("/api/admin/activity-log")
      .then((d) => { if (!cancelled) setEvents(d.events); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  return (
    <div className="rounded-2xl border p-5 sm:p-6" style={{ background: UI.card, borderColor: UI.line }}>
      <h2 className="font-display font-bold text-lg mb-4" style={{ color: UI.ink }}>Recent activity</h2>
      {error && <p className="font-body text-sm" style={{ color: ERROR }}>{error}</p>}
      {!error && !events && <p className="font-body text-sm" style={{ color: UI.inkSoft }}>Loading…</p>}
      {events && events.length === 0 && <p className="font-body text-sm" style={{ color: UI.inkSoft }}>No activity yet.</p>}
      {events && events.length > 0 && (
        <ul className="grid gap-3">
          {events.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 font-body text-sm">
              <span style={{ color: UI.ink }}>
                <span className="font-semibold capitalize">{e.eventType.replace(/_/g, " ")}</span>
                {(e.email || e.details?.email) && <span style={{ color: UI.inkSoft }}> — {e.email || e.details.email}</span>}
                <span style={{ color: UI.inkSoft }}> ({describeEvent(e.eventType, e.details)})</span>
              </span>
              <span className="flex-shrink-0 font-mono text-xs" style={{ color: UI.inkSoft }}>{timeAgo(e.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminDashboard({ onExit }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activityUserId, setActivityUserId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    api("/api/admin/stats").then(setStats).catch((e) => setError(e.message));
  }, [feedKey]);

  const loadUsers = useCallback(() => {
    const params = new URLSearchParams({ q, tier, status, page: String(page) });
    api(`/api/admin/users?${params}`)
      .then((d) => { setUsers(d.users); setTotalCount(d.totalCount); })
      .catch((e) => setError(e.message));
  }, [q, tier, status, page]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 250);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const handleAction = async (user, action, extra) => {
    setActionError("");
    try {
      const body = { userId: user.id, action };
      if (action === "set_tier") body.tier = extra;
      if (action === "set_status") body.status = extra;

      if (action === "view_activity") {
        setActivityUserId(user.id);
        return;
      }

      if (action === "confirm_delete") {
        setDeleteTarget(user);
        return;
      }

      await api("/api/admin/user-action", { method: "POST", body: JSON.stringify(body) });
      loadUsers();
      setFeedKey((k) => k + 1);
    } catch (e) {
      setActionError(e.message);
    }
  };

  const pageCount = Math.max(1, Math.ceil(totalCount / 50));

  return (
    <div className="min-h-dvh" style={{ background: UI.page }}>
      <header className="sticky top-0 z-30" style={{ borderBottom: `2px solid ${UI.ink}`, background: UI.page }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onExit} aria-label="Back to app" className="flex items-center justify-center rounded-lg" style={{ color: UI.ink }}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display font-bold text-xl" style={{ color: UI.ink }}>Admin Dashboard</h1>
          </div>
          <a
            href="/api/admin/users-export"
            className="flex items-center gap-2 font-body text-sm font-semibold rounded-full px-4 py-2 transition hover:opacity-90"
            style={{ background: ACCENT, color: WHITE }}
          >
            <Download size={15} /> Export CSV
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 grid gap-6">
        {error && <p className="font-body text-sm" style={{ color: ERROR }}>{error}</p>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total users" value={stats ? stats.totalUsers.toLocaleString() : "…"} />
          <StatCard icon={CreditCard} label="Active subscribers" value={stats ? stats.activeSubscribers.toLocaleString() : "…"} />
          <StatCard icon={DollarSign} label="MRR" value={stats ? formatCents(stats.mrrCents) : "…"} />
          <StatCard icon={UserPlus} label="New signups (mo.)" value={stats ? stats.newSignupsThisMonth.toLocaleString() : "…"} />
        </div>

        <div className="rounded-2xl border p-4 sm:p-5 flex flex-wrap items-center gap-3" style={{ background: UI.card, borderColor: UI.line }}>
          <input
            type="text"
            placeholder="Search by email…"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            className="flex-1 min-w-[180px] rounded-lg px-3 py-2 font-body text-sm border"
            style={{ borderColor: UI.line, color: UI.ink }}
          />
          <select
            value={tier}
            onChange={(e) => { setPage(1); setTier(e.target.value); }}
            className="rounded-lg px-3 py-2 font-body text-sm border"
            style={{ borderColor: UI.line, color: UI.ink }}
          >
            <option value="">All tiers</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <select
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            className="rounded-lg px-3 py-2 font-body text-sm border"
            style={{ borderColor: UI.line, color: UI.ink }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {actionError && <p className="font-body text-sm" style={{ color: ERROR }}>{actionError}</p>}

        <div className="rounded-2xl border overflow-hidden" style={{ background: UI.card, borderColor: UI.line }}>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm" style={{ minWidth: 720 }}>
              <thead>
                <tr style={{ background: UI.stone }}>
                  {["Email", "Signup date", "Last login", "Tier", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-mono text-[0.65rem] uppercase tracking-wide" style={{ color: UI.inkSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users === null && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: UI.inkSoft }}>Loading…</td></tr>
                )}
                {users !== null && users.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: UI.inkSoft }}>No users match these filters.</td></tr>
                )}
                {users?.map((u) => (
                  <tr key={u.id} className="border-t" style={{ borderColor: UI.line }}>
                    <td className="px-4 py-3" style={{ color: UI.ink }}>{u.email}</td>
                    <td className="px-4 py-3" style={{ color: UI.inkSoft }}>{formatDate(u.signupDate)}</td>
                    <td className="px-4 py-3" style={{ color: UI.inkSoft }}>{formatDateTime(u.lastLoginAt)}</td>
                    <td className="px-4 py-3"><TierPill tier={u.tier} /></td>
                    <td className="px-4 py-3"><StatusPill status={u.accountStatus} /></td>
                    <td className="px-4 py-3 text-right"><ActionsMenu user={u} onAction={handleAction} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t font-body text-xs" style={{ borderColor: UI.line, color: UI.inkSoft }}>
              <span>Page {page} of {pageCount} · {totalCount} users</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40 underline">Prev</button>
                <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40 underline">Next</button>
              </div>
            </div>
          )}
        </div>

        <ActivityFeed refreshKey={feedKey} />
      </div>

      {activityUserId && <UserActivityModal userId={activityUserId} onClose={() => setActivityUserId(null)} />}
      {deleteTarget && (
        <DeleteAccountModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            loadUsers();
            setFeedKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

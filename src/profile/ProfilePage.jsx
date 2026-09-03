import { useState, useEffect } from "react";
import { User, Building2, Check, Download, Trash2, ImageOff, Loader2, CalendarClock, FileEdit, Pencil } from "lucide-react";
import {
  UI, ACCENT, WHITE, ACCENT_PRESETS, SCRIPT_FONTS, scriptFontCss,
  DEFAULT_HEADSHOT_URL, DEFAULT_LOGO_URL, mixWithWhite,
  useAgentAsset, UploadBox, TopNav,
  loadCalendarEntries, saveCalendarEntries,
  loadPostDrafts, savePostDrafts, writeDraftHandoff,
} from "../shared.jsx";
import { useAuth, api } from "../auth/AuthContext.jsx";

function formatPostDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function PostThumb({ post, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setDeleting(false);
    }
  };

  const filename = `${(post.category || "post").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${post.id}.png`;

  return (
    <div className="rounded-xl overflow-hidden border group relative" style={{ borderColor: UI.line, background: UI.card }}>
      <div className="flex items-center justify-center" style={{ aspectRatio: "4 / 5", background: mixWithWhite(UI.ink, 0.95) }}>
        <img src={post.imageData} alt={post.headline || post.category} className="w-full h-full object-cover" />
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition"
        style={{ background: "rgba(27,36,48,0.55)" }}
      >
        {confirming ? (
          <>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="font-body text-xs font-semibold rounded-full px-3 py-1.5 disabled:opacity-60"
              style={{ background: "#C0392B", color: WHITE }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="font-body text-xs font-semibold rounded-full px-3 py-1.5"
              style={{ background: WHITE, color: UI.ink }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              aria-label="Download"
              onClick={() => downloadDataUrl(post.imageData, filename)}
              className="flex items-center justify-center rounded-full transition hover:opacity-85"
              style={{ width: 32, height: 32, background: WHITE, color: UI.ink }}
            >
              <Download size={14} />
            </button>
            <button
              aria-label="Delete"
              onClick={() => setConfirming(true)}
              className="flex items-center justify-center rounded-full transition hover:opacity-85"
              style={{ width: 32, height: 32, background: WHITE, color: "#C0392B" }}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
        <span className="font-body text-[0.65rem] font-semibold truncate" style={{ color: UI.inkSoft }}>{post.category || post.template}</span>
        <span className="font-mono text-[0.6rem] flex-shrink-0" style={{ color: UI.inkSoft }}>{formatPostDate(post.createdAt)}</span>
      </div>
    </div>
  );
}

function PostsSection() {
  const [posts, setPosts] = useState(null); // null while loading
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api("/api/posts")
      .then((data) => { if (!cancelled) setPosts(data.posts || []); })
      .catch(() => { if (!cancelled) setError("Couldn't load your posts — try refreshing."); });
    return () => { cancelled = true; };
  }, []);

  const deletePost = async (id) => {
    await api(`/api/posts?id=${id}`, { method: "DELETE" });
    setPosts((p) => p.filter((post) => post.id !== id));
  };

  if (error) {
    return <p className="font-body text-sm py-8 text-center" style={{ color: "#C0392B" }}>{error}</p>;
  }

  if (posts === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin" style={{ color: UI.inkSoft }} />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <ImageOff size={28} style={{ color: UI.inkSoft }} />
        <p className="font-body text-sm mt-3" style={{ color: UI.inkSoft }}>
          Posts you download will show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-body text-xs mb-5" style={{ color: UI.inkSoft }}>
        Every post you've downloaded, newest first. Re-download or remove one below.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post) => (
          <PostThumb key={post.id} post={post} onDelete={deletePost} />
        ))}
      </div>
    </div>
  );
}

const PLANNED_POST_TYPES = {
  listing: { label: "Listing", color: "#0043FF" },
  community: { label: "Community", color: "#0F9D58" },
  other: { label: "Other", color: "#697386" },
};

function formatPlannedDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// Posts saved from the Content Planner — but only the ones a person actually
// wrote themselves. The Planner also seeds days with suggestion-pool prompts
// ("Fill my month") and Community's "Need inspiration" ideas can land here
// too; those aren't real posts someone made, so they're left out of this
// list entirely rather than mixed in with genuine plans.
function PlannedPostsSection() {
  const [entries, setEntries] = useState(() => loadCalendarEntries());

  const plannedPosts = entries
    .filter((e) => e.date && e.source !== "suggestion" && e.source !== "community")
    .sort((a, b) => a.date.localeCompare(b.date));

  const togglePosted = (id) => {
    const next = entries.map((e) => (e.id === id ? { ...e, done: !e.done } : e));
    setEntries(next);
    saveCalendarEntries(next);
  };

  const deletePost = (id) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveCalendarEntries(next);
  };

  if (plannedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <CalendarClock size={28} style={{ color: UI.inkSoft }} />
        <p className="font-body text-sm mt-3" style={{ color: UI.inkSoft }}>
          Posts you plan with a date on the Content Planner will show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-body text-xs mb-5" style={{ color: UI.inkSoft }}>
        Every post you've scheduled on the Content Planner, earliest first.
      </p>
      <ul className="grid gap-2">
        {plannedPosts.map((post) => {
          const t = PLANNED_POST_TYPES[post.type] || PLANNED_POST_TYPES.other;
          return (
            <li
              key={post.id}
              className="flex items-center gap-3 rounded-xl border px-3.5 py-3"
              style={{ borderColor: UI.line, background: UI.card }}
            >
              <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: t.color }} />
              <div className="min-w-0 flex-1">
                <span
                  className="block font-body text-sm font-semibold truncate"
                  style={{ color: post.done ? UI.inkSoft : UI.ink, textDecoration: post.done ? "line-through" : "none" }}
                >
                  {post.title}
                </span>
                <span className="block font-body text-xs" style={{ color: UI.inkSoft }}>
                  {formatPlannedDate(post.date)}{post.time ? ` · ${post.time}` : ""} · {t.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => togglePosted(post.id)}
                className="font-body text-xs font-semibold rounded-full px-3 py-1.5 flex-shrink-0 transition"
                style={{ background: post.done ? UI.stone : mixWithWhite(ACCENT, 0.88), color: post.done ? UI.inkSoft : ACCENT }}
              >
                {post.done ? "Posted" : "Mark posted"}
              </button>
              <button
                aria-label="Delete"
                onClick={() => deletePost(post.id)}
                className="flex items-center justify-center rounded-full flex-shrink-0 transition hover:opacity-70"
                style={{ width: 28, height: 28, color: "#C0392B" }}
              >
                <Trash2 size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const DRAFT_TOOL_LABELS = { listings: "Listing", community: "Community" };

// Posts saved with "Save for later" from the Listing/Community tools —
// the full form someone filled in, minus photos (which only ever live in
// memory), so a person can rough out a batch of posts in one sitting and
// come back to finish each one instead of starting from scratch.
function DraftsSection({ onSwitchTool }) {
  const [drafts, setDrafts] = useState(() => loadPostDrafts());

  const sorted = [...drafts].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });

  const editDraft = (draft) => {
    writeDraftHandoff(draft.id);
    onSwitchTool(draft.tool);
  };

  const deleteDraft = (id) => {
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    savePostDrafts(next);
  };

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <FileEdit size={28} style={{ color: UI.inkSoft }} />
        <p className="font-body text-sm mt-3" style={{ color: UI.inkSoft }}>
          Posts you save for later from Listings or Community will show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-body text-xs mb-5" style={{ color: UI.inkSoft }}>
        Rough out a batch of posts, then come back and finish each one — photos aren't saved, so you'll re-add those.
      </p>
      <ul className="grid gap-2">
        {sorted.map((draft) => (
          <li
            key={draft.id}
            className="flex items-center gap-3 rounded-xl border px-3.5 py-3"
            style={{ borderColor: UI.line, background: UI.card }}
          >
            <div className="min-w-0 flex-1">
              <span className="block font-body text-sm font-semibold truncate" style={{ color: UI.ink }}>
                {draft.label || "Untitled post"}
              </span>
              <span className="block font-body text-xs" style={{ color: UI.inkSoft }}>
                {DRAFT_TOOL_LABELS[draft.tool] || draft.tool}{draft.typeLabel ? ` · ${draft.typeLabel}` : ""}
                {draft.date ? ` · ${formatPlannedDate(draft.date)}` : " · No date set"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => editDraft(draft)}
              className="font-body text-xs font-semibold rounded-full px-3 py-1.5 flex-shrink-0 flex items-center gap-1.5 transition"
              style={{ background: mixWithWhite(ACCENT, 0.88), color: ACCENT }}
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              aria-label="Delete"
              onClick={() => deleteDraft(draft.id)}
              className="flex items-center justify-center rounded-full flex-shrink-0 transition hover:opacity-70"
              style={{ width: 28, height: 28, color: "#C0392B" }}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// A small, non-canvas mockup of the contact band every post carries — lets
// an agent see the effect of a brand-kit change (color, font, logo) without
// switching tools and rebuilding a real post.
function BrandPreview({ data, headshot, logo }) {
  const name = data.agentName || "Your Name, Realtor";
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: UI.line, maxWidth: 340 }}>
      <div
        className="flex flex-col items-center justify-center text-center px-6"
        style={{ aspectRatio: "4 / 3", background: mixWithWhite(data.accentColor, 0.88) }}
      >
        <span className="font-body text-xs font-semibold tracking-wide mb-1" style={{ color: data.accentColor }}>
          JUST LISTED
        </span>
        <span style={{ font: scriptFontCss(data.scriptFont, 34), color: UI.ink, lineHeight: 1.1 }}>
          Open House!
        </span>
      </div>
      <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: BLACK_BAND }}>
        {headshot.img && (
          <img src={headshot.img.src} alt="" className="rounded-full flex-shrink-0" style={{ width: 34, height: 34, objectFit: "cover" }} />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-body text-xs font-semibold truncate" style={{ color: "#FFFFFF" }}>{name}</div>
          <div className="font-body truncate" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.65rem" }}>
            {data.agentPhone || "(555) 123-4567"}{data.brokerageName ? ` · ${data.brokerageName}` : ""}
          </div>
        </div>
        {logo.img && (
          <img src={logo.img.src} alt="" className="flex-shrink-0" style={{ height: 24, width: "auto", objectFit: "contain" }} />
        )}
      </div>
    </div>
  );
}

const BLACK_BAND = "#1B2430";

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>{label}</span>
      <input className="input" {...props} />
    </label>
  );
}

function BrandSection({ brandKit, saveBrandKit }) {
  const [data, setData] = useState(() => ({
    agentName: brandKit?.agentName || "",
    agentPhone: brandKit?.agentPhone || "",
    agentEmail: brandKit?.agentEmail || "",
    brokerageName: brandKit?.brokerageName || "",
    brokerageCity: brandKit?.brokerageCity || "",
    officePhone: brandKit?.officePhone || "",
    website: brandKit?.website || "",
    licenseNumber: brandKit?.licenseNumber || "",
    accentColor: brandKit?.accentColor || "#1B2430",
    scriptFont: brandKit?.scriptFont || SCRIPT_FONTS[0].name,
  }));
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const update = (key) => (e) => { setData((d) => ({ ...d, [key]: e.target.value })); setStatus("idle"); };

  const headshot = useAgentAsset(DEFAULT_HEADSHOT_URL, "Headshot", brandKit?.headshotUrl);
  const logo = useAgentAsset(DEFAULT_LOGO_URL, "Brokerage logo", brandKit?.logoUrl);

  const save = async () => {
    setStatus("saving");
    try {
      await saveBrandKit({
        ...data,
        headshotUrl: headshot.source === "custom" ? headshot.url : null,
        logoUrl: logo.source === "custom" ? logo.url : null,
        onboarded: true,
      });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_auto] gap-8">
      <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          <UploadBox label="HEADSHOT" icon={User} state={headshot} hint="Your photo" />
          <UploadBox label="LOGO" icon={Building2} state={logo} hint="Brokerage logo" />
        </div>
        <Field label="AGENT NAME" value={data.agentName} onChange={update("agentName")} placeholder="Jane Doe, Realtor" />
        <Field label="CELL PHONE" value={data.agentPhone} onChange={update("agentPhone")} placeholder="(555) 123-4567" />
        <Field label="EMAIL" value={data.agentEmail} onChange={update("agentEmail")} placeholder="you@example.com" />
        <Field label="WEBSITE" value={data.website} onChange={update("website")} placeholder="yourname.com" />
        <Field label="BROKERAGE" value={data.brokerageName} onChange={update("brokerageName")} placeholder="Your Brokerage" />
        <Field label="OFFICE CITY" value={data.brokerageCity} onChange={update("brokerageCity")} placeholder="Your City" />
        <Field label="OFFICE PHONE" value={data.officePhone} onChange={update("officePhone")} placeholder="(555) 987-6543" />
        <Field label="LICENSE NUMBER" value={data.licenseNumber} onChange={update("licenseNumber")} placeholder="For required disclosures" />

        <div className="md:col-span-2">
          <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BRAND COLOR</span>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_PRESETS.map((c) => (
              <button key={c} type="button" onClick={() => { setData((d) => ({ ...d, accentColor: c })); setStatus("idle"); }} aria-label={c}
                className="rounded-full transition"
                style={{
                  width: "2rem", height: "2rem", background: c,
                  border: data.accentColor.toLowerCase() === c.toLowerCase() ? `2px solid ${UI.ink}` : "2px solid transparent",
                  boxShadow: data.accentColor.toLowerCase() === c.toLowerCase() ? `0 0 0 2px white, 0 0 0 3px ${UI.ink}` : "none",
                }} />
            ))}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="color" value={data.accentColor} onChange={(e) => { setData((d) => ({ ...d, accentColor: e.target.value })); setStatus("idle"); }}
                style={{ width: "2rem", height: "2rem", padding: 0, border: `1px solid ${UI.line}`, borderRadius: "0.4rem", background: "none" }} />
              <span className="font-mono text-xs" style={{ color: UI.inkSoft }}>Custom</span>
            </label>
          </div>
        </div>

        <div className="md:col-span-2">
          <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SCRIPT FONT</span>
          <select className="input" value={data.scriptFont} onChange={update("scriptFont")}>
            {SCRIPT_FONTS.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>

        <div className="md:col-span-2 flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={status === "saving"}
            className="font-body text-sm font-semibold rounded px-5 py-2.5 transition disabled:opacity-60"
            style={{ background: ACCENT, color: WHITE }}
          >
            {status === "saving" ? "Saving…" : "Save brand settings"}
          </button>
          {status === "saved" && <span className="font-body text-xs flex items-center gap-1" style={{ color: UI.inkSoft }}><Check size={14} /> Saved to your account.</span>}
          {status === "error" && <span className="font-body text-xs" style={{ color: "#C0392B" }}>Couldn't save — try again.</span>}
        </div>
      </div>

      <div>
        <span className="font-mono text-xs block mb-2" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PREVIEW</span>
        <BrandPreview data={data} headshot={headshot} logo={logo} />
        <p className="font-body text-xs mt-2" style={{ color: UI.inkSoft, maxWidth: 340 }}>
          An example of how your contact info appears on every post — real posts use your photos and chosen layout.
        </p>
      </div>
    </div>
  );
}

function AccountSection() {
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setDone(false);
    if (newPassword !== confirm) { setError("New passwords don't match."); return; }
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 max-w-sm">
      {user?.email && (
        <div>
          <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>EMAIL</span>
          <p className="font-body text-sm" style={{ color: UI.ink }}>{user.email}</p>
        </div>
      )}

      {user?.isAdmin && (
        <a
          href="/admin"
          className="font-body text-sm font-semibold rounded px-5 py-2.5 transition justify-self-start"
          style={{ background: UI.stone, color: UI.ink }}
        >
          Open admin dashboard →
        </a>
      )}

      <form onSubmit={submit} className="grid gap-4">
        <h3 className="font-body text-sm font-semibold" style={{ color: UI.ink }}>Change password</h3>
        <Field label="CURRENT PASSWORD" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        <Field label="NEW PASSWORD" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
        <Field label="CONFIRM NEW PASSWORD" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
        {error && <div className="font-body text-xs" style={{ color: "#C0392B" }}>{error}</div>}
        {done && <div className="font-body text-xs" style={{ color: UI.inkSoft }}>Password updated.</div>}
        <button
          type="submit"
          disabled={busy}
          className="font-body text-sm font-semibold rounded px-5 py-2.5 transition disabled:opacity-60 justify-self-start"
          style={{ background: ACCENT, color: WHITE }}
        >
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export function ProfilePage({ onSwitchTool, onGoHome }) {
  const { user, brandKit, logout, saveBrandKit } = useAuth();
  const [tab, setTab] = useState("brand"); // brand | drafts | planned | posts | account

  return (
    <div className="min-h-screen" style={{ background: UI.page }}>
      <TopNav active="profile" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <h1 className="font-display font-bold text-2xl mb-1" style={{ color: UI.ink }}>Profile</h1>
        <p className="font-body text-sm mb-6" style={{ color: UI.inkSoft }}>
          Manage the brand info that appears on every post, and your account settings.
        </p>

        <div className="flex items-center gap-1 p-1 rounded-full mb-6 w-fit" style={{ background: UI.stone }}>
          <button
            onClick={() => setTab("brand")}
            className="px-4 py-1.5 rounded-full font-body text-xs font-semibold transition"
            style={{
              background: tab === "brand" ? UI.card : "transparent",
              color: tab === "brand" ? UI.ink : UI.inkSoft,
              boxShadow: tab === "brand" ? "0 1px 3px rgba(27,36,48,0.15)" : "none",
            }}
          >
            Brand
          </button>
          <button
            onClick={() => setTab("drafts")}
            className="px-4 py-1.5 rounded-full font-body text-xs font-semibold transition"
            style={{
              background: tab === "drafts" ? UI.card : "transparent",
              color: tab === "drafts" ? UI.ink : UI.inkSoft,
              boxShadow: tab === "drafts" ? "0 1px 3px rgba(27,36,48,0.15)" : "none",
            }}
          >
            Drafts
          </button>
          <button
            onClick={() => setTab("planned")}
            className="px-4 py-1.5 rounded-full font-body text-xs font-semibold transition"
            style={{
              background: tab === "planned" ? UI.card : "transparent",
              color: tab === "planned" ? UI.ink : UI.inkSoft,
              boxShadow: tab === "planned" ? "0 1px 3px rgba(27,36,48,0.15)" : "none",
            }}
          >
            Planned Posts
          </button>
          <button
            onClick={() => setTab("posts")}
            className="px-4 py-1.5 rounded-full font-body text-xs font-semibold transition"
            style={{
              background: tab === "posts" ? UI.card : "transparent",
              color: tab === "posts" ? UI.ink : UI.inkSoft,
              boxShadow: tab === "posts" ? "0 1px 3px rgba(27,36,48,0.15)" : "none",
            }}
          >
            Past Posts
          </button>
          <button
            onClick={() => setTab("account")}
            className="px-4 py-1.5 rounded-full font-body text-xs font-semibold transition"
            style={{
              background: tab === "account" ? UI.card : "transparent",
              color: tab === "account" ? UI.ink : UI.inkSoft,
              boxShadow: tab === "account" ? "0 1px 3px rgba(27,36,48,0.15)" : "none",
            }}
          >
            Account
          </button>
        </div>

        <div className="rounded-2xl border p-5 sm:p-8" style={{ background: UI.card, borderColor: UI.line }}>
          {tab === "brand" && <BrandSection brandKit={brandKit} saveBrandKit={saveBrandKit} />}
          {tab === "drafts" && <DraftsSection onSwitchTool={onSwitchTool} />}
          {tab === "planned" && <PlannedPostsSection />}
          {tab === "posts" && <PostsSection />}
          {tab === "account" && <AccountSection />}
        </div>
      </div>
    </div>
  );
}

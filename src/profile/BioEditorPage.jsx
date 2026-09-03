import { useEffect, useState } from "react";
import {
  Plus, X, Loader2, CheckCircle2, RefreshCw, Copy, Check, ExternalLink,
  ChevronDown, ChevronUp, GripVertical, Smartphone, Monitor, RotateCcw, Eye, ImagePlus,
} from "lucide-react";
import { UI, ACCENT, ERROR, WHITE, TopNav, SCRIPT_FONTS, scriptFontCss, DEFAULT_HEADSHOT_URL } from "../shared.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  LINK_TYPES, SOCIAL_TYPES, BioLinksList, textOn, relativeLuminance,
  NAME_SIZES, nameSizePx, THEME_PRESETS, BUTTON_STYLES, bgStyle, resizeImageToDataUrl,
} from "./bioShared.jsx";

const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const CONTENT_TYPES = LINK_TYPES.filter((t) => !SOCIAL_TYPES.has(t.id));
const SOCIAL_LINK_TYPES = LINK_TYPES.filter((t) => SOCIAL_TYPES.has(t.id));
const TAGLINE_MAX = 80;

const DEFAULTS = {
  handle: "", tagline: "", brokerage: "", bgColor: UI.ink, boxColor: "#2E3B4C",
  nameFont: "", nameSize: "md", buttonStyle: "rounded", bgImageUrl: "", bgTint: 40,
};

let linkIdSeq = 0;
function newLinkId() {
  return `new-${Date.now()}-${linkIdSeq++}`;
}

function Section({ number, title, subtitle, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border" style={{ background: UI.card, borderColor: UI.line, overflow: open ? "visible" : "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span>
          <span className="font-display font-bold text-base" style={{ color: UI.ink }}>{number}. {title}</span>
          {subtitle && <span className="font-body text-xs block mt-0.5" style={{ color: UI.inkSoft }}>{subtitle}</span>}
        </span>
        {open ? <ChevronUp size={18} style={{ color: UI.inkSoft }} /> : <ChevronDown size={18} style={{ color: UI.inkSoft }} />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export function BioEditorPage({ onSwitchTool, onGoHome }) {
  const { user, brandKit, logout, saveBrandKit } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [handle, setHandle] = useState(DEFAULTS.handle);
  const [handleError, setHandleError] = useState("");
  const [tagline, setTagline] = useState(DEFAULTS.tagline);
  const [brokerage, setBrokerage] = useState(DEFAULTS.brokerage);
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor);
  const [boxColor, setBoxColor] = useState(DEFAULTS.boxColor);
  const [nameFont, setNameFont] = useState(DEFAULTS.nameFont);
  const [nameSize, setNameSize] = useState(DEFAULTS.nameSize);
  const [buttonStyle, setButtonStyle] = useState(DEFAULTS.buttonStyle);
  const [bgImageUrl, setBgImageUrl] = useState(DEFAULTS.bgImageUrl);
  const [bgTint, setBgTint] = useState(DEFAULTS.bgTint);
  const [bgImageError, setBgImageError] = useState("");
  const [links, setLinks] = useState([]);
  const [contentMenuOpen, setContentMenuOpen] = useState(false);
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState("mobile"); // mobile | desktop
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bio", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Couldn't load your bio page.");
        if (cancelled) return;
        setHandle(data.profile?.handle || DEFAULTS.handle);
        setTagline(data.profile?.tagline || DEFAULTS.tagline);
        setBrokerage(data.profile?.brokerage || brandKit?.brokerageName || DEFAULTS.brokerage);
        setBgColor(data.profile?.bgColor || DEFAULTS.bgColor);
        setBoxColor(data.profile?.boxColor || DEFAULTS.boxColor);
        setNameFont(data.profile?.nameFont || DEFAULTS.nameFont);
        setNameSize(data.profile?.nameSize || DEFAULTS.nameSize);
        setButtonStyle(data.profile?.buttonStyle || DEFAULTS.buttonStyle);
        setBgImageUrl(data.profile?.bgImageUrl || DEFAULTS.bgImageUrl);
        setBgTint(data.profile?.bgTint ?? DEFAULTS.bgTint);
        setLinks(data.links || []);
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const name = brandKit?.agentName || user?.fullName || "";
  useEffect(() => { setNameDraft(name); }, [name]);

  const contentLinks = links.filter((l) => !SOCIAL_TYPES.has(l.type));
  const socialLinks = links.filter((l) => SOCIAL_TYPES.has(l.type));
  const availableContentTypes = CONTENT_TYPES.filter(
    (t) => t.id === "custom" || !links.some((l) => l.type === t.id)
  );
  const availableSocialTypes = SOCIAL_LINK_TYPES.filter((t) => !links.some((l) => l.type === t.id));
  const publicUrl = handle ? `${window.location.origin}/u/${handle}` : "";

  function addLink(type) {
    setLinks((prev) => [
      ...prev,
      { id: newLinkId(), type: type.id, label: type.label, url: "", fetching: false, fetched: false, address: "", price: "", beds: "", baths: "" },
    ]);
    setContentMenuOpen(false);
    setSocialMenuOpen(false);
  }
  function updateLink(id, field, value) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }
  function removeLink(id) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }
  function move(id, dir) {
    setLinks((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      const group = prev.filter((l) => SOCIAL_TYPES.has(l.type) === SOCIAL_TYPES.has(prev[idx].type));
      const groupIdx = group.findIndex((l) => l.id === id);
      const newGroupIdx = groupIdx + dir;
      if (newGroupIdx < 0 || newGroupIdx >= group.length) return prev;
      const otherId = group[newGroupIdx].id;
      const otherIdx = prev.findIndex((l) => l.id === otherId);
      const copy = [...prev];
      [copy[idx], copy[otherIdx]] = [copy[otherIdx], copy[idx]];
      return copy;
    });
  }

  async function fetchZillowDetails(id, url) {
    if (!url.trim()) return;
    updateLink(id, "fetching", true);
    try {
      const res = await fetch("/api/listings-fetch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't fetch that listing.");
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...data, label: data.address, fetching: false, fetched: true } : l))
      );
    } catch (err) {
      updateLink(id, "fetching", false);
      updateLink(id, "fetchError", err.message);
    }
  }

  async function onBgImagePick(file) {
    if (!file) return;
    setBgImageError("");
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setBgImageUrl(dataUrl);
    } catch (err) {
      setBgImageError(err.message);
    }
  }

  function onHandleChange(v) {
    const clean = v.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setHandle(clean);
    setHandleError(clean && !HANDLE_RE.test(clean) ? "Lowercase letters, numbers, and hyphens only." : "");
  }

  async function save() {
    if (handle && !HANDLE_RE.test(handle)) { setHandleError("Lowercase letters, numbers, and hyphens only."); return; }
    setSaveStatus("saving");
    setSaveError("");
    try {
      if (nameDraft.trim() && nameDraft.trim() !== name) {
        await saveBrandKit({ ...brandKit, agentName: nameDraft.trim() });
      }
      const res = await fetch("/api/bio", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, tagline, brokerage, bgColor, boxColor, nameFont, nameSize, buttonStyle, bgImageUrl, bgTint, links }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save.");
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err.message);
    }
  }

  function resetToDefault() {
    if (!window.confirm("Reset colors, fonts, and layout to defaults? Your links and handle are kept. This won't save until you click Save Changes.")) return;
    setBgColor(DEFAULTS.bgColor);
    setBoxColor(DEFAULTS.boxColor);
    setNameFont(DEFAULTS.nameFont);
    setNameSize(DEFAULTS.nameSize);
    setButtonStyle(DEFAULTS.buttonStyle);
    setBgImageUrl(DEFAULTS.bgImageUrl);
    setBgTint(DEFAULTS.bgTint);
    setSaveStatus("idle");
  }

  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="min-h-screen" style={{ background: UI.page }}>
      <TopNav active="bio" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl mb-1" style={{ color: UI.ink }}>
              Build your real estate link-in-bio page
            </h1>
            <p className="font-body text-sm max-w-xl" style={{ color: UI.inkSoft }}>
              Create a beautiful, mobile-first page that drives traffic to your most important links.
              Paste a Zillow listing link and we'll pull in the property details for you.
            </p>
          </div>

          {!loading && !loadError && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {saveStatus === "saving" && <span className="font-body text-xs flex items-center gap-1.5" style={{ color: UI.inkSoft }}><Loader2 size={13} className="animate-spin" /> Saving…</span>}
                {saveStatus === "saved" && <span className="font-body text-xs flex items-center gap-1.5" style={{ color: "#3F8F5F" }}><CheckCircle2 size={13} /> All changes saved</span>}
                {saveStatus === "error" && <span className="font-body text-xs" style={{ color: ERROR }}>{saveError}</span>}
                {publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-body text-sm font-semibold rounded-lg px-4 py-2 transition flex items-center gap-1.5"
                    style={{ background: UI.ink, color: WHITE }}
                  >
                    View Live Link <ExternalLink size={13} />
                  </a>
                )}
              </div>
              {publicUrl && (
                <button onClick={copyLink} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 border font-mono text-xs transition" style={{ borderColor: UI.line, color: UI.inkSoft }} onMouseEnter={(e) => e.currentTarget.style.color = ACCENT} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft}>
                  {publicUrl.replace(/^https?:\/\//, "")} {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <p className="font-body text-sm" style={{ color: UI.inkSoft }}>Loading…</p>
        ) : loadError ? (
          <p className="font-body text-sm" style={{ color: ERROR }}>{loadError}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
            {/* ---------------- EDITOR PANEL ---------------- */}
            <div className="flex flex-col gap-4">
              <Section number={1} title="Profile">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <img
                      src={brandKit?.headshotUrl || DEFAULT_HEADSHOT_URL}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover border"
                      style={{ borderColor: UI.line }}
                    />
                    <button
                      type="button"
                      onClick={() => onSwitchTool("profile")}
                      className="font-body text-xs rounded-full px-3 py-1.5 border transition flex items-center gap-1.5"
                      style={{ borderColor: UI.line, color: UI.inkSoft }}
                      onMouseEnter={(e) => e.currentTarget.style.color = ACCENT}
                      onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft}
                    >
                      Change Photo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <div>
                      <label className="font-mono text-xs uppercase tracking-wide block mb-1.5" style={{ color: UI.inkSoft }}>Name</label>
                      <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Jane Doe, Realtor" className="input" />
                    </div>
                    <div>
                      <label className="font-mono text-xs uppercase tracking-wide block mb-1.5" style={{ color: UI.inkSoft }}>Brokerage / Company</label>
                      <input value={brokerage} onChange={(e) => setBrokerage(e.target.value)} placeholder="Coastal Living Realty" className="input" />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-mono text-xs uppercase tracking-wide" style={{ color: UI.inkSoft }}>Tagline / Bio</label>
                        <span className="font-mono text-[10px]" style={{ color: UI.inkSoft }}>{tagline.length}/{TAGLINE_MAX}</span>
                      </div>
                      <input
                        value={tagline}
                        maxLength={TAGLINE_MAX}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="Helping buyers and sellers in your area."
                        className="input"
                      />
                    </div>
                  </div>
                </div>
                <p className="font-body text-[11px] mt-3" style={{ color: UI.inkSoft }}>
                  Photo and name come from your <button type="button" onClick={() => onSwitchTool("profile")} className="underline" style={{ color: ACCENT }}>Profile → Brand</button> settings —
                  editing the name here updates it there too. Brokerage is specific to this page.
                </p>
              </Section>

              <Section number={2} title="Appearance">
                <p className="font-mono text-xs uppercase tracking-wide mb-2" style={{ color: UI.inkSoft }}>Theme</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setBgColor(t.bg); setBoxColor(t.box); }}
                      className="font-body text-sm rounded-lg px-3.5 py-2 border transition"
                      style={{
                        borderColor: bgColor === t.bg && boxColor === t.box ? ACCENT : UI.line,
                        color: bgColor === t.bg && boxColor === t.box ? ACCENT : UI.ink,
                        fontWeight: bgColor === t.bg && boxColor === t.box ? 700 : 400,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <ColorField label="Background" value={bgColor} onChange={setBgColor} />
                  <ColorField label="Buttons" value={boxColor} onChange={setBoxColor} />
                </div>

                <p className="font-mono text-xs uppercase tracking-wide mb-2" style={{ color: UI.inkSoft }}>Background image (optional)</p>
                {bgImageUrl ? (
                  <div className="rounded-xl overflow-hidden mb-2 relative" style={{ height: 100 }}>
                    <img src={bgImageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: bgColor, opacity: bgTint / 100 }} />
                    <button
                      type="button"
                      onClick={() => setBgImageUrl("")}
                      className="absolute top-2 right-2 rounded-full p-1"
                      style={{ background: "rgba(0,0,0,0.5)", color: "#FFFFFF" }}
                      aria-label="Remove background image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex items-center justify-center gap-2 border border-dashed rounded-xl py-4 mb-2 text-sm font-body cursor-pointer transition"
                    style={{ borderColor: UI.line, color: UI.inkSoft }}
                  >
                    <ImagePlus size={16} /> Upload a photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onBgImagePick(e.target.files[0])} />
                  </label>
                )}
                {bgImageError && <p className="font-body text-[11px] mb-2" style={{ color: ERROR }}>{bgImageError}</p>}
                {bgImageUrl && (
                  <div className="mb-4">
                    <label className="font-mono text-xs uppercase tracking-wide flex items-center justify-between mb-1.5" style={{ color: UI.inkSoft }}>
                      <span>Tint intensity</span>
                      <span>{bgTint}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={bgTint}
                      onChange={(e) => setBgTint(Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: ACCENT }}
                    />
                  </div>
                )}

                <p className="font-mono text-xs uppercase tracking-wide mb-2" style={{ color: UI.inkSoft }}>Button style</p>
                <div className="flex gap-2 mb-4">
                  {BUTTON_STYLES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setButtonStyle(b.id)}
                      className="font-body text-sm px-3.5 py-2 border transition flex-1"
                      style={{
                        borderColor: buttonStyle === b.id ? ACCENT : UI.line,
                        color: buttonStyle === b.id ? ACCENT : UI.ink,
                        fontWeight: buttonStyle === b.id ? 700 : 400,
                        borderRadius: b.radius === 999 ? 999 : b.radius,
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-xs uppercase tracking-wide block mb-1.5" style={{ color: UI.inkSoft }}>Font</label>
                    <select className="input" value={nameFont} onChange={(e) => setNameFont(e.target.value)}>
                      <option value="">Default (PostKey Serif)</option>
                      {SCRIPT_FONTS.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs uppercase tracking-wide block mb-1.5" style={{ color: UI.inkSoft }}>Name size</label>
                    <select className="input" value={nameSize} onChange={(e) => setNameSize(e.target.value)}>
                      {NAME_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </Section>

              <Section number={3} title="Content / Links">
                {contentLinks.length === 0 && (
                  <div className="rounded-xl py-6 px-4 text-center mb-3 border border-dashed" style={{ borderColor: UI.line }}>
                    <p className="font-body text-sm" style={{ color: UI.inkSoft }}>No content links yet.</p>
                  </div>
                )}
                <div className="flex flex-col gap-2 mb-3">
                  {contentLinks.map((link, i) => (
                    <LinkRow
                      key={link.id}
                      link={link}
                      isFirst={i === 0}
                      isLast={i === contentLinks.length - 1}
                      onMove={(dir) => move(link.id, dir)}
                      onUpdate={(field, v) => updateLink(link.id, field, v)}
                      onRemove={() => removeLink(link.id)}
                      onFetch={() => fetchZillowDetails(link.id, link.url)}
                    />
                  ))}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setContentMenuOpen((o) => !o)}
                    disabled={availableContentTypes.length === 0}
                    className="font-body w-full flex items-center justify-center gap-2 border border-dashed rounded-xl py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                  >
                    <Plus size={16} /> Add Content
                  </button>
                  {contentMenuOpen && (
                    <TypeMenu types={availableContentTypes} onPick={addLink} />
                  )}
                </div>
              </Section>

              <Section number={4} title="Social Links">
                {socialLinks.length === 0 && (
                  <div className="rounded-xl py-6 px-4 text-center mb-3 border border-dashed" style={{ borderColor: UI.line }}>
                    <p className="font-body text-sm" style={{ color: UI.inkSoft }}>No social links yet.</p>
                  </div>
                )}
                <div className="flex flex-col gap-2 mb-3">
                  {socialLinks.map((link, i) => {
                    const typeInfo = LINK_TYPES.find((t) => t.id === link.type);
                    const Icon = typeInfo.icon;
                    return (
                      <div key={link.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border" style={{ background: UI.stone, borderColor: UI.line }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: typeInfo.color }}>
                          <Icon size={15} color="#FFFFFF" />
                        </div>
                        <input
                          value={link.url}
                          onChange={(e) => updateLink(link.id, "url", e.target.value)}
                          placeholder={typeInfo.placeholder}
                          className="input flex-1 min-w-0"
                        />
                        <button onClick={() => removeLink(link.id)} className="shrink-0 p-1 transition" style={{ color: UI.inkSoft }} onMouseEnter={(e) => e.currentTarget.style.color = ERROR} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft} aria-label="Remove link">
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setSocialMenuOpen((o) => !o)}
                    disabled={availableSocialTypes.length === 0}
                    className="font-body w-full flex items-center justify-center gap-2 border border-dashed rounded-xl py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                  >
                    <Plus size={16} /> Add Social Link
                  </button>
                  {socialMenuOpen && (
                    <TypeMenu types={availableSocialTypes} onPick={addLink} />
                  )}
                </div>
              </Section>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={save}
                  disabled={saveStatus === "saving"}
                  className="font-body text-sm font-semibold rounded-lg px-5 py-2.5 transition disabled:opacity-60 flex items-center gap-2"
                  style={{ background: ACCENT, color: WHITE }}
                >
                  <Check size={16} /> {saveStatus === "saving" ? "Saving…" : "Save Changes"}
                </button>
                {publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-body text-sm font-semibold rounded-lg px-5 py-2.5 transition flex items-center gap-2 border"
                    style={{ borderColor: UI.line, color: UI.ink }}
                  >
                    <Eye size={16} /> Preview
                  </a>
                )}
                <button
                  onClick={resetToDefault}
                  className="font-body text-sm flex items-center gap-1.5 transition"
                  style={{ color: UI.inkSoft }}
                  onMouseEnter={(e) => e.currentTarget.style.color = ERROR}
                  onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft}
                >
                  <RotateCcw size={14} /> Reset to Default
                </button>
              </div>
            </div>

            {/* ---------------- LIVE PREVIEW ---------------- */}
            <div className="lg:sticky lg:top-[calc(82px+1.5rem)]">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-xs tracking-[0.1em] uppercase" style={{ color: UI.inkSoft }}>Live preview</p>
                <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: UI.stone }}>
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    aria-label="Mobile preview"
                    className="p-1.5 rounded-full transition"
                    style={{ background: previewMode === "mobile" ? UI.card : "transparent", boxShadow: previewMode === "mobile" ? "0 1px 3px rgba(27,36,48,0.15)" : "none" }}
                  >
                    <Smartphone size={14} style={{ color: previewMode === "mobile" ? UI.ink : UI.inkSoft }} />
                  </button>
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    aria-label="Desktop preview"
                    className="p-1.5 rounded-full transition"
                    style={{ background: previewMode === "desktop" ? UI.card : "transparent", boxShadow: previewMode === "desktop" ? "0 1px 3px rgba(27,36,48,0.15)" : "none" }}
                  >
                    <Monitor size={14} style={{ color: previewMode === "desktop" ? UI.ink : UI.inkSoft }} />
                  </button>
                </div>
              </div>

              {previewMode === "mobile" ? (
                <div className="rounded-[2.4rem] border-4 p-2.5 shadow-2xl mx-auto" style={{ borderColor: "#1A1D22", background: "#1A1D22", maxWidth: 320 }}>
                  <div className="w-24 h-5 rounded-full mx-auto mb-1" style={{ background: "#1A1D22" }} />
                  <div
                    className="rounded-[1.9rem] overflow-hidden min-h-[560px] px-6 py-8 flex flex-col items-center transition-colors duration-200"
                    style={bgStyle(bgColor, bgImageUrl, bgTint)}
                  >
                    <PreviewContent {...{ name, tagline, brokerage, bgColor, boxColor, nameFont, nameSize, buttonStyle, links }} />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-4 p-2.5 shadow-2xl" style={{ borderColor: "#1A1D22", background: "#1A1D22" }}>
                  <div className="flex items-center gap-1.5 px-2 pb-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
                    {publicUrl && (
                      <span className="font-mono text-[10px] ml-2 px-2 py-0.5 rounded" style={{ background: "#2A2D32", color: "#8A93A3" }}>
                        {publicUrl.replace(/^https?:\/\//, "")}
                      </span>
                    )}
                  </div>
                  <div
                    className="rounded-xl overflow-hidden min-h-[560px] px-6 py-10 flex flex-col items-center transition-colors duration-200"
                    style={bgStyle(bgColor, bgImageUrl, bgTint)}
                  >
                    <div className="w-full max-w-sm">
                      <PreviewContent {...{ name, tagline, brokerage, bgColor, boxColor, nameFont, nameSize, buttonStyle, links }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewContent({ name, tagline, brokerage, bgColor, boxColor, nameFont, nameSize, buttonStyle, links }) {
  return (
    <>
      <div className="w-20 h-20 rounded-full p-1 mb-4" style={{ background: `conic-gradient(from 180deg, ${ACCENT}, #6E8CFF, ${ACCENT})` }}>
        <div className="font-display w-full h-full rounded-full flex items-center justify-center text-lg" style={{ background: UI.ink, color: "#FDFBF7" }}>
          {(name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
      </div>
      <h2
        className={nameFont ? "text-center mb-0.5" : "font-display text-center mb-0.5"}
        style={{
          color: textOn(bgColor),
          font: nameFont ? scriptFontCss(nameFont, nameSizePx(nameSize)) : undefined,
          fontSize: nameFont ? undefined : `${nameSizePx(nameSize)}px`,
          fontWeight: nameFont ? undefined : 700,
        }}
      >
        {name || "Your Name"}
      </h2>
      {brokerage && (
        <p className="font-body text-sm text-center mb-1" style={{ color: relativeLuminance(bgColor) > 0.5 ? UI.inkSoft : "#9FB4E8" }}>{brokerage}</p>
      )}
      <p className="font-body text-xs text-center mb-6 opacity-70 max-w-[260px]" style={{ color: textOn(bgColor) }}>{tagline}</p>

      <BioLinksList links={links} bgColor={bgColor} boxColor={boxColor} buttonStyle={buttonStyle} asLink={false} />

      <p className="font-mono text-[10px] tracking-[0.1em] uppercase mt-8 opacity-40" style={{ color: textOn(bgColor) }}>Powered by PostKey</p>
    </>
  );
}

function TypeMenu({ types, onPick }) {
  return (
    <div className="absolute z-10 mt-2 w-full rounded-xl p-2 shadow-xl grid grid-cols-2 gap-1.5 border" style={{ background: UI.card, borderColor: UI.line }}>
      {types.map((t) => {
        const Icon = t.icon;
        return (
          <button key={t.id} onClick={() => onPick(t)} className="font-body flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition" style={{ color: UI.ink }} onMouseEnter={(e) => e.currentTarget.style.background = UI.stone} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: t.color }}>
              <Icon size={13} color="#FFFFFF" />
            </span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function LinkRow({ link, isFirst, isLast, onMove, onUpdate, onRemove, onFetch }) {
  const typeInfo = LINK_TYPES.find((t) => t.id === link.type);
  const Icon = typeInfo.icon;
  const isZillow = link.type === "zillow";

  return (
    <div className="rounded-xl px-3 py-2.5 border" style={{ background: UI.stone, borderColor: UI.line }}>
      <div className="flex items-center gap-2">
        <div className="flex items-center -ml-0.5 shrink-0">
          <GripVertical size={14} style={{ color: UI.inkSoft, opacity: 0.5 }} />
          <div className="flex flex-col ml-0.5" style={{ color: UI.inkSoft }}>
            <button onClick={() => onMove(-1)} disabled={isFirst} className="disabled:opacity-20 leading-none text-[10px] px-1 transition" style={{ color: "inherit" }} onMouseEnter={(e) => e.currentTarget.style.color = ACCENT} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft} aria-label="Move up">▲</button>
            <button onClick={() => onMove(1)} disabled={isLast} className="disabled:opacity-20 leading-none text-[10px] px-1 transition" style={{ color: "inherit" }} onMouseEnter={(e) => e.currentTarget.style.color = ACCENT} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft} aria-label="Move down">▼</button>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: typeInfo.color }}>
          <Icon size={15} color="#FFFFFF" />
        </div>

        {!isZillow && (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
            <input value={link.label} onChange={(e) => onUpdate("label", e.target.value)} placeholder="Label" className="input min-w-0" />
            <input value={link.url} onChange={(e) => onUpdate("url", e.target.value)} placeholder={typeInfo.placeholder} className="input min-w-0" />
          </div>
        )}

        {isZillow && !link.fetched && (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <input value={link.url} onChange={(e) => onUpdate("url", e.target.value)} placeholder={typeInfo.placeholder} className="input flex-1 min-w-0" />
            <button
              onClick={onFetch}
              disabled={!link.url.trim() || link.fetching}
              className="font-body shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              {link.fetching ? (<><Loader2 size={12} className="animate-spin" /> Fetching</>) : "Fetch details"}
            </button>
          </div>
        )}

        {isZillow && link.fetched && (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <p className="font-body text-sm truncate flex-1" style={{ color: UI.ink }}>{link.address}</p>
            <span className="font-body text-xs font-medium shrink-0" style={{ color: ACCENT }}>{link.price}</span>
          </div>
        )}

        <button onClick={onRemove} className="shrink-0 p-1 transition" style={{ color: UI.inkSoft }} onMouseEnter={(e) => e.currentTarget.style.color = ERROR} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft} aria-label="Remove link">
          <X size={16} />
        </button>
      </div>

      {isZillow && link.fetchError && !link.fetched && (
        <p className="font-body mt-2 ml-8 text-[11px]" style={{ color: ERROR }}>{link.fetchError} You can still add the details by hand below.</p>
      )}

      {isZillow && link.fetched && (
        <div className="mt-2.5 ml-8 pl-3 border-l-2 flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ borderColor: UI.line }}>
          <span className="font-body flex items-center gap-1 text-[11px]" style={{ color: "#3F8F5F" }}>
            <CheckCircle2 size={12} /> Pulled from Zillow
          </span>
          <LabeledMini label="Beds" value={link.beds} onChange={(v) => onUpdate("beds", v)} />
          <LabeledMini label="Baths" value={link.baths} onChange={(v) => onUpdate("baths", v)} />
          <LabeledMini label="Price" value={link.price} onChange={(v) => onUpdate("price", v)} />
          <button onClick={onFetch} className="font-body flex items-center gap-1 text-[11px] transition" style={{ color: UI.inkSoft }} onMouseEnter={(e) => e.currentTarget.style.color = ACCENT} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft}>
            <RefreshCw size={11} /> Re-fetch
          </button>
        </div>
      )}

      {isZillow && !link.fetched && !link.fetching && (
        <div className="mt-2.5 ml-8 pl-3 border-l-2 flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ borderColor: UI.line }}>
          <span className="font-body text-[11px]" style={{ color: UI.inkSoft }}>Or enter manually:</span>
          <LabeledMini label="Address" value={link.address} onChange={(v) => onUpdate("address", v)} />
          <LabeledMini label="Beds" value={link.beds} onChange={(v) => onUpdate("beds", v)} />
          <LabeledMini label="Baths" value={link.baths} onChange={(v) => onUpdate("baths", v)} />
          <LabeledMini label="Price" value={link.price} onChange={(v) => onUpdate("price", v)} />
        </div>
      )}
    </div>
  );
}

function LabeledMini({ label, value, onChange }) {
  return (
    <span className="font-body flex items-center gap-1 text-[11px]" style={{ color: UI.inkSoft }}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-body w-14 bg-transparent border-b outline-none px-0.5"
        style={{ borderColor: UI.line, color: UI.ink }}
        onFocus={(e) => e.currentTarget.style.borderColor = ACCENT}
        onBlur={(e) => e.currentTarget.style.borderColor = UI.line}
      />
    </span>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="font-mono text-xs uppercase tracking-wide block mb-1.5" style={{ color: UI.inkSoft }}>{label}</label>
      <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border" style={{ borderColor: UI.line, background: UI.card }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded-md border-none cursor-pointer bg-transparent" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="font-body flex-1 bg-transparent text-sm outline-none uppercase min-w-0" style={{ color: UI.ink }} />
      </div>
    </div>
  );
}

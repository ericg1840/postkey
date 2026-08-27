import { useEffect, useState } from "react";
import {
  Globe, Facebook, Instagram, Home, Building2, Briefcase, Link as LinkIcon,
  Plus, X, Loader2, CheckCircle2, RefreshCw, Copy, Check, ExternalLink,
} from "lucide-react";
import { UI, ACCENT, ERROR, WHITE, TopNav, SCRIPT_FONTS, scriptFontCss } from "../shared.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

const LINK_TYPES = [
  { id: "website", label: "Website", icon: Globe, placeholder: "yourname.com" },
  { id: "facebook", label: "Facebook", icon: Facebook, placeholder: "facebook.com/yourpage" },
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "instagram.com/yourhandle" },
  { id: "zillow", label: "Zillow Listing", icon: Home, placeholder: "zillow.com/homedetails/..." },
  { id: "realtor", label: "Realtor.com", icon: Building2, placeholder: "realtor.com/agent/you" },
  { id: "broker", label: "Brokerage Site", icon: Briefcase, placeholder: "yourbrokerage.com" },
  { id: "custom", label: "Custom Link", icon: LinkIcon, placeholder: "https://..." },
];

const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

function hexToRgb(hex) {
  const m = hex.replace("#", "");
  const bigint = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function textOn(hex) {
  return relativeLuminance(hex) > 0.5 ? UI.ink : "#FDFBF7";
}

let linkIdSeq = 0;
function newLinkId() {
  return `new-${Date.now()}-${linkIdSeq++}`;
}

export function BioEditorPage({ onSwitchTool, onGoHome }) {
  const { user, brandKit, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState("");
  const [tagline, setTagline] = useState("");
  const [bgColor, setBgColor] = useState(UI.ink);
  const [boxColor, setBoxColor] = useState("#2E3B4C");
  const [nameFont, setNameFont] = useState("");
  const [links, setLinks] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bio", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Couldn't load your bio page.");
        if (cancelled) return;
        setHandle(data.profile?.handle || "");
        setTagline(data.profile?.tagline || "");
        setBgColor(data.profile?.bgColor || UI.ink);
        setBoxColor(data.profile?.boxColor || "#2E3B4C");
        setNameFont(data.profile?.nameFont || "");
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
  const availableTypes = LINK_TYPES.filter(
    (t) => t.id === "custom" || !links.some((l) => l.type === t.id)
  );
  const publicUrl = handle ? `${window.location.origin}/u/${handle}` : "";

  function addLink(type) {
    setLinks((prev) => [
      ...prev,
      { id: newLinkId(), type: type.id, label: type.label, url: "", fetching: false, fetched: false, address: "", price: "", beds: "", baths: "" },
    ]);
    setMenuOpen(false);
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
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
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
      const res = await fetch("/api/bio", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, tagline, bgColor, boxColor, nameFont, links }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save.");
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err.message);
    }
  }

  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const boxTextColor = textOn(boxColor);
  const boxSubColor = relativeLuminance(boxColor) > 0.5 ? UI.inkSoft : "#B9C0CC";

  return (
    <div className="min-h-screen" style={{ background: UI.page }}>
      <TopNav active="bio" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <p className="font-mono text-xs tracking-[0.14em] uppercase mb-2" style={{ color: ACCENT }}>
          Simple to build. Easy to share. Made for real estate.
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl mb-2" style={{ color: UI.ink }}>
          Your Links. Your Brand. One Powerful Page.
        </h1>
        <p className="font-body text-sm sm:text-base mb-3 max-w-2xl" style={{ color: UI.inkSoft }}>
          Create a link-in-bio page that looks as good as your real estate brand. Make it yours with
          custom colors, your branding, and only the links you want your audience to see — social
          profiles, website, contact info, listings, and more, all in one place.
        </p>
        <p className="font-body text-sm mb-8 max-w-2xl" style={{ color: UI.inkSoft }}>
          <span className="font-semibold" style={{ color: UI.ink }}>Turn listings into posts:</span>{" "}
          paste a Zillow listing link and we'll automatically pull in the property details, so you can
          quickly turn your listing into engaging social content.
        </p>

        {loading ? (
          <p className="font-body text-sm" style={{ color: UI.inkSoft }}>Loading…</p>
        ) : loadError ? (
          <p className="font-body text-sm" style={{ color: ERROR }}>{loadError}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
            {/* ---------------- EDITOR PANEL ---------------- */}
            <div>
              <p className="font-mono text-xs tracking-[0.1em] uppercase mb-3" style={{ color: UI.inkSoft }}>Page basics</p>
              <div className="rounded-2xl border p-5 sm:p-6" style={{ background: UI.card, borderColor: UI.line }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wide block mb-1.5" style={{ color: UI.inkSoft }}>Your link</label>
                  <div className="flex items-center rounded-lg overflow-hidden" style={{ background: UI.card, border: `1px solid ${handleError ? ERROR : UI.line}` }}>
                    <span className="font-body pl-3 text-xs shrink-0" style={{ color: UI.inkSoft }}>/u/</span>
                    <input
                      value={handle}
                      onChange={(e) => onHandleChange(e.target.value)}
                      placeholder="dana-whitfield"
                      className="font-body w-full bg-transparent px-1.5 py-2 text-sm outline-none min-w-0"
                      style={{ color: UI.ink }}
                    />
                  </div>
                  {handleError && <p className="font-body text-[11px] mt-1" style={{ color: ERROR }}>{handleError}</p>}
                </div>
                <div>
                  <label className="font-mono text-xs uppercase tracking-wide block mb-1.5" style={{ color: UI.inkSoft }}>Tagline</label>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Coastal Living Realty · Ocean City, MD"
                    className="input"
                  />
                </div>
              </div>

              <p className="font-mono text-xs tracking-[0.1em] uppercase mb-3" style={{ color: UI.inkSoft }}>Colors</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <ColorField label="Background" value={bgColor} onChange={setBgColor} />
                <ColorField label="Link box" value={boxColor} onChange={setBoxColor} />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wide block mb-1.5" style={{ color: UI.inkSoft }}>Name style</label>
                <select className="input" value={nameFont} onChange={(e) => setNameFont(e.target.value)}>
                  <option value="">Default (PostKey Serif)</option>
                  {SCRIPT_FONTS.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              <div className="h-px my-6" style={{ background: UI.line }} />

              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-xs tracking-[0.1em] uppercase" style={{ color: UI.inkSoft }}>
                  Your links {links.length > 0 && `(${links.length})`}
                </p>
              </div>

              {links.length === 0 && (
                <div className="rounded-xl py-8 px-4 text-center mb-4 border border-dashed" style={{ borderColor: UI.line }}>
                  <p className="font-body text-sm" style={{ color: UI.inkSoft }}>No links yet. Add your website, socials, or a Zillow listing below.</p>
                </div>
              )}

              <div className="flex flex-col gap-2 mb-4">
                {links.map((link, i) => {
                  const typeInfo = LINK_TYPES.find((t) => t.id === link.type);
                  const Icon = typeInfo.icon;
                  const isZillow = link.type === "zillow";

                  return (
                    <div key={link.id} className="rounded-xl px-3 py-2.5 border" style={{ background: UI.stone, borderColor: UI.line }}>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col -ml-0.5" style={{ color: UI.inkSoft }}>
                          <button onClick={() => move(link.id, -1)} disabled={i === 0} className="disabled:opacity-20 leading-none text-[10px] px-1 transition" style={{ color: "inherit" }} onMouseEnter={(e) => e.currentTarget.style.color = ACCENT} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft} aria-label="Move up">▲</button>
                          <button onClick={() => move(link.id, 1)} disabled={i === links.length - 1} className="disabled:opacity-20 leading-none text-[10px] px-1 transition" style={{ color: "inherit" }} onMouseEnter={(e) => e.currentTarget.style.color = ACCENT} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft} aria-label="Move down">▼</button>
                        </div>
                        <Icon size={16} className="shrink-0" style={{ color: ACCENT }} />

                        {!isZillow && (
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                            <input
                              value={link.label}
                              onChange={(e) => updateLink(link.id, "label", e.target.value)}
                              placeholder="Label"
                              className="input min-w-0"
                            />
                            <input
                              value={link.url}
                              onChange={(e) => updateLink(link.id, "url", e.target.value)}
                              placeholder={typeInfo.placeholder}
                              className="input min-w-0"
                            />
                          </div>
                        )}

                        {isZillow && !link.fetched && (
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <input
                              value={link.url}
                              onChange={(e) => updateLink(link.id, "url", e.target.value)}
                              placeholder={typeInfo.placeholder}
                              className="input flex-1 min-w-0"
                            />
                            <button
                              onClick={() => fetchZillowDetails(link.id, link.url)}
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

                        <button onClick={() => removeLink(link.id)} className="shrink-0 p-1 transition" style={{ color: UI.inkSoft }} onMouseEnter={(e) => e.currentTarget.style.color = ERROR} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft} aria-label="Remove link">
                          <X size={16} />
                        </button>
                      </div>

                      {isZillow && link.fetchError && !link.fetched && (
                        <p className="font-body mt-2 ml-6 text-[11px]" style={{ color: ERROR }}>{link.fetchError} You can still add the details by hand below.</p>
                      )}

                      {isZillow && link.fetched && (
                        <div className="mt-2.5 ml-6 pl-3 border-l-2 flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ borderColor: UI.line }}>
                          <span className="font-body flex items-center gap-1 text-[11px]" style={{ color: "#3F8F5F" }}>
                            <CheckCircle2 size={12} /> Pulled from Zillow
                          </span>
                          <LabeledMini label="Beds" value={link.beds} onChange={(v) => updateLink(link.id, "beds", v)} />
                          <LabeledMini label="Baths" value={link.baths} onChange={(v) => updateLink(link.id, "baths", v)} />
                          <LabeledMini label="Price" value={link.price} onChange={(v) => updateLink(link.id, "price", v)} />
                          <button onClick={() => fetchZillowDetails(link.id, link.url)} className="font-body flex items-center gap-1 text-[11px] transition" style={{ color: UI.inkSoft }} onMouseEnter={(e) => e.currentTarget.style.color = ACCENT} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft}>
                            <RefreshCw size={11} /> Re-fetch
                          </button>
                        </div>
                      )}

                      {isZillow && !link.fetched && !link.fetching && (
                        <div className="mt-2.5 ml-6 pl-3 border-l-2 flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ borderColor: UI.line }}>
                          <span className="font-body text-[11px]" style={{ color: UI.inkSoft }}>Or enter manually:</span>
                          <LabeledMini label="Address" value={link.address} onChange={(v) => updateLink(link.id, "address", v)} />
                          <LabeledMini label="Beds" value={link.beds} onChange={(v) => updateLink(link.id, "beds", v)} />
                          <LabeledMini label="Baths" value={link.baths} onChange={(v) => updateLink(link.id, "baths", v)} />
                          <LabeledMini label="Price" value={link.price} onChange={(v) => updateLink(link.id, "price", v)} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  disabled={availableTypes.length === 0}
                  className="font-body w-full flex items-center justify-center gap-2 border border-dashed rounded-xl py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ borderColor: ACCENT, color: ACCENT }}
                >
                  <Plus size={16} /> Add a link
                </button>

                {menuOpen && (
                  <div className="absolute z-10 mt-2 w-full rounded-xl p-2 shadow-xl grid grid-cols-2 gap-1.5 border" style={{ background: UI.card, borderColor: UI.line }}>
                    {availableTypes.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button key={t.id} onClick={() => addLink(t)} className="font-body flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition" style={{ color: UI.ink }} onMouseEnter={(e) => e.currentTarget.style.background = UI.stone} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <Icon size={15} style={{ color: ACCENT }} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="h-px my-6" style={{ background: UI.line }} />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={save}
                  disabled={saveStatus === "saving"}
                  className="font-body text-sm font-semibold rounded-lg px-5 py-2.5 transition disabled:opacity-60"
                  style={{ background: ACCENT, color: WHITE }}
                >
                  {saveStatus === "saving" ? "Saving…" : "Save changes"}
                </button>
                {saveStatus === "saved" && <span className="font-body text-xs flex items-center gap-1" style={{ color: "#3F8F5F" }}><Check size={14} /> Saved</span>}
                {saveStatus === "error" && <span className="font-body text-xs" style={{ color: ERROR }}>{saveError}</span>}

                {publicUrl && (
                  <div className="flex items-center gap-2 ml-auto">
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="font-body flex items-center gap-1 text-xs transition" style={{ color: UI.inkSoft }} onMouseEnter={(e) => e.currentTarget.style.color = ACCENT} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft}>
                      <ExternalLink size={12} /> {publicUrl.replace(/^https?:\/\//, "")}
                    </a>
                    <button onClick={copyLink} className="flex items-center gap-1 text-xs transition" style={{ color: UI.inkSoft }} onMouseEnter={(e) => e.currentTarget.style.color = ACCENT} onMouseLeave={(e) => e.currentTarget.style.color = UI.inkSoft} aria-label="Copy link">
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* ---------------- LIVE PREVIEW ---------------- */}
            <div className="lg:sticky lg:top-8">
              <p className="font-mono text-xs tracking-[0.1em] uppercase mb-3" style={{ color: UI.inkSoft }}>Live preview</p>
              <div className="rounded-[2.2rem] border-4 p-3 shadow-2xl" style={{ borderColor: UI.stone, background: UI.card }}>
                <div
                  className="rounded-[1.6rem] overflow-hidden min-h-[560px] px-6 py-10 flex flex-col items-center transition-colors duration-200"
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="w-20 h-20 rounded-full p-1 mb-4" style={{ background: `conic-gradient(from 180deg, ${ACCENT}, #6E8CFF, ${ACCENT})` }}>
                    <div className="font-display w-full h-full rounded-full flex items-center justify-center text-lg" style={{ background: UI.ink, color: "#FDFBF7" }}>
                      {(name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <h2
                    className={nameFont ? "text-center mb-1" : "font-display text-xl text-center mb-1"}
                    style={nameFont ? { color: textOn(bgColor), font: scriptFontCss(nameFont, 28) } : { color: textOn(bgColor) }}
                  >
                    {name || "Your Name"}
                  </h2>
                  <p className="font-body text-xs text-center mb-8 opacity-70 max-w-[240px]" style={{ color: textOn(bgColor) }}>{tagline}</p>

                  <div className="w-full flex flex-col gap-2.5">
                    {links.length === 0 && (
                      <p className="font-body text-center text-xs italic opacity-50 mt-4" style={{ color: textOn(bgColor) }}>Your links will appear here</p>
                    )}
                    {links.map((link) => {
                      const typeInfo = LINK_TYPES.find((t) => t.id === link.type);
                      const Icon = typeInfo.icon;
                      const isZillow = link.type === "zillow";
                      const title = isZillow && (link.fetched || link.address) ? (link.address || link.label || typeInfo.label) : (link.label || typeInfo.label);
                      const sub = isZillow && (link.fetched || link.address)
                        ? [link.beds && `${link.beds} bed`, link.baths && `${link.baths} bath`, link.price].filter(Boolean).join(" · ")
                        : link.url || typeInfo.placeholder;

                      return (
                        <div key={link.id} className="flex items-center gap-3 rounded-xl px-4 py-3 transition-transform hover:-translate-y-0.5" style={{ backgroundColor: boxColor }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ border: `2px solid ${ACCENT}`, background: bgColor }}>
                            <Icon size={11} style={{ color: ACCENT }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-body text-sm font-semibold truncate" style={{ color: boxTextColor }}>{title}</p>
                            <p className="font-body text-[11px] truncate" style={{ color: boxSubColor }}>{sub}</p>
                          </div>
                          <span style={{ color: ACCENT }}>›</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="font-mono text-[10px] tracking-[0.1em] uppercase mt-10 opacity-40" style={{ color: textOn(bgColor) }}>Powered by PostKey</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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

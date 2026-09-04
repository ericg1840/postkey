import { useState } from "react";
import { User, ArrowRight, ArrowLeft, Check } from "lucide-react";
import {
  UI, ACCENT_PRESETS, DEFAULT_HEADSHOT_URL,
  useAgentAsset, UploadBox,
} from "../shared.jsx";
import { AUTH } from "../auth/AuthShell.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { LINK_TYPES, BioLinksList, textOn } from "../profile/bioShared.jsx";

const STEPS = ["Welcome", "Profile & first link"];
const LISTING_COUNTS = ["1–2", "3–5", "6–10", "10+"];
const CONTENT_LINK_TYPES = LINK_TYPES.filter((t) => t.id !== "facebook" && t.id !== "instagram" && t.id !== "tiktok" && t.id !== "linkedin");
const PREVIEW_BG = UI.ink;
const PREVIEW_BOX = "#2E3B4C";

function initials(name) {
  return (name || "?").trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
}

export function OnboardingWizard() {
  const { user, brandKit, saveBrandKit } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [listingVolume, setListingVolume] = useState(brandKit?.listingVolume || "");
  const [agentName, setAgentName] = useState(brandKit?.agentName || user?.fullName || "");
  const [brokerage, setBrokerage] = useState(brandKit?.brokerageName || "");
  const [accentColor, setAccentColor] = useState(brandKit?.accentColor || "#0043FF");
  const [linkType, setLinkType] = useState("website");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const headshot = useAgentAsset(DEFAULT_HEADSHOT_URL, "Headshot", brandKit?.headshotUrl);
  const previewAvatarUrl = headshot.source === "custom" ? headshot.url : null;

  const hasLink = linkUrl.trim().length > 0;
  const previewLinks = hasLink
    ? [{ id: "preview", type: linkType, label: linkLabel.trim() || CONTENT_LINK_TYPES.find((t) => t.id === linkType)?.label || "Link", url: linkUrl.trim() }]
    : [];

  const finish = async ({ markOnboarded, saveProfile }) => {
    setBusy(true);
    setError("");
    try {
      // Save the bio-page link first so the brand-kit save below (which
      // updates local state directly, not from a re-fetch) can report the
      // real link count — otherwise the checklist would show "no link yet"
      // right after a link was in fact just saved.
      if (saveProfile) {
        const res = await fetch("/api/bio", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brokerage,
            bgColor: PREVIEW_BG,
            boxColor: PREVIEW_BOX,
            buttonStyle: "rounded",
            links: hasLink
              ? [{ type: linkType, label: linkLabel.trim(), url: linkUrl.trim() }]
              : [],
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Couldn't save your link.");
        }
      }

      await saveBrandKit({
        ...brandKit,
        agentName,
        brokerageName: brokerage,
        accentColor,
        listingVolume: listingVolume || null,
        headshotUrl: previewAvatarUrl,
        onboarded: markOnboarded,
        linkCount: saveProfile && hasLink ? 1 : (brandKit?.linkCount || 0),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const isLast = step === STEPS.length - 1;
  const next = async () => {
    if (isLast) await finish({ markOnboarded: true, saveProfile: true });
    else setStep((s) => s + 1);
  };
  const skip = () => finish({ markOnboarded: true, saveProfile: false });

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10"
      style={{
        background: "linear-gradient(180deg, #BFE0F5 0%, #DCEEFA 45%, #F3F9FD 100%)",
        paddingTop: "calc(2.5rem + env(safe-area-inset-top))",
        paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <style>{`
        .ob-input { width: 100%; background: transparent; border: none; outline: none; font-family: 'Public Sans', sans-serif; font-size: 0.9rem; color: ${AUTH.ink}; }
        .ob-input::placeholder { color: ${AUTH.muted}; }
        .ob-field { display: flex; align-items: center; gap: 0.6rem; background: ${AUTH.field}; border: 1px solid ${AUTH.border}; border-radius: 10px; padding: 0.7rem 0.9rem; }
        .ob-field:focus-within { border-color: ${AUTH.ink}; }
        .ob-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; letter-spacing: 0.04em; color: ${AUTH.muted}; display: block; margin-bottom: 0.35rem; }
      `}</style>

      <div className="w-full" style={{ maxWidth: step === 1 ? 760 : 480 }}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-body text-xs font-semibold" style={{ color: AUTH.muted }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <button onClick={skip} disabled={busy} className="font-body text-xs underline" style={{ color: AUTH.muted }}>
            Skip onboarding
          </button>
        </div>

        <div className="flex items-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 rounded-full" style={{ height: 4, background: i <= step ? AUTH.ink : AUTH.border }} />
          ))}
        </div>

        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.96)", boxShadow: "0 20px 50px rgba(27,36,48,0.14)" }}>
          {step === 0 && (
            <div style={{ maxWidth: 400 }}>
              <h1 className="font-display font-bold text-xl mb-2" style={{ color: AUTH.ink }}>
                Welcome to PostKey{agentName ? `, ${agentName.split(" ")[0]}` : ""}!
              </h1>
              <p className="font-body text-sm mb-6" style={{ color: AUTH.muted }}>
                A couple of quick questions to get you set up — nothing here is required.
              </p>

              <label className="block mb-2">
                <span className="ob-label">YOUR NAME (AS SHOWN ON POSTS)</span>
                <span className="ob-field"><input className="ob-input" value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Jane Doe, Realtor" /></span>
              </label>

              <label className="block">
                <span className="ob-label">LISTINGS YOU TYPICALLY MANAGE <span style={{ textTransform: "none" }}>(optional)</span></span>
                <div className="flex items-center gap-2 flex-wrap">
                  {LISTING_COUNTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setListingVolume((v) => (v === c ? "" : c))}
                      className="font-body text-sm rounded-full px-3.5 py-1.5 transition"
                      style={{
                        border: `1.5px solid ${listingVolume === c ? AUTH.ink : AUTH.border}`,
                        background: listingVolume === c ? AUTH.ink : "transparent",
                        color: listingVolume === c ? "#FFFFFF" : AUTH.ink,
                        fontWeight: listingVolume === c ? 700 : 400,
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-8 md:grid-cols-[1fr_260px]">
              <div>
                <h2 className="font-display font-bold text-lg mb-1" style={{ color: AUTH.ink }}>Set up your link-in-bio page</h2>
                <p className="font-body text-sm mb-5" style={{ color: AUTH.muted }}>Fill this in and watch your page take shape on the right.</p>

                <div className="mb-4">
                  <UploadBox label="PHOTO" icon={User} state={headshot} hint="Your photo" />
                </div>

                <label className="block mb-4">
                  <span className="ob-label">BROKERAGE</span>
                  <span className="ob-field"><input className="ob-input" value={brokerage} onChange={(e) => setBrokerage(e.target.value)} placeholder="Your Brokerage" /></span>
                </label>

                <label className="ob-label block mb-1.5">BRAND COLOR</label>
                <div className="flex items-center gap-2 flex-wrap mb-5">
                  {ACCENT_PRESETS.map((c) => (
                    <button key={c} type="button" onClick={() => setAccentColor(c)} aria-label={c}
                      className="rounded-full transition"
                      style={{
                        width: "1.9rem", height: "1.9rem", background: c,
                        border: accentColor.toLowerCase() === c.toLowerCase() ? `2px solid ${AUTH.ink}` : "2px solid transparent",
                        boxShadow: accentColor.toLowerCase() === c.toLowerCase() ? "0 0 0 2px white, 0 0 0 3px " + AUTH.ink : "none",
                      }} />
                  ))}
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                      style={{ width: "1.9rem", height: "1.9rem", padding: 0, border: `1px solid ${AUTH.border}`, borderRadius: "0.4rem", background: "none" }} />
                    <span className="font-mono text-xs" style={{ color: AUTH.muted }}>Custom</span>
                  </label>
                </div>

                <span className="ob-label block mb-1.5">FIRST LINK</span>
                <div className="grid gap-2 mb-1">
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value)}
                    className="ob-field font-body text-sm"
                    style={{ color: AUTH.ink, appearance: "auto" }}
                  >
                    {CONTENT_LINK_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  <span className="ob-field"><input className="ob-input" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Link title, e.g. Book a showing" /></span>
                  <span className="ob-field"><input className="ob-input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder={CONTENT_LINK_TYPES.find((t) => t.id === linkType)?.placeholder} /></span>
                </div>
              </div>

              <div>
                <div className="rounded-2xl p-1.5" style={{ background: AUTH.inkDeep, boxShadow: "0 12px 30px rgba(0,0,0,0.28)" }}>
                  <div className="rounded-xl px-4 py-6 flex flex-col items-center text-center" style={{ background: PREVIEW_BG, minHeight: 380 }}>
                    <div
                      className="w-16 h-16 rounded-full mb-3 flex items-center justify-center font-display font-bold overflow-hidden"
                      style={{ background: previewAvatarUrl ? "transparent" : `linear-gradient(135deg, ${accentColor}, #E0298C)`, color: "#FFFFFF" }}
                    >
                      {previewAvatarUrl ? <img src={previewAvatarUrl} alt="" className="w-full h-full object-cover" /> : initials(agentName)}
                    </div>
                    <p className="font-display font-bold text-base" style={{ color: textOn(PREVIEW_BG) }}>{agentName || "Your name"}</p>
                    {brokerage && <p className="font-body text-xs mb-5" style={{ color: "#9FB4E8" }}>{brokerage}</p>}
                    {!brokerage && <div className="mb-5" />}
                    <BioLinksList links={previewLinks} bgColor={PREVIEW_BG} boxColor={PREVIEW_BOX} buttonStyle="rounded" asLink={false} />
                  </div>
                </div>
                <p className="font-mono text-[0.65rem] uppercase tracking-wide mt-2 text-center" style={{ color: AUTH.muted }}>Live preview</p>
              </div>
            </div>
          )}

          {error && <p className="font-body text-sm mt-4" style={{ color: "#C0392B" }}>{error}</p>}

          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} disabled={busy} className="flex items-center gap-1.5 font-body text-sm font-semibold" style={{ color: AUTH.muted }}>
                <ArrowLeft size={15} /> Back
              </button>
            ) : <span />}
            <button
              onClick={next}
              disabled={busy}
              className="flex items-center gap-2 py-2.5 px-5 rounded-lg font-body text-sm font-semibold transition disabled:opacity-60"
              style={{ background: AUTH.ink, color: "#FFFFFF" }}
            >
              {busy ? "Saving…" : isLast ? "Finish setup" : "Continue"}
              {isLast ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

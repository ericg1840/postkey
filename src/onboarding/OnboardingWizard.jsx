import { useState } from "react";
import { User, Building2, Image as ImageIcon, ArrowRight, ArrowLeft, Check } from "lucide-react";
import {
  ACCENT_PRESETS, DEFAULT_HEADSHOT_URL, DEFAULT_LOGO_URL,
  useAgentAsset, UploadBox,
} from "../shared.jsx";
import { AUTH } from "../auth/AuthShell.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

const STEPS = ["Welcome", "Photo & logo", "Brand color", "Contact info", "Brokerage & license"];

export function OnboardingWizard() {
  const { user, brandKit, saveBrandKit } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({
    agentName: brandKit?.agentName || user?.fullName || "",
    agentPhone: brandKit?.agentPhone || "",
    agentEmail: brandKit?.agentEmail || "",
    website: brandKit?.website || "",
    brokerageName: brandKit?.brokerageName || "",
    brokerageCity: brandKit?.brokerageCity || "",
    officePhone: brandKit?.officePhone || "",
    licenseNumber: brandKit?.licenseNumber || "",
    accentColor: brandKit?.accentColor || "#1B2430",
  });
  const set = (key) => (e) => setData((d) => ({ ...d, [key]: e.target.value }));

  const headshot = useAgentAsset(DEFAULT_HEADSHOT_URL, "Headshot", brandKit?.headshotUrl);
  const logo = useAgentAsset(DEFAULT_LOGO_URL, "Brokerage logo", brandKit?.logoUrl);

  const finish = async (markOnboarded) => {
    setBusy(true);
    try {
      await saveBrandKit({
        ...data,
        headshotUrl: headshot.source === "custom" ? headshot.url : null,
        logoUrl: logo.source === "custom" ? logo.url : null,
        onboarded: markOnboarded,
      });
    } finally {
      setBusy(false);
    }
  };

  const isLast = step === STEPS.length - 1;
  const next = async () => {
    if (isLast) await finish(true);
    else setStep((s) => s + 1);
  };
  const skip = () => finish(true);

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

      <div className="w-full" style={{ maxWidth: 480 }}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-body text-xs font-semibold" style={{ color: AUTH.muted }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <button onClick={skip} disabled={busy} className="font-body text-xs underline" style={{ color: AUTH.muted }}>
            Skip for now
          </button>
        </div>

        <div className="flex items-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 rounded-full" style={{ height: 4, background: i <= step ? AUTH.ink : AUTH.border }} />
          ))}
        </div>

        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.96)", boxShadow: "0 20px 50px rgba(27,36,48,0.14)" }}>
          {step === 0 && (
            <div>
              <h1 className="font-display font-bold text-xl mb-2" style={{ color: AUTH.ink }}>Welcome to PostKey{data.agentName ? `, ${data.agentName.split(" ")[0]}` : ""}!</h1>
              <p className="font-body text-sm mb-6" style={{ color: AUTH.muted }}>
                Let's set up your brand kit once — your photo, logo, colors, and contact info will be ready on every post from now on.
              </p>
              <label>
                <span className="ob-label">YOUR NAME (AS SHOWN ON POSTS)</span>
                <span className="ob-field"><input className="ob-input" value={data.agentName} onChange={set("agentName")} placeholder="Jane Doe, Realtor" /></span>
              </label>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display font-bold text-lg mb-1" style={{ color: AUTH.ink }}>Your photo & logo</h2>
              <p className="font-body text-sm mb-5" style={{ color: AUTH.muted }}>These appear on the contact strip of every post.</p>
              <div className="grid grid-cols-2 gap-3">
                <UploadBox label="HEADSHOT" icon={User} state={headshot} hint="Your photo" />
                <UploadBox label="LOGO" icon={Building2} state={logo} hint="Brokerage logo" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display font-bold text-lg mb-1" style={{ color: AUTH.ink }}>Your brand color</h2>
              <p className="font-body text-sm mb-5" style={{ color: AUTH.muted }}>Used for headlines, accents, and highlights on your posts.</p>
              <div className="flex items-center gap-2 flex-wrap">
                {ACCENT_PRESETS.map((c) => (
                  <button key={c} onClick={() => setData((d) => ({ ...d, accentColor: c }))} aria-label={c}
                    className="rounded-full transition"
                    style={{
                      width: "2rem", height: "2rem", background: c,
                      border: data.accentColor.toLowerCase() === c.toLowerCase() ? `2px solid ${AUTH.ink}` : "2px solid transparent",
                      boxShadow: data.accentColor.toLowerCase() === c.toLowerCase() ? "0 0 0 2px white, 0 0 0 3px " + AUTH.ink : "none",
                    }} />
                ))}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="color" value={data.accentColor} onChange={(e) => setData((d) => ({ ...d, accentColor: e.target.value }))}
                    style={{ width: "2rem", height: "2rem", padding: 0, border: `1px solid ${AUTH.border}`, borderRadius: "0.4rem", background: "none" }} />
                  <span className="font-mono text-xs" style={{ color: AUTH.muted }}>Custom</span>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <h2 className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>Contact info</h2>
              <label>
                <span className="ob-label">CELL PHONE</span>
                <span className="ob-field"><input className="ob-input" value={data.agentPhone} onChange={set("agentPhone")} placeholder="(555) 123-4567" /></span>
              </label>
              <label>
                <span className="ob-label">EMAIL</span>
                <span className="ob-field"><input className="ob-input" type="email" value={data.agentEmail} onChange={set("agentEmail")} placeholder="you@example.com" /></span>
              </label>
              <label>
                <span className="ob-label">WEBSITE</span>
                <span className="ob-field"><input className="ob-input" value={data.website} onChange={set("website")} placeholder="yourname.com" /></span>
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4">
              <h2 className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>Brokerage & license</h2>
              <label>
                <span className="ob-label">BROKERAGE</span>
                <span className="ob-field"><input className="ob-input" value={data.brokerageName} onChange={set("brokerageName")} placeholder="Your Brokerage" /></span>
              </label>
              <label>
                <span className="ob-label">OFFICE CITY</span>
                <span className="ob-field"><input className="ob-input" value={data.brokerageCity} onChange={set("brokerageCity")} placeholder="Your City" /></span>
              </label>
              <label>
                <span className="ob-label">OFFICE PHONE</span>
                <span className="ob-field"><input className="ob-input" value={data.officePhone} onChange={set("officePhone")} placeholder="(555) 987-6543" /></span>
              </label>
              <label>
                <span className="ob-label">LICENSE NUMBER</span>
                <span className="ob-field"><input className="ob-input" value={data.licenseNumber} onChange={set("licenseNumber")} placeholder="For required disclosures" /></span>
              </label>
            </div>
          )}

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

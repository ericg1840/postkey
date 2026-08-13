import { Key, Sparkles, Palette, Lock } from "lucide-react";

// Neutral, brand-agnostic palette for the sign-in/sign-up chrome — deliberately
// not the app's pink accent, since this screen is the first thing every agent
// sees, before it's "their" workspace.
export const AUTH = {
  ink: "#1B2430",
  inkDeep: "#121924",
  muted: "#697386",
  border: "#E3EAF2",
  field: "#F4F7FB",
  card: "rgba(255,255,255,0.96)",
};

const FEATURES = [
  { icon: Sparkles, text: "Turn a listing photo into a branded post in seconds" },
  { icon: Palette, text: "Your logo, headshot, and colors — saved to your account" },
  { icon: Lock, text: "Listing photos never leave your device" },
];

function BrandPanel() {
  return (
    <div
      className="hidden md:flex flex-col justify-between rounded-2xl p-9 relative overflow-hidden"
      style={{ background: `linear-gradient(155deg, ${AUTH.ink} 0%, ${AUTH.inkDeep} 100%)`, width: 340 }}
    >
      <div className="absolute rounded-full" style={{ width: 220, height: 220, top: -80, right: -80, background: "rgba(255,255,255,0.06)" }} />
      <div className="absolute rounded-full" style={{ width: 160, height: 160, bottom: -60, left: -60, background: "rgba(255,255,255,0.05)" }} />

      <div className="relative">
        <div className="flex items-center justify-center rounded-xl mb-5" style={{ width: 48, height: 48, background: "rgba(255,255,255,0.12)" }}>
          <Key size={22} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
        </div>
        <h2 className="font-display font-bold text-2xl" style={{ color: "#FFFFFF" }}>PostKey</h2>
        <p className="font-body text-sm mt-2" style={{ color: "rgba(255,255,255,0.65)", maxWidth: 240 }}>
          Branded social posts for real estate agents, ready in minutes.
        </p>
      </div>

      <div className="relative grid gap-4">
        {FEATURES.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 28, height: 28, background: "rgba(255,255,255,0.1)" }}>
              <Icon size={14} color="#FFFFFF" />
            </div>
            <p className="font-body text-xs mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthShell({ icon: Icon, title, subtitle, children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #BFE0F5 0%, #DCEEFA 45%, #F3F9FD 100%)",
      }}
    >
      <style>{`
        .auth-input { width: 100%; background: transparent; border: none; outline: none; font-family: 'Public Sans', sans-serif; font-size: 0.9rem; color: ${AUTH.ink}; }
        .auth-input::placeholder { color: ${AUTH.muted}; }
        .auth-field { display: flex; align-items: center; gap: 0.6rem; background: ${AUTH.field}; border: 1px solid ${AUTH.border}; border-radius: 10px; padding: 0.7rem 0.9rem; }
        .auth-field:focus-within { border-color: ${AUTH.ink}; }
        .auth-cta { width: 100%; background: ${AUTH.ink}; color: #FFFFFF; font-family: 'Public Sans', sans-serif; font-weight: 600; font-size: 0.9rem; border-radius: 10px; padding: 0.75rem; transition: opacity 0.15s; }
        .auth-cta:disabled { opacity: 0.6; }
        .auth-cta:not(:disabled):hover { opacity: 0.88; }
      `}</style>

      <div className="absolute rounded-full" style={{ width: 420, height: 420, top: -160, left: -120, background: "rgba(255,255,255,0.35)", filter: "blur(10px)" }} />
      <div className="absolute rounded-full" style={{ width: 320, height: 320, bottom: -100, right: -80, background: "rgba(255,255,255,0.4)", filter: "blur(10px)" }} />

      <div className="w-full relative flex gap-5 items-stretch justify-center" style={{ maxWidth: 760 }}>
        <BrandPanel />

        <div className="w-full" style={{ maxWidth: 380 }}>
          <div className="flex items-center gap-2 justify-center mb-5 md:hidden">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: AUTH.ink }}>
              <Key size={15} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>PostKey</span>
          </div>

          <div
            className="rounded-2xl p-8"
            style={{ background: AUTH.card, boxShadow: "0 20px 50px rgba(27,36,48,0.14)", backdropFilter: "blur(6px)" }}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: 44, height: 44, background: AUTH.ink }}>
                <Icon size={20} color="#FFFFFF" />
              </div>
              <h1 className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>{title}</h1>
              {subtitle && <p className="font-body text-xs mt-1.5" style={{ color: AUTH.muted, maxWidth: 260 }}>{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthField({ icon: Icon, trailing, children }) {
  return (
    <label className="auth-field">
      {Icon && <Icon size={16} style={{ color: AUTH.muted, flexShrink: 0 }} />}
      {children}
      {trailing}
    </label>
  );
}

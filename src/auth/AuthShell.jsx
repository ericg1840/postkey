import { Key, Lightbulb, PenSquare, CalendarCheck, ShieldCheck, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { ACCENT_PRESETS } from "../shared.jsx";

// Neutral, brand-agnostic palette for the sign-in/sign-up chrome — deliberately
// not the app's pink accent, since this screen is the first thing every agent
// sees, before it's "their" workspace.
export const AUTH = {
  ink: "#1B2430",
  inkDeep: "#0E141C",
  muted: "#697386",
  border: "#E3EAF2",
  field: "#F4F7FB",
  card: "rgba(255,255,255,0.96)",
};

export const AUTH_BLUE = ACCENT_PRESETS[1];

const FEATURES = [
  { icon: Lightbulb, title: "Know what to post", text: "Get content ideas that connect with your audience." },
  { icon: PenSquare, title: "Create branded content fast", text: "Use your templates and brand to post in minutes." },
  { icon: CalendarCheck, title: "Stay consistent every week", text: "Plan ahead and keep your brand top of mind." },
];

// A stylized "finished post" mockup — no real screenshot needed, just enough
// visual specificity that a visitor immediately reads it as a social post.
function PostMockup() {
  return (
    <div className="relative" style={{ width: 260, height: 300 }}>
      <div
        className="absolute rounded-xl p-3"
        style={{ width: 168, bottom: 6, left: -6, background: "linear-gradient(155deg, #2A2140, #1B1430)", transform: "rotate(-9deg)", boxShadow: "0 16px 30px rgba(0,0,0,0.35)" }}
      >
        <p className="font-display font-bold" style={{ color: "#FFFFFF", fontSize: "0.72rem", lineHeight: 1.25 }}>
          5 TIPS FOR FIRST-TIME HOME BUYERS
        </p>
        <p className="font-body mt-2" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.62rem" }}>Swipe →</p>
      </div>

      <div
        className="absolute rounded-xl p-3"
        style={{ width: 168, bottom: -10, right: -10, background: "linear-gradient(155deg, #14213A, #0E1626)", transform: "rotate(7deg)", boxShadow: "0 16px 30px rgba(0,0,0,0.35)" }}
      >
        <p className="font-display font-bold" style={{ color: "#FFFFFF", fontSize: "0.72rem" }}>LOCAL MARKET UPDATE</p>
        <p className="font-body mt-1" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.6rem" }}>What's happening in your neighborhood</p>
        <svg width="70" height="20" viewBox="0 0 70 20" className="mt-1.5">
          <polyline points="0,16 12,10 24,13 36,6 48,9 60,2 70,4" fill="none" stroke={AUTH_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div
        className="absolute rounded-2xl overflow-hidden"
        style={{ width: 190, top: 0, left: 30, background: "#FFFFFF", transform: "rotate(3deg)", boxShadow: "0 24px 46px rgba(0,0,0,0.4)" }}
      >
        <div className="flex items-center gap-2 px-2.5 py-2">
          <div className="rounded-full flex-shrink-0" style={{ width: 22, height: 22, background: `linear-gradient(135deg, ${ACCENT_PRESETS[0]}, ${ACCENT_PRESETS[4]})` }} />
          <div>
            <p className="font-body font-semibold" style={{ fontSize: "0.62rem", color: AUTH.ink }}>Market Update</p>
            <p className="font-body" style={{ fontSize: "0.55rem", color: AUTH.muted }}>Just now</p>
          </div>
        </div>
        <div className="relative" style={{ height: 150, background: "linear-gradient(165deg, #4A6FA5, #16213A)" }}>
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <p className="font-display font-bold" style={{ color: "#FFFFFF", fontSize: "1.15rem", lineHeight: 1 }}>JUST<br />SOLD</p>
            <p className="font-body mt-1.5" style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.55rem" }}>123 Maple Street<br />Austin, TX</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-2.5 py-2">
          <div className="flex items-center gap-2.5">
            <Heart size={13} color={AUTH.muted} />
            <MessageCircle size={13} color={AUTH.muted} />
            <Send size={13} color={AUTH.muted} />
          </div>
          <Bookmark size={13} color={AUTH.muted} />
        </div>
        <div className="grid gap-1 px-2.5 pb-2.5">
          <div className="rounded-full" style={{ height: 4, width: "70%", background: AUTH.border }} />
          <div className="rounded-full" style={{ height: 4, width: "45%", background: AUTH.border }} />
        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div
      className="hidden md:flex flex-col justify-between rounded-2xl p-9 relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${AUTH.ink} 0%, ${AUTH.inkDeep} 100%)`, width: 400 }}
    >
      {/* Glow accents */}
      <div className="absolute rounded-full" style={{ width: 300, height: 300, top: -120, right: -100, background: `${AUTH_BLUE}33`, filter: "blur(50px)" }} />
      <div className="absolute rounded-full" style={{ width: 240, height: 240, bottom: -80, left: -100, background: `${ACCENT_PRESETS[4]}2E`, filter: "blur(50px)" }} />
      {/* Faint dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          maskImage: "radial-gradient(ellipse at 70% 20%, black 0%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse at 70% 20%, black 0%, transparent 65%)",
        }}
      />

      <div className="relative">
        <span className="font-mono font-semibold" style={{ color: AUTH_BLUE, fontSize: "0.68rem", letterSpacing: "0.08em" }}>
          BUILT FOR REAL ESTATE AGENTS
        </span>
        <h2 className="font-display font-bold mt-2" style={{ color: "#FFFFFF", fontSize: "1.9rem", lineHeight: 1.12 }}>
          Your real estate content, ready in minutes.
        </h2>
        <p className="font-body text-sm mt-3" style={{ color: "rgba(255,255,255,0.62)", maxWidth: 280 }}>
          Create branded posts, find content ideas, and stay consistent on social.
        </p>

        <div className="grid gap-4 mt-7">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 32, height: 32, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Icon size={15} color={AUTH_BLUE} />
              </div>
              <div>
                <p className="font-body text-sm font-semibold" style={{ color: "#FFFFFF" }}>{title}</p>
                <p className="font-body text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex justify-end my-6">
        <PostMockup />
      </div>

      <div className="relative pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <p className="flex items-center gap-1.5 font-body text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
          <ShieldCheck size={14} color={AUTH_BLUE} />
          Free to get started &nbsp;•&nbsp; No design skills needed
        </p>
      </div>
    </div>
  );
}

export function AuthShell({ icon: Icon, title, subtitle, onBack, children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #EDF1FA 0%, #F4F6FC 45%, #FAFBFE 100%)",
      }}
    >
      <style>{`
        .auth-input { width: 100%; background: transparent; border: none; outline: none; font-family: 'Public Sans', sans-serif; font-size: 0.9rem; color: ${AUTH.ink}; }
        .auth-input::placeholder { color: ${AUTH.muted}; }
        .auth-field { display: flex; align-items: center; gap: 0.6rem; background: ${AUTH.field}; border: 1px solid ${AUTH.border}; border-radius: 10px; padding: 0.7rem 0.9rem; }
        .auth-field:focus-within { border-color: ${AUTH_BLUE}; }
        .auth-cta { width: 100%; background: ${AUTH_BLUE}; color: #FFFFFF; font-family: 'Public Sans', sans-serif; font-weight: 600; font-size: 0.9rem; border-radius: 10px; padding: 0.8rem; transition: opacity 0.15s; }
        .auth-cta:disabled { opacity: 0.6; }
        .auth-cta:not(:disabled):hover { opacity: 0.9; }
      `}</style>

      <div className="absolute top-6 left-6 md:top-8 md:left-9 flex items-center gap-4 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: AUTH.ink }}>
            <Key size={15} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
          </div>
          <span className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>PostKey</span>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="font-body text-xs font-semibold flex items-center gap-1.5"
            style={{ color: AUTH.muted }}
          >
            ← Back to home
          </button>
        )}
      </div>

      <div className="w-full relative flex gap-5 items-stretch justify-center mt-14 md:mt-0" style={{ maxWidth: 820 }}>
        <BrandPanel />

        <div className="w-full" style={{ maxWidth: 420 }}>
          <div
            className="rounded-2xl p-8"
            style={{ background: AUTH.card, boxShadow: "0 20px 50px rgba(27,36,48,0.14)", backdropFilter: "blur(6px)" }}
          >
            {title && (
              <div className="flex flex-col items-center text-center mb-6">
                {Icon && (
                  <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: 44, height: 44, background: AUTH.ink }}>
                    <Icon size={20} color="#FFFFFF" />
                  </div>
                )}
                <h1 className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>{title}</h1>
                {subtitle && <p className="font-body text-xs mt-1.5" style={{ color: AUTH.muted, maxWidth: 280 }}>{subtitle}</p>}
              </div>
            )}
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

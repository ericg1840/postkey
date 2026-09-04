import { Lightbulb, PenSquare, CalendarCheck, ShieldCheck, Key } from "lucide-react";
import { ACCENT_PRESETS, Logo } from "../shared.jsx";
import { PostCard } from "../marketing/HomePage.jsx";

// Matches the "Bold Blocks" palette used across the marketing site and app
// chrome: thick ink borders + offset sticker shadows, full-saturation
// accents, playful rotation — this screen should read as the same product
// as the page a visitor just signed up from, not a separate calmer one.
export const AUTH = {
  ink: "#1B2430",
  inkDeep: "#0E141C",
  muted: "#697386",
  border: "#E3EAF2",
  field: "#F4F7FB",
  card: "#FFFFFF",
};

export const AUTH_BLUE = ACCENT_PRESETS[1];
const PINK = ACCENT_PRESETS[0];
const GREEN = ACCENT_PRESETS[2];
const PURPLE = ACCENT_PRESETS[4];

const FEATURES = [
  { icon: Lightbulb, color: PINK, title: "Know what to post", text: "Get content ideas that connect with your audience." },
  { icon: PenSquare, color: AUTH_BLUE, title: "Create branded content fast", text: "Use your templates and brand to post in minutes." },
  { icon: CalendarCheck, color: GREEN, title: "Stay consistent every week", text: "Plan ahead and keep your brand top of mind." },
];

function BrandPanel() {
  return (
    <div
      className="hidden md:flex flex-col justify-between rounded-2xl p-9 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${PURPLE}, ${AUTH_BLUE})`, border: "2.5px solid #1B2430", boxShadow: "6px 6px 0 #1B2430", width: 400 }}
    >
      <div className="absolute rounded-full pointer-events-none" style={{ top: -100, right: -100, width: 320, height: 320, background: "#FFFFFF", opacity: 0.06 }} />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5">
          <Key size={13} color="#F2B705" style={{ transform: "rotate(-45deg)" }} />
          <span className="font-mono font-bold" style={{ color: "#F2B705", fontSize: "0.72rem", letterSpacing: "0.08em" }}>
            BUILT FOR REAL ESTATE AGENTS
          </span>
        </span>
        <h2 className="font-bold mt-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFFFFF", fontSize: "1.9rem", lineHeight: 1.12 }}>
          Your real estate content, ready in minutes.
        </h2>
        <p className="font-body text-sm mt-3" style={{ color: "rgba(255,255,255,0.75)", maxWidth: 280 }}>
          Create branded posts, find content ideas, and stay consistent on social.
        </p>

        <div className="grid gap-4 mt-7">
          {FEATURES.map(({ icon: Icon, color, title, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 32, height: 32, background: color, transform: `rotate(${i % 2 === 0 ? -6 : 6}deg)` }}>
                <Icon size={15} color="#FFFFFF" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold" style={{ color: "#FFFFFF" }}>{title}</p>
                <p className="font-body text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto my-8" style={{ width: 260, height: 190 }}>
        <div className="absolute" style={{ top: 0, left: 20 }}>
          <PostCard category="JUST LISTED" headline="Just Listed!" color={PINK} rotate={-8} top={0} left={0} scale={0.78} />
        </div>
        <div className="absolute" style={{ top: 24, left: 130 }}>
          <PostCard category="SOLD" headline="Sold Fast!" color={GREEN} rotate={7} top={0} left={0} scale={0.78} />
        </div>
      </div>

      <div className="relative pt-5" style={{ borderTop: "2px solid rgba(255,255,255,0.18)" }}>
        <p className="flex items-center gap-1.5 font-body text-xs font-semibold" style={{ color: "#FFFFFF" }}>
          <ShieldCheck size={14} color="#FFFFFF" />
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
      style={{ background: "#FFF6E7" }}
    >
      <div className="absolute rounded-full pointer-events-none" style={{ top: -120, left: -100, width: 360, height: 360, background: AUTH_BLUE, opacity: 0.14, filter: "blur(10px)" }} />
      <div className="absolute rounded-full pointer-events-none" style={{ bottom: -140, right: -80, width: 420, height: 420, background: PINK, opacity: 0.14, filter: "blur(10px)" }} />
      <div className="absolute rounded-full pointer-events-none hidden sm:block" style={{ top: 60, right: 120, width: 70, height: 70, background: GREEN, opacity: 0.18 }} />

      <style>{`
        .auth-input { width: 100%; background: transparent; border: none; outline: none; font-family: 'Public Sans', sans-serif; font-size: 0.9rem; color: ${AUTH.ink}; }
        .auth-input::placeholder { color: ${AUTH.muted}; }
        .auth-field { display: flex; align-items: center; gap: 0.6rem; background: ${AUTH.field}; border: 2px solid #1B2430; border-radius: 12px; padding: 0.7rem 0.9rem; }
        .auth-field:focus-within { background: #FFFFFF; }
        .auth-cta { width: 100%; background: ${PINK}; color: #FFFFFF; font-family: 'Public Sans', sans-serif; font-weight: 700; font-size: 0.9rem; border: 2.5px solid #1B2430; box-shadow: 4px 4px 0 #1B2430; border-radius: 999px; padding: 0.8rem; transition: opacity 0.15s, transform 0.15s; }
        .auth-cta:disabled { opacity: 0.6; }
        .auth-cta:not(:disabled):hover { opacity: 0.88; }
      `}</style>

      <div className="absolute top-6 left-6 md:top-8 md:left-9 flex items-center gap-4 z-10" style={{ top: "calc(1.5rem + env(safe-area-inset-top))" }}>
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink }}>PostKey</span>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="font-body text-xs font-semibold flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-white"
            style={{ color: AUTH.ink, border: "2px solid #1B2430" }}
          >
            ← Back to home
          </button>
        )}
      </div>

      <div className="w-full relative flex gap-6 items-stretch justify-center mt-14 md:mt-0" style={{ maxWidth: 840 }}>
        <BrandPanel />

        <div className="w-full" style={{ maxWidth: 420 }}>
          <div
            className="rounded-2xl p-8"
            style={{ background: AUTH.card, border: "2.5px solid #1B2430", boxShadow: "6px 6px 0 #1B2430" }}
          >
            {title && (
              <div className="flex flex-col items-center text-center mb-6">
                {Icon && (
                  <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: 44, height: 44, background: AUTH.ink, transform: "rotate(-4deg)" }}>
                    <Icon size={20} color="#FFFFFF" />
                  </div>
                )}
                <h1 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink }}>{title}</h1>
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

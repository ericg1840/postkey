import { Key, Sparkles, Palette, Lock, Users, Star } from "lucide-react";
import { AUTH } from "../auth/AuthShell.jsx";
import { ACCENT_PRESETS } from "../shared.jsx";

const FEATURES = [
  { icon: Sparkles, title: "Create posts in seconds", text: "Turn a listing photo into a polished, on-brand graphic without opening a design tool.", color: ACCENT_PRESETS[0] },
  { icon: Palette, title: "Always on-brand", text: "Your logo, headshot, colors, and contact info are set up once and applied to every post.", color: ACCENT_PRESETS[1] },
  { icon: Lock, title: "Your photos stay private", text: "Listing photos are rendered right in your browser and never uploaded anywhere.", color: ACCENT_PRESETS[2] },
  { icon: Users, title: "Listings and Community", text: "Just Sold and Just Listed graphics, plus local-spotlight and market-tip posts to stay visible between listings.", color: ACCENT_PRESETS[3] },
];

const MOCK_CARDS = [
  { label: "Just SOLD!", color: ACCENT_PRESETS[0], rotate: -9, top: 10, left: 0 },
  { label: "Open House!", color: ACCENT_PRESETS[1], rotate: 6, top: 70, left: 150 },
  { label: "Local Favorite!", color: ACCENT_PRESETS[3], rotate: -4, top: 190, left: 20 },
];

function PostCard({ label, color, rotate, top, left }) {
  return (
    <div
      className="absolute rounded-2xl overflow-hidden"
      style={{
        width: 168, height: 200, top, left,
        transform: `rotate(${rotate}deg)`,
        background: "#FFFFFF",
        boxShadow: "0 20px 40px rgba(27,36,48,0.22)",
      }}
    >
      <div className="relative" style={{ height: "62%", background: `linear-gradient(155deg, ${color}22, ${color}55)` }}>
        <span
          className="absolute rounded-lg font-display font-bold"
          style={{ top: 10, right: 10, background: color, color: "#FFFFFF", fontSize: "0.6rem", padding: "5px 8px", lineHeight: 1.2, textAlign: "right" }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-2.5" style={{ height: "38%" }}>
        <div className="rounded-full flex-shrink-0" style={{ width: 22, height: 22, background: AUTH.border }} />
        <div className="grid gap-1 flex-1">
          <div className="rounded-full" style={{ height: 5, width: "70%", background: AUTH.border }} />
          <div className="rounded-full" style={{ height: 5, width: "45%", background: AUTH.border }} />
        </div>
      </div>
    </div>
  );
}

function FloatingDot({ top, left, right, bottom, size = 10, color }) {
  return <div className="absolute rounded-full" style={{ top, left, right, bottom, width: size, height: size, background: color }} />;
}

function FloatingSparkle({ top, left, right, bottom, size = 22, color, rotate = 0 }) {
  return (
    <div className="absolute" style={{ top, left, right, bottom, transform: `rotate(${rotate}deg)` }}>
      <Sparkles size={size} color={color} fill={color} strokeWidth={0} />
    </div>
  );
}

export function HomePage({ onGetStarted, onLogIn }) {
  return (
    <div style={{ background: "#FDFBF7" }}>
      <header>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: AUTH.ink }}>
              <Key size={15} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>PostKey</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onLogIn}
              className="font-body text-sm font-semibold rounded-full px-4 py-2 transition"
              style={{ color: AUTH.ink, background: "#F1EFE8" }}
            >
              Sign in
            </button>
            <button
              onClick={onGetStarted}
              className="font-body text-sm font-semibold rounded-full px-4 py-2 transition hover:opacity-88"
              style={{ background: ACCENT_PRESETS[0], color: "#FFFFFF" }}
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 460, height: 460, top: -220, left: -180, background: `${ACCENT_PRESETS[1]}12`, filter: "blur(20px)" }} />
        <div className="absolute rounded-full" style={{ width: 360, height: 360, bottom: -180, right: -120, background: `${ACCENT_PRESETS[0]}14`, filter: "blur(20px)" }} />

        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24 relative grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6"
              style={{ background: "#FFFFFF", boxShadow: "0 4px 14px rgba(27,36,48,0.08)" }}
            >
              <Key size={13} color={ACCENT_PRESETS[0]} style={{ transform: "rotate(-45deg)" }} />
              <span className="font-body text-xs font-semibold" style={{ color: AUTH.ink }}>Built for real estate agents</span>
            </div>

            <h1 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "clamp(2.1rem, 4.8vw, 3.4rem)", lineHeight: 1.08 }}>
              Turn listing photos into{" "}
              <span style={{ fontFamily: "'Dancing Script', cursive", color: ACCENT_PRESETS[0], fontWeight: 700 }}>
                scroll-stopping
              </span>{" "}
              posts.
            </h1>
            <p className="font-body mt-5" style={{ color: AUTH.muted, fontSize: "1.05rem", maxWidth: 460 }}>
              Upload a photo, PostKey does the rest — your brand, your colors, ready to share in every size you need.
            </p>

            <div className="flex items-center gap-3 mt-8 flex-wrap">
              <button
                onClick={onGetStarted}
                className="font-body font-semibold rounded-full px-6 py-3.5 transition hover:opacity-88"
                style={{ background: ACCENT_PRESETS[0], color: "#FFFFFF", fontSize: "0.95rem", boxShadow: `0 10px 24px ${ACCENT_PRESETS[0]}40` }}
              >
                Get Started — it's free
              </button>
              <button
                onClick={onLogIn}
                className="font-body font-semibold rounded-full px-6 py-3.5 transition"
                style={{ color: AUTH.ink, fontSize: "0.95rem", background: "#F1EFE8" }}
              >
                Log in
              </button>
            </div>

            <div className="flex items-center gap-5 mt-8 flex-wrap">
              <span className="flex items-center gap-1.5 font-body text-xs font-semibold" style={{ color: AUTH.muted }}>
                <Lock size={13} /> Photos stay private
              </span>
              <span className="flex items-center gap-1.5 font-body text-xs font-semibold" style={{ color: AUTH.muted }}>
                <Sparkles size={13} /> No design skills needed
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block" style={{ height: 420 }}>
            <FloatingSparkle top={-6} right={40} size={26} color={ACCENT_PRESETS[3]} rotate={-10} />
            <FloatingSparkle bottom={20} left={0} size={18} color={ACCENT_PRESETS[1]} rotate={12} />
            <FloatingDot top={30} right={0} size={12} color={ACCENT_PRESETS[2]} />
            <FloatingDot bottom={60} right={60} size={8} color={ACCENT_PRESETS[0]} />
            <Star size={16} color={AUTH.border} fill={AUTH.border} strokeWidth={0} className="absolute" style={{ top: 130, right: 10 }} />

            <div className="relative mx-auto" style={{ width: 340, height: 400 }}>
              {MOCK_CARDS.map((c, i) => <PostCard key={i} {...c} />)}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="font-display font-bold text-center" style={{ color: AUTH.ink, fontSize: "1.75rem" }}>
          Everything you need, built in
        </h2>
        <div className="grid sm:grid-cols-2 gap-5 mt-10">
          {FEATURES.map(({ icon: Icon, title, text, color }, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: "#FFFFFF", boxShadow: "0 4px 20px rgba(27,36,48,0.06)" }}>
              <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: 42, height: 42, background: `${color}1A` }}>
                <Icon size={19} color={color} />
              </div>
              <h3 className="font-display font-bold text-base" style={{ color: AUTH.ink }}>{title}</h3>
              <p className="font-body text-sm mt-1.5" style={{ color: AUTH.muted }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="px-6">
        <div
          className="max-w-5xl mx-auto rounded-3xl relative overflow-hidden text-center py-16 px-6"
          style={{ background: AUTH.ink }}
        >
          <FloatingSparkle top={20} left={40} size={20} color={ACCENT_PRESETS[3]} rotate={-8} />
          <FloatingSparkle bottom={24} right={60} size={16} color={ACCENT_PRESETS[1]} rotate={14} />
          <h2 className="font-display font-bold text-2xl sm:text-3xl relative" style={{ color: "#FFFFFF" }}>
            Set up your brand kit once.
          </h2>
          <p className="font-body text-sm mt-3 relative" style={{ color: "rgba(255,255,255,0.65)" }}>
            Then every post — Just Listed, Just Sold, local spotlights, and more — is ready in a couple of clicks.
          </p>
          <button
            onClick={onGetStarted}
            className="font-body font-semibold rounded-full px-6 py-3.5 mt-7 relative transition hover:opacity-88"
            style={{ background: ACCENT_PRESETS[0], color: "#FFFFFF", fontSize: "0.95rem" }}
          >
            Create your account
          </button>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10">
        <p className="font-body text-xs" style={{ color: AUTH.muted }}>© {new Date().getFullYear()} PostKey.</p>
      </footer>
    </div>
  );
}

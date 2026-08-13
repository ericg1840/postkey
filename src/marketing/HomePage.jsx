import { Key, Sparkles, Palette, Lock, Lightbulb, Zap, Repeat, Star, ArrowRight } from "lucide-react";
import { AUTH } from "../auth/AuthShell.jsx";
import { ACCENT_PRESETS } from "../shared.jsx";

// Primary landing-page accent — swapped from the pink post-accent preset to blue.
const PRIMARY = ACCENT_PRESETS[1];

const FEATURES = [
  { icon: Lightbulb, title: "Never run out of ideas", text: "Fresh real estate, local, educational, and engagement content to post between listings.", color: ACCENT_PRESETS[3] },
  { icon: Zap, title: "Create in seconds", text: "Turn an idea, listing, or photo into a ready-to-post graphic — no design tool required.", color: PRIMARY },
  { icon: Palette, title: "Always on-brand", text: "Your logo, headshot, colors, and contact info are set up once and applied automatically.", color: ACCENT_PRESETS[4] },
  { icon: Repeat, title: "Stay consistent", text: "Know exactly what to post next, so a busy week never means a quiet feed.", color: ACCENT_PRESETS[2] },
];

const STEPS = [
  { n: 1, title: "Choose what to post", text: "Pick a listing, market update, buyer tip, or local spotlight — or get an idea from PostKey." },
  { n: 2, title: "PostKey creates it", text: "Get your graphic, headline, and copy, formatted and ready for social." },
  { n: 3, title: "Make it yours", text: "Your colors, logo, headshot, and contact info are already applied." },
];

const EXAMPLES = [
  { tag: "JUST LISTED", headline: "Just Listed!", sub: "419 Tall Oaks Dr", color: PRIMARY },
  { tag: "JUST SOLD", headline: "Sold Fast!", sub: "Another happy client", color: ACCENT_PRESETS[3] },
  { tag: "MARKET UPDATE", headline: "3 Things Buyers Should Know", sub: "Before making an offer", color: ACCENT_PRESETS[4] },
  { tag: "LOCAL SPOTLIGHT", headline: "Local Favorite!", sub: "The Kettle & Vine", color: ACCENT_PRESETS[2] },
];

function PostCard({ label, color, rotate, top, left, scale = 1 }) {
  return (
    <div
      className="absolute rounded-2xl overflow-hidden"
      style={{
        width: 168, height: 200, top, left,
        transform: `rotate(${rotate}deg) scale(${scale})`,
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

// A finished-looking example post — used in the "See what you can create" gallery.
function ExampleCard({ tag, headline, sub, color }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 12px 30px rgba(27,36,48,0.1)" }}>
      <div className="relative flex flex-col justify-end p-4" style={{ height: 190, background: `linear-gradient(165deg, ${color}26, ${color}66)` }}>
        <span
          className="absolute rounded-full font-mono font-semibold"
          style={{ top: 12, left: 12, background: "#FFFFFF", color, fontSize: "0.62rem", letterSpacing: "0.04em", padding: "4px 10px" }}
        >
          {tag}
        </span>
        <h4 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "1.25rem", lineHeight: 1.15 }}>{headline}</h4>
        <p className="font-body text-xs mt-1" style={{ color: AUTH.ink, opacity: 0.7 }}>{sub}</p>
      </div>
      <div className="flex items-center gap-2 px-3.5 py-3">
        <div className="rounded-full flex-shrink-0" style={{ width: 20, height: 20, background: AUTH.border }} />
        <div className="grid gap-1 flex-1">
          <div className="rounded-full" style={{ height: 4, width: "60%", background: AUTH.border }} />
          <div className="rounded-full" style={{ height: 4, width: "38%", background: AUTH.border }} />
        </div>
      </div>
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
          <nav className="hidden sm:flex items-center gap-6">
            <a href="#features" className="font-body text-sm font-semibold" style={{ color: AUTH.muted }}>Features</a>
            <a href="#how-it-works" className="font-body text-sm font-semibold" style={{ color: AUTH.muted }}>How It Works</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={onLogIn}
              className="font-body text-sm font-semibold rounded-full px-4 py-2 transition"
              style={{ color: AUTH.ink, background: "#F1EFE8" }}
            >
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="font-body text-sm font-semibold rounded-full px-4 py-2 transition hover:opacity-88"
              style={{ background: PRIMARY, color: "#FFFFFF" }}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 460, height: 460, top: -220, left: -180, background: `${ACCENT_PRESETS[4]}12`, filter: "blur(20px)" }} />
        <div className="absolute rounded-full" style={{ width: 360, height: 360, bottom: -180, right: -120, background: `${PRIMARY}14`, filter: "blur(20px)" }} />

        <div className="max-w-6xl mx-auto px-6 pt-16 sm:pt-24 relative grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6"
              style={{ background: "#FFFFFF", boxShadow: "0 4px 14px rgba(27,36,48,0.08)" }}
            >
              <Key size={13} color={PRIMARY} style={{ transform: "rotate(-45deg)" }} />
              <span className="font-body text-xs font-semibold" style={{ color: AUTH.ink }}>Built for real estate agents</span>
            </div>

            <h1 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "clamp(2.1rem, 4.8vw, 3.4rem)", lineHeight: 1.08 }}>
              Never wonder what to{" "}
              <span style={{ fontFamily: "'Dancing Script', cursive", color: PRIMARY, fontWeight: 700 }}>
                post
              </span>{" "}
              again.
            </h1>
            <p className="font-body mt-5" style={{ color: AUTH.muted, fontSize: "1.05rem", maxWidth: 460 }}>
              Create scroll-stopping real estate content in minutes — branded to you and ready to share.
            </p>
            <p className="font-body mt-2" style={{ color: AUTH.muted, fontSize: "0.9rem", maxWidth: 460 }}>
              From new listings and sold posts to market tips, local content, and everyday social ideas.
            </p>

            <div className="flex items-center gap-3 mt-8 flex-wrap">
              <button
                onClick={onGetStarted}
                className="font-body font-semibold rounded-full px-6 py-3.5 transition hover:opacity-88"
                style={{ background: PRIMARY, color: "#FFFFFF", fontSize: "0.95rem", boxShadow: `0 10px 24px ${PRIMARY}40` }}
              >
                Get Started Free
              </button>
              <a
                href="#how-it-works"
                className="font-body font-semibold rounded-full px-6 py-3.5 transition"
                style={{ color: AUTH.ink, fontSize: "0.95rem", background: "#F1EFE8" }}
              >
                See How It Works
              </a>
            </div>

            <div className="flex items-center gap-x-5 gap-y-2 mt-8 flex-wrap">
              <span className="flex items-center gap-1.5 font-body text-xs font-semibold" style={{ color: AUTH.muted }}>
                <Lock size={13} /> Photos stay private
              </span>
              <span className="flex items-center gap-1.5 font-body text-xs font-semibold" style={{ color: AUTH.muted }}>
                <Sparkles size={13} /> No design skills needed
              </span>
              <span className="flex items-center gap-1.5 font-body text-xs font-semibold" style={{ color: AUTH.muted }}>
                <Key size={13} /> Free to get started
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block" style={{ height: 420 }}>
            <FloatingSparkle top={-6} right={40} size={26} color={ACCENT_PRESETS[3]} rotate={-10} />
            <FloatingSparkle bottom={20} left={0} size={18} color={ACCENT_PRESETS[1]} rotate={12} />
            <FloatingDot top={30} right={0} size={12} color={ACCENT_PRESETS[2]} />
            <FloatingDot bottom={60} right={60} size={8} color={PRIMARY} />
            <Star size={16} color={AUTH.border} fill={AUTH.border} strokeWidth={0} className="absolute" style={{ top: 130, right: 10 }} />

            <div className="relative mx-auto" style={{ width: 340, height: 400 }}>
              <PostCard label="Just SOLD!" color={PRIMARY} rotate={-9} top={10} left={0} />
              <PostCard label="Buyer Tip!" color={ACCENT_PRESETS[4]} rotate={6} top={70} left={150} />
              <PostCard label="Local Favorite!" color={ACCENT_PRESETS[3]} rotate={-4} top={190} left={20} scale={1.06} />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20 sm:py-24">
        <h2 className="font-display font-bold text-center" style={{ color: AUTH.ink, fontSize: "1.75rem" }}>
          Your next post in 3 steps
        </h2>
        <div className="grid sm:grid-cols-3 gap-8 mt-12 relative">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative text-center sm:text-left">
              {i < STEPS.length - 1 && (
                <ArrowRight size={20} className="hidden sm:block absolute" style={{ top: 18, right: -34, color: AUTH.border }} />
              )}
              <div
                className="flex items-center justify-center rounded-full font-display font-bold mx-auto sm:mx-0"
                style={{ width: 40, height: 40, background: AUTH.ink, color: "#FFFFFF", fontSize: "1.05rem" }}
              >
                {s.n}
              </div>
              <h3 className="font-display font-bold text-base mt-4" style={{ color: AUTH.ink }}>{s.title}</h3>
              <p className="font-body text-sm mt-1.5" style={{ color: AUTH.muted }}>{s.text}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <button
            onClick={onGetStarted}
            className="font-body font-semibold rounded-full px-6 py-3.5 transition hover:opacity-88"
            style={{ background: PRIMARY, color: "#FFFFFF", fontSize: "0.95rem" }}
          >
            Create your first post →
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="font-display font-bold text-center" style={{ color: AUTH.ink, fontSize: "1.75rem" }}>
          Everything you need to stay consistent
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

      {/* EXAMPLES */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="font-display font-bold text-center" style={{ color: AUTH.ink, fontSize: "1.75rem" }}>
          See what you can create
        </h2>
        <p className="font-body text-sm text-center mt-2" style={{ color: AUTH.muted }}>
          A few examples of what PostKey generates — branded to you automatically.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {EXAMPLES.map((e, i) => <ExampleCard key={i} {...e} />)}
        </div>
      </section>

      {/* BRAND KIT */}
      <section className="max-w-6xl mx-auto px-6 py-4 sm:py-8">
        <div className="rounded-3xl p-8 sm:p-12 text-center" style={{ background: "#F1EFE8" }}>
          <h2 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "1.75rem" }}>
            Set your brand once.
          </h2>
          <p className="font-display font-bold" style={{ color: PRIMARY, fontSize: "1.75rem" }}>
            PostKey remembers the rest.
          </p>
          <p className="font-body text-sm mt-4" style={{ color: AUTH.muted }}>
            Logo &nbsp;·&nbsp; Colors &nbsp;·&nbsp; Fonts &nbsp;·&nbsp; Headshot &nbsp;·&nbsp; Contact Info
          </p>
          <p className="font-body text-sm mt-1" style={{ color: AUTH.muted }}>
            Every post you create automatically feels like you.
          </p>
          <button
            onClick={onGetStarted}
            className="font-body font-semibold rounded-full px-6 py-3.5 mt-7 transition hover:opacity-88"
            style={{ background: AUTH.ink, color: "#FFFFFF", fontSize: "0.95rem" }}
          >
            Create My Brand Kit
          </button>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 mt-8">
        <div
          className="max-w-5xl mx-auto rounded-3xl relative overflow-hidden text-center py-16 px-6"
          style={{ background: AUTH.ink }}
        >
          <FloatingSparkle top={20} left={40} size={20} color={ACCENT_PRESETS[3]} rotate={-8} />
          <FloatingSparkle bottom={24} right={60} size={16} color={ACCENT_PRESETS[1]} rotate={14} />
          <h2 className="font-display font-bold text-2xl sm:text-3xl relative" style={{ color: "#FFFFFF" }}>
            Your next post is already waiting.
          </h2>
          <p className="font-body text-sm mt-3 relative" style={{ color: "rgba(255,255,255,0.65)" }}>
            Create better real estate content, stay consistent, and spend less time wondering what to post.
          </p>
          <button
            onClick={onGetStarted}
            className="font-body font-semibold rounded-full px-6 py-3.5 mt-7 relative transition hover:opacity-88"
            style={{ background: PRIMARY, color: "#FFFFFF", fontSize: "0.95rem" }}
          >
            Get Started Free
          </button>
          <p className="font-body text-xs mt-3 relative" style={{ color: "rgba(255,255,255,0.5)" }}>
            No design skills needed.
          </p>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10">
        <p className="font-body text-xs" style={{ color: AUTH.muted }}>© {new Date().getFullYear()} PostKey.</p>
      </footer>
    </div>
  );
}

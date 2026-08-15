import { Key, Sparkles, Palette, Lock, Lightbulb, Zap, Repeat, Star, ArrowRight, Heart, MessageCircle, Send, Bookmark, Check } from "lucide-react";
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
  { n: 1, title: "Choose what to post", text: "Listings, testimonials, local favorites, buyer & seller tips, design inspiration, and more." },
  { n: 2, title: "PostKey creates it", text: "Get your graphic, headline, and copy, formatted and ready for social." },
  { n: 3, title: "Make it yours", text: "Your colors, logo, headshot, and contact info are already applied." },
];

const EXAMPLES = [
  {
    category: "LISTING", headline: "Just Listed!", sub: "419 Tall Oaks Dr",
    caption: "Stunning 4 bed, 3 bath home with modern updates and a backyard oasis.", cta: "View more details →",
    color: PRIMARY,
  },
  {
    category: "SOLD", headline: "Sold Fast!", sub: "Another happy client",
    caption: "Multiple offers and a smooth closing from start to finish.", cta: "#SoldByPostKeyRealty",
    color: ACCENT_PRESETS[3],
  },
  {
    category: "EDUCATION", headline: "3 Things Buyers Should Know", sub: "Before making an offer",
    caption: "A little knowledge now can save time, stress, and money later.", cta: "Read more →",
    color: ACCENT_PRESETS[4],
  },
  {
    category: "LOCAL", headline: "Local Favorite!", sub: "The Kettle & Vine",
    caption: "Great coffee, friendly faces, and the perfect spot to start your day.", cta: "#SupportLocal",
    color: ACCENT_PRESETS[2],
  },
];

// A miniature version of an actual PostKey-generated graphic — same category
// pill + headline + contact-band treatment as the real templates, so the
// floating cards in the hero/CTA read as real output, not abstract shapes.
function PostCard({ category, headline, color, rotate, top, left, scale = 1 }) {
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
      <div className="relative flex items-end p-2.5" style={{ height: "64%", background: `linear-gradient(155deg, ${color}26, ${color}68)` }}>
        <span
          className="absolute rounded-full font-mono font-bold"
          style={{ top: 8, left: 8, background: color, color: "#FFFFFF", fontSize: "0.5rem", letterSpacing: "0.04em", padding: "3px 7px" }}
        >
          {category}
        </span>
        <h4 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "1.05rem", lineHeight: 1.08, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{headline}</h4>
      </div>
      <div className="flex items-center gap-1.5 px-2.5" style={{ height: "36%" }}>
        <div className="rounded-full flex-shrink-0" style={{ width: 20, height: 20, background: AUTH.border }} />
        <div className="grid gap-1 flex-1">
          <div className="rounded-full" style={{ height: 4, width: "70%", background: AUTH.border }} />
          <div className="rounded-full" style={{ height: 4, width: "45%", background: AUTH.border }} />
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
function ExampleCard({ category, headline, sub, caption, cta, color }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 12px 30px rgba(27,36,48,0.1)" }}>
      <div className="relative flex flex-col justify-end p-5" style={{ height: 224, background: `linear-gradient(165deg, ${color}24, ${color}70)` }}>
        <span
          className="absolute rounded-full font-mono font-bold"
          style={{ top: 14, left: 14, background: color, color: "#FFFFFF", fontSize: "0.6rem", letterSpacing: "0.05em", padding: "4px 11px" }}
        >
          {category}
        </span>
        <h4 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "1.4rem", lineHeight: 1.12 }}>{headline}</h4>
        <p className="font-body text-xs mt-1" style={{ color: AUTH.ink, opacity: 0.72 }}>{sub}</p>
      </div>
      <div className="flex items-center gap-3 px-4 pt-3" style={{ color: AUTH.muted }}>
        <Heart size={16} />
        <MessageCircle size={16} />
        <Send size={15} />
        <Bookmark size={15} className="ml-auto" />
      </div>
      <div className="flex items-start gap-2 px-4 pt-2.5 pb-4">
        <div className="rounded-full flex-shrink-0 mt-0.5" style={{ width: 20, height: 20, background: AUTH.border }} />
        <p className="font-body text-xs" style={{ color: AUTH.muted, lineHeight: 1.55 }}>
          {caption} <span className="font-semibold" style={{ color }}>{cta}</span>
        </p>
      </div>
    </div>
  );
}

function BrandKitRow({ label, children }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: `1px solid ${AUTH.border}` }}>
      <span className="font-mono font-semibold" style={{ color: AUTH.muted, letterSpacing: "0.04em", fontSize: "0.62rem" }}>{label.toUpperCase()}</span>
      {children}
    </div>
  );
}

// A miniature preview of the brand kit UI — shows what "set it once" actually looks like.
function BrandKitPreview() {
  return (
    <div className="rounded-2xl p-5 w-full" style={{ maxWidth: 260, background: "#FFFFFF", boxShadow: "0 20px 45px rgba(27,36,48,0.14)" }}>
      <span className="font-mono font-bold block mb-4" style={{ color: AUTH.ink, letterSpacing: "0.04em", fontSize: "0.68rem" }}>YOUR BRAND KIT</span>
      <BrandKitRow label="Logo">
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: AUTH.ink }}>
          <Key size={10} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
          <span className="font-display font-bold" style={{ color: "#FFFFFF", fontSize: "0.62rem" }}>PostKey Realty</span>
        </div>
      </BrandKitRow>
      <BrandKitRow label="Colors">
        <div className="flex items-center gap-1.5">
          {[AUTH.ink, PRIMARY, ACCENT_PRESETS[3], "#F1EFE8"].map((c, i) => (
            <span key={i} className="rounded-full" style={{ width: 15, height: 15, background: c, border: c === "#F1EFE8" ? `1px solid ${AUTH.border}` : "none" }} />
          ))}
        </div>
      </BrandKitRow>
      <BrandKitRow label="Font">
        <span className="font-display font-bold text-sm" style={{ color: AUTH.ink }}>Montserrat</span>
      </BrandKitRow>
      <BrandKitRow label="Headshot">
        <div className="rounded-full" style={{ width: 24, height: 24, background: `linear-gradient(155deg, ${PRIMARY}33, ${PRIMARY}66)` }} />
      </BrandKitRow>
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold" style={{ color: AUTH.muted, letterSpacing: "0.04em", fontSize: "0.62rem" }}>CONTACT</span>
        <span className="font-body" style={{ color: AUTH.ink, fontSize: "0.7rem" }}>555.123.4567</span>
      </div>
    </div>
  );
}

export function HomePage({ onGetStarted, onLogIn }) {
  return (
    <div style={{ background: "#FDFBF7" }}>
      <header style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink-0">
            <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 28, height: 28, background: AUTH.ink }}>
              <Key size={14} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
            </div>
            <span className="font-display font-bold text-base sm:text-lg whitespace-nowrap" style={{ color: AUTH.ink }}>PostKey</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6">
            <a href="#features" className="font-body text-sm font-semibold" style={{ color: AUTH.muted }}>Features</a>
            <a href="#how-it-works" className="font-body text-sm font-semibold" style={{ color: AUTH.muted }}>How It Works</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={onLogIn}
              className="font-body text-xs sm:text-sm font-semibold rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 transition whitespace-nowrap"
              style={{ color: AUTH.ink, background: "#F1EFE8" }}
            >
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="font-body text-xs sm:text-sm font-semibold rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 transition hover:opacity-88 whitespace-nowrap"
              style={{ background: PRIMARY, color: "#FFFFFF" }}
            >
              <span className="sm:hidden">Start Free</span>
              <span className="hidden sm:inline">Get Started Free</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 460, height: 460, top: -220, left: -180, background: `${ACCENT_PRESETS[4]}12`, filter: "blur(20px)" }} />
        <div className="absolute rounded-full" style={{ width: 360, height: 360, bottom: -180, right: -120, background: `${PRIMARY}14`, filter: "blur(20px)" }} />

        <div className="max-w-6xl mx-auto px-6 pt-10 sm:pt-14 relative grid lg:grid-cols-2 gap-14 items-center">
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
              Create polished, on-brand social posts in minutes — without staring at a blank screen or designing everything from scratch.
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
                className="font-body font-semibold rounded-full px-6 py-3.5 transition hover:opacity-75"
                style={{ color: AUTH.ink, fontSize: "0.95rem", background: "#F1EFE8", border: `1.5px solid ${AUTH.border}` }}
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
            <p className="font-body text-xs font-semibold mt-3" style={{ color: PRIMARY }}>
              Create your first post in under 3 minutes.
            </p>
          </div>

          <div className="relative hidden lg:block" style={{ height: 420 }}>
            <FloatingSparkle top={-6} right={40} size={26} color={ACCENT_PRESETS[3]} rotate={-10} />
            <FloatingSparkle bottom={20} left={0} size={18} color={ACCENT_PRESETS[1]} rotate={12} />
            <FloatingDot top={30} right={0} size={12} color={ACCENT_PRESETS[2]} />
            <FloatingDot bottom={60} right={60} size={8} color={PRIMARY} />
            <Star size={16} color={AUTH.border} fill={AUTH.border} strokeWidth={0} className="absolute" style={{ top: 130, right: 10 }} />

            <div className="relative mx-auto" style={{ width: 340, height: 400 }}>
              <PostCard category="SOLD" headline="Sold Fast!" color={PRIMARY} rotate={-9} top={10} left={0} />
              <PostCard category="CLIENT LOVE" headline="5-Star Review!" color={ACCENT_PRESETS[4]} rotate={6} top={70} left={150} />
              <PostCard category="LOCAL" headline="Local Favorite!" color={ACCENT_PRESETS[3]} rotate={-4} top={190} left={20} scale={1.06} />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 pt-10 pb-16 sm:pt-12 sm:pb-20">
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
      <section id="features" className="max-w-6xl mx-auto px-6 py-14 sm:py-16">
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
      <section className="max-w-6xl mx-auto px-6 py-14 sm:py-16">
        <h2 className="font-display font-bold text-center" style={{ color: AUTH.ink, fontSize: "1.75rem" }}>
          See what you can create
        </h2>
        <p className="font-body text-sm text-center mt-2 mx-auto" style={{ color: AUTH.muted, maxWidth: 440 }}>
          Listings, closings, market updates, local content, and more — all styled to match your brand.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {EXAMPLES.map((e, i) => <ExampleCard key={i} {...e} />)}
        </div>
        <div className="text-center mt-8">
          <button
            onClick={onGetStarted}
            className="font-body font-semibold rounded-full px-6 py-3 transition hover:opacity-80"
            style={{ background: "#FFFFFF", color: PRIMARY, border: `1.5px solid ${PRIMARY}40`, fontSize: "0.9rem" }}
          >
            Explore Post Ideas →
          </button>
        </div>
      </section>

      {/* BRAND KIT */}
      <section className="max-w-6xl mx-auto px-6 py-6 sm:py-8">
        <div className="rounded-3xl p-8 sm:p-14 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center" style={{ background: "#F1EFE8" }}>
          <div className="text-center lg:text-left">
            <span className="font-mono font-bold" style={{ color: AUTH.muted, letterSpacing: "0.06em", fontSize: "0.7rem" }}>
              SET YOUR BRAND ONCE
            </span>
            <h2 className="font-display font-bold mt-3" style={{ color: AUTH.ink, fontSize: "1.85rem", lineHeight: 1.15 }}>
              Set your brand once.
            </h2>
            <p className="font-display font-bold" style={{ color: PRIMARY, fontSize: "1.85rem", lineHeight: 1.15 }}>
              PostKey remembers the rest.
            </p>
            <p className="font-body text-sm mt-4 mx-auto lg:mx-0" style={{ color: AUTH.muted, maxWidth: 360 }}>
              Add your branding and contact info once and we'll apply it to every post you create.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 mt-6">
              {["Logo", "Colors", "Fonts", "Headshot", "Contact Info"].map((label) => (
                <span key={label} className="font-body text-xs font-semibold flex items-center gap-1.5" style={{ color: AUTH.ink }}>
                  <span className="rounded-full flex-shrink-0" style={{ width: 5, height: 5, background: PRIMARY }} />
                  {label}
                </span>
              ))}
            </div>
            <button
              onClick={onGetStarted}
              className="font-body font-semibold rounded-full px-6 py-3.5 mt-8 transition hover:opacity-88"
              style={{ background: PRIMARY, color: "#FFFFFF", fontSize: "0.95rem" }}
            >
              Set Up My Brand
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <BrandKitPreview />
            <div className="hidden sm:flex items-center gap-4">
              <ArrowRight size={18} style={{ color: AUTH.muted }} />
              <span className="font-body text-xs font-semibold" style={{ color: AUTH.muted }}>Applied automatically</span>
              <ArrowRight size={18} style={{ color: AUTH.muted }} />
              <div className="relative flex-shrink-0" style={{ width: 148, height: 176 }}>
                <PostCard category="LISTING" headline="Just Listed!" color={PRIMARY} rotate={0} top={0} left={0} scale={0.88} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-14 sm:py-16">
        <div
          className="max-w-5xl mx-auto rounded-3xl relative overflow-hidden py-14 px-6 sm:px-14"
          style={{ background: AUTH.ink }}
        >
          <FloatingSparkle top={20} left={40} size={20} color={ACCENT_PRESETS[3]} rotate={-8} />
          <FloatingSparkle bottom={24} left={"46%"} size={16} color={ACCENT_PRESETS[1]} rotate={14} />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-center lg:text-left">
              <h2 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: "#FFFFFF" }}>
                Your next post is already waiting.
              </h2>
              <p className="font-body text-sm mt-3 mx-auto lg:mx-0" style={{ color: "rgba(255,255,255,0.65)", maxWidth: 400 }}>
                Choose an idea, personalize it, and share it in minutes.
              </p>
              <button
                onClick={onGetStarted}
                className="font-body font-semibold rounded-full px-6 py-3.5 mt-7 transition hover:opacity-88"
                style={{ background: PRIMARY, color: "#FFFFFF", fontSize: "0.95rem" }}
              >
                Create Your First Post Free
              </button>
              <div className="flex items-center justify-center lg:justify-start gap-x-5 gap-y-1.5 mt-4 flex-wrap">
                <span className="font-body text-xs flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <Check size={13} /> Free to start
                </span>
                <span className="font-body text-xs flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <Check size={13} /> No credit card required
                </span>
              </div>
            </div>

            <div className="relative hidden lg:block" style={{ height: 220 }}>
              <div className="absolute" style={{ top: 10, left: 10 }}>
                <PostCard category="MARKET UPDATE" headline="Inventory Up!" color={ACCENT_PRESETS[4]} rotate={-9} top={0} left={0} scale={0.78} />
              </div>
              <div className="absolute" style={{ top: -20, left: 110 }}>
                <PostCard category="SOLD" headline="Just Sold!" color={PRIMARY} rotate={5} top={0} left={0} scale={0.9} />
              </div>
              <div className="absolute" style={{ top: 20, left: 220 }}>
                <PostCard category="LOCAL" headline="Local Favorite!" color={ACCENT_PRESETS[2]} rotate={-4} top={0} left={0} scale={0.78} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 pt-10 pb-8 border-t" style={{ borderColor: AUTH.border }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-lg" style={{ width: 26, height: 26, background: AUTH.ink }}>
                <Key size={13} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
              </div>
              <span className="font-display font-bold text-base" style={{ color: AUTH.ink }}>PostKey</span>
            </div>
            <p className="font-body text-xs mt-3" style={{ color: AUTH.muted, maxWidth: 240 }}>
              Built for real estate agents. Create better content, stay consistent, and close more.
            </p>
          </div>
          <div>
            <span className="font-mono font-bold block mb-3" style={{ color: AUTH.ink, letterSpacing: "0.05em", fontSize: "0.68rem" }}>PRODUCT</span>
            <div className="grid gap-2">
              <a href="#features" className="font-body text-xs font-semibold" style={{ color: AUTH.muted }}>Features</a>
              <a href="#how-it-works" className="font-body text-xs font-semibold" style={{ color: AUTH.muted }}>How It Works</a>
            </div>
          </div>
        </div>
        <p className="font-body text-xs mt-10" style={{ color: AUTH.muted }}>© {new Date().getFullYear()} PostKey. All rights reserved.</p>
      </footer>
    </div>
  );
}

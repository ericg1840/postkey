import { Key, Sparkles, Lock, Lightbulb, Zap, Palette, Heart, MessageCircle, Send, Bookmark, Check, Instagram } from "lucide-react";
import { AUTH } from "../auth/AuthShell.jsx";
import { ACCENT_PRESETS, Logo } from "../shared.jsx";

// Primary landing-page accent — swapped from the pink post-accent preset to blue.
const PRIMARY = ACCENT_PRESETS[1];

const FEATURES = [
  { icon: Lightbulb, title: "Fresh real estate ideas", text: "Listings, market updates, local spots, and buyer & seller tips — so you're never staring at a blank feed." },
  { icon: Zap, title: "Ready-to-post in seconds", text: "Turn an idea, listing, or photo into a finished graphic — no design tool required." },
  { icon: Palette, title: "Your branding applied automatically", text: "Your colors, logo, and contact info are already on every post — no re-formatting, ever." },
];

// Content categories PostKey is actually built around, not a generic social caption tool.
const CONTENT_TYPES = [
  "Listings", "Just Sold", "Market Updates", "Testimonials", "Open Houses", "Neighborhood Spotlights", "Buyer & Seller Tips",
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
  },
  {
    category: "SOLD", headline: "Sold Fast!", sub: "Another happy client",
    caption: "Multiple offers and a smooth closing from start to finish.", cta: "#SoldByPostKeyRealty",
  },
  {
    category: "EDUCATION", headline: "3 Things Buyers Should Know", sub: "Before making an offer",
    caption: "A little knowledge now can save time, stress, and money later.", cta: "Read more →",
  },
  {
    category: "LOCAL", headline: "Local Favorite!", sub: "The Kettle & Vine",
    caption: "Great coffee, friendly faces, and the perfect spot to start your day.", cta: "#SupportLocal",
  },
];

// A miniature version of an actual PostKey-generated graphic, kept plain
// (border, not a heavy drop shadow) so it reads as a real sample rather
// than a decorative sticker — still used by AboutPage's own hero collage.
export function PostCard({ category, headline, color = PRIMARY, rotate = 0, top, left, scale = 1 }) {
  return (
    <div
      className="absolute rounded-2xl overflow-hidden border"
      style={{
        width: 168, height: 200, top, left,
        transform: `rotate(${rotate}deg) scale(${scale})`,
        background: "#FFFFFF",
        borderColor: AUTH.border,
      }}
    >
      <div className="relative flex items-end p-2.5" style={{ height: "64%", background: color }}>
        <span
          className="absolute rounded-full font-mono font-bold"
          style={{ top: 8, left: 8, background: "rgba(255,255,255,0.92)", color, fontSize: "0.5rem", letterSpacing: "0.04em", padding: "3px 7px" }}
        >
          {category}
        </span>
        <h4 className="font-display font-bold" style={{ color: "#FFFFFF", fontSize: "1.05rem", lineHeight: 1.08, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{headline}</h4>
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

// Kept as no-ops for AboutPage compatibility — the busy floating-decoration
// look didn't fit the calmer redesign, so HomePage no longer places any.
export function FloatingDot() { return null; }
export function FloatingSparkle() { return null; }

// A finished-looking example post — used in the "See what you can create" gallery.
function ExampleCard({ category, headline, sub, caption, cta }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: "#FFFFFF", borderColor: AUTH.border }}>
      <div className="relative flex flex-col justify-end p-6" style={{ height: 260, background: "#F1EFE8" }}>
        <span
          className="absolute rounded-full font-mono font-bold"
          style={{ top: 16, left: 16, background: "#FFFFFF", color: AUTH.ink, fontSize: "0.6rem", letterSpacing: "0.05em", padding: "5px 12px", border: `1px solid ${AUTH.border}` }}
        >
          {category}
        </span>
        <h4 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "1.5rem", lineHeight: 1.15 }}>{headline}</h4>
        <p className="font-body text-sm mt-1" style={{ color: AUTH.muted }}>{sub}</p>
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
          {caption} <span className="font-semibold" style={{ color: PRIMARY }}>{cta}</span>
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
export function BrandKitPreview() {
  return (
    <div className="rounded-2xl p-5 w-full border" style={{ maxWidth: 260, background: "#FFFFFF", borderColor: AUTH.border }}>
      <span className="font-mono font-bold block mb-4" style={{ color: AUTH.ink, letterSpacing: "0.04em", fontSize: "0.68rem" }}>YOUR BRAND KIT</span>
      <BrandKitRow label="Logo">
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: AUTH.ink }}>
          <Key size={10} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
          <span className="font-display font-bold" style={{ color: "#FFFFFF", fontSize: "0.62rem" }}>PostKey Realty</span>
        </div>
      </BrandKitRow>
      <BrandKitRow label="Colors">
        <div className="flex items-center gap-1.5">
          {[AUTH.ink, PRIMARY, "#F1EFE8"].map((c, i) => (
            <span key={i} className="rounded-full" style={{ width: 15, height: 15, background: c, border: `1px solid ${AUTH.border}` }} />
          ))}
        </div>
      </BrandKitRow>
      <BrandKitRow label="Font">
        <span className="font-display font-bold text-sm" style={{ color: AUTH.ink }}>Montserrat</span>
      </BrandKitRow>
      <BrandKitRow label="Headshot">
        <div className="rounded-full" style={{ width: 24, height: 24, background: "#F1EFE8", border: `1px solid ${AUTH.border}` }} />
      </BrandKitRow>
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold" style={{ color: AUTH.muted, letterSpacing: "0.04em", fontSize: "0.62rem" }}>CONTACT</span>
        <span className="font-body" style={{ color: AUTH.ink, fontSize: "0.7rem" }}>555.123.4567</span>
      </div>
    </div>
  );
}

export function HomePage({ onGetStarted, onLogIn, onAbout, onPrivacy, onTerms }) {
  return (
    <div style={{ background: "#FDFBF7" }}>
      <header style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-5xl mx-auto px-3 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink-0">
            <Logo size={24} />
            <span className="font-display font-bold text-base whitespace-nowrap" style={{ color: AUTH.ink }}>PostKey</span>
          </div>
          <nav className="hidden sm:flex items-center gap-7">
            <a href="#features" className="font-body text-sm" style={{ color: AUTH.muted }}>Features</a>
            <a href="#how-it-works" className="font-body text-sm" style={{ color: AUTH.muted }}>How It Works</a>
            {onAbout && (
              <button onClick={onAbout} className="font-body text-sm" style={{ color: AUTH.muted }}>About</button>
            )}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={onLogIn}
              className="font-body text-xs sm:text-sm rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 transition whitespace-nowrap"
              style={{ color: AUTH.ink }}
            >
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="font-body text-xs sm:text-sm font-semibold rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 transition hover:opacity-85 whitespace-nowrap"
              style={{ background: AUTH.ink, color: "#FFFFFF" }}
            >
              <span className="sm:hidden">Start Free</span>
              <span className="hidden sm:inline">Get Started Free</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 pt-14 sm:pt-20 pb-6 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 border"
          style={{ borderColor: AUTH.border }}
        >
          <Key size={13} color={PRIMARY} style={{ transform: "rotate(-45deg)" }} />
          <span className="font-body text-xs font-semibold" style={{ color: AUTH.ink }}>Built for real estate agents</span>
        </div>

        <h1 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "clamp(2.2rem, 6vw, 3.6rem)", lineHeight: 1.12 }}>
          Never wonder what to
        </h1>
        <h1
          className="font-bold"
          style={{ fontFamily: "'Dancing Script', cursive", color: PRIMARY, fontSize: "clamp(2.6rem, 8vw, 4.6rem)", lineHeight: 1.15 }}
        >
          post again.
        </h1>

        <p className="font-body mt-6 mx-auto" style={{ color: AUTH.muted, fontSize: "1.05rem", maxWidth: 460 }}>
          Create polished, on-brand social posts in minutes — without staring at a blank screen or designing everything from scratch.
        </p>

        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <button
            onClick={onGetStarted}
            className="font-body font-semibold rounded-full px-6 py-3.5 transition hover:opacity-85"
            style={{ background: AUTH.ink, color: "#FFFFFF", fontSize: "0.95rem" }}
          >
            Get Started Free
          </button>
          <a
            href="#examples"
            className="font-body font-semibold rounded-full px-6 py-3.5 transition border"
            style={{ color: AUTH.ink, fontSize: "0.95rem", borderColor: AUTH.border }}
          >
            See a Sample Post
          </a>
        </div>

        <div className="flex items-center justify-center gap-x-5 gap-y-2 mt-9 flex-wrap">
          <span className="flex items-center gap-1.5 font-body text-xs" style={{ color: AUTH.muted }}>
            <Lock size={13} /> Photos stay private
          </span>
          <span className="flex items-center gap-1.5 font-body text-xs" style={{ color: AUTH.muted }}>
            <Sparkles size={13} /> No design skills needed
          </span>
          <span className="flex items-center gap-1.5 font-body text-xs" style={{ color: AUTH.muted }}>
            <Key size={13} /> Free to get started
          </span>
        </div>
      </section>

      {/* HERO VISUAL */}
      <section className="max-w-2xl mx-auto px-6 sm:px-10 pb-16 sm:pb-24">
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: AUTH.border }}>
          <ExampleCard {...EXAMPLES[0]} />
        </div>
      </section>

      {/* WHY REAL ESTATE */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 py-14 sm:py-16 text-center border-t" style={{ borderColor: AUTH.border }}>
        <h2 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "1.5rem" }}>
          Built specifically for busy real estate agents.
        </h2>
        <p className="font-body text-sm mt-3 mx-auto" style={{ color: AUTH.muted, maxWidth: 480 }}>
          Not a generic caption generator — every idea, template, and headline is built around what agents actually post.
        </p>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2.5 mt-8">
          {CONTENT_TYPES.map((label) => (
            <span key={label} className="font-body text-sm" style={{ color: AUTH.ink }}>
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-t" style={{ borderColor: AUTH.border }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
          <h2 className="font-display font-bold text-center" style={{ color: AUTH.ink, fontSize: "1.6rem" }}>
            Your next post in 3 steps
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 mt-12">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div
                  className="flex items-center justify-center rounded-full font-display font-bold border"
                  style={{ width: 34, height: 34, color: AUTH.ink, borderColor: AUTH.border, fontSize: "0.95rem" }}
                >
                  {s.n}
                </div>
                <h3 className="font-display font-bold text-base mt-4" style={{ color: AUTH.ink }}>{s.title}</h3>
                <p className="font-body text-sm mt-1.5" style={{ color: AUTH.muted }}>{s.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={onGetStarted}
              className="font-body font-semibold rounded-full px-6 py-3.5 transition hover:opacity-85"
              style={{ background: AUTH.ink, color: "#FFFFFF", fontSize: "0.95rem" }}
            >
              Create your first post →
            </button>
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section id="examples" className="border-t" style={{ borderColor: AUTH.border }}>
        <div className="max-w-5xl mx-auto pt-16 pb-16 sm:pt-20 sm:pb-20">
          <div className="px-6 sm:px-10">
            <h2 className="font-display font-bold text-center" style={{ color: AUTH.ink, fontSize: "1.6rem" }}>
              See what you can create
            </h2>
            <p className="font-body text-sm text-center mt-2 mx-auto" style={{ color: AUTH.muted, maxWidth: 440 }}>
              Listings, closings, market updates, local content, and more — all styled to match your brand.
            </p>
          </div>
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory px-6 sm:px-10 pb-2 sm:pb-0 sm:grid sm:grid-cols-2 sm:overflow-visible mt-10" style={{ scrollbarWidth: "none" }}>
            {EXAMPLES.map((e, i) => (
              <div key={i} className="flex-shrink-0 w-[82%] xs:w-[70%] snap-center sm:w-auto">
                <ExampleCard {...e} />
              </div>
            ))}
          </div>
          <div className="text-center mt-8 px-6 sm:px-10">
            <button
              onClick={onGetStarted}
              className="font-body font-semibold rounded-full px-6 py-3 transition border"
              style={{ color: AUTH.ink, borderColor: AUTH.border, fontSize: "0.9rem" }}
            >
              Explore Post Ideas →
            </button>
          </div>
        </div>
      </section>

      {/* BRAND KIT */}
      <section className="border-t" style={{ borderColor: AUTH.border }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
            <span className="font-mono font-bold" style={{ color: AUTH.muted, letterSpacing: "0.06em", fontSize: "0.7rem" }}>
              SET YOUR BRAND ONCE
            </span>
            <h2 className="font-display font-bold mt-3" style={{ color: AUTH.ink, fontSize: "1.7rem", lineHeight: 1.2 }}>
              Set your brand once. PostKey remembers the rest.
            </h2>
            <p className="font-body text-sm mt-4 mx-auto lg:mx-0" style={{ color: AUTH.muted, maxWidth: 360 }}>
              Add your branding and contact info once and we'll apply it to every post you create.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 mt-6">
              {["Logo", "Colors", "Fonts", "Headshot", "Contact Info"].map((label) => (
                <span key={label} className="font-body text-xs" style={{ color: AUTH.muted }}>
                  {label}
                </span>
              ))}
            </div>
            <button
              onClick={onGetStarted}
              className="font-body font-semibold rounded-full px-6 py-3.5 mt-8 transition hover:opacity-85"
              style={{ background: AUTH.ink, color: "#FFFFFF", fontSize: "0.95rem" }}
            >
              Set Up My Brand
            </button>
          </div>

          <div className="flex justify-center">
            <BrandKitPreview />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-20 border-t" style={{ borderColor: AUTH.border }}>
        <h2 className="font-display font-bold text-center" style={{ color: AUTH.ink, fontSize: "1.6rem" }}>
          Focus on your clients, not content.
        </h2>
        <p className="font-body text-sm text-center mt-2 mx-auto" style={{ color: AUTH.muted, maxWidth: 480 }}>
          Every minute you're not staring at a blank feed is a minute back for showings, calls, and closings.
        </p>
        <div className="grid sm:grid-cols-3 gap-10 mt-12">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <div key={i}>
              <Icon size={22} color={AUTH.ink} />
              <h3 className="font-display font-bold text-base mt-4" style={{ color: AUTH.ink }}>{title}</h3>
              <p className="font-body text-sm mt-1.5" style={{ color: AUTH.muted }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t" style={{ borderColor: AUTH.border }}>
        <div className="max-w-2xl mx-auto px-6 py-16 sm:py-20 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo size={22} />
            <span className="font-display font-bold text-base" style={{ color: AUTH.ink }}>PostKey</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: AUTH.ink }}>
            Your next week of content could be ready in minutes.
          </h2>
          <p className="font-body text-sm mt-3 mx-auto" style={{ color: AUTH.muted, maxWidth: 400 }}>
            Choose a few ideas, personalize them, and your feed is covered.
          </p>
          <button
            onClick={onGetStarted}
            className="font-body font-semibold rounded-full px-6 py-3.5 mt-7 transition hover:opacity-85"
            style={{ background: AUTH.ink, color: "#FFFFFF", fontSize: "0.95rem" }}
          >
            Create Your First Post Free
          </button>
          <div className="flex items-center justify-center gap-x-5 gap-y-1.5 mt-5 flex-wrap">
            <span className="font-body text-xs flex items-center gap-1.5" style={{ color: AUTH.muted }}>
              <Check size={13} /> Free to start
            </span>
            <span className="font-body text-xs flex items-center gap-1.5" style={{ color: AUTH.muted }}>
              <Check size={13} /> No credit card required
            </span>
          </div>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 sm:px-10 pt-10 pb-8 border-t" style={{ borderColor: AUTH.border }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={22} />
              <span className="font-display font-bold text-base" style={{ color: AUTH.ink }}>PostKey</span>
            </div>
            <p className="font-body text-xs mt-3" style={{ color: AUTH.muted, maxWidth: 240 }}>
              Built for real estate agents. Create better content, stay consistent, and close more.
            </p>
            <a
              href="#"
              aria-label="PostKey on Instagram"
              className="inline-flex items-center justify-center rounded-full mt-4 transition hover:opacity-75 border"
              style={{ width: 30, height: 30, borderColor: AUTH.border }}
            >
              <Instagram size={14} color={AUTH.ink} />
            </a>
          </div>
          <div className="flex gap-10 sm:gap-14">
            <div>
              <span className="font-mono font-bold block mb-3" style={{ color: AUTH.ink, letterSpacing: "0.05em", fontSize: "0.68rem" }}>PRODUCT</span>
              <div className="grid gap-2">
                <a href="#features" className="font-body text-xs" style={{ color: AUTH.muted }}>Features</a>
                <a href="#how-it-works" className="font-body text-xs" style={{ color: AUTH.muted }}>How It Works</a>
                {onAbout && (
                  <button onClick={onAbout} className="font-body text-xs text-left" style={{ color: AUTH.muted }}>About</button>
                )}
              </div>
            </div>
            <div>
              <span className="font-mono font-bold block mb-3" style={{ color: AUTH.ink, letterSpacing: "0.05em", fontSize: "0.68rem" }}>COMPANY</span>
              <div className="grid gap-2">
                {onPrivacy ? (
                  <button onClick={onPrivacy} className="font-body text-xs text-left" style={{ color: AUTH.muted }}>Privacy Policy</button>
                ) : (
                  <a href="#" className="font-body text-xs" style={{ color: AUTH.muted }}>Privacy Policy</a>
                )}
                {onTerms ? (
                  <button onClick={onTerms} className="font-body text-xs text-left" style={{ color: AUTH.muted }}>Terms of Service</button>
                ) : (
                  <a href="#" className="font-body text-xs" style={{ color: AUTH.muted }}>Terms of Service</a>
                )}
                <a href="mailto:support@postkey.app" className="font-body text-xs" style={{ color: AUTH.muted }}>Contact & Support</a>
              </div>
            </div>
          </div>
        </div>
        <p className="font-body text-xs mt-10" style={{ color: AUTH.muted }}>© {new Date().getFullYear()} PostKey. All rights reserved.</p>
      </footer>
    </div>
  );
}

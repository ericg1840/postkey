import { Key, Sparkles, Lock, Palette, Home, MapPin, MessageCircle, Calendar, Link2, Heart, Send, Bookmark, Check, Instagram } from "lucide-react";
import { AUTH } from "../auth/AuthShell.jsx";
import { ACCENT_PRESETS, Logo } from "../shared.jsx";

// Primary landing-page accent — blue, used for chrome/CTAs; the pink preset
// is reserved as the hero's "pop" color (the sticker badge, the script line).
const PRIMARY = ACCENT_PRESETS[1];
const PINK = ACCENT_PRESETS[0];
const GREEN = ACCENT_PRESETS[2];
const ORANGE = ACCENT_PRESETS[3];
const PURPLE = ACCENT_PRESETS[4];

// What's actually waiting for an agent once they sign up — maps 1:1 to the
// real tools (brand kit onboarding, ListingTool, CommunityTool,
// DescriptionTool, ContentCalendar, the Key Link page), not generic feature copy.
const WHATS_INSIDE = [
  { icon: Palette, color: PINK, title: "Your brand kit, set once", text: "Add your logo, colors, headshot, and contact info one time — every post uses it automatically." },
  { icon: Home, color: PRIMARY, title: "Listing & Sold graphics", text: "Just Listed, Just Sold, Open House, and Price Drop templates, ready in seconds." },
  { icon: MapPin, color: GREEN, title: "Local & community posts", text: "Market updates, buyer & seller tips, and neighborhood spotlights that keep you visible between listings." },
  { icon: MessageCircle, color: ORANGE, title: "Captions written for you", text: "Every graphic comes with an on-brand caption, so you're never stuck staring at an empty text box." },
  { icon: Calendar, color: PURPLE, title: "A content calendar", text: "See your whole week or month of posts at a glance, and brainstorm new ideas whenever you need one." },
  { icon: Link2, color: PINK, title: "Your own branded Key Link page", text: "One link for all your social media accounts that shows off your listings and gets people to your contact info." },
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
    color: PINK, houseStyle: "cottage",
  },
  {
    category: "SOLD", headline: "Sold Fast!", sub: "Another happy client",
    caption: "Multiple offers and a smooth closing from start to finish.", cta: "#SoldByPostKeyRealty",
    color: GREEN, houseStyle: "modern",
  },
  {
    category: "EDUCATION", headline: "3 Things Buyers Should Know", sub: "Before making an offer",
    caption: "A little knowledge now can save time, stress, and money later.", cta: "Read more →",
    color: ORANGE, houseStyle: "bungalow",
  },
  {
    category: "LOCAL", headline: "Local Favorite!", sub: "The Kettle & Vine",
    caption: "Great coffee, friendly faces, and the perfect spot to start your day.", cta: "#SupportLocal",
    color: PURPLE, houseStyle: "shop",
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

// A flat, single-color house illustration — gives each example post a bit
// of real color and a sense of a real listing behind it, without pulling in
// a photo library or breaking the page's plain, hand-drawn feel.
function HouseArt({ color, style = "cottage" }) {
  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">
      <rect width="400" height="260" fill={`${color}15`} />
      <circle cx="336" cy="46" r="24" fill={`${color}40`} />
      <rect x="0" y="196" width="400" height="64" fill={`${color}22`} />

      {style === "modern" && (
        <g>
          <rect x="110" y="130" width="180" height="80" fill="#FFFFFF" stroke={color} strokeWidth="3" />
          <rect x="110" y="108" width="180" height="24" fill={color} />
          <rect x="130" y="150" width="40" height="40" fill={`${color}33`} stroke={color} strokeWidth="2" />
          <rect x="230" y="150" width="40" height="40" fill={`${color}33`} stroke={color} strokeWidth="2" />
          <rect x="192" y="160" width="16" height="50" fill={color} />
        </g>
      )}

      {style === "bungalow" && (
        <g>
          <polygon points="100,130 200,86 300,130" fill={color} />
          <rect x="118" y="130" width="164" height="80" fill="#FFFFFF" stroke={color} strokeWidth="3" />
          <rect x="184" y="162" width="32" height="48" fill={color} />
          <circle cx="140" cy="160" r="14" fill={`${color}33`} stroke={color} strokeWidth="2" />
          <circle cx="260" cy="160" r="14" fill={`${color}33`} stroke={color} strokeWidth="2" />
        </g>
      )}

      {style === "shop" && (
        <g>
          <rect x="120" y="118" width="160" height="92" fill="#FFFFFF" stroke={color} strokeWidth="3" />
          <rect x="112" y="102" width="176" height="24" rx="4" fill={color} />
          <rect x="136" y="150" width="128" height="34" fill={`${color}2A`} stroke={color} strokeWidth="2" />
          <rect x="188" y="184" width="24" height="26" fill={color} />
        </g>
      )}

      {style === "cottage" && (
        <g>
          <polygon points="118,128 200,76 282,128" fill={color} />
          <rect x="130" y="128" width="140" height="82" fill="#FFFFFF" stroke={color} strokeWidth="3" />
          <rect x="176" y="160" width="28" height="50" fill={color} />
          <rect x="144" y="144" width="26" height="26" fill={`${color}33`} stroke={color} strokeWidth="2" />
          <rect x="230" y="144" width="26" height="26" fill={`${color}33`} stroke={color} strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

// A finished-looking example post — used in the "See what you can create" gallery.
function ExampleCard({ category, headline, sub, caption, cta, color = PRIMARY, houseStyle = "cottage", rotate = 0 }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: `2.5px solid ${color}`, transform: `rotate(${rotate}deg)` }}>
      <div className="relative flex flex-col justify-end p-6 overflow-hidden" style={{ height: 260 }}>
        <div className="absolute inset-0">
          <HouseArt color={color} style={houseStyle} />
        </div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.94) 96%)" }} />
        <span
          className="relative rounded-full font-mono font-bold self-start mb-auto"
          style={{ background: "#FFFFFF", color, fontSize: "0.6rem", letterSpacing: "0.05em", padding: "5px 12px", border: `2px solid ${color}` }}
        >
          {category}
        </span>
        <h4 className="relative font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink, fontSize: "1.5rem", lineHeight: 1.15 }}>{headline}</h4>
        <p className="relative font-body text-sm mt-1" style={{ color: AUTH.muted }}>{sub}</p>
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

// Chunky "sticker" button: thick ink border + offset drop shadow, used for
// every primary/secondary CTA on the playful redesign — exported so other
// "Bold Blocks" screens (sign up / log in) use the same control.
export function StickerButton({ as: As = "button", href, onClick, background, color, children, className = "", small, disabled }) {
  const Tag = As;
  return (
    <Tag
      href={href}
      onClick={onClick}
      disabled={disabled}
      className={`font-body font-bold rounded-full transition inline-flex items-center justify-center gap-1.5 ${disabled ? "opacity-60" : "hover:opacity-85"} ${small ? "px-4 py-2 text-xs" : "px-6 py-3.5 text-sm"} ${className}`}
      style={{ background, color, border: "2.5px solid #1B2430", boxShadow: "4px 4px 0 #1B2430" }}
    >
      {children}
    </Tag>
  );
}

export function HomePage({ onGetStarted, onLogIn, onAbout, onPrivacy, onTerms }) {
  return (
    <div style={{ background: "#FFFFFF" }}>
      <header style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-5xl mx-auto px-3 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-1 border-b" style={{ borderColor: "#EFF2F7" }}>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-shrink-0">
            <Logo size={34} />
            <span className="font-bold text-lg sm:text-xl whitespace-nowrap" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink }}>PostKey</span>
          </div>
          <nav className="hidden sm:flex items-center gap-7">
            <a href="#expect" className="font-body text-sm font-semibold" style={{ color: AUTH.ink }}>What You Get</a>
            <a href="#how-it-works" className="font-body text-sm font-semibold" style={{ color: AUTH.ink }}>How It Works</a>
            {onAbout && (
              <button onClick={onAbout} className="font-body text-sm font-semibold" style={{ color: AUTH.ink }}>About</button>
            )}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={onLogIn}
              className="font-body text-xs sm:text-sm font-semibold rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 transition whitespace-nowrap"
              style={{ color: AUTH.ink }}
            >
              Log in
            </button>
            <StickerButton onClick={onGetStarted} background={PRIMARY} color="#FFFFFF" small className="whitespace-nowrap">
              <span className="sm:hidden">Start Free</span>
              <span className="hidden sm:inline">Get Started Free</span>
            </StickerButton>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "#FFF6E7" }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: -120, left: -100, width: 360, height: 360, background: PRIMARY, opacity: 0.14, filter: "blur(10px)" }} />
        <div className="absolute rounded-full pointer-events-none" style={{ bottom: -140, right: -80, width: 420, height: 420, background: PINK, opacity: 0.14, filter: "blur(10px)" }} />
        <div className="absolute rounded-full pointer-events-none hidden sm:block" style={{ top: 60, right: 120, width: 70, height: 70, background: GREEN, opacity: 0.18 }} />

        <div className="relative max-w-2xl mx-auto px-6 sm:px-10 pt-16 sm:pt-24 pb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 bg-white" style={{ border: "2px solid #1B2430" }}>
            <Key size={13} color={PINK} style={{ transform: "rotate(-45deg)" }} />
            <span className="font-body text-xs font-semibold" style={{ color: AUTH.ink }}>Built for real estate agents</span>
          </div>

          <h1 className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink, fontSize: "clamp(2.2rem, 6vw, 3.4rem)", lineHeight: 1.1 }}>
            Never wonder what to
          </h1>
          <h1
            className="font-bold inline-block"
            style={{ fontFamily: "'Dancing Script', cursive", color: PINK, fontSize: "clamp(2.6rem, 8vw, 4.6rem)", lineHeight: 1.15, transform: "rotate(-2deg)" }}
          >
            post again.
          </h1>

          <p className="font-body mt-5 mx-auto" style={{ color: AUTH.muted, fontSize: "1.05rem", maxWidth: 460, lineHeight: 1.55 }}>
            Create polished, on-brand social posts in minutes — without staring at a blank screen or designing everything from scratch.
          </p>

          <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
            <StickerButton onClick={onGetStarted} background={PINK} color="#FFFFFF">Get Started Free</StickerButton>
            <StickerButton as="a" href="#examples" background="#FFFFFF" color={AUTH.ink}>See a Sample Post</StickerButton>
          </div>

          <div className="flex items-center justify-center gap-2.5 mt-8 flex-wrap">
            <span className="flex items-center gap-1.5 font-body text-xs font-bold rounded-full px-3.5 py-2" style={{ color: GREEN, background: `${GREEN}20`, transform: "rotate(-2deg)" }}>
              <Lock size={13} /> Photos stay private
            </span>
            <span className="flex items-center gap-1.5 font-body text-xs font-bold rounded-full px-3.5 py-2" style={{ color: PURPLE, background: `${PURPLE}20`, transform: "rotate(1.5deg)" }}>
              <Sparkles size={13} /> No design skills needed
            </span>
            <span className="flex items-center gap-1.5 font-body text-xs font-bold rounded-full px-3.5 py-2" style={{ color: ORANGE, background: `${ORANGE}20`, transform: "rotate(-1deg)" }}>
              <Key size={13} /> Free to get started
            </span>
          </div>
        </div>

        {/* HERO VISUAL */}
        <div className="relative max-w-sm mx-auto px-6 pb-16 sm:pb-24 pt-14">
          <span
            className="absolute font-mono font-bold rounded-full bg-white z-10"
            style={{ top: 30, left: 14, color: "#FFFFFF", background: PINK, border: "2px solid #1B2430", boxShadow: "3px 3px 0 #1B2430", fontSize: "0.62rem", letterSpacing: "0.05em", padding: "5px 12px", transform: "rotate(-8deg)" }}
          >
            JUST LISTED
          </span>
          <ExampleCard {...EXAMPLES[0]} rotate={-2} />
        </div>
      </section>

      {/* CONTENT TYPES — dark full-bleed band */}
      <section style={{ background: AUTH.ink }}>
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-14 sm:py-16 text-center">
          <span className="font-mono font-bold" style={{ color: "#F2B705", letterSpacing: "0.06em", fontSize: "0.7rem" }}>BUILT SPECIFICALLY FOR AGENTS</span>
          <h2 className="font-bold mt-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFFFFF", fontSize: "1.5rem" }}>
            Not a generic caption tool.
          </h2>

          <div className="flex flex-wrap justify-center gap-2.5 mt-8">
            {CONTENT_TYPES.map((label, i) => (
              <span
                key={label}
                className="font-body text-sm font-bold rounded-full px-4 py-2"
                style={{ background: [PINK, PRIMARY, GREEN, ORANGE, PURPLE][i % 5], color: "#FFFFFF", transform: `rotate(${i % 2 === 0 ? -2 : 1.5}deg)` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INSIDE — the "what to expect after signup" overview */}
      <section id="expect" className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PRIMARY})` }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: -100, right: -100, width: 320, height: 320, background: "#FFFFFF", opacity: 0.06 }} />
        <div className="relative max-w-xl mx-auto px-6 sm:px-10 pt-16 sm:pt-20 text-center">
          <span className="font-mono font-bold" style={{ color: "#FFD166", letterSpacing: "0.06em", fontSize: "0.7rem" }}>AFTER YOU SIGN UP</span>
          <h2 className="font-bold mt-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFFFFF", fontSize: "1.7rem", lineHeight: 1.25 }}>
            Here's what's waiting for you inside.
          </h2>
          <p className="font-body text-sm mt-3 mx-auto" style={{ color: "rgba(255,255,255,0.8)", maxWidth: 420, lineHeight: 1.55 }}>
            One quick brand setup — then everything below is ready whenever you need it.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 pt-12 pb-16 sm:pb-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHATS_INSIDE.map(({ icon: Icon, color, title, text }, i) => (
            <div
              key={title}
              className="rounded-2xl p-6 bg-white"
              style={{ border: "2.5px solid #1B2430", transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)` }}
            >
              <div className="flex items-center justify-center rounded-2xl" style={{ width: 46, height: 46, background: color, transform: "rotate(-6deg)" }}>
                <Icon size={22} color="#FFFFFF" />
              </div>
              <h3 className="font-bold mt-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink, fontSize: "1.05rem" }}>{title}</h3>
              <p className="font-body text-sm mt-1.5" style={{ color: AUTH.muted, lineHeight: 1.55 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
          <h2 className="font-bold text-center" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink, fontSize: "1.6rem" }}>
            Your next post in 3 steps
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 mt-12">
            {STEPS.map((s, i) => (
              <div key={s.n}>
                <div
                  className="flex items-center justify-center rounded-full font-bold"
                  style={{ width: 52, height: 52, color: [PINK, PRIMARY, GREEN][i], border: `3px solid ${[PINK, PRIMARY, GREEN][i]}`, fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.15rem" }}
                >
                  {s.n}
                </div>
                <h3 className="font-bold text-base mt-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink }}>{s.title}</h3>
                <p className="font-body text-sm mt-1.5" style={{ color: AUTH.muted }}>{s.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <StickerButton onClick={onGetStarted} background={AUTH.ink} color="#FFFFFF">Create your first post →</StickerButton>
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section id="examples" className="border-t" style={{ background: "#FBFAF6", borderColor: "#EFF2F7" }}>
        <div className="max-w-5xl mx-auto pt-16 pb-16 sm:pt-20 sm:pb-20">
          <div className="px-6 sm:px-10">
            <h2 className="font-bold text-center" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink, fontSize: "1.6rem" }}>
              See what you can create
            </h2>
            <p className="font-body text-sm text-center mt-2 mx-auto" style={{ color: AUTH.muted, maxWidth: 440 }}>
              Listings, closings, market updates, local content, and more — all styled to match your brand.
            </p>
          </div>
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory px-6 sm:px-10 pb-2 sm:pb-0 sm:grid sm:grid-cols-2 sm:overflow-visible mt-10" style={{ scrollbarWidth: "none" }}>
            {EXAMPLES.map((e, i) => (
              <div key={i} className="flex-shrink-0 w-[82%] xs:w-[70%] snap-center sm:w-auto">
                <ExampleCard {...e} rotate={i % 2 === 0 ? -1.5 : 1.5} />
              </div>
            ))}
          </div>
          <div className="text-center mt-8 px-6 sm:px-10">
            <StickerButton onClick={onGetStarted} background="#FFFFFF" color={AUTH.ink} small>Explore Post Ideas →</StickerButton>
          </div>
        </div>
      </section>

      {/* YOUR INFO — bold full-bleed color band */}
      <section style={{ background: AUTH.ink }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
            <span className="font-mono font-bold" style={{ color: "#F2B705", letterSpacing: "0.06em", fontSize: "0.7rem" }}>
              SET YOUR BRAND ONCE
            </span>
            <h2 className="font-bold mt-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFFFFF", fontSize: "1.7rem", lineHeight: 1.2 }}>
              PostKey remembers the rest.
            </h2>
            <p className="font-body text-sm mt-4 mx-auto lg:mx-0" style={{ color: "rgba(255,255,255,0.65)", maxWidth: 360 }}>
              Add your branding and contact info once and we'll apply it to every post you create.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-6">
              {["Logo", "Colors", "Fonts", "Headshot", "Contact Info"].map((label) => (
                <span key={label} className="font-body text-xs rounded-full px-3 py-1.5" style={{ color: "#FFFFFF", background: "rgba(255,255,255,0.08)" }}>
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-8 flex justify-center lg:justify-start">
              <StickerButton onClick={onGetStarted} background="#F2B705" color={AUTH.ink}>Set Up My Brand</StickerButton>
            </div>
          </div>

          <div className="flex justify-center">
            <div style={{ transform: "rotate(2deg)" }}>
              <BrandKitPreview />
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — bright color band */}
      <section className="relative overflow-hidden text-center" style={{ background: PINK }}>
        <div className="absolute rounded-full pointer-events-none hidden sm:block" style={{ bottom: 70, right: 130, width: 20, height: 20, background: "rgba(255,255,255,0.35)" }} />
        <div className="absolute rounded-full pointer-events-none hidden sm:block" style={{ top: 90, right: 220, width: 14, height: 14, background: "#F2B705" }} />
        <div className="relative max-w-xl mx-auto px-6 py-16 sm:py-20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo size={22} />
            <span className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFFFFF" }}>PostKey</span>
          </div>
          <h2 className="font-bold text-2xl sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFFFFF" }}>
            Your next week of content could be ready in minutes.
          </h2>
          <p className="font-body text-sm mt-3 mx-auto" style={{ color: "rgba(255,255,255,0.85)", maxWidth: 400 }}>
            Choose a few ideas, personalize them, and your feed is covered.
          </p>
          <div className="mt-7 flex justify-center">
            <StickerButton onClick={onGetStarted} background="#FFFFFF" color={AUTH.ink}>Create Your First Post Free</StickerButton>
          </div>
          <div className="flex items-center justify-center gap-x-5 gap-y-1.5 mt-5 flex-wrap">
            <span className="font-body text-xs flex items-center gap-1.5" style={{ color: "#FFFFFF" }}>
              <Check size={13} /> Free to start
            </span>
            <span className="font-body text-xs flex items-center gap-1.5" style={{ color: "#FFFFFF" }}>
              <Check size={13} /> No credit card required
            </span>
          </div>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 sm:px-10 pt-10 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={22} />
              <span className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink }}>PostKey</span>
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
                <a href="#expect" className="font-body text-xs" style={{ color: AUTH.muted }}>What You Get</a>
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

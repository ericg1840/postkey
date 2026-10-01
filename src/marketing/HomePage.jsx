import { useEffect, useRef } from "react";
import { Key, Palette, Home, MapPin, MessageCircle, Calendar, Link2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { AUTH } from "../auth/AuthShell.jsx";
import { ACCENT_PRESETS, Logo } from "../shared.jsx";

const PRIMARY = ACCENT_PRESETS[1];
const PINK = ACCENT_PRESETS[0];
const GREEN = ACCENT_PRESETS[2];
const ORANGE = ACCENT_PRESETS[3];
const PURPLE = ACCENT_PRESETS[4];

// Apple-style marketing palette: near-black ink, a soft gray for alternate
// sections, and the brand blue kept for actions so the page still reads
// as PostKey. The system font stack picks up SF Pro on Apple devices and
// falls back to Inter (loaded in index.html) everywhere else.
const A = {
  ink: "#1D1D1F",
  muted: "#6E6E73",
  alt: "#F5F5F7",
  line: "#D2D2D7",
  link: "#0066CC",
};
const SANS = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", "Helvetica Neue", Arial, sans-serif`;
const HEADLINE = { fontFamily: SANS, color: A.ink, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.05, textWrap: "balance" };
const GRADIENT_TEXT = {
  background: `linear-gradient(90deg, ${PINK}, ${PURPLE} 55%, ${PRIMARY})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};
// Lines the edge of a horizontal scroller up with the page's max-w-5xl
// column, so the first card starts where the heading above it does.
const GUTTER = "max(1.5rem, calc((100vw - 64rem) / 2 + 1.5rem))";

// Fades a block up the first time it scrolls into view. The class is set
// on the node directly (no state) and the CSS in index.css skips the
// motion entirely under prefers-reduced-motion.
function Reveal({ children, delay = 0, className = "", style }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add("is-in");
        io.disconnect();
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

const SCENES = {
  day: { sky: ["#7FB2E5", "#D7E9F6"], sun: "#FFF4D6", hill: "#9BB89A", lawn: ["#5E8C4E", "#2F5229"], glow: "#DCEBF5" },
  dusk: { sky: ["#3B4A7A", "#F2A779"], sun: "#FFD9A8", hill: "#5E6B7D", lawn: ["#4B6440", "#1E2E1B"], glow: "#FFD27A" },
  golden: { sky: ["#F6C68B", "#FBE8CF"], sun: "#FFF1D2", hill: "#C9B48A", lawn: ["#7C8F4A", "#3E4D24"], glow: "#FFE3A3" },
};

// A soft, flat illustration standing in for a listing photo — sky, trees,
// lawn, and one of a few house shapes — so the sample posts read as real
// listings without shipping stock photography.
function ListingScene({ scene = "day", house = "classic", id }) {
  const s = SCENES[scene];
  const lit = scene === "dusk";
  const win = lit ? s.glow : "#BFD9EC";
  return (
    <svg viewBox="0 0 400 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s.sky[0]} />
          <stop offset="1" stopColor={s.sky[1]} />
        </linearGradient>
        <linearGradient id={`lawn-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s.lawn[0]} />
          <stop offset="1" stopColor={s.lawn[1]} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#sky-${id})`} />
      <circle cx="320" cy="70" r="26" fill={s.sun} opacity="0.9" />
      <path d="M0 190 Q 90 150 190 178 T 400 168 V 300 H 0 Z" fill={s.hill} opacity="0.7" />
      {[-10, 40, 345, 395].map((x, i) => (
        <circle key={i} cx={x} cy={190} r={i % 2 ? 34 : 42} fill={s.lawn[1]} opacity="0.85" />
      ))}
      <rect y="205" width="400" height="95" fill={`url(#lawn-${id})`} />

      {house === "modern" && (
        <g>
          <rect x="96" y="128" width="208" height="86" fill="#F3F1EC" />
          <rect x="150" y="96" width="132" height="40" fill="#E6E2DA" />
          <rect x="86" y="122" width="228" height="8" fill="#3A3D44" />
          <rect x="144" y="90" width="144" height="7" fill="#3A3D44" />
          <rect x="110" y="146" width="70" height="44" fill={win} />
          <rect x="196" y="146" width="56" height="44" fill={win} />
          <rect x="164" y="106" width="104" height="22" fill={win} />
          <rect x="266" y="150" width="24" height="64" fill="#6B4A36" />
        </g>
      )}
      {house === "classic" && (
        <g>
          <polygon points="92,136 200,78 308,136" fill="#4A4D57" />
          <rect x="108" y="134" width="184" height="80" fill="#F2EEE6" />
          {[124, 168, 232, 262].map((x) => <rect key={x} x={x} y="150" width="22" height="26" fill={win} />)}
          <rect x="188" y="164" width="26" height="50" fill="#6B4A36" />
        </g>
      )}
      {house === "farmhouse" && (
        <g>
          <polygon points="96,140 152,96 208,140" fill="#2F3238" />
          <polygon points="190,140 252,90 314,140" fill="#2F3238" />
          <rect x="106" y="138" width="200" height="76" fill="#FAF8F3" />
          <rect x="124" y="152" width="22" height="30" fill={win} />
          <rect x="160" y="152" width="22" height="30" fill={win} />
          <rect x="238" y="118" width="28" height="20" fill={win} />
          <rect x="232" y="152" width="50" height="30" fill={win} />
          <rect x="196" y="166" width="24" height="48" fill="#2F3238" />
        </g>
      )}
      <polygon points="190,214 214,214 250,300 154,300" fill="#D9D3C7" opacity="0.85" />
    </svg>
  );
}

// An HTML stand-in for a real Spotlight post: hero photo fading into a
// dark stats card, then the brokerage contact strip. Sized in container
// units (cqmin) the way the canvas sizes everything off its shorter side,
// so the same component reads right at feed, story, and landscape shapes.
function PostMock({ eyebrow, word1, word2, accent = PINK, scene, house, address, price, stats = ["4", "3", "2,840"], cta = "Tap for tour", aspect = "1 / 1", id }) {
  return (
    <div
      className="relative overflow-hidden flex flex-col"
      style={{ aspectRatio: aspect, containerType: "size", background: "#161B26", fontFamily: SANS, textAlign: "left" }}
    >
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0"><ListingScene scene={scene} house={house} id={id} /></div>
        <div className="absolute inset-x-0 bottom-0" style={{ height: "40%", background: "linear-gradient(180deg, rgba(22,27,38,0) 0%, rgba(22,27,38,0.55) 55%, #161B26 100%)" }} />
        <span
          className="absolute inline-flex items-center rounded-full font-bold"
          style={{ top: "3.5cqmin", left: "4.5cqmin", gap: "1cqmin", padding: "0.9cqmin 1.8cqmin", fontSize: "1.9cqmin", letterSpacing: "0.04em", color: "#FFFFFF", background: "rgba(20,20,20,0.55)" }}
        >
          <span className="rounded-full" style={{ width: "1cqmin", height: "1cqmin", background: accent }} />
          {word1.toUpperCase()} {word2.toUpperCase()}
        </span>
      </div>
      <div style={{ padding: "4.5cqmin 6cqmin 3.8cqmin" }}>
        <span className="block font-bold" style={{ color: accent, fontSize: "2.1cqmin", letterSpacing: "0.03em" }}>{eyebrow.toUpperCase()}</span>
        <span className="block" style={{ width: "10cqmin", height: "0.25cqmin", background: accent, marginTop: "1cqmin" }} />
        <div style={{ marginTop: "1.6cqmin", fontSize: "6.5cqmin", lineHeight: 1 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: "#FFFFFF" }}>{word1} </span>
          <span style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700, color: accent }}>{word2}.</span>
        </div>
        <span className="block" style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.8cqmin", marginTop: "1.6cqmin" }}>{address}</span>
        <div className="grid grid-cols-3" style={{ marginTop: "2.6cqmin", borderTop: "1px solid rgba(255,255,255,0.18)", borderBottom: "1px solid rgba(255,255,255,0.18)", padding: "1.6cqmin 0" }}>
          {["BEDROOMS", "BATHROOMS", "SQUARE FEET"].map((label, i) => (
            <div key={label}>
              <span className="block" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: accent, fontSize: "3.4cqmin", lineHeight: 1.1 }}>{stats[i]}</span>
              <span className="block font-semibold" style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.2cqmin", marginTop: "0.4cqmin" }}>{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between" style={{ marginTop: "2cqmin" }}>
          <div>
            <span className="block font-semibold" style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.5cqmin" }}>LISTED AT</span>
            <span className="block font-extrabold" style={{ color: "#FFFFFF", fontSize: "3.1cqmin", lineHeight: 1.15 }}>{price}</span>
          </div>
          <span className="rounded-full font-bold" style={{ background: accent, color: "#FFFFFF", fontSize: "1.7cqmin", padding: "1.3cqmin 2.2cqmin" }}>{cta.toUpperCase()}</span>
        </div>
      </div>
      <div className="flex items-center bg-white" style={{ height: "13.5cqmin", padding: "0 5cqmin", gap: "2.4cqmin" }}>
        <span className="rounded-md" style={{ width: "7cqmin", height: "7cqmin", background: "#E5E5EA" }} />
        <div>
          <span className="block font-bold" style={{ color: A.ink, fontSize: "2.4cqmin" }}>Jane Doe, Realtor</span>
          <span className="block" style={{ width: "5cqmin", height: "0.4cqmin", background: accent, marginTop: "0.6cqmin" }} />
        </div>
      </div>
    </div>
  );
}

const HERO_POST = { id: "hero", eyebrow: "Now on the market", word1: "Just", word2: "Listed", accent: PINK, scene: "day", house: "classic", address: "419 Tall Oaks Dr, Warminster", price: "$2,295,000", stats: ["4", "4", "3,028"] };

const EXAMPLES = [
  { label: "Just Listed", blurb: "Lead with the photo. Let the details close the deal.", post: HERO_POST },
  { label: "Open House", blurb: "Day, time, and address — impossible to miss.", post: { id: "open", eyebrow: "Saturday 1 – 3 PM", word1: "Open", word2: "House", accent: PRIMARY, scene: "golden", house: "farmhouse", address: "82 Maple Ct, Doylestown", price: "$749,000", stats: ["3", "2", "1,960"], cta: "See you there" } },
  { label: "New Price", blurb: "A price improvement that actually gets noticed.", post: { id: "price", eyebrow: "Price improvement", word1: "New", word2: "Price", accent: ORANGE, scene: "day", house: "modern", address: "7 Harbor View Ln, Newtown", price: "$1,149,000", stats: ["4", "3", "2,840"], cta: "Book a showing" } },
  { label: "Under Contract", blurb: "Keep momentum visible while you head to closing.", post: { id: "contract", eyebrow: "Pending", word1: "Under", word2: "Contract", accent: PURPLE, scene: "dusk", house: "classic", address: "1210 Ridge Rd, Yardley", price: "$985,000", stats: ["5", "3", "3,410"], cta: "Ask me how" } },
  { label: "Just Sold", blurb: "Celebrate the close — and show the next seller what you do.", post: { id: "sold", eyebrow: "Another happy client", word1: "Just", word2: "Sold", accent: GREEN, scene: "golden", house: "modern", address: "56 Founders Way, Warminster", price: "$2,010,000", stats: ["3", "3", "2,515"], cta: "Thinking of selling?" } },
];

const SIZES = [
  { label: "Feed", dims: "1080 × 1080", aspect: "1 / 1", width: "13.5rem" },
  { label: "Story", dims: "1080 × 1920", aspect: "9 / 16", width: "10.5rem" },
  { label: "Portrait", dims: "1080 × 1350", aspect: "4 / 5", width: "13.5rem" },
  { label: "Facebook", dims: "1200 × 630", aspect: "1200 / 630", width: "20rem" },
];

const STEPS = [
  { n: "1", title: "Pick what to post.", text: "A listing, a closing, a local favorite, a market stat, or a tip — or let the planner suggest one." },
  { n: "2", title: "Add a photo and the details.", text: "Your logo, colors, headshot, and contact info are already on it. Choose the layout you like." },
  { n: "3", title: "Download and post.", text: "Feed, story, Facebook, and portrait sizes are all ready from the same design." },
];

function PrimaryButton({ onClick, children, large }) {
  return (
    <button
      onClick={onClick}
      className="press-fx rounded-full font-medium transition hover:brightness-110 whitespace-nowrap"
      style={{ fontFamily: SANS, background: PRIMARY, color: "#FFFFFF", minHeight: 44, padding: large ? "0 1.6rem" : "0 1.1rem", fontSize: large ? "1.0625rem" : "0.875rem" }}
    >
      {children}
    </button>
  );
}

function TextLink({ href, onClick, children, color = A.link, size = "1.0625rem" }) {
  const Tag = href ? "a" : "button";
  return (
    <Tag href={href} onClick={onClick} className="inline-flex items-center gap-0.5 hover:underline" style={{ fontFamily: SANS, color, fontSize: size, minHeight: 44 }}>
      {children} <ChevronRight size={16} strokeWidth={2.25} />
    </Tag>
  );
}

// A phone frame around a feed post — the hero's product shot.
function PhoneMock() {
  return (
    <div className="relative mx-auto" style={{ width: "min(19rem, 78vw)" }}>
      <div className="rounded-[3rem] p-[0.6rem]" style={{ background: "#1D1D1F", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)" }}>
        <div className="relative rounded-[2.5rem] overflow-hidden bg-white" style={{ fontFamily: SANS }}>
          <div className="absolute left-1/2 -translate-x-1/2 rounded-full z-10" style={{ top: 10, width: "32%", height: 24, background: "#1D1D1F" }} />
          <div className="flex items-center gap-2 px-3.5" style={{ paddingTop: 46, paddingBottom: 10 }}>
            <span className="rounded-full p-[2px]" style={{ background: `linear-gradient(45deg, ${ORANGE}, ${PINK}, ${PURPLE})` }}>
              <span className="block rounded-full bg-white p-[2px]"><span className="block rounded-full" style={{ width: 22, height: 22, background: "#E5E5EA" }} /></span>
            </span>
            <span className="text-[0.72rem] font-semibold" style={{ color: A.ink }}>janedoe.realtor</span>
            <span className="ml-auto text-[0.9rem] leading-none" style={{ color: A.ink }}>···</span>
          </div>
          <PostMock {...HERO_POST} id="phone" />
          <div className="px-3.5 pt-2.5 pb-6">
            <div className="flex gap-3" style={{ color: A.ink }}>
              {[0, 1, 2].map((i) => <span key={i} className="rounded-full" style={{ width: 18, height: 18, border: `1.8px solid ${A.ink}` }} />)}
            </div>
            <p className="text-[0.68rem] font-semibold mt-2" style={{ color: A.ink }}>248 likes</p>
            <p className="text-[0.68rem] mt-0.5 leading-snug" style={{ color: A.ink }}>
              <span className="font-semibold">janedoe.realtor</span> Just listed in Warminster — 4 beds, 4 baths, and a backyard made for summer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExampleScroller() {
  const ref = useRef(null);
  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    el.scrollBy({ left: dir * ((card?.offsetWidth || 320) + 20), behavior: "smooth" });
  };
  return (
    <>
      <div
        ref={ref}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: "none", paddingLeft: GUTTER, paddingRight: GUTTER, scrollPaddingLeft: GUTTER }}
      >
        {EXAMPLES.map((e) => (
          <div key={e.label} data-card className="snap-start flex-shrink-0 rounded-[1.75rem] bg-white overflow-hidden flex flex-col" style={{ width: "min(22rem, 80vw)" }}>
            <div className="px-7 pt-7 pb-6">
              <span className="block text-xs font-semibold" style={{ color: e.post.accent, fontFamily: SANS }}>{e.label}</span>
              <p className="mt-1.5" style={{ ...HEADLINE, fontSize: "1.3rem", lineHeight: 1.2, letterSpacing: "-0.015em" }}>{e.blurb}</p>
            </div>
            <div className="mt-auto px-7 pb-7">
              <div className="rounded-xl overflow-hidden" style={{ boxShadow: "0 12px 30px -12px rgba(0,0,0,0.25)" }}>
                <PostMock {...e.post} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 mt-4" style={{ paddingRight: GUTTER }}>
        {[[-1, ChevronLeft, "Previous"], [1, ChevronRight, "Next"]].map(([dir, Icon, label]) => (
          <button key={label} onClick={() => scroll(dir)} aria-label={label} className="press-fx rounded-full flex items-center justify-center transition hover:brightness-95" style={{ width: 44, height: 44, background: "#E8E8ED", color: A.ink }}>
            <Icon size={20} />
          </button>
        ))}
      </div>
    </>
  );
}

function Tile({ icon: Icon, color, title, text, className = "", children, dark }) {
  return (
    <div className={`rounded-[1.75rem] p-8 sm:p-10 flex flex-col overflow-hidden ${className}`} style={{ background: dark ? "#000000" : A.alt }}>
      <Icon size={30} color={color} strokeWidth={1.75} />
      <h3 className="mt-5" style={{ ...HEADLINE, color: dark ? "#F5F5F7" : A.ink, fontSize: "1.6rem", lineHeight: 1.15, letterSpacing: "-0.02em" }}>{title}</h3>
      <p className="mt-2.5" style={{ fontFamily: SANS, color: dark ? "#A1A1A6" : A.muted, fontSize: "1.0625rem", lineHeight: 1.47 }}>{text}</p>
      {children}
    </div>
  );
}

function BrandKitVisual() {
  return (
    <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ fontFamily: SANS }}>
      <div className="rounded-2xl bg-white p-4 flex flex-col items-center justify-center gap-2">
        <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: A.ink }}>
          <Key size={11} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
          <span className="text-[0.65rem] font-semibold text-white">PostKey Realty</span>
        </span>
        <span className="text-[0.7rem]" style={{ color: A.muted }}>Logo</span>
      </div>
      <div className="rounded-2xl bg-white p-4 flex flex-col items-center justify-center gap-2">
        <span className="flex -space-x-1.5">
          {[A.ink, PRIMARY, PINK].map((c) => <span key={c} className="rounded-full" style={{ width: 22, height: 22, background: c, border: "2px solid #FFFFFF" }} />)}
        </span>
        <span className="text-[0.7rem]" style={{ color: A.muted }}>Colors</span>
      </div>
      <div className="rounded-2xl bg-white p-4 flex flex-col items-center justify-center gap-2">
        <span style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700, fontSize: "1.25rem", color: A.ink, lineHeight: 1 }}>Jane Doe</span>
        <span className="text-[0.7rem]" style={{ color: A.muted }}>Name font</span>
      </div>
      <div className="rounded-2xl bg-white p-4 flex flex-col items-center justify-center gap-2">
        <span className="rounded-full" style={{ width: 28, height: 28, background: "linear-gradient(135deg, #E5E5EA, #C7C7CC)" }} />
        <span className="text-[0.7rem]" style={{ color: A.muted }}>Headshot</span>
      </div>
    </div>
  );
}

function KeyLinkVisual() {
  return (
    <div className="mt-8 mx-auto w-full rounded-2xl p-5" style={{ maxWidth: "18rem", background: "#1C1C1E", fontFamily: SANS }}>
      <div className="flex flex-col items-center">
        <span className="rounded-full" style={{ width: 44, height: 44, background: "linear-gradient(135deg, #3A3A3C, #636366)" }} />
        <span className="text-sm font-semibold mt-2 text-white">Jane Doe</span>
        <span className="text-[0.7rem]" style={{ color: "#A1A1A6" }}>PostKey Realty · Warminster</span>
      </div>
      <div className="grid gap-2 mt-4">
        {["View my listings", "Book a call", "Instagram", "Save my contact"].map((t, i) => (
          <span key={t} className="rounded-full text-center text-xs font-medium py-2.5" style={{ background: i === 0 ? PINK : "#2C2C2E", color: "#FFFFFF" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ---- Shared with AboutPage / AuthShell (kept in their original style) ----

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
          style={{ top: 8, left: 8, background: "rgba(255,255,255,0.92)", color, fontSize: "0.62rem", letterSpacing: "0.04em", padding: "3px 7px" }}
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

function BrandKitRow({ label, children }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: `1px solid ${AUTH.border}` }}>
      <span className="font-mono font-semibold" style={{ color: AUTH.muted, letterSpacing: "0.04em", fontSize: "0.7rem" }}>{label.toUpperCase()}</span>
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
      <BrandKitRow label="Name font">
        <span className="font-bold" style={{ color: AUTH.ink, fontFamily: "'Dancing Script', cursive", fontSize: "1rem" }}>Jane Doe</span>
      </BrandKitRow>
      <BrandKitRow label="Headshot">
        <div className="rounded-full" style={{ width: 24, height: 24, background: "#F1EFE8", border: `1px solid ${AUTH.border}` }} />
      </BrandKitRow>
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold" style={{ color: AUTH.muted, letterSpacing: "0.04em", fontSize: "0.7rem" }}>CONTACT</span>
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
      className={`press-fx font-body font-bold rounded-full transition inline-flex items-center justify-center gap-1.5 ${disabled ? "opacity-60" : "hover:opacity-85"} ${small ? "px-4 text-xs" : "px-6 text-sm"} ${className}`}
      style={{ minHeight: 44, background, color, border: "2.5px solid #1B2430", boxShadow: "4px 4px 0 #1B2430" }}
    >
      {children}
    </Tag>
  );
}

export function HomePage({ onGetStarted, onLogIn, onAbout, onPrivacy, onTerms }) {
  const navLink = { fontFamily: SANS, color: A.ink, fontSize: "0.8125rem", minHeight: 44, opacity: 0.85 };
  const footLink = { fontFamily: SANS, color: A.muted, fontSize: "0.75rem", minHeight: 44 };
  return (
    <div style={{ background: "#FFFFFF", fontFamily: SANS, WebkitFontSmoothing: "antialiased" }}>
      {/* NAV — sticky, translucent, Apple-style frosted bar */}
      <header
        className="sticky top-0 z-40"
        style={{ paddingTop: "env(safe-area-inset-top)", background: "rgba(255,255,255,0.8)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[52px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Logo size={24} />
            <span className="font-semibold whitespace-nowrap" style={{ color: A.ink, fontSize: "1.0625rem", letterSpacing: "-0.01em" }}>PostKey</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#examples" className="inline-flex items-center hover:opacity-100" style={navLink}>Examples</a>
            <a href="#sizes" className="inline-flex items-center hover:opacity-100" style={navLink}>Sizes</a>
            <a href="#expect" className="inline-flex items-center hover:opacity-100" style={navLink}>What You Get</a>
            <a href="#how-it-works" className="inline-flex items-center hover:opacity-100" style={navLink}>How It Works</a>
            {onAbout && <button onClick={onAbout} className="inline-flex items-center hover:opacity-100" style={navLink}>About</button>}
          </nav>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <button onClick={onLogIn} className="inline-flex items-center whitespace-nowrap" style={navLink}>Log in</button>
            <button
              onClick={onGetStarted}
              className="press-fx rounded-full font-medium whitespace-nowrap transition hover:brightness-110"
              style={{ background: PRIMARY, color: "#FFFFFF", fontSize: "0.8125rem", padding: "0.4rem 0.9rem", minHeight: 32 }}
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden text-center">
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ top: "38%", width: "70rem", maxWidth: "160vw", height: "40rem", background: `radial-gradient(closest-side, ${PINK}1F, ${PURPLE}14 45%, rgba(255,255,255,0) 75%)` }}
        />
        <div className="relative max-w-4xl mx-auto px-6 pt-16 sm:pt-24">
          <Reveal>
            <p className="font-semibold" style={{ color: A.ink, fontSize: "clamp(1.0625rem, 2vw, 1.3rem)", letterSpacing: "-0.01em" }}>
              PostKey for real estate agents
            </p>
            <h1 className="mt-3" style={{ ...HEADLINE, fontSize: "clamp(2.75rem, 8vw, 5.25rem)" }}>
              Never wonder what<br className="hidden sm:block" /> <span style={GRADIENT_TEXT}>to post again.</span>
            </h1>
            <p className="mt-6 mx-auto" style={{ color: A.muted, fontSize: "clamp(1.1rem, 2.1vw, 1.45rem)", lineHeight: 1.4, maxWidth: "38rem", letterSpacing: "-0.005em" }}>
              Polished, on-brand listing and community posts in minutes. Your logo, colors, and contact info — already on every one.
            </p>
            <div className="flex items-center justify-center gap-x-7 gap-y-2 mt-9 flex-wrap">
              <PrimaryButton onClick={onGetStarted} large>Get started free</PrimaryButton>
              <TextLink href="#examples">See examples</TextLink>
            </div>
            <p className="mt-3" style={{ color: A.muted, fontSize: "0.8125rem" }}>Free to start. No credit card required.</p>
          </Reveal>
        </div>

        <Reveal delay={150} className="relative max-w-5xl mx-auto px-6 pt-14 sm:pt-20 pb-20 sm:pb-28">
          <div className="relative flex items-end justify-center">
            <div className="hidden lg:block absolute rounded-2xl overflow-hidden" style={{ width: "13rem", left: "8%", bottom: "16%", transform: "rotate(-6deg)", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.3)" }}>
              <PostMock {...EXAMPLES[1].post} id="hero-left" aspect="9 / 16" />
            </div>
            <div className="hidden lg:block absolute rounded-2xl overflow-hidden" style={{ width: "15rem", right: "6%", bottom: "22%", transform: "rotate(5deg)", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.3)" }}>
              <PostMock {...EXAMPLES[4].post} id="hero-right" aspect="4 / 5" />
            </div>
            <div className="relative"><PhoneMock /></div>
          </div>
        </Reveal>
      </section>

      {/* EXAMPLES */}
      <section id="examples" className="py-20 sm:py-28" style={{ background: A.alt, scrollMarginTop: 52 }}>
        <Reveal className="max-w-5xl mx-auto px-6">
          <h2 style={{ ...HEADLINE, fontSize: "clamp(2.25rem, 5vw, 3.5rem)", maxWidth: "40rem" }}>
            Every moment of a listing. <span style={{ color: A.muted }}>Covered.</span>
          </h2>
        </Reveal>
        <Reveal delay={100} className="mt-12">
          <ExampleScroller />
        </Reveal>
      </section>

      {/* SIZES — black feature band */}
      <section id="sizes" className="py-20 sm:py-28 text-center overflow-hidden" style={{ background: "#000000", scrollMarginTop: 52 }}>
        <Reveal className="max-w-4xl mx-auto px-6">
          <p className="font-semibold" style={{ ...GRADIENT_TEXT, fontSize: "1.0625rem" }}>Every size, every platform</p>
          <h2 className="mt-3" style={{ ...HEADLINE, color: "#F5F5F7", fontSize: "clamp(2.25rem, 5.5vw, 4rem)" }}>
            One post. Four sizes.<br />Zero resizing.
          </h2>
          <p className="mt-5 mx-auto" style={{ color: "#A1A1A6", fontSize: "clamp(1.0625rem, 1.8vw, 1.3rem)", lineHeight: 1.45, maxWidth: "34rem" }}>
            Design it once and download it for feed, story, portrait, and Facebook — laid out for each shape, not just cropped.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-14">
          <div className="flex items-end gap-6 sm:gap-8 overflow-x-auto pb-2 lg:justify-center" style={{ scrollbarWidth: "none", paddingLeft: GUTTER, paddingRight: GUTTER }}>
            {SIZES.map((s) => (
              <div key={s.label} className="flex-shrink-0 text-left" style={{ width: s.width }}>
                <div className="rounded-xl overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}>
                  <PostMock {...HERO_POST} id={`size-${s.label}`} aspect={s.aspect} />
                </div>
                <p className="mt-4 font-semibold" style={{ color: "#F5F5F7", fontSize: "0.9375rem" }}>{s.label}</p>
                <p style={{ color: "#86868B", fontSize: "0.8125rem" }}>{s.dims}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* WHAT'S INSIDE — bento grid */}
      <section id="expect" className="py-20 sm:py-28" style={{ scrollMarginTop: 52 }}>
        <div className="max-w-5xl mx-auto px-6">
          <Reveal className="text-center">
            <h2 style={{ ...HEADLINE, fontSize: "clamp(2.25rem, 5vw, 3.5rem)" }}>
              Everything you need.<br /><span style={{ color: A.muted }}>Nothing you don't.</span>
            </h2>
            <p className="mt-5 mx-auto" style={{ color: A.muted, fontSize: "clamp(1.0625rem, 1.8vw, 1.3rem)", lineHeight: 1.45, maxWidth: "34rem" }}>
              One quick brand setup — then all of this is ready whenever you need it.
            </p>
          </Reveal>
          <div className="grid md:grid-cols-6 gap-4 sm:gap-5 mt-14">
            <Reveal className="md:col-span-4 flex">
              <Tile icon={Palette} color={PINK} title="Your brand kit. Set once." text="Add your logo, colors, headshot, and contact info one time — every post uses it automatically." className="flex-1">
                <BrandKitVisual />
              </Tile>
            </Reveal>
            <Reveal delay={80} className="md:col-span-2 flex">
              <Tile icon={Home} color={PRIMARY} title="Listing & Sold graphics." text="Just Listed, Just Sold, Open House, New Price, Under Contract, and Coming Soon — in eight layouts." className="flex-1" />
            </Reveal>
            <Reveal className="md:col-span-2 flex">
              <Tile icon={Calendar} color={PURPLE} title="A planner that fills itself." text="Plan your week or month, set recurring topics, and let auto-fill suggest posts for the empty days." className="flex-1" />
            </Reveal>
            <Reveal delay={80} className="md:col-span-2 flex">
              <Tile icon={MapPin} color={GREEN} title="Local & community posts." text="Market stats, testimonials, tips, and neighborhood spotlights that keep you visible between listings." className="flex-1" />
            </Reveal>
            <Reveal delay={160} className="md:col-span-2 flex">
              <Tile icon={MessageCircle} color={ORANGE} title="Captions, drafted." text="Enter the details and get a ready-to-post listing description — no more staring at an empty text box." className="flex-1" />
            </Reveal>
            <Reveal className="md:col-span-6 flex">
              <div className="flex-1 rounded-[1.75rem] p-8 sm:p-10 grid md:grid-cols-2 gap-6 items-center" style={{ background: "#000000" }}>
                <div>
                  <Link2 size={30} color={PINK} strokeWidth={1.75} />
                  <h3 className="mt-5" style={{ ...HEADLINE, color: "#F5F5F7", fontSize: "clamp(1.6rem, 3vw, 2.25rem)", lineHeight: 1.12, letterSpacing: "-0.02em" }}>
                    Your own Key Link page.
                  </h3>
                  <p className="mt-3" style={{ color: "#A1A1A6", fontSize: "1.0625rem", lineHeight: 1.47, maxWidth: "26rem" }}>
                    One link for every social profile — it shows off your listings and gets people straight to your contact info.
                  </p>
                </div>
                <KeyLinkVisual />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 sm:py-28" style={{ background: A.alt, scrollMarginTop: 52 }}>
        <div className="max-w-5xl mx-auto px-6">
          <Reveal className="text-center">
            <h2 style={{ ...HEADLINE, fontSize: "clamp(2.25rem, 5vw, 3.5rem)" }}>Your next post in three steps.</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-10 md:gap-8 mt-14">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <span className="block font-semibold" style={{ ...GRADIENT_TEXT, fontSize: "3.5rem", lineHeight: 1, letterSpacing: "-0.03em" }}>{s.n}</span>
                <h3 className="mt-4" style={{ ...HEADLINE, fontSize: "1.375rem", lineHeight: 1.2, letterSpacing: "-0.015em" }}>{s.title}</h3>
                <p className="mt-2" style={{ color: A.muted, fontSize: "1.0625rem", lineHeight: 1.47 }}>{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 sm:py-32 text-center">
        <Reveal className="max-w-3xl mx-auto px-6">
          <h2 style={{ ...HEADLINE, fontSize: "clamp(2.5rem, 6.5vw, 4.5rem)" }}>
            Your next week of content.<br /><span style={GRADIENT_TEXT}>Ready in minutes.</span>
          </h2>
          <div className="flex items-center justify-center gap-x-7 gap-y-2 mt-10 flex-wrap">
            <PrimaryButton onClick={onGetStarted} large>Create your first post</PrimaryButton>
            <TextLink onClick={onLogIn}>Log in</TextLink>
          </div>
          <div className="flex items-center justify-center gap-x-6 gap-y-1 mt-5 flex-wrap" style={{ color: A.muted, fontSize: "0.8125rem" }}>
            <span className="inline-flex items-center gap-1.5"><Check size={14} /> Free to start</span>
            <span className="inline-flex items-center gap-1.5"><Check size={14} /> No credit card required</span>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer style={{ background: A.alt }}>
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-10">
          <p className="pb-4" style={{ color: A.muted, fontSize: "0.75rem", lineHeight: 1.5, borderBottom: `1px solid ${A.line}` }}>
            Built for real estate agents. Create better content, stay consistent, and close more.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-x-6 pt-2">
            <p style={{ color: A.muted, fontSize: "0.75rem" }} className="py-3 sm:py-0">© {new Date().getFullYear()} PostKey. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-x-5">
              <a href="#examples" className="inline-flex items-center hover:underline" style={footLink}>Examples</a>
              <a href="#how-it-works" className="inline-flex items-center hover:underline" style={footLink}>How It Works</a>
              {onAbout && <button onClick={onAbout} className="inline-flex items-center hover:underline" style={footLink}>About</button>}
              {onPrivacy ? (
                <button onClick={onPrivacy} className="inline-flex items-center hover:underline" style={footLink}>Privacy Policy</button>
              ) : (
                <a href="#" className="inline-flex items-center hover:underline" style={footLink}>Privacy Policy</a>
              )}
              {onTerms ? (
                <button onClick={onTerms} className="inline-flex items-center hover:underline" style={footLink}>Terms of Service</button>
              ) : (
                <a href="#" className="inline-flex items-center hover:underline" style={footLink}>Terms of Service</a>
              )}
              <a href="mailto:support@postkey.app" className="inline-flex items-center hover:underline" style={footLink}>Contact & Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

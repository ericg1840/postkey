import { Key, Smartphone, Laptop, Palette, Lock, Clock, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AUTH } from "../auth/AuthShell.jsx";
import { ACCENT_PRESETS, Logo } from "../shared.jsx";
import { PostCard, BrandKitPreview } from "./HomePage.jsx";

const PRIMARY = ACCENT_PRESETS[1];

const PRINCIPLES = [
  { icon: Clock, title: "Built for busy days", text: "A post takes minutes, not a design session — so it actually happens between showings.", color: PRIMARY },
  { icon: Palette, title: "Always on-brand", text: "Your logo, colors, fonts, and contact info are set once and applied to everything you create.", color: ACCENT_PRESETS[3] },
  { icon: Lock, title: "Private by design", text: "Listing and client photos are rendered on your device and never uploaded to a server.", color: ACCENT_PRESETS[4] },
];

export function AboutPage({ onBack, onGetStarted, onLogIn }) {
  return (
    <div style={{ background: "#FDFBF7" }}>
      <header style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-1">
          <button onClick={onBack} className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink-0">
            <Logo size={26} />
            <span className="font-display font-bold text-base sm:text-lg whitespace-nowrap" style={{ color: AUTH.ink }}>PostKey</span>
          </button>
          <button onClick={onBack} className="hidden sm:flex items-center gap-1.5 font-body text-sm font-semibold" style={{ color: AUTH.muted }}>
            <ArrowLeft size={15} /> Back to home
          </button>
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

        <div className="max-w-4xl mx-auto px-6 pt-10 sm:pt-14 pb-6 relative text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6"
            style={{ background: "#FFFFFF", boxShadow: "0 4px 14px rgba(27,36,48,0.08)" }}
          >
            <Key size={13} color={PRIMARY} style={{ transform: "rotate(-45deg)" }} />
            <span className="font-body text-xs font-semibold" style={{ color: AUTH.ink }}>Why PostKey exists</span>
          </div>

          <h1 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.1 }}>
            Real estate doesn't happen at a desk.{" "}
            <span style={{ fontFamily: "'Dancing Script', cursive", color: PRIMARY, fontWeight: 700 }}>Your marketing</span>{" "}
            shouldn't either.
          </h1>
          <p className="font-body mt-5 mx-auto" style={{ color: AUTH.muted, fontSize: "1.05rem", maxWidth: 560 }}>
            PostKey helps agents post to social media quickly and consistently — with a design and message that's
            always on-brand — whether that's from your phone right after a showing, or back at the office at the
            end of the day.
          </p>
        </div>
      </section>

      {/* WHEREVER THE DAY TAKES YOU */}
      <section className="max-w-5xl mx-auto px-6 py-10 sm:py-14">
        <h2 className="font-display font-bold text-center" style={{ color: AUTH.ink, fontSize: "1.65rem" }}>
          Made for wherever you actually work
        </h2>
        <p className="font-body text-sm text-center mt-2 mx-auto" style={{ color: AUTH.muted, maxWidth: 480 }}>
          No design software to open, no templates to hunt for — just pick up where you left off.
        </p>

        <div className="grid sm:grid-cols-2 gap-5 mt-10">
          <div className="rounded-2xl p-7" style={{ background: "#FFFFFF", boxShadow: "0 4px 20px rgba(27,36,48,0.06)" }}>
            <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: 44, height: 44, background: `${PRIMARY}1A` }}>
              <Smartphone size={20} color={PRIMARY} />
            </div>
            <h3 className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>In the car after a showing</h3>
            <p className="font-body text-sm mt-2" style={{ color: AUTH.muted, lineHeight: 1.6 }}>
              Snap the listing photo, pick a template, and post before you've pulled out of the driveway. PostKey
              runs the same in a mobile browser as it does on a laptop — no app to install.
            </p>
          </div>
          <div className="rounded-2xl p-7" style={{ background: "#FFFFFF", boxShadow: "0 4px 20px rgba(27,36,48,0.06)" }}>
            <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: 44, height: 44, background: `${ACCENT_PRESETS[3]}1A` }}>
              <Laptop size={20} color={ACCENT_PRESETS[3]} />
            </div>
            <h3 className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>Back at the office</h3>
            <p className="font-body text-sm mt-2" style={{ color: AUTH.muted, lineHeight: 1.6 }}>
              Batch a week of content, fine-tune the details on a bigger screen, and build out your whole social
              set — square, story, and landscape — in the same sitting.
            </p>
          </div>
        </div>
      </section>

      {/* CONSISTENCY / BRAND KIT */}
      <section className="max-w-6xl mx-auto px-6 py-6 sm:py-8">
        <div className="rounded-3xl p-8 sm:p-14 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center" style={{ background: "#F1EFE8" }}>
          <div className="text-center lg:text-left">
            <span className="font-mono font-bold" style={{ color: AUTH.muted, letterSpacing: "0.06em", fontSize: "0.7rem" }}>
              THE PROBLEM WE SAW
            </span>
            <h2 className="font-display font-bold mt-3" style={{ color: AUTH.ink, fontSize: "1.75rem", lineHeight: 1.2 }}>
              Every rushed post chips away at the brand you've built.
            </h2>
            <p className="font-body text-sm mt-4 mx-auto lg:mx-0" style={{ color: AUTH.muted, maxWidth: 400 }}>
              A different font here, a missing logo there, a caption that doesn't sound like you — small
              inconsistencies add up, and clients notice a feed that feels thrown together. PostKey keeps every
              post looking like it came from the same agent, because it did.
            </p>
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
              <span className="font-body text-xs font-semibold" style={{ color: AUTH.muted }}>Every post, every time</span>
              <ArrowRight size={18} style={{ color: AUTH.muted }} />
              <div className="relative flex-shrink-0" style={{ width: 148, height: 176 }}>
                <PostCard category="LISTING" headline="Just Listed!" color={PRIMARY} rotate={0} top={0} left={0} scale={0.88} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="max-w-6xl mx-auto px-6 py-14 sm:py-16">
        <h2 className="font-display font-bold text-center" style={{ color: AUTH.ink, fontSize: "1.75rem" }}>
          What guides how we build it
        </h2>
        <div className="grid sm:grid-cols-3 gap-5 mt-10">
          {PRINCIPLES.map(({ icon: Icon, title, text, color }, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: "#FFFFFF", boxShadow: "0 4px 20px rgba(27,36,48,0.06)" }}>
              <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: 42, height: 42, background: `${color}1A` }}>
                <Icon size={19} color={color} />
              </div>
              <h3 className="font-display font-bold text-base" style={{ color: AUTH.ink }}>{title}</h3>
              <p className="font-body text-sm mt-1.5" style={{ color: AUTH.muted, lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-14 sm:py-16">
        <div
          className="max-w-5xl mx-auto rounded-3xl relative overflow-hidden py-14 px-6 sm:px-14"
          style={{ background: AUTH.ink }}
        >
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-center lg:text-left">
              <h2 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: "#FFFFFF" }}>
                Try it after your next appointment.
              </h2>
              <p className="font-body text-sm mt-3 mx-auto lg:mx-0" style={{ color: "rgba(255,255,255,0.65)", maxWidth: 400 }}>
                See how fast an on-brand post comes together, right from your phone.
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
                <PostCard category="SOLD" headline="Sold Fast!" color={PRIMARY} rotate={-9} top={0} left={0} scale={0.78} />
              </div>
              <div className="absolute" style={{ top: -20, left: 110 }}>
                <PostCard category="LOCAL" headline="Local Favorite!" color={ACCENT_PRESETS[2]} rotate={5} top={0} left={0} scale={0.9} />
              </div>
              <div className="absolute" style={{ top: 20, left: 220 }}>
                <PostCard category="CLIENT LOVE" headline="5-Star Review!" color={ACCENT_PRESETS[4]} rotate={-4} top={0} left={0} scale={0.78} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 pt-10 pb-8 border-t" style={{ borderColor: AUTH.border }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <div>
            <button onClick={onBack} className="flex items-center gap-2">
              <Logo size={24} />
              <span className="font-display font-bold text-base" style={{ color: AUTH.ink }}>PostKey</span>
            </button>
            <p className="font-body text-xs mt-3" style={{ color: AUTH.muted, maxWidth: 240 }}>
              Built for real estate agents. Create better content, stay consistent, and close more.
            </p>
          </div>
          <button onClick={onBack} className="font-body text-xs font-semibold flex items-center gap-1.5" style={{ color: AUTH.muted }}>
            <ArrowLeft size={13} /> Back to home
          </button>
        </div>
        <p className="font-body text-xs mt-10" style={{ color: AUTH.muted }}>© {new Date().getFullYear()} PostKey. All rights reserved.</p>
      </footer>
    </div>
  );
}

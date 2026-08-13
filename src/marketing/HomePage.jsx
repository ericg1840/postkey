import { Key, Sparkles, Palette, Lock, Users } from "lucide-react";
import { AUTH } from "../auth/AuthShell.jsx";

const FEATURES = [
  { icon: Sparkles, title: "Create posts in seconds", text: "Turn a listing photo into a polished, on-brand graphic without opening a design tool." },
  { icon: Palette, title: "Always on-brand", text: "Your logo, headshot, colors, and contact info are set up once and applied to every post." },
  { icon: Lock, title: "Your photos stay private", text: "Listing photos are rendered right in your browser and never uploaded anywhere." },
  { icon: Users, title: "Listings and Community", text: "Just Sold and Just Listed graphics, plus local-spotlight and market-tip posts to stay visible between listings." },
];

export function HomePage({ onGetStarted, onLogIn }) {
  return (
    <div style={{ background: "#F3F9FD" }}>
      <header className="border-b" style={{ borderColor: AUTH.border }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: AUTH.ink }}>
              <Key size={15} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>PostKey</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={onLogIn} className="font-body text-sm font-semibold" style={{ color: AUTH.ink }}>
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="font-body text-sm font-semibold rounded-lg px-4 py-2 transition hover:opacity-88"
              style={{ background: AUTH.ink, color: "#FFFFFF" }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #BFE0F5 0%, #DCEEFA 55%, #F3F9FD 100%)" }}
      >
        <div className="absolute rounded-full" style={{ width: 420, height: 420, top: -180, left: -140, background: "rgba(255,255,255,0.35)", filter: "blur(10px)" }} />
        <div className="absolute rounded-full" style={{ width: 320, height: 320, bottom: -140, right: -100, background: "rgba(255,255,255,0.4)", filter: "blur(10px)" }} />
        <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center relative">
          <h1 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1 }}>
            Branded social posts,<br />built for real estate agents.
          </h1>
          <p className="font-body mt-5" style={{ color: AUTH.muted, fontSize: "1.05rem", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            Upload a listing photo, PostKey does the rest — your brand, your colors, ready to share in every size you need.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <button
              onClick={onGetStarted}
              className="font-body font-semibold rounded-lg px-6 py-3 transition hover:opacity-88"
              style={{ background: AUTH.ink, color: "#FFFFFF", fontSize: "0.95rem" }}
            >
              Get Started — it's free
            </button>
            <button
              onClick={onLogIn}
              className="font-body font-semibold rounded-lg px-6 py-3 border transition"
              style={{ borderColor: AUTH.border, color: AUTH.ink, fontSize: "0.95rem", background: "rgba(255,255,255,0.6)" }}
            >
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <div key={i} className="rounded-2xl p-6 border" style={{ background: "#FFFFFF", borderColor: AUTH.border }}>
              <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: 40, height: 40, background: AUTH.ink }}>
                <Icon size={18} color="#FFFFFF" />
              </div>
              <h3 className="font-display font-bold text-base" style={{ color: AUTH.ink }}>{title}</h3>
              <p className="font-body text-sm mt-1.5" style={{ color: AUTH.muted }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section style={{ background: AUTH.ink }}>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="font-display font-bold text-2xl" style={{ color: "#FFFFFF" }}>Set up your brand kit once.</h2>
          <p className="font-body text-sm mt-2" style={{ color: "rgba(255,255,255,0.65)" }}>
            Then every post — Just Listed, Just Sold, local spotlights, and more — is ready in a couple of clicks.
          </p>
          <button
            onClick={onGetStarted}
            className="font-body font-semibold rounded-lg px-6 py-3 mt-6 transition hover:opacity-88"
            style={{ background: "#FFFFFF", color: AUTH.ink, fontSize: "0.95rem" }}
          >
            Create your account
          </button>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8">
        <p className="font-body text-xs" style={{ color: AUTH.muted }}>© {new Date().getFullYear()} PostKey.</p>
      </footer>
    </div>
  );
}

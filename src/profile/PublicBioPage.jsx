import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { UI, ACCENT, scriptFontCss } from "../shared.jsx";
import { BioLinksList, textOn, relativeLuminance, nameSizePx, bgStyle } from "./bioShared.jsx";

export function PublicBioPage({ handle }) {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bio-public?handle=${encodeURIComponent(handle)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Page not found.");
        if (!cancelled) setState({ loading: false, error: "", data });
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: err.message, data: null });
      }
    })();
    return () => { cancelled = true; };
  }, [handle]);

  if (state.loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: UI.ink }}>
        <p className="font-body text-sm" style={{ color: "#8A93A3" }}>Loading…</p>
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-2 text-center px-6" style={{ background: UI.ink }}>
        <p className="font-display text-lg" style={{ color: "#FDFBF7" }}>This page doesn't exist.</p>
        <p className="font-body text-sm" style={{ color: "#8A93A3" }}>{state.error}</p>
      </div>
    );
  }

  const { name, headshotUrl, tagline, brokerage, bgColor, boxColor, nameFont, nameSize, buttonStyle, bgImageUrl, bgTint, links } = state.data;

  return (
    <div
      className="min-h-dvh flex flex-col items-center px-6"
      style={{
        ...bgStyle(bgColor, bgImageUrl, bgTint),
        paddingTop: "calc(3rem + env(safe-area-inset-top))",
        paddingBottom: "calc(3rem + env(safe-area-inset-bottom))",
        paddingLeft: "calc(1.5rem + env(safe-area-inset-left))",
        paddingRight: "calc(1.5rem + env(safe-area-inset-right))",
      }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-24 h-24 rounded-full p-1 mb-4" style={{ background: `conic-gradient(from 180deg, ${ACCENT}, #6E8CFF, ${ACCENT})` }}>
          {headshotUrl ? (
            <img src={headshotUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="font-display w-full h-full rounded-full flex items-center justify-center text-xl" style={{ background: UI.ink, color: "#FDFBF7" }}>
              {(name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <h1
          className={nameFont ? "text-center mb-1" : "font-display text-center mb-1"}
          style={{
            color: textOn(bgColor),
            font: nameFont ? scriptFontCss(nameFont, nameSizePx(nameSize)) : undefined,
            fontSize: nameFont ? undefined : `${nameSizePx(nameSize)}px`,
            fontWeight: nameFont ? undefined : 700,
          }}
        >
          {name || "Agent"}
        </h1>
        {brokerage && (
          <p className="font-body text-sm text-center mb-1" style={{ color: relativeLuminance(bgColor) > 0.5 ? "#5B6472" : "#9FB4E8" }}>{brokerage}</p>
        )}
        {tagline && (
          <p className="font-body text-sm text-center mb-8 opacity-70 max-w-[280px]" style={{ color: textOn(bgColor) }}>{tagline}</p>
        )}

        <BioLinksList links={links} bgColor={bgColor} boxColor={boxColor} buttonStyle={buttonStyle} asLink />

        <a
          href="/"
          className="flex items-center gap-1.5 mt-10 text-xs font-body opacity-60 hover:opacity-90 transition-opacity"
          style={{ color: textOn(bgColor) }}
        >
          Create your own Key Link page with{" "}
          <span className="font-display font-bold" style={{ color: ACCENT }}>PostKey</span>
          <ArrowRight size={13} />
        </a>
      </div>
    </div>
  );
}

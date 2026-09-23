import { useEffect, useState } from "react";
import { ArrowRight, RotateCw } from "lucide-react";
import { UI, ACCENT, scriptFontCss } from "../shared.jsx";
import { BioLinksList, textOn, relativeLuminance, nameSizePx, bgStyle } from "./bioShared.jsx";

// What the browser tab (and a bookmark) calls this page: the agent, not
// PostKey's own marketing title from index.html.
export function bioPageTitle({ name, brokerage } = {}) {
  const who = (name || "").trim() || "Real estate agent";
  return brokerage ? `${who} | ${brokerage}` : who;
}

// Shown for a handle that doesn't exist (or belongs to a disabled account).
// Visitors land here from a mistyped or outdated link on someone's social
// profile, so it says what happened and gives them somewhere to go.
function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 text-center px-6" style={{ background: UI.ink }}>
      <h1 className="font-display text-2xl font-bold" style={{ color: "#FDFBF7" }}>We couldn't find that page</h1>
      <p className="font-body text-sm max-w-xs" style={{ color: "#A9B1BE" }}>
        The link may have a typo, or the agent may have changed their page address. Try asking them for their latest link.
      </p>
      <a href="/" className="font-body text-sm font-semibold rounded-full px-5 mt-3 inline-flex items-center gap-1.5" style={{ minHeight: 44, background: "#FDFBF7", color: UI.ink }}>
        Go to PostKey <ArrowRight size={14} />
      </a>
    </div>
  );
}

// Anything other than a 404 (offline, a server error): the page probably
// exists, so offer a retry instead of claiming it doesn't.
function LoadFailed({ onRetry }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 text-center px-6" style={{ background: UI.ink }}>
      <h1 className="font-display text-xl font-bold" style={{ color: "#FDFBF7" }}>This page didn't load</h1>
      <p className="font-body text-sm max-w-xs" style={{ color: "#A9B1BE" }}>Check your connection and try again.</p>
      <button onClick={onRetry} className="font-body text-sm font-semibold rounded-full px-5 mt-2 inline-flex items-center gap-1.5" style={{ minHeight: 44, background: "#FDFBF7", color: UI.ink }}>
        <RotateCw size={14} /> Try again
      </button>
    </div>
  );
}

export function PublicBioPage({ handle }) {
  const [state, setState] = useState({ loading: true, notFound: false, failed: false, data: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bio-public?handle=${encodeURIComponent(handle)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 404) setState({ loading: false, notFound: true, failed: false, data: null });
        else if (!res.ok) setState({ loading: false, notFound: false, failed: true, data: null });
        else setState({ loading: false, notFound: false, failed: false, data });
      } catch {
        if (!cancelled) setState({ loading: false, notFound: false, failed: true, data: null });
      }
    })();
    return () => { cancelled = true; };
  }, [handle, attempt]);

  useEffect(() => {
    if (state.data) document.title = bioPageTitle(state.data);
    else if (state.notFound) document.title = "Page not found | PostKey";
  }, [state.data, state.notFound]);

  if (state.loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: UI.ink }}>
        <p className="font-body text-sm" style={{ color: "#8A93A3" }}>Loading…</p>
      </div>
    );
  }

  if (state.notFound) return <NotFound />;
  if (state.failed || !state.data) {
    return <LoadFailed onRetry={() => { setState((s) => ({ ...s, loading: true, failed: false })); setAttempt((n) => n + 1); }} />;
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
        <div className="w-24 h-24 rounded-full p-1 mb-4" style={{ background: boxColor || ACCENT }}>
          {headshotUrl ? (
            <img src={headshotUrl} alt={name ? `${name}` : ""} className="w-full h-full rounded-full object-cover" />
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

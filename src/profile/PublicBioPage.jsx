import { useEffect, useState } from "react";
import { ArrowRight, RotateCw } from "lucide-react";
import { BioPage } from "./BioPage.jsx";
import { TOKENS } from "../lib/bioTheme.mjs";

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
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 text-center px-6" style={{ background: TOKENS.page }}>
      <h1 className="font-display text-2xl font-bold" style={{ color: TOKENS.text }}>We couldn't find that page</h1>
      <p className="font-body text-sm max-w-xs" style={{ color: TOKENS.textSoft }}>
        The link may have a typo, or the agent may have changed their page address. Try asking them for their latest link.
      </p>
      <a href="/" className="font-body text-sm font-semibold rounded-full px-5 mt-3 inline-flex items-center gap-1.5" style={{ minHeight: 44, background: TOKENS.text, color: "#FFFFFF" }}>
        Go to PostKey <ArrowRight size={14} />
      </a>
    </div>
  );
}

// Anything other than a 404 (offline, a server error): the page probably
// exists, so offer a retry instead of claiming it doesn't.
function LoadFailed({ onRetry }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 text-center px-6" style={{ background: TOKENS.page }}>
      <h1 className="font-display text-xl font-bold" style={{ color: TOKENS.text }}>This page didn't load</h1>
      <p className="font-body text-sm max-w-xs" style={{ color: TOKENS.textSoft }}>Check your connection and try again.</p>
      <button onClick={onRetry} className="font-body text-sm font-semibold rounded-full px-5 mt-2 inline-flex items-center gap-1.5" style={{ minHeight: 44, background: TOKENS.text, color: "#FFFFFF" }}>
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
      <div className="min-h-dvh flex items-center justify-center" style={{ background: TOKENS.page }}>
        <p className="font-body text-sm" style={{ color: TOKENS.textSoft }}>Loading…</p>
      </div>
    );
  }

  if (state.notFound) return <NotFound />;
  if (state.failed || !state.data) {
    return <LoadFailed onRetry={() => { setState((s) => ({ ...s, loading: true, failed: false })); setAttempt((n) => n + 1); }} />;
  }

  return (
    <main className="min-h-dvh" style={{ background: TOKENS.page, paddingBottom: "env(safe-area-inset-bottom)" }}>
      <BioPage data={state.data} handle={handle} asLink />
    </main>
  );
}

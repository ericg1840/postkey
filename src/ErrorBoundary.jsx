import { Component } from "react";
import { Key } from "lucide-react";

// Matches the errors thrown when a lazy `import()` chunk 404s — happens to a
// tab/PWA that was left open across a deploy, since the old bundle still
// references asset hashes the new deploy no longer serves. Different
// browsers phrase it differently, hence the multiple patterns.
const CHUNK_ERROR_RE = /loading chunk|failed to fetch dynamically imported module|importing a module script failed/i;
const RELOAD_FLAG = "pk_chunk_reload_attempted";

// Without this, any render-time error (a bad lazy import chief among them)
// unmounts the whole React tree and leaves a blank white screen with no way
// out short of the user guessing to hard-refresh — this is why the admin
// dashboard sometimes "flashes and goes blank" on a phone that had the site
// open from before the last deploy.
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (CHUNK_ERROR_RE.test(error?.message || "")) {
      // Reload once to pick up the new bundle — guarded by sessionStorage so
      // a genuinely broken deploy can't trap the tab in a reload loop.
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
      }
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        className="min-h-dvh flex items-center justify-center p-6"
        style={{ background: "linear-gradient(180deg, #BFE0F5 0%, #DCEEFA 45%, #F3F9FD 100%)" }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 48, height: 48, background: "#1B2430" }}>
            <Key size={22} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
          </div>
          <p className="font-body text-sm" style={{ color: "#1B2430" }}>Something went wrong loading the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="press-fx font-body text-sm font-semibold rounded-full px-5"
            style={{ minHeight: 44, background: "#1B2430", color: "#FFFFFF" }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

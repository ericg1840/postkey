import { useState } from "react";
import { MailWarning } from "lucide-react";
import { UI, ACCENT, WHITE } from "../shared.jsx";
import { useAuth, api } from "../auth/AuthContext.jsx";

// Shown to anyone whose address isn't confirmed yet. Deliberately not
// dismissible and not a hard gate: an unconfirmed address usually means a
// typo, and the consequence of that is a password reset they can never
// receive — so it should keep asking, but it shouldn't lock someone out of
// an app they've already paid attention to. Accounts that predate
// verification are grandfathered server-side and never see this.
export function VerifyEmailBanner() {
  const { user, refresh } = useAuth();
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [message, setMessage] = useState("");

  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setState("sending");
    setMessage("");
    try {
      const data = await api("/api/auth/resend-verification", { method: "POST" });
      // They confirmed in another tab while this one sat open.
      if (data.alreadyVerified) {
        await refresh();
        return;
      }
      setState("sent");
    } catch (err) {
      setState("error");
      setMessage(err.message || "Couldn't send that just now.");
    }
  };

  return (
    <div
      className="px-3 sm:px-6 py-2.5"
      style={{ background: "#FFF4E5", borderBottom: `1px solid ${UI.line}` }}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-2.5 flex-wrap">
        <MailWarning size={16} style={{ color: "#B25E02", flexShrink: 0 }} />
        <span className="font-body text-sm flex-1 min-w-[200px]" style={{ color: "#7A4300" }}>
          {state === "sent" ? (
            <>Sent — check <strong>{user.email}</strong> (and your spam folder).</>
          ) : (
            <>Confirm your email so you can reset your password if you ever need to. We sent a link to <strong>{user.email}</strong>.</>
          )}
          {state === "error" && <span style={{ color: "#C0392B" }}> {message}</span>}
        </span>
        {state !== "sent" && (
          <button
            type="button"
            onClick={resend}
            disabled={state === "sending"}
            className="press-fx font-body text-xs font-bold rounded-full px-3.5 flex-shrink-0 disabled:opacity-60"
            style={{ minHeight: 36, background: ACCENT, color: WHITE }}
          >
            {state === "sending" ? "Sending…" : "Resend"}
          </button>
        )}
      </div>
    </div>
  );
}

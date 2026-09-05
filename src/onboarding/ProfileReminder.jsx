import { useState } from "react";
import { X } from "lucide-react";
import { UI, ACCENT, WHITE } from "../shared.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

const HIDE_KEY_PREFIX = "postkey_profile_reminder_hidden_";

export function ProfileReminder({ onNavigate }) {
  const { user, brandKit, saveBrandKit } = useAuth();
  const hideKey = user ? `${HIDE_KEY_PREFIX}${user.id}` : null;
  const [hiddenThisSession, setHiddenThisSession] = useState(() => {
    if (!hideKey) return false;
    try {
      return sessionStorage.getItem(hideKey) === "1";
    } catch {
      return false;
    }
  });
  const [busy, setBusy] = useState(false);

  if (!brandKit || !brandKit.onboarded || brandKit.profileReminderDismissed) return null;
  const profileComplete = Boolean(brandKit.agentName?.trim() && brandKit.brokerageName?.trim());
  if (profileComplete || hiddenThisSession) return null;

  const hideForSession = () => {
    try {
      sessionStorage.setItem(hideKey, "1");
    } catch {
      // Private browsing / storage disabled — falls back to just this render.
    }
    setHiddenThisSession(true);
  };

  const dismissForGood = async () => {
    setBusy(true);
    try {
      await saveBrandKit({ ...brandKit, profileReminderDismissed: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed z-40 rounded-2xl p-4"
      style={{
        bottom: "calc(1.25rem + env(safe-area-inset-bottom))", right: "1.25rem", left: "1.25rem", maxWidth: 320, marginLeft: "auto",
        background: WHITE, border: `1px solid ${UI.line}`, boxShadow: "0 16px 40px rgba(27,36,48,0.18)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-display font-bold text-sm" style={{ color: UI.ink }}>Finish setting up your profile</h3>
          <p className="font-body text-xs mt-1" style={{ color: UI.inkSoft }}>
            Add your name, photo, and brokerage so they show up on every post.
          </p>
        </div>
        <button onClick={hideForSession} aria-label="Hide for now" className="press-fx flex items-center justify-center" style={{ color: UI.inkSoft, flexShrink: 0, width: 44, height: 44, margin: "-14px -14px -14px 0" }}>
          <X size={16} />
        </button>
      </div>
      <button
        onClick={() => onNavigate("profile")}
        className="press-fx w-full mt-2 rounded-lg font-body text-sm font-semibold"
        style={{ minHeight: 44, background: ACCENT, color: WHITE }}
      >
        Complete your profile
      </button>
      <button onClick={dismissForGood} disabled={busy} className="press-fx w-full mt-2 text-center font-body text-xs underline" style={{ color: UI.inkSoft, minHeight: 44 }}>
        Don't remind me again
      </button>
    </div>
  );
}

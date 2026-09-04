import { useState } from "react";
import { X, Check } from "lucide-react";
import { UI, ACCENT, PINK, WHITE } from "../shared.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

const HIDE_KEY_PREFIX = "postkey_checklist_hidden_";

export function OnboardingChecklist({ onNavigate }) {
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

  if (!brandKit || !brandKit.onboarded || brandKit.checklistDismissed) return null;

  const profileDone = Boolean(brandKit.agentName?.trim() && brandKit.brokerageName?.trim());
  const linkDone = (brandKit.linkCount || 0) > 0;
  if (profileDone && linkDone) return null;
  if (hiddenThisSession) return null;

  const doneCount = (profileDone ? 1 : 0) + (linkDone ? 1 : 0);

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
      await saveBrandKit({ ...brandKit, checklistDismissed: true });
    } finally {
      setBusy(false);
    }
  };

  const ctaLabel = !profileDone ? "Complete your profile" : "Add a link";
  const ctaTarget = !profileDone ? "profile" : "bio";

  return (
    <div
      className="fixed z-40 rounded-2xl p-5"
      style={{
        bottom: "1.25rem",
        right: "1.25rem",
        left: "1.25rem",
        maxWidth: 340,
        marginLeft: "auto",
        background: WHITE,
        border: `1px solid ${UI.line}`,
        boxShadow: "0 16px 40px rgba(27,36,48,0.18)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm" style={{ color: UI.ink }}>Finish setting up</h3>
        <button onClick={hideForSession} aria-label="Hide for now" style={{ color: UI.inkSoft }}>
          <X size={16} />
        </button>
      </div>

      <div className="rounded-full overflow-hidden mb-1.5" style={{ height: 6, background: UI.stone }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(doneCount / 2) * 100}%`, background: `linear-gradient(90deg, ${ACCENT}, ${PINK})` }}
        />
      </div>
      <p className="font-mono text-[0.65rem] mb-3" style={{ color: UI.inkSoft }}>{doneCount} of 2 steps done</p>

      {[
        { done: profileDone, label: "Complete your profile", sub: "Name, brokerage & photo added" },
        { done: linkDone, label: "Add your first link", sub: "Your bio page needs at least one link to go live" },
      ].map((item) => (
        <div key={item.label} className="flex items-start gap-2.5 py-2 border-t" style={{ borderColor: UI.line }}>
          <span
            className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
            style={{ width: 20, height: 20, background: item.done ? "#DEF3E7" : "transparent", border: item.done ? "none" : `1.5px solid ${UI.line}` }}
          >
            {item.done && <Check size={12} color="#1E8E5A" />}
          </span>
          <div>
            <p className="font-body text-sm font-semibold" style={{ color: item.done ? UI.inkSoft : UI.ink, textDecoration: item.done ? "line-through" : "none", textDecorationColor: UI.line }}>
              {item.label}
            </p>
            <p className="font-body text-xs" style={{ color: UI.inkSoft }}>{item.sub}</p>
          </div>
        </div>
      ))}

      <button
        onClick={() => onNavigate(ctaTarget)}
        className="w-full mt-4 rounded-lg py-2.5 font-body text-sm font-semibold"
        style={{ background: UI.ink, color: UI.page }}
      >
        {ctaLabel}
      </button>
      <button onClick={dismissForGood} disabled={busy} className="w-full mt-2 text-center font-body text-xs underline" style={{ color: UI.inkSoft }}>
        Don't show this again
      </button>
    </div>
  );
}

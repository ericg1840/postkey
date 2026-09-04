import { useState } from "react";
import { AUTH } from "../auth/AuthShell.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { BrandSection } from "../profile/ProfilePage.jsx";

export function OnboardingWizard() {
  const { brandKit, saveBrandKit } = useAuth();
  const [skipping, setSkipping] = useState(false);

  const skip = async () => {
    setSkipping(true);
    try {
      await saveBrandKit({ ...brandKit, onboarded: true });
    } finally {
      setSkipping(false);
    }
  };

  return (
    <div
      className="min-h-screen px-4 sm:px-8 py-10"
      style={{
        background: "linear-gradient(180deg, #BFE0F5 0%, #DCEEFA 45%, #F3F9FD 100%)",
        paddingTop: "calc(2.5rem + env(safe-area-inset-top))",
        paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-xl mb-1.5" style={{ color: AUTH.ink }}>Welcome to PostKey!</h1>
            <p className="font-body text-sm" style={{ color: AUTH.muted, maxWidth: 480 }}>
              Set up your brand kit once — your photo, logo, colors, and contact info will be ready on every post from now on.
            </p>
          </div>
          <button onClick={skip} disabled={skipping} className="font-body text-xs underline whitespace-nowrap flex-shrink-0 mt-1" style={{ color: AUTH.muted }}>
            {skipping ? "Skipping…" : "Skip for now"}
          </button>
        </div>

        <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.96)", boxShadow: "0 20px 50px rgba(27,36,48,0.14)" }}>
          <BrandSection brandKit={brandKit} saveBrandKit={saveBrandKit} />
        </div>
      </div>
    </div>
  );
}

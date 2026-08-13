// Neutral, brand-agnostic palette for the sign-in/sign-up chrome — deliberately
// not the app's pink accent, since this screen is the first thing every agent
// sees, before it's "their" workspace.
export const AUTH = {
  ink: "#1B2430",
  muted: "#697386",
  border: "#E3EAF2",
  field: "#F4F7FB",
  card: "rgba(255,255,255,0.92)",
};

export function AuthShell({ icon: Icon, title, subtitle, children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #BFE0F5 0%, #DCEEFA 45%, #F3F9FD 100%)",
      }}
    >
      <style>{`
        .auth-input { width: 100%; background: transparent; border: none; outline: none; font-family: 'Public Sans', sans-serif; font-size: 0.9rem; color: ${AUTH.ink}; }
        .auth-input::placeholder { color: ${AUTH.muted}; }
        .auth-field { display: flex; align-items: center; gap: 0.6rem; background: ${AUTH.field}; border: 1px solid ${AUTH.border}; border-radius: 10px; padding: 0.7rem 0.9rem; }
        .auth-field:focus-within { border-color: ${AUTH.ink}; }
        .auth-cta { width: 100%; background: ${AUTH.ink}; color: #FFFFFF; font-family: 'Public Sans', sans-serif; font-weight: 600; font-size: 0.9rem; border-radius: 10px; padding: 0.75rem; transition: opacity 0.15s; }
        .auth-cta:disabled { opacity: 0.6; }
        .auth-cta:not(:disabled):hover { opacity: 0.88; }
      `}</style>

      <div className="absolute rounded-full" style={{ width: 340, height: 340, top: -120, left: -100, background: "rgba(255,255,255,0.35)", filter: "blur(10px)" }} />
      <div className="absolute rounded-full" style={{ width: 260, height: 260, bottom: -80, right: -60, background: "rgba(255,255,255,0.4)", filter: "blur(10px)" }} />

      <div className="w-full relative" style={{ maxWidth: 380 }}>
        <div
          className="rounded-2xl p-8"
          style={{ background: AUTH.card, boxShadow: "0 20px 50px rgba(27,36,48,0.14)", backdropFilter: "blur(6px)" }}
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: 44, height: 44, background: AUTH.ink }}>
              <Icon size={20} color="#FFFFFF" />
            </div>
            <h1 className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>{title}</h1>
            {subtitle && <p className="font-body text-xs mt-1.5" style={{ color: AUTH.muted, maxWidth: 260 }}>{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthField({ icon: Icon, trailing, children }) {
  return (
    <label className="auth-field">
      {Icon && <Icon size={16} style={{ color: AUTH.muted, flexShrink: 0 }} />}
      {children}
      {trailing}
    </label>
  );
}

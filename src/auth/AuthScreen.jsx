import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";
import { AUTH, AUTH_BLUE, AuthShell, AuthField } from "./AuthShell.jsx";
import { ACCENT_PRESETS } from "../shared.jsx";

const PINK = ACCENT_PRESETS[0];
const GREEN = ACCENT_PRESETS[2];

const COPY = {
  login: { title: "Welcome back", subtitle: "Log in to pick up where you left off." },
  signup: { title: "Create your free account", subtitle: "Set up your brand and create your first post in just a few minutes." },
  forgot: { title: "Reset your password", subtitle: "Enter your account email and we'll send a link to reset it." },
};

const STEPS = ["Account", "Brand", "First Post"];
const STEP_COLORS = [PINK, AUTH_BLUE, GREEN];

function ModeTabs({ mode, onChange }) {
  return (
    <div className="flex items-center rounded-full p-1 mb-6 bg-white" style={{ border: "2px solid #1B2430" }}>
      {["signup", "login"].map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className="press-fx flex-1 font-body text-sm font-bold rounded-full transition"
          style={{
            minHeight: 44,
            background: mode === m ? PINK : "transparent",
            color: mode === m ? "#FFFFFF" : AUTH.muted,
          }}
        >
          {m === "signup" ? "Sign Up" : "Log In"}
        </button>
      ))}
    </div>
  );
}

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function GoogleButton() {
  return (
    <a
      href="/api/auth/google/start"
      className="press-fx flex items-center justify-center gap-2 rounded-full bg-white font-body text-sm font-bold"
      style={{ minHeight: 44, border: "2px solid #1B2430", color: AUTH.ink }}
    >
      <GoogleIcon />
      Continue with Google
    </a>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div style={{ flex: 1, height: 1, background: AUTH.border }} />
      <span className="font-body text-xs font-semibold" style={{ color: AUTH.muted }}>or</span>
      <div style={{ flex: 1, height: 1, background: AUTH.border }} />
    </div>
  );
}

function StepIndicator() {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className="flex items-center justify-center rounded-full font-body font-bold flex-shrink-0"
              style={{
                width: 20, height: 20, fontSize: "0.68rem",
                background: i === 0 ? STEP_COLORS[i] : AUTH.field,
                color: i === 0 ? "#FFFFFF" : AUTH.muted,
                border: i === 0 ? "2px solid #1B2430" : `1px solid ${AUTH.border}`,
              }}
            >
              {i + 1}
            </span>
            <span className="font-body text-xs font-semibold" style={{ color: i === 0 ? AUTH.ink : AUTH.muted }}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ width: 24, height: 1, background: AUTH.border }} />}
        </div>
      ))}
    </div>
  );
}

export function AuthScreen({ initialMode = "login", initialError = "", onBack }) {
  const { login, signup, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState(initialMode); // login | signup | forgot
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const switchMode = (next) => { setMode(next); setError(""); setResetMessage(""); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const data = await requestPasswordReset(email);
        setResetMessage(data.message);
      } else if (mode === "signup") {
        await signup(email, password, fullName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const { title, subtitle } = COPY[mode];

  return (
    <AuthShell onBack={onBack}>
      {mode !== "forgot" && <ModeTabs mode={mode} onChange={switchMode} />}

      <div className={mode === "forgot" ? "mb-6" : "mb-6 text-center"}>
        <h1 className="font-bold text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif", color: AUTH.ink }}>{title}</h1>
        {subtitle && <p className="font-body text-sm mt-1.5" style={{ color: AUTH.muted }}>{subtitle}</p>}
      </div>

      {mode === "forgot" && resetMessage ? (
        <div className="grid gap-4">
          <p className="font-body text-sm" style={{ color: AUTH.ink }}>{resetMessage}</p>
          <button type="button" onClick={() => switchMode("login")} className="press-fx font-body text-xs font-semibold underline text-left flex items-center -ml-1 px-1" style={{ color: AUTH.muted, minHeight: 44 }}>
            Back to log in
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3.5">
          {mode !== "forgot" && (
            <>
              <GoogleButton />
              <OrDivider />
            </>
          )}
          {mode === "signup" && (
            <AuthField icon={User}>
              <input className="auth-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
            </AuthField>
          )}
          <AuthField icon={Mail}>
            <input type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          </AuthField>
          {mode !== "forgot" && (
            <AuthField icon={Lock} trailing={
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"} className="press-fx flex items-center justify-center" style={{ color: AUTH.muted, width: 44, height: 44, margin: "-10px" }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }>
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                minLength={8}
                required
              />
            </AuthField>
          )}
          {mode === "signup" && (
            <span className="font-body text-xs -mt-2" style={{ color: AUTH.muted }}>8+ characters</span>
          )}

          {mode === "login" && (
            <button type="button" onClick={() => switchMode("forgot")} className="press-fx font-body text-xs -mt-1 flex items-center justify-end px-1" style={{ color: AUTH.muted, minHeight: 44 }}>
              Forgot password?
            </button>
          )}

          {error && <div className="font-body text-xs" style={{ color: "#C0392B" }}>{error}</div>}

          <button type="submit" disabled={busy} className="auth-cta">
            {busy ? "Please wait…" : mode === "signup" ? "Get Started Free" : "Log in"}
          </button>

          {mode === "signup" && <StepIndicator />}

          {mode === "forgot" ? (
            <button type="button" onClick={() => switchMode("login")} className="press-fx font-body text-xs font-semibold underline text-center mt-1 flex items-center justify-center" style={{ color: AUTH.muted, minHeight: 44 }}>
              Back to log in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="press-fx font-body text-xs text-center mt-1 flex items-center justify-center"
              style={{ color: AUTH.muted, minHeight: 44 }}
            >
              {mode === "login" ? "New here? " : "Already have an account? "}
              <span className="font-semibold underline" style={{ color: AUTH.ink }}>
                {mode === "login" ? "Create an account" : "Log in"}
              </span>
            </button>
          )}
        </form>
      )}
    </AuthShell>
  );
}

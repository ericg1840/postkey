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
          className="flex-1 font-body text-sm font-bold rounded-full py-2 transition"
          style={{
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

export function AuthScreen({ initialMode = "login", onBack }) {
  const { login, signup, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState(initialMode); // login | signup | forgot
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
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
          <button type="button" onClick={() => switchMode("login")} className="font-body text-xs font-semibold underline text-left" style={{ color: AUTH.muted }}>
            Back to log in
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3.5">
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
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"} style={{ color: AUTH.muted }}>
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
            <button type="button" onClick={() => switchMode("forgot")} className="font-body text-xs text-right -mt-1" style={{ color: AUTH.muted }}>
              Forgot password?
            </button>
          )}

          {error && <div className="font-body text-xs" style={{ color: "#C0392B" }}>{error}</div>}

          <button type="submit" disabled={busy} className="auth-cta">
            {busy ? "Please wait…" : mode === "signup" ? "Get Started Free" : "Log in"}
          </button>

          {mode === "signup" && <StepIndicator />}

          {mode === "forgot" ? (
            <button type="button" onClick={() => switchMode("login")} className="font-body text-xs font-semibold underline text-center mt-1" style={{ color: AUTH.muted }}>
              Back to log in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="font-body text-xs text-center mt-1"
              style={{ color: AUTH.muted }}
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

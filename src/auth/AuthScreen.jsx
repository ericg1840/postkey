import { useState } from "react";
import { LogIn, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";
import { AUTH, AuthShell, AuthField } from "./AuthShell.jsx";

const COPY = {
  login: { title: "Sign in with email", subtitle: "Turn your listings into share-ready posts in seconds.", cta: "Log in" },
  signup: { title: "Create your account", subtitle: "Set up your own brand kit and start posting in minutes.", cta: "Create account" },
  forgot: { title: "Reset your password", subtitle: "Enter your account email and we'll send a link to reset it.", cta: "Send reset link" },
};

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

  const { title, subtitle, cta } = COPY[mode];

  return (
    <AuthShell icon={LogIn} title={title} subtitle={subtitle} onBack={onBack}>
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

          {mode === "login" && (
            <button type="button" onClick={() => switchMode("forgot")} className="font-body text-xs text-right -mt-1" style={{ color: AUTH.muted }}>
              Forgot password?
            </button>
          )}

          {error && <div className="font-body text-xs" style={{ color: "#C0392B" }}>{error}</div>}

          <button type="submit" disabled={busy} className="auth-cta">
            {busy ? "Please wait…" : cta}
          </button>

          {mode === "forgot" ? (
            <button type="button" onClick={() => switchMode("login")} className="font-body text-xs font-semibold underline text-center" style={{ color: AUTH.muted }}>
              Back to log in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="font-body text-xs text-center"
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

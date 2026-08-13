import { useState } from "react";
import { Image as ImageIcon, Lock } from "lucide-react";
import { UI, PINK, WHITE } from "../shared.jsx";
import { useAuth } from "./AuthContext.jsx";

export function AuthScreen() {
  const { login, signup, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

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

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: UI.stone }}>
      <div className="w-full sm:w-auto" style={{ maxWidth: 400 }}>
        <div className="flex items-center gap-2 justify-center mb-8">
          <ImageIcon size={22} style={{ color: PINK }} />
          <span className="font-display font-bold text-lg" style={{ color: UI.ink }}>PostKey</span>
        </div>

        <div className="rounded-lg border p-6 sm:p-6" style={{ borderColor: UI.line, background: UI.card }}>
          {mode !== "forgot" && (
            <div className="flex items-center gap-1 p-1 rounded-full mb-6" style={{ background: UI.stone }}>
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); setResetMessage(""); }}
                className="flex-1 px-4 py-1.5 rounded-full font-body text-xs font-semibold transition"
                style={{
                  background: mode === "login" ? UI.card : "transparent",
                  color: mode === "login" ? UI.ink : UI.inkSoft,
                  boxShadow: mode === "login" ? "0 1px 3px rgba(39,27,32,0.15)" : "none",
                }}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(""); setResetMessage(""); }}
                className="flex-1 px-4 py-1.5 rounded-full font-body text-xs font-semibold transition"
                style={{
                  background: mode === "signup" ? UI.card : "transparent",
                  color: mode === "signup" ? UI.ink : UI.inkSoft,
                  boxShadow: mode === "signup" ? "0 1px 3px rgba(39,27,32,0.15)" : "none",
                }}
              >
                Create account
              </button>
            </div>
          )}

          {mode === "forgot" && resetMessage ? (
            <div className="grid gap-4">
              <p className="font-body text-sm" style={{ color: UI.ink }}>{resetMessage}</p>
              <button
                type="button"
                onClick={() => { setMode("login"); setResetMessage(""); }}
                className="font-body text-xs font-semibold underline text-left"
                style={{ color: UI.inkSoft }}
              >
                Back to log in
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              {mode === "forgot" && (
                <p className="font-body text-xs" style={{ color: UI.inkSoft }}>
                  Enter your account email and we'll send a link to reset your password.
                </p>
              )}
              {mode === "signup" && (
                <div>
                  <label className="font-body text-xs font-semibold block mb-1.5" style={{ color: UI.inkSoft }}>Your name</label>
                  <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Mariella Torres" required />
                </div>
              )}
              <div>
                <label className="font-body text-xs font-semibold block mb-1.5" style={{ color: UI.inkSoft }}>Email</label>
                <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              {mode !== "forgot" && (
                <div>
                  <label className="font-body text-xs font-semibold block mb-1.5" style={{ color: UI.inkSoft }}>Password</label>
                  <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
                </div>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); }}
                  className="font-body text-xs underline text-left -mt-2"
                  style={{ color: UI.inkSoft }}
                >
                  Forgot password?
                </button>
              )}

              {error && <div className="font-body text-xs" style={{ color: "#C0392B" }}>{error}</div>}

              <button
                type="submit"
                disabled={busy}
                className="font-body text-sm font-semibold rounded px-4 py-2.5 transition disabled:opacity-60"
                style={{ background: PINK, color: WHITE }}
              >
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Log in"}
              </button>

              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className="font-body text-xs font-semibold underline text-left"
                  style={{ color: UI.inkSoft }}
                >
                  Back to log in
                </button>
              )}
            </form>
          )}
        </div>

        <div className="flex items-center gap-1.5 font-body text-xs justify-center mt-4" style={{ color: UI.inkSoft }}>
          <Lock size={12} />
          Your brand kit is stored securely on your account — post photos never leave your device
        </div>
      </div>
    </div>
  );
}


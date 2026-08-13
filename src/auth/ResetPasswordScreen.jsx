import { useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";
import { AUTH, AuthShell, AuthField } from "./AuthShell.jsx";

export function ResetPasswordScreen({ email, token, onDone }) {
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    try {
      await resetPassword(email, token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell icon={KeyRound} title={done ? "Password reset" : "Set a new password"} subtitle={done ? undefined : `For ${email}`}>
      {done ? (
        <div className="grid gap-4">
          <p className="font-body text-sm text-center" style={{ color: AUTH.ink }}>Your password has been reset.</p>
          <button type="button" onClick={onDone} className="auth-cta">Go to log in</button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3.5">
          <AuthField icon={Lock}>
            <input type="password" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" minLength={8} required />
          </AuthField>
          <AuthField icon={Lock}>
            <input type="password" className="auth-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" minLength={8} required />
          </AuthField>

          {error && <div className="font-body text-xs" style={{ color: "#C0392B" }}>{error}</div>}

          <button type="submit" disabled={busy} className="auth-cta">
            {busy ? "Please wait…" : "Reset password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

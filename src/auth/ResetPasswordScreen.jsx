import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { UI, PINK, WHITE } from "../shared.jsx";
import { useAuth } from "./AuthContext.jsx";

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
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: UI.stone }}>
      <div className="w-full sm:w-auto" style={{ maxWidth: 400 }}>
        <div className="flex items-center gap-2 justify-center mb-8">
          <ImageIcon size={22} style={{ color: PINK }} />
          <span className="font-display font-bold text-lg" style={{ color: UI.ink }}>PostKey</span>
        </div>

        <div className="rounded-lg border p-6 sm:p-6" style={{ borderColor: UI.line, background: UI.card }}>
          {done ? (
            <div className="grid gap-4">
              <p className="font-body text-sm" style={{ color: UI.ink }}>Your password has been reset.</p>
              <button
                type="button"
                onClick={onDone}
                className="font-body text-sm font-semibold rounded px-4 py-2.5 transition"
                style={{ background: PINK, color: WHITE }}
              >
                Go to log in
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <p className="font-body text-xs" style={{ color: UI.inkSoft }}>Set a new password for {email}.</p>
              <div>
                <label className="font-body text-xs font-semibold block mb-1.5" style={{ color: UI.inkSoft }}>New password</label>
                <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
              </div>
              <div>
                <label className="font-body text-xs font-semibold block mb-1.5" style={{ color: UI.inkSoft }}>Confirm password</label>
                <input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
              </div>

              {error && <div className="font-body text-xs" style={{ color: "#C0392B" }}>{error}</div>}

              <button
                type="submit"
                disabled={busy}
                className="font-body text-sm font-semibold rounded px-4 py-2.5 transition disabled:opacity-60"
                style={{ background: PINK, color: WHITE }}
              >
                {busy ? "Please wait…" : "Reset password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

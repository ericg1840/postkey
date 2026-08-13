import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";

export function ChangePasswordModal({ onClose, ui, accent }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) { setError("New passwords don't match."); return; }
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ background: "rgba(27,36,48,0.45)", zIndex: 100 }}
      onClick={onClose}
    >
      <div
        className="rounded-lg w-full"
        style={{ maxWidth: 380, background: ui.card, boxShadow: "0 20px 50px rgba(27,36,48,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="font-display font-bold text-base" style={{ color: ui.ink }}>
            {done ? "Password changed" : "Change password"}
          </h2>
          <button onClick={onClose} style={{ color: ui.inkSoft }}><X size={18} /></button>
        </div>

        <div className="p-6 pt-4">
          {done ? (
            <div className="grid gap-4">
              <p className="font-body text-sm" style={{ color: ui.ink }}>Your password has been updated.</p>
              <button
                onClick={onClose}
                className="font-body text-sm font-semibold rounded px-4 py-2.5 transition"
                style={{ background: accent, color: "#FFFFFF" }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <label className="block">
                <span className="font-mono text-xs block mb-1.5" style={{ color: ui.inkSoft, letterSpacing: "0.04em" }}>CURRENT PASSWORD</span>
                <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </label>
              <label className="block">
                <span className="font-mono text-xs block mb-1.5" style={{ color: ui.inkSoft, letterSpacing: "0.04em" }}>NEW PASSWORD</span>
                <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
              </label>
              <label className="block">
                <span className="font-mono text-xs block mb-1.5" style={{ color: ui.inkSoft, letterSpacing: "0.04em" }}>CONFIRM NEW PASSWORD</span>
                <input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
              </label>

              {error && <div className="font-body text-xs" style={{ color: "#C0392B" }}>{error}</div>}

              <button
                type="submit"
                disabled={busy}
                className="font-body text-sm font-semibold rounded px-4 py-2.5 transition disabled:opacity-60"
                style={{ background: accent, color: "#FFFFFF" }}
              >
                {busy ? "Saving…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

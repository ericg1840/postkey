import { createContext, useContext, useEffect, useState, useCallback } from "react";

// Temporary: the hosted backend (database + auth API) isn't confirmed working
// yet, so skip real accounts and let anyone use the tool immediately. Brand
// kit is kept in this browser's localStorage so it survives a refresh but
// isn't tied to an account. Flip this back to false once signup/login work.
const STANDALONE = true;
const STANDALONE_STORAGE_KEY = "postkey_standalone_brandkit";

const AuthContext = createContext(null);

function StandaloneAuthProvider({ children }) {
  const [brandKit, setBrandKit] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STANDALONE_STORAGE_KEY)) || { onboarded: true };
    } catch {
      return { onboarded: true };
    }
  });

  const saveBrandKit = async (kit) => {
    const next = { ...kit, onboarded: true };
    setBrandKit(next);
    try {
      localStorage.setItem(STANDALONE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable (private browsing, etc) — brand kit just won't persist across refreshes.
    }
  };

  const value = {
    user: { id: "guest", email: "", fullName: brandKit?.agentName || "" },
    brandKit,
    loading: false,
    saveBrandKit,
    changePassword: async () => {
      throw new Error("Password change isn't available in this preview.");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function api(path, options) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function LiveAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [brandKit, setBrandKit] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await api("/api/auth/me");
    setUser(data.user || null);
    setBrandKit(data.brandKit || null);
    return data;
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const signup = async (email, password, fullName) => {
    const data = await api("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password, fullName }) });
    await refresh();
    return data;
  };

  const login = async (email, password) => {
    const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await refresh();
    return data;
  };

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setBrandKit(null);
  };

  const saveBrandKit = async (kit) => {
    await api("/api/brand-kit", { method: "PUT", body: JSON.stringify(kit) });
    setBrandKit(kit);
  };

  const requestPasswordReset = async (email) => {
    return api("/api/auth/request-reset", { method: "POST", body: JSON.stringify({ email }) });
  };

  const resetPassword = async (email, token, newPassword) => {
    return api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ email, token, newPassword }) });
  };

  const changePassword = async (currentPassword, newPassword) => {
    return api("/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
  };

  return (
    <AuthContext.Provider value={{ user, brandKit, loading, signup, login, logout, saveBrandKit, requestPasswordReset, resetPassword, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const AuthProvider = STANDALONE ? StandaloneAuthProvider : LiveAuthProvider;

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

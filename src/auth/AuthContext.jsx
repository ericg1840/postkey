import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

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

export function AuthProvider({ children }) {
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

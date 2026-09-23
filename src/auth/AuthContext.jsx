import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getAnonId } from "../marketing/track.mjs";

const AuthContext = createContext(null);

export async function api(path, options) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  // A route worker/index.mjs doesn't know about falls through to the static
  // site handler, which (thanks to the SPA fallback) returns index.html with
  // a 200 — silently treating that as "success" with no data previously sent
  // the caller an empty object instead of a clear error, which crashed
  // further downstream wherever the response shape was assumed.
  if (!(res.headers.get("content-type") || "").includes("application/json")) {
    throw new Error(`${path} isn't wired up on the server yet.`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

// A hint, not a credential: whether this browser was signed in last time we
// checked. The session cookie itself is HttpOnly, so without this the app
// can't tell a returning agent from a first-time visitor until
// /api/auth/me answers — and made every visitor stare at a spinner for
// that round trip before the homepage appeared. Logged-out visitors (no
// hint) now get the homepage immediately; signed-in ones still wait, so
// they never see the marketing page flash up first.
const SIGNED_IN_HINT_KEY = "postkey_signed_in";

export function mightBeSignedIn() {
  try {
    return localStorage.getItem(SIGNED_IN_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function setSignedInHint(signedIn) {
  try {
    if (signedIn) localStorage.setItem(SIGNED_IN_HINT_KEY, "1");
    else localStorage.removeItem(SIGNED_IN_HINT_KEY);
  } catch {
    // Storage unavailable — visitors just get the spinner, as before.
  }
}

function LiveAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [brandKit, setBrandKit] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await api("/api/auth/me");
    setSignedInHint(!!data.user);
    setUser(data.user || null);
    setBrandKit(data.brandKit || null);
    return data;
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const signup = async (email, password, fullName) => {
    const data = await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, fullName, anonId: getAnonId() }),
    });
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
    setSignedInHint(false);
    setUser(null);
    setBrandKit(null);
  };

  // Signs out every device this account is logged in on, this one included.
  const logoutEverywhere = async () => {
    await api("/api/auth/logout-all", { method: "POST" });
    setSignedInHint(false);
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
    <AuthContext.Provider value={{ user, brandKit, loading, refresh, signup, login, logout, logoutEverywhere, saveBrandKit, requestPasswordReset, resetPassword, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const AuthProvider = LiveAuthProvider;

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

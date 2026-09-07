// Requires the "nodejs_compat" compatibility flag (set in wrangler.toml) —
// Cloudflare Workers only expose node:crypto's scrypt/hmac/hash primitives
// with that flag enabled.
import { scryptSync, randomBytes, timingSafeEqual, createHmac, createHash } from "node:crypto";

const COOKIE_NAME = "postkey_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(env) {
  const secret = env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return secret;
}

// scrypt's cost scales with input length, so an unbounded password is a
// cheap way to burn Worker CPU on an endpoint that takes anonymous POSTs.
// Well above any real passphrase, low enough to stay a fixed small cost.
export const MAX_PASSWORD_LENGTH = 200;

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

export function createSessionToken(userId, env) {
  const payload = base64url(JSON.stringify({ uid: userId, exp: Date.now() + SESSION_MAX_AGE * 1000 }));
  const sig = createHmac("sha256", getSecret(env)).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token, env) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", getSecret(env)).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.uid || !data.exp || Date.now() > data.exp) return null;
    return data.uid;
  } catch {
    return null;
  }
}

export function parseCookies(req) {
  const header = req.headers.get("cookie") || "";
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const raw = part.slice(idx + 1).trim();
    // An unrelated cookie on the same domain carrying a stray "%" (an
    // analytics or third-party cookie, say) makes decodeURIComponent throw
    // URIError — which, uncaught, would 500 *every* API call for that
    // browser, including /api/auth/me, until they cleared their cookies.
    let value;
    try {
      value = decodeURIComponent(raw);
    } catch {
      value = raw;
    }
    out[part.slice(0, idx).trim()] = value;
  }
  return out;
}

export function getUserIdFromRequest(req, env) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME], env);
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

const RESET_TOKEN_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
// Longer than a reset: a welcome email often gets opened days later, and an
// expired link there means a confused new user rather than a security win.
const VERIFY_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// The raw token goes in the emailed link; only its hash is stored, so a
// database read alone can never produce a usable link.
function createHashedToken(maxAgeMs) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + maxAgeMs);
  return { token, tokenHash, expires };
}

export function createResetToken() {
  return createHashedToken(RESET_TOKEN_MAX_AGE_MS);
}

export function createVerifyToken() {
  return createHashedToken(VERIFY_TOKEN_MAX_AGE_MS);
}

export function verifyHashedToken(token, storedHash, storedExpires) {
  if (!token || !storedHash || !storedExpires) return false;
  if (new Date(storedExpires).getTime() < Date.now()) return false;
  const candidate = createHash("sha256").update(token).digest();
  const expected = Buffer.from(storedHash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// Same check either way — kept under its original name for the reset flow.
export const verifyResetToken = verifyHashedToken;

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

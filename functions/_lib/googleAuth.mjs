import { randomBytes } from "node:crypto";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export const STATE_COOKIE_NAME = "postkey_oauth_state";

export function getGoogleCredentials(env) {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google sign-in is not configured");
  return { clientId, clientSecret };
}

export function redirectUri(origin) {
  return `${origin}/api/auth/google/callback`;
}

export function createState() {
  return randomBytes(24).toString("base64url");
}

// Short-lived and not marked with a Path scoping it to the callback route --
// this cookie only exists for the few seconds between leaving for Google and
// coming back.
export function stateCookie(state) {
  return `${STATE_COOKIE_NAME}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

export function clearStateCookie() {
  return `${STATE_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function buildAuthorizeUrl({ env, origin, state }) {
  const { clientId } = getGoogleCredentials(env);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

// Exchanges the authorization code for an access token, then calls Google's
// userinfo endpoint with it. We use the userinfo endpoint rather than
// decoding the id_token ourselves -- the token exchange already happened
// over a server-to-server HTTPS call authenticated with our client secret,
// so there's no separate JWT signature to verify.
export async function fetchGoogleProfile({ env, origin, code }) {
  const { clientId, clientSecret } = getGoogleCredentials(env);

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error("Failed to exchange Google authorization code");
  const tokens = await tokenRes.json();

  const profileRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) throw new Error("Failed to fetch Google profile");
  const profile = await profileRes.json();

  if (!profile.sub || !profile.email) throw new Error("Google profile is missing required fields");
  if (!profile.email_verified) throw new Error("Google account email is not verified");

  return { googleId: profile.sub, email: profile.email.toLowerCase(), fullName: profile.name || profile.email };
}

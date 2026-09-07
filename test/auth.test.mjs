import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  getUserIdFromRequest,
  sessionCookie,
  clearSessionCookie,
  createResetToken,
  verifyResetToken,
  createVerifyToken,
  verifyHashedToken,
  MAX_PASSWORD_LENGTH,
} from "../functions/_lib/auth.mjs";
import { escapeHtml } from "../functions/_lib/email.mjs";

const ENV = { SESSION_SECRET: "test-secret-value" };

// parseCookies/getUserIdFromRequest take a Request-like object; only the
// cookie header is ever read.
const reqWithCookie = (cookie) => new Request("https://example.com/", { headers: cookie ? { cookie } : {} });

describe("password hashing", () => {
  test("a hash verifies against its own password", () => {
    const stored = hashPassword("correct horse battery staple");
    assert.equal(verifyPassword("correct horse battery staple", stored), true);
  });

  test("a wrong password does not verify", () => {
    const stored = hashPassword("correct horse battery staple");
    assert.equal(verifyPassword("Correct horse battery staple", stored), false);
    assert.equal(verifyPassword("", stored), false);
  });

  test("the same password hashes differently every time (salted)", () => {
    assert.notEqual(hashPassword("same-password"), hashPassword("same-password"));
  });

  test("a malformed stored value is rejected rather than throwing", () => {
    for (const stored of ["", "no-colon", ":", "salt:", ":hash"]) {
      assert.equal(verifyPassword("anything", stored), false, `stored: ${JSON.stringify(stored)}`);
    }
  });

  test("a password of the maximum accepted length still round-trips", () => {
    const longest = "a".repeat(MAX_PASSWORD_LENGTH);
    assert.equal(verifyPassword(longest, hashPassword(longest)), true);
  });
});

describe("session tokens", () => {
  test("a freshly issued token resolves back to its user id", () => {
    assert.equal(verifySessionToken(createSessionToken(42, ENV), ENV), 42);
  });

  test("a token signed with a different secret is rejected", () => {
    const token = createSessionToken(42, ENV);
    assert.equal(verifySessionToken(token, { SESSION_SECRET: "other-secret" }), null);
  });

  test("tampering with the payload invalidates the signature", () => {
    const [payload, sig] = createSessionToken(42, ENV).split(".");
    // Re-encode the payload with a different uid, keeping the original sig.
    const forged = Buffer.from(JSON.stringify({ uid: 999, exp: Date.now() + 60_000 })).toString("base64url");
    assert.notEqual(forged, payload);
    assert.equal(verifySessionToken(`${forged}.${sig}`, ENV), null);
  });

  test("an expired token is rejected", () => {
    // Hand-build an already-expired token, signed correctly.
    const payload = Buffer.from(JSON.stringify({ uid: 7, exp: Date.now() - 1000 })).toString("base64url");
    const sig = createHmac("sha256", ENV.SESSION_SECRET).update(payload).digest("base64url");
    assert.equal(verifySessionToken(`${payload}.${sig}`, ENV), null);
  });

  test("structurally invalid tokens are rejected rather than throwing", () => {
    for (const token of ["", "no-dot", "a.b", "...", undefined, null]) {
      assert.equal(verifySessionToken(token, ENV), null, `token: ${JSON.stringify(token)}`);
    }
  });
});

describe("cookie parsing", () => {
  test("reads the session cookie out of a normal header", () => {
    const cookies = parseCookies(reqWithCookie("postkey_session=abc123; other=1"));
    assert.equal(cookies.postkey_session, "abc123");
    assert.equal(cookies.other, "1");
  });

  test("percent-encoded values are decoded", () => {
    assert.equal(parseCookies(reqWithCookie("a=hello%20world")).a, "hello world");
  });

  // Regression: an unrelated cookie carrying a stray "%" made
  // decodeURIComponent throw URIError, which turned every authenticated API
  // request for that browser into a 500 until they cleared their cookies.
  test("a malformed percent-escape does not throw, and the session still parses", () => {
    const cookies = parseCookies(reqWithCookie("junk=100%; postkey_session=still-here"));
    assert.equal(cookies.postkey_session, "still-here");
    assert.equal(cookies.junk, "100%");
  });

  test("a request with no cookie header yields no user", () => {
    assert.equal(getUserIdFromRequest(reqWithCookie(null), ENV), null);
  });

  test("a valid session cookie round-trips through getUserIdFromRequest", () => {
    const token = createSessionToken(123, ENV);
    const header = sessionCookie(token).split(";")[0];
    assert.equal(getUserIdFromRequest(reqWithCookie(header), ENV), 123);
  });

  test("session cookies are HttpOnly, Secure and SameSite-scoped", () => {
    for (const cookie of [sessionCookie("t"), clearSessionCookie()]) {
      assert.match(cookie, /HttpOnly/);
      assert.match(cookie, /Secure/);
      assert.match(cookie, /SameSite=Lax/);
      assert.match(cookie, /Path=\//);
      // No Domain attribute: the cookie should bind to whatever host served
      // the request, so a custom domain works without a code change.
      assert.doesNotMatch(cookie, /Domain=/i);
    }
    assert.match(clearSessionCookie(), /Max-Age=0/);
  });
});

describe("password reset tokens", () => {
  test("the raw token verifies against the stored hash", () => {
    const { token, tokenHash, expires } = createResetToken();
    assert.equal(verifyResetToken(token, tokenHash, expires), true);
  });

  test("only the hash is stored, never the token itself", () => {
    const { token, tokenHash } = createResetToken();
    assert.notEqual(token, tokenHash);
    assert.ok(!tokenHash.includes(token));
  });

  test("a different token does not verify", () => {
    const { tokenHash, expires } = createResetToken();
    const other = createResetToken();
    assert.equal(verifyResetToken(other.token, tokenHash, expires), false);
  });

  test("an expired token does not verify", () => {
    const { token, tokenHash } = createResetToken();
    assert.equal(verifyResetToken(token, tokenHash, new Date(Date.now() - 1000)), false);
  });

  test("missing pieces are rejected rather than throwing", () => {
    const { token, tokenHash, expires } = createResetToken();
    assert.equal(verifyResetToken(null, tokenHash, expires), false);
    assert.equal(verifyResetToken(token, null, expires), false);
    assert.equal(verifyResetToken(token, tokenHash, null), false);
  });
});

describe("email verification tokens", () => {
  test("a fresh token verifies against its stored hash", () => {
    const { token, tokenHash, expires } = createVerifyToken();
    assert.equal(verifyHashedToken(token, tokenHash, expires), true);
  });

  test("only the hash is stored, never the token", () => {
    const { token, tokenHash } = createVerifyToken();
    assert.notEqual(token, tokenHash);
    assert.ok(!tokenHash.includes(token));
  });

  test("someone else's token does not verify", () => {
    const mine = createVerifyToken();
    const theirs = createVerifyToken();
    assert.equal(verifyHashedToken(theirs.token, mine.tokenHash, mine.expires), false);
  });

  // Longer-lived than a reset on purpose: a welcome email often gets opened
  // days later, and an expired link there is a confused new user.
  test("lasts days rather than the reset token's hour", () => {
    const anHour = 60 * 60 * 1000;
    const remaining = createVerifyToken().expires.getTime() - Date.now();
    assert.ok(remaining > 24 * anHour, `expected more than a day, got ${remaining / anHour}h`);
  });

  test("an expired token does not verify", () => {
    const { token, tokenHash } = createVerifyToken();
    assert.equal(verifyHashedToken(token, tokenHash, new Date(Date.now() - 1000)), false);
  });

  test("a user with no token stored cannot be verified by a blank one", () => {
    assert.equal(verifyHashedToken("", null, null), false);
    assert.equal(verifyHashedToken(null, null, null), false);
  });
});

describe("escapeHtml", () => {
  // Regression: the signup name and the address in reset emails are dropped
  // into email HTML, so markup in either has to arrive inert.
  test("neutralises markup", () => {
    assert.equal(escapeHtml('<a href="x">click</a>'), "&lt;a href=&quot;x&quot;&gt;click&lt;/a&gt;");
    assert.equal(escapeHtml("Tom & Jerry"), "Tom &amp; Jerry");
    assert.equal(escapeHtml("it's"), "it&#39;s");
  });

  test("ampersands are escaped before the entities they introduce", () => {
    // A naive ordering would turn < into &lt; and then re-escape the &.
    assert.equal(escapeHtml("<"), "&lt;");
  });

  test("ordinary names pass through unchanged", () => {
    assert.equal(escapeHtml("Billy-Jo Salkowski"), "Billy-Jo Salkowski");
  });

  test("null and undefined become an empty string", () => {
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");
  });
});

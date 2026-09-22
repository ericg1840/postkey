import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createSessionToken, verifySession } from "../functions/_lib/auth.mjs";
import { loadSessionUser } from "../functions/_lib/session.mjs";
import { csvCell } from "../functions/api/admin/users-export.mjs";

const ENV = { SESSION_SECRET: "test-secret-value" };
const reqWith = (token) => new Request("https://example.com/", { headers: { cookie: `postkey_session=${token}` } });

function stubDb(row) {
  return { sql: () => Promise.resolve(row ? [row] : []) };
}
const activeUser = (overrides = {}) => ({ id: 7, account_status: "active", session_version: 0, ...overrides });

describe("session versions", () => {
  test("a token carries the version it was issued under", () => {
    assert.deepEqual(verifySession(createSessionToken(7, ENV, 3), ENV), { uid: 7, sv: 3 });
  });

  test("tokens issued before versions existed read as version 0", () => {
    // Hand-built in the old { uid, exp } shape, signed the same way.
    const payload = Buffer.from(JSON.stringify({ uid: 7, exp: Date.now() + 60_000 })).toString("base64url");
    const sig = createHmac("sha256", ENV.SESSION_SECRET).update(payload).digest("base64url");
    assert.deepEqual(verifySession(`${payload}.${sig}`, ENV), { uid: 7, sv: 0 });
  });
});

describe("loadSessionUser", () => {
  test("accepts a live session for an active account", async () => {
    const user = await loadSessionUser(reqWith(createSessionToken(7, ENV, 0)), ENV, stubDb(activeUser()));
    assert.equal(user?.id, 7);
  });

  test("rejects a session issued before a password change", async () => {
    const token = createSessionToken(7, ENV, 0);
    assert.equal(await loadSessionUser(reqWith(token), ENV, stubDb(activeUser({ session_version: 1 }))), null);
  });

  test("rejects a disabled account even with a current session", async () => {
    const token = createSessionToken(7, ENV, 0);
    assert.equal(await loadSessionUser(reqWith(token), ENV, stubDb(activeUser({ account_status: "disabled" }))), null);
  });

  test("rejects a deleted account", async () => {
    assert.equal(await loadSessionUser(reqWith(createSessionToken(7, ENV, 0)), ENV, stubDb(null)), null);
  });

  test("never queries without a valid cookie", async () => {
    let queried = false;
    const db = { sql: () => { queried = true; return Promise.resolve([]); } };
    assert.equal(await loadSessionUser(reqWith("garbage"), ENV, db), null);
    assert.equal(queried, false);
  });
});

describe("csvCell", () => {
  test("neutralises cells a spreadsheet would run as a formula", () => {
    assert.equal(csvCell("=HYPERLINK(\"x\")@a.com"), `"'=HYPERLINK(""x"")@a.com"`);
    assert.equal(csvCell("+1@a.com"), "'+1@a.com");
    assert.equal(csvCell("@a.com"), "'@a.com");
  });

  test("leaves ordinary values alone", () => {
    assert.equal(csvCell("agent@example.com"), "agent@example.com");
    assert.equal(csvCell("19.00"), "19.00");
    assert.equal(csvCell(null), "");
  });
});

import test from "node:test";
import assert from "node:assert/strict";
import { generateRecurringPosts } from "../functions/api/content/posts.mjs";

function stubDb() {
  const calls = [];
  return {
    calls,
    sql(strings, ...values) {
      calls.push({ text: strings.join("?"), values });
      return Promise.resolve([]);
    },
  };
}

test("generation is a single statement gated on the per-month ledger", async () => {
  const db = stubDb();
  await generateRecurringPosts(db, 7, "2026-02");
  assert.equal(db.calls.length, 1);
  const { text } = db.calls[0];
  // The ledger claim is what stops a dismissed suggestion coming back and
  // two concurrent views both inserting — losing it reintroduces both bugs.
  assert.match(text, /INSERT INTO content_recurring_generated/);
  assert.match(text, /ON CONFLICT DO NOTHING/);
  assert.match(text, /FROM claimed/);
});

test("scopes to the user's active topics and clamps to the month's length", async () => {
  const db = stubDb();
  await generateRecurringPosts(db, 7, "2026-02");
  const { text, values } = db.calls[0];
  assert.match(text, /user_id = \? AND active = true/);
  assert.ok(values.includes(7));
  assert.ok(values.includes("2026-02"));
  assert.ok(values.includes(28), "February 2026 has 28 days");
});

test("leap-year February clamps to the 29th", async () => {
  const db = stubDb();
  await generateRecurringPosts(db, 7, "2028-02");
  assert.ok(db.calls[0].values.includes(29));
});

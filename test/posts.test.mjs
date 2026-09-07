import test from "node:test";
import assert from "node:assert/strict";
import { MAX_POSTS_PER_USER, pruneOldPosts } from "../functions/api/posts.mjs";

// Stands in for the Neon tagged-template `sql`, capturing the query text and
// the bound parameters so the pruning query can be asserted on without a
// database.
function stubDb(rowsToReturn = []) {
  const calls = [];
  return {
    calls,
    sql(strings, ...values) {
      calls.push({ text: strings.join("?"), values });
      return Promise.resolve(rowsToReturn);
    },
  };
}

test("pruneOldPosts returns how many rows it removed", async () => {
  const db = stubDb([{ id: 4 }, { id: 5 }, { id: 6 }]);
  assert.equal(await pruneOldPosts(db, 7), 3);
});

test("pruneOldPosts reports zero when nothing was over the cap", async () => {
  const db = stubDb([]);
  assert.equal(await pruneOldPosts(db, 7), 0);
});

test("pruneOldPosts scopes the delete to one user and keeps the newest", async () => {
  const db = stubDb();
  await pruneOldPosts(db, 42);

  assert.equal(db.calls.length, 1);
  const { text, values } = db.calls[0];

  // Both the DELETE and the "which ones to keep" subquery must be scoped to
  // the user — a missing filter on either one would delete other people's
  // posts, which is the failure worth a test.
  assert.deepEqual(values, [42, 42, MAX_POSTS_PER_USER]);

  // Newest-first with a deterministic tiebreak: without the id, two posts
  // saved in the same second could order arbitrarily and the wrong one gets
  // dropped.
  assert.match(text, /ORDER BY created_at DESC, id DESC/);
  assert.match(text, /LIMIT/);
});

test("pruneOldPosts honours an explicit max", async () => {
  const db = stubDb();
  await pruneOldPosts(db, 42, 5);
  assert.deepEqual(db.calls[0].values, [42, 42, 5]);
});

test("the cap leaves room for months of normal use", () => {
  assert.ok(MAX_POSTS_PER_USER >= 100);
});

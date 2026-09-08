import test from "node:test";
import assert from "node:assert/strict";
import { mergeDrafts } from "../src/lib/drafts.mjs";

const draft = (id, updatedAt, label = id) => ({ id, updatedAt, label, form: {} });
const ids = (list) => list.map((d) => d.id).sort();

test("a draft only this device has is kept and pushed", () => {
  const { merged, toPush } = mergeDrafts([draft("a", "2026-09-01T00:00:00Z")], [], []);
  assert.deepEqual(ids(merged), ["a"]);
  assert.deepEqual(ids(toPush), ["a"]);
});

test("a draft only the server has is adopted, not pushed back", () => {
  const { merged, toPush } = mergeDrafts([], [draft("b", "2026-09-01T00:00:00Z")], []);
  assert.deepEqual(ids(merged), ["b"]);
  assert.deepEqual(toPush, []);
});

test("the newer copy wins in both directions", () => {
  const localNewer = mergeDrafts(
    [draft("a", "2026-09-02T00:00:00Z", "local")],
    [draft("a", "2026-09-01T00:00:00Z", "server")],
  );
  assert.equal(localNewer.merged[0].label, "local");
  assert.deepEqual(ids(localNewer.toPush), ["a"]);

  const serverNewer = mergeDrafts(
    [draft("a", "2026-09-01T00:00:00Z", "local")],
    [draft("a", "2026-09-03T00:00:00Z", "server")],
  );
  assert.equal(serverNewer.merged[0].label, "server");
  assert.deepEqual(serverNewer.toPush, []);
});

test("an identical timestamp is treated as the same version, not a conflict", () => {
  const { merged, toPush } = mergeDrafts(
    [draft("a", "2026-09-01T00:00:00Z", "local")],
    [draft("a", "2026-09-01T00:00:00Z", "server")],
  );
  assert.equal(merged.length, 1);
  // No pointless write back to the server.
  assert.deepEqual(toPush, []);
});

// The bug this design exists to prevent: delete on the phone, open the
// laptop, and the draft comes back because the laptop still has it locally
// and the server merely doesn't.
test("a draft deleted elsewhere stays deleted and is never resurrected", () => {
  const { merged, toPush } = mergeDrafts([draft("a", "2026-09-01T00:00:00Z")], [], ["a"]);
  assert.deepEqual(merged, []);
  assert.deepEqual(toPush, []);
});

test("a tombstoned draft the server still lists is dropped", () => {
  // Belt and braces: if a delete and an upsert race, the tombstone decides.
  const { merged } = mergeDrafts([], [draft("a", "2026-09-01T00:00:00Z")], ["a"]);
  assert.deepEqual(merged, []);
});

test("merges both sides at once without losing or duplicating anything", () => {
  const { merged, toPush } = mergeDrafts(
    [draft("shared", "2026-09-05T00:00:00Z", "local"), draft("local-only", "2026-09-01T00:00:00Z"), draft("gone", "2026-09-01T00:00:00Z")],
    [draft("shared", "2026-09-01T00:00:00Z", "server"), draft("remote-only", "2026-09-02T00:00:00Z")],
    ["gone"],
  );
  assert.deepEqual(ids(merged), ["local-only", "remote-only", "shared"]);
  assert.equal(merged.find((d) => d.id === "shared").label, "local");
  assert.deepEqual(ids(toPush), ["local-only", "shared"]);
});

test("a malformed record can't take the merge down with it", () => {
  const { merged } = mergeDrafts(
    [null, { label: "no id" }, draft("a", "2026-09-01T00:00:00Z")],
    [undefined, draft("b", "not a date")],
  );
  assert.deepEqual(ids(merged), ["a", "b"]);
});

test("a missing timestamp sorts oldest rather than winning", () => {
  const { merged } = mergeDrafts(
    [{ id: "a", label: "local" }],
    [draft("a", "2026-09-01T00:00:00Z", "server")],
  );
  assert.equal(merged[0].label, "server");
});

test("non-array inputs degrade to empty rather than throwing", () => {
  assert.deepEqual(mergeDrafts(null, null), { merged: [], toPush: [] });
  assert.deepEqual(mergeDrafts(undefined, undefined, undefined), { merged: [], toPush: [] });
});

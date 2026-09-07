import test from "node:test";
import assert from "node:assert/strict";
import { rotateBlocks, seedFromText } from "../src/lib/description.mjs";

test("seedFromText is stable for the same address", () => {
  assert.equal(seedFromText("419 Tall Oaks Dr"), seedFromText("419 Tall Oaks Dr"));
});

test("seedFromText ignores case and stray whitespace", () => {
  const base = seedFromText("419 Tall Oaks Dr");
  assert.equal(seedFromText("  419 tall oaks dr  "), base);
  assert.equal(seedFromText("419  Tall   Oaks Dr"), base);
});

test("seedFromText separates different addresses", () => {
  // The whole point of the change: two listings by one agent must not start
  // at the same index in every phrase pool.
  const seeds = ["419 Tall Oaks Dr", "12 Birch Ln", "8800 Cedar Ct", "5 Elm St"]
    .map(seedFromText);
  assert.equal(new Set(seeds).size, seeds.length);
});

test("seedFromText spreads addresses across a pool rather than clustering", () => {
  // A hash that collides mod a small pool size would leave every listing on
  // the same opener even though the raw seeds differ.
  const addresses = Array.from({ length: 200 }, (_, i) => `${i + 1} Maple Street`);
  const buckets = new Set(addresses.map((a) => seedFromText(a) % 8));
  assert.equal(buckets.size, 8);
});

test("seedFromText handles an empty address", () => {
  assert.equal(typeof seedFromText(""), "number");
  assert.equal(seedFromText(""), seedFromText(null));
});

test("rotateBlocks leaves short lists alone", () => {
  assert.deepEqual(rotateBlocks([], 3), []);
  assert.deepEqual(rotateBlocks(["a"], 3), ["a"]);
});

test("rotateBlocks rotates without dropping or duplicating a block", () => {
  const blocks = ["ext", "parking", "lot", "amenities", "updates"];
  for (let n = 0; n < 12; n += 1) {
    const rotated = rotateBlocks(blocks, n);
    assert.equal(rotated.length, blocks.length);
    assert.deepEqual([...rotated].sort(), [...blocks].sort());
  }
});

test("rotateBlocks gives every block a turn at the front", () => {
  const blocks = ["a", "b", "c", "d"];
  const firsts = new Set(Array.from({ length: 4 }, (_, n) => rotateBlocks(blocks, n)[0]));
  assert.equal(firsts.size, 4);
});

test("rotateBlocks copes with a huge seed and never returns undefined", () => {
  // Seeds are 32-bit hashes, not small counters — a naive slice(n) would
  // return an empty array for these.
  const blocks = ["a", "b", "c"];
  for (const n of [0, 4294967295, 2166136261, 999999999]) {
    const rotated = rotateBlocks(blocks, n);
    assert.equal(rotated.length, 3);
    assert.ok(rotated.every(Boolean));
  }
});

test("rotateBlocks does not mutate its input", () => {
  const blocks = ["a", "b", "c"];
  rotateBlocks(blocks, 2);
  assert.deepEqual(blocks, ["a", "b", "c"]);
});

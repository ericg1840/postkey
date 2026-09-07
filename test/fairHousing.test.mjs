import test from "node:test";
import assert from "node:assert/strict";
import { AVOID, REVIEW, FAIR_HOUSING_RULES, scanFairHousing } from "../src/lib/fairHousing.mjs";

const phrases = (text) => scanFairHousing(text).map((f) => f.phrase.toLowerCase());
const ids = (text) => scanFairHousing(text).map((f) => f.id);

test("clean copy produces no findings", () => {
  assert.deepEqual(scanFairHousing("Four bedrooms, a fenced yard, and a two-car garage."), []);
  assert.deepEqual(scanFairHousing(""), []);
  assert.deepEqual(scanFairHousing(null), []);
});

// The false positives that would make agents ignore the checker entirely.
// "Family room" is a room; "single-family" is a property class.
test("architectural uses of 'family' never flag", () => {
  const safe = [
    "Cozy family room with a gas fireplace.",
    "This single-family home sits on a corner lot.",
    "A multi-family property with three units.",
    "The family room opens to the kitchen.",
  ];
  for (const text of safe) assert.deepEqual(scanFairHousing(text), [], text);
});

test("flags describing who the home is for", () => {
  assert.deepEqual(ids("Perfect for families."), ["suited-for-families"]);
  assert.deepEqual(ids("A great family-friendly street."), ["family-friendly"]);
  assert.deepEqual(ids("Families will love the yard."), ["families-will"]);
  assert.deepEqual(ids("Ready to welcome its next family."), ["next-family"]);
  assert.deepEqual(ids("Great for kids."), ["kids"]);
});

test("flags exclusions outright", () => {
  assert.equal(scanFairHousing("No children.")[0].severity, AVOID);
  assert.equal(scanFairHousing("Adults only.")[0].severity, AVOID);
  assert.equal(scanFairHousing("No Section 8.")[0].severity, AVOID);
});

test("flags safety claims about an area but not a quiet street", () => {
  assert.equal(scanFairHousing("A safe neighborhood.")[0].severity, AVOID);
  assert.deepEqual(scanFairHousing("A quiet street with mature trees."), []);
});

test("school quality is review, not avoid", () => {
  const [flag] = scanFairHousing("Close to top-rated schools.");
  assert.equal(flag.severity, REVIEW);
  assert.equal(flag.category, "Steering");
});

test("walking distance is flagged, a stated distance is not", () => {
  assert.deepEqual(ids("Walking distance to downtown."), ["walking-distance"]);
  assert.deepEqual(scanFairHousing("Half a mile from downtown."), []);
});

test("findings come back in the order they appear in the text", () => {
  const text = "Perfect for families, within walking distance of top-rated schools.";
  const found = scanFairHousing(text);
  assert.deepEqual(found.map((f) => f.index), [...found.map((f) => f.index)].sort((a, b) => a - b));
  assert.deepEqual(ids(text), ["suited-for-families", "walking-distance", "school-quality"]);
});

test("every match reports the text that actually triggered it", () => {
  const text = "Perfect for families and walking distance to shops.";
  for (const flag of scanFairHousing(text)) {
    assert.equal(text.slice(flag.index, flag.index + flag.phrase.length), flag.phrase);
  }
});

test("repeated scans of the same text give the same result", () => {
  // A shared /g regex keeps lastIndex between calls; reusing the literals
  // rather than cloning them would make the second scan miss matches.
  const text = "Perfect for families. No children. Safe neighborhood.";
  assert.deepEqual(phrases(text), phrases(text));
  assert.equal(scanFairHousing(text).length, 3);
});

test("the same phrase twice is reported twice, at both positions", () => {
  const found = scanFairHousing("Perfect for families. Also perfect for families.");
  assert.equal(found.length, 2);
  assert.notEqual(found[0].index, found[1].index);
});

test("every rule is well formed and carries advice", () => {
  const seen = new Set();
  for (const rule of FAIR_HOUSING_RULES) {
    assert.ok(!seen.has(rule.id), `duplicate rule id ${rule.id}`);
    seen.add(rule.id);
    assert.ok(rule.pattern.flags.includes("g"), `${rule.id} needs the g flag`);
    assert.ok(rule.pattern.flags.includes("i"), `${rule.id} needs the i flag`);
    assert.ok(rule.note && rule.suggestion, `${rule.id} needs a note and a suggestion`);
    assert.ok([AVOID, REVIEW].includes(rule.severity), `${rule.id} has an unknown severity`);
  }
});

test("matching is case insensitive", () => {
  assert.equal(scanFairHousing("PERFECT FOR FAMILIES").length, 1);
  assert.equal(scanFairHousing("perfect for families").length, 1);
});

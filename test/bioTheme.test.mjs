import { test } from "node:test";
import assert from "node:assert/strict";
import { readableAccent, headerOverlay, chipTint, contrastRatio, DEFAULT_ACCENT } from "../src/lib/bioTheme.mjs";

test("the default accent is used as-is", () => {
  assert.equal(readableAccent("#003DA5"), "#003DA5");
});

test("invalid or missing accents fall back to the default", () => {
  assert.equal(readableAccent(""), DEFAULT_ACCENT);
  assert.equal(readableAccent("red"), DEFAULT_ACCENT);
  assert.equal(readableAccent("url(x)"), DEFAULT_ACCENT);
});

// White text on the accent, and the accent as text on white cards.
test("light accents are darkened until white text on them is readable", () => {
  for (const light of ["#FFD400", "#9CC3E6", "#FFFFFF", "#F4F2ED"]) {
    assert.ok(contrastRatio(readableAccent(light), "#FFFFFF") >= 4.5, light);
  }
});

test("the chip tint for the default blue matches the mockup", () => {
  assert.equal(chipTint("#003DA5"), "#E6ECF6");
});

test("the header overlay is a deep shade of the accent", () => {
  assert.equal(headerOverlay("#003DA5"), "rgba(0, 31, 83, 0.78)");
  assert.match(headerOverlay("#DC1C2E"), /^rgba\(110, 14, 23, 0\.78\)$/);
});

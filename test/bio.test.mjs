import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanColor } from "../functions/api/bio.mjs";

test("hex colors are kept", () => {
  assert.equal(cleanColor("#003DA5", "#000000"), "#003DA5");
  assert.equal(cleanColor("#fff", "#000000"), "#fff");
  assert.equal(cleanColor("  #abcdef ", "#000000"), "#abcdef");
});

test("anything else falls back to the default", () => {
  for (const bad of ["red", "#12", "#1234567", "rgb(0,0,0)", "#003DA5; background:url(x)", "", null, undefined, 42, "x".repeat(10_000)]) {
    assert.equal(cleanColor(bad, "#1B2430"), "#1B2430", String(bad).slice(0, 40));
  }
});

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { parsePlannedListing, exampleFieldsInUse } from "../src/lib/listingPost.mjs";

describe("parsePlannedListing", () => {
  test("address first, type after a dash", () => {
    assert.deepEqual(parsePlannedListing("419 Tall Oaks Dr — Just Listed"), { address: "419 Tall Oaks Dr", templateKey: "just_listed" });
    assert.deepEqual(parsePlannedListing("12 Main St - Sold"), { address: "12 Main St", templateKey: "sold" });
  });

  test("type first", () => {
    assert.deepEqual(parsePlannedListing("Open House: 12 Main St"), { address: "12 Main St", templateKey: "open_house" });
    assert.deepEqual(parsePlannedListing("Just Listed — 419 Tall Oaks Dr"), { address: "419 Tall Oaks Dr", templateKey: "just_listed" });
  });

  test("the planner's auto-fill follow-ups", () => {
    const parsed = parsePlannedListing("Follow-up: 56 Founders Way — open house, price or status update");
    assert.equal(parsed.address, "56 Founders Way");
    assert.equal(parsed.templateKey, "open_house");
  });

  test("specific phrases win over a bare 'sold'", () => {
    assert.equal(parsePlannedListing("Under contract — sold in 3 days?").templateKey, "under_contract");
    assert.equal(parsePlannedListing("New price on 8 Elm St").templateKey, "price_improvement");
  });

  test("a plain address keeps whatever post type is already picked", () => {
    assert.deepEqual(parsePlannedListing("419 Tall Oaks Dr"), { address: "419 Tall Oaks Dr", templateKey: null });
  });

  test("a hyphenated address isn't split", () => {
    assert.equal(parsePlannedListing("12-14 Main St — Coming Soon").address, "12-14 Main St");
  });
});

describe("exampleFieldsInUse", () => {
  const defaults = { address: "419 Tall Oaks Dr", price: "$2,295,000", beds: "4" };

  test("lists the fields still holding the example", () => {
    assert.deepEqual(exampleFieldsInUse({ address: "419 Tall Oaks Dr", price: "$500,000" }, defaults, ["address", "price"]), ["address"]);
  });

  test("an emptied field isn't an example", () => {
    assert.deepEqual(exampleFieldsInUse({ address: "", price: "" }, defaults, ["address", "price"]), []);
  });
});

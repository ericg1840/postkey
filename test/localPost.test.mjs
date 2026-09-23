import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { ellipsizeLines, postTitle, postFileBase, clientTypeLabel } from "../src/lib/localPost.mjs";

describe("ellipsizeLines", () => {
  test("leaves text that fits alone", () => {
    assert.deepEqual(ellipsizeLines(["a", "b"], 3), ["a", "b"]);
  });

  test("cuts to the limit and marks the cut, dropping trailing punctuation", () => {
    assert.deepEqual(ellipsizeLines(["one two", "three four,", "five"], 2), ["one two", "three four…"]);
  });
});

describe("postTitle", () => {
  const leftover = { subject: "The Kettle & Vine" };

  test("card and list styles use the subject", () => {
    assert.equal(postTitle({ ...leftover, style: "card" }), "The Kettle & Vine");
    assert.equal(postTitle({ subject: "Open House Tips", style: "tips" }), "Open House Tips");
  });

  test("other styles don't inherit a leftover subject", () => {
    assert.equal(postTitle({ ...leftover, style: "testimonial", clientName: "Mariella Torres" }), "Mariella Torres review");
    assert.equal(postTitle({ ...leftover, style: "testimonial", clientName: "" }), "Client testimonial");
    assert.equal(postTitle({ ...leftover, style: "poll", pollHeadline: "", optionA: "Open", optionB: "Defined" }), "Open vs Defined");
    assert.equal(postTitle({ ...leftover, style: "quote", quoteEyebrow: "", quoteText: "A fresh coat of paint is still the best update" }), "A fresh coat of paint is");
  });
});

describe("postFileBase", () => {
  test("slugs title and type", () => {
    assert.equal(postFileBase("The Kettle & Vine", "Local Spotlight"), "the-kettle-vine-local-spotlight");
  });

  test("falls back when the title is empty or all symbols", () => {
    assert.equal(postFileBase("", "Market Stats"), "local-post-market-stats");
    assert.equal(postFileBase("!!!", "Quote Card"), "local-post-quote-card");
  });
});

describe("clientTypeLabel", () => {
  test("singular for one client", () => {
    assert.equal(clientTypeLabel("Buyer", "Mariella Torres"), "BUYER");
    assert.equal(clientTypeLabel("Seller", "Jon"), "SELLER");
  });

  test("plural for a couple or family", () => {
    assert.equal(clientTypeLabel("Buyer", "Mariella & Jon"), "BUYERS");
    assert.equal(clientTypeLabel("Seller", "Sam and Alex Lee"), "SELLERS");
    assert.equal(clientTypeLabel("Buyer", "The Torres Family"), "BUYERS");
  });

  test("a name merely containing 'and' stays singular", () => {
    assert.equal(clientTypeLabel("Buyer", "Andrea Sandoval"), "BUYER");
  });
});

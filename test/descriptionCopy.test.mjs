import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULTS, TONES, buildDescription, buildFacebookPost,
  tidy, stripLeadingArticle, endSentence, addressNamesPlace,
} from "../src/lib/descriptionCopy.mjs";
import { scanFairHousing } from "../src/lib/fairHousing.mjs";

// Every tone at enough variants to reach every entry in every pool (the
// largest has nine), in both formats.
function everyOutput(form) {
  const out = [];
  for (const tone of TONES) {
    for (let v = 0; v < 18; v += 1) {
      out.push(buildDescription({ ...form, tone }, v));
      out.push(buildFacebookPost({ ...form, tone }, v));
    }
  }
  return out;
}

const PUNCTUATED = {
  ...DEFAULTS,
  highlight: "A huge chef's kitchen.",
  primarySuite: "a walk-in closet.",
  parking: "Two-car garage.",
  amenities: "Pool.",
  updates: "New roof!",
  conditionNote: "Sold as-is.",
  nearby: "local parks.",
  schoolDistrict: "Central Bucks School District.",
  features: "Hardwood floors.\nFinished basement;",
  exteriorFeatures: "Deck,\nFenced yard.",
};

test("tidy strips trailing punctuation and whitespace only", () => {
  assert.equal(tidy("Two-car garage. "), "Two-car garage");
  assert.equal(tidy("New roof!!"), "New roof");
  assert.equal(tidy("Deck,"), "Deck");
  assert.equal(tidy("St. Albans Rd"), "St. Albans Rd");
  assert.equal(tidy(undefined), "");
});

test("stripLeadingArticle drops a/an/the but not words that start with them", () => {
  assert.equal(stripLeadingArticle("A huge kitchen"), "huge kitchen");
  assert.equal(stripLeadingArticle("an open floor plan"), "open floor plan");
  assert.equal(stripLeadingArticle("The view"), "view");
  assert.equal(stripLeadingArticle("Theater room"), "Theater room");
  assert.equal(stripLeadingArticle("A-frame loft"), "A-frame loft");
});

test("endSentence adds a full stop only when one is missing", () => {
  assert.equal(endSentence("Call me today"), "Call me today.");
  assert.equal(endSentence("Call me today!"), "Call me today!");
  assert.equal(endSentence("Ready to see it?"), "Ready to see it?");
  assert.equal(endSentence('Call "Jane."'), 'Call "Jane."');
  assert.equal(endSentence("  "), "");
});

test("addressNamesPlace matches whole words, case-insensitively", () => {
  assert.ok(addressNamesPlace("419 Tall Oaks Dr, Warminster", "Warminster"));
  assert.ok(addressNamesPlace("419 Tall Oaks Dr, warminster PA", "Warminster"));
  assert.ok(!addressNamesPlace("12 Ashbourne Rd", "Ash"));
  assert.ok(!addressNamesPlace("419 Tall Oaks Dr", "Warminster"));
  assert.ok(!addressNamesPlace("419 Tall Oaks Dr", ""));
  // Regex characters in a place name are literal.
  assert.ok(addressNamesPlace("1 Main St, St. Davids", "St. Davids"));
});

test("typed punctuation never doubles up with the template's", () => {
  for (const text of everyOutput(PUNCTUATED)) {
    assert.doesNotMatch(text, /\.\.|[.!?;,:][.,]|\.\s+—/, text);
  }
});

test("a highlight typed with an article doesn't get a second one", () => {
  for (const text of everyOutput(PUNCTUATED)) {
    assert.doesNotMatch(text, /\b(?:the|a) a huge/i, text);
  }
});

test("highlight templates never put 'a' in front of a plural", () => {
  const form = { ...DEFAULTS, highlight: "Hardwood floors throughout" };
  for (const text of everyOutput(form)) {
    assert.doesNotMatch(text, /\ba hardwood floors/i, text);
  }
});

test("a custom call to action ends with punctuation", () => {
  const form = { ...DEFAULTS, cta: "Call me today" };
  for (const tone of TONES) {
    assert.match(buildDescription({ ...form, tone }, 0), /Call me today\.$/);
    assert.match(buildFacebookPost({ ...form, tone }, 0), /Call me today\.\n/);
  }
});

test("the town isn't repeated when the address already names it", () => {
  // DEFAULTS' address ends in its own neighborhood, Warminster.
  for (const tone of TONES) {
    for (let v = 0; v < 18; v += 1) {
      const mls = buildDescription({ ...DEFAULTS, tone }, v);
      const [firstSentence] = mls.split(/(?<=[.!])\s/);
      if (firstSentence.includes(DEFAULTS.address)) {
        assert.equal(firstSentence.match(/Warminster/g).length, 1, firstSentence);
      }
      const intro = buildFacebookPost({ ...DEFAULTS, tone }, v).split("\n")[2];
      assert.ok((intro.match(/Warminster/g) || []).length <= 1, intro);
    }
  }
});

test("the town still appears when the address doesn't name it", () => {
  const form = { ...DEFAULTS, address: "419 Tall Oaks Dr" };
  // warm[0]: "Welcome home to <address>, a … tucked into <place>."
  assert.match(buildDescription({ ...form, tone: "warm" }, 0), /tucked into Warminster/);
});

test("no address produces no copy rather than a sentence with a hole in it", () => {
  for (const address of ["", "   "]) {
    for (const tone of TONES) {
      assert.equal(buildDescription({ ...DEFAULTS, address, tone }, 0), "");
      assert.equal(buildFacebookPost({ ...DEFAULTS, address, tone }, 0), "");
    }
  }
});

test("Facebook bullets have no markdown asterisk", () => {
  for (const tone of TONES) {
    assert.doesNotMatch(buildFacebookPost({ ...DEFAULTS, tone }, 0), /^\* /m);
  }
});

test("the Facebook intro doesn't repeat the header's welcome", () => {
  for (const tone of TONES) {
    for (let v = 0; v < 4; v += 1) {
      const lines = buildFacebookPost({ ...DEFAULTS, tone }, v).split("\n");
      assert.doesNotMatch(lines[2], /^Welcome/, lines[2]);
    }
  }
});

test("the default example passes the fair-housing check", () => {
  // It's the first thing a new user sees; it shouldn't open with a warning
  // about wording they didn't write.
  for (const text of everyOutput(DEFAULTS)) {
    assert.deepEqual(scanFairHousing(text), [], text);
  }
});

test("a list item containing 'and' isn't chained with another 'and'", () => {
  const form = { ...DEFAULTS, features: "Finished basement\nCabinet space and a pantry" };
  for (const text of everyOutput(form).filter((t) => !t.includes("🏡"))) {
    assert.doesNotMatch(text, /finished basement and cabinet space and/i, text);
  }
});

test("output is deterministic for a given form and variant", () => {
  assert.equal(buildDescription(DEFAULTS, 5), buildDescription(DEFAULTS, 5));
  assert.equal(buildFacebookPost(DEFAULTS, 5), buildFacebookPost(DEFAULTS, 5));
});

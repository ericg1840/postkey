import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { linkHref, linkProps } from "../src/lib/bioLinks.mjs";

describe("linkHref", () => {
  test("bare domains get https://", () => {
    assert.equal(linkHref({ url: "janedoe.com" }), "https://janedoe.com");
    assert.equal(linkHref({ url: "  instagram.com/jane " }), "https://instagram.com/jane");
  });

  test("full http(s) URLs pass through", () => {
    assert.equal(linkHref({ url: "https://zillow.com/x" }), "https://zillow.com/x");
    assert.equal(linkHref({ url: "HTTP://old.example" }), "HTTP://old.example");
  });

  // The bug: "Call me" pointed at https://tel:5551234567.
  test("phone, text and email links keep their scheme", () => {
    assert.equal(linkHref({ url: "tel:5551234567" }), "tel:5551234567");
    assert.equal(linkHref({ url: "sms:+15551234567" }), "sms:+15551234567");
    assert.equal(linkHref({ url: "mailto:jane@example.com" }), "mailto:jane@example.com");
  });

  test("script schemes are neutralised, not passed through", () => {
    assert.equal(linkHref({ url: "javascript:alert(1)" }), "https://javascript:alert(1)");
    assert.equal(linkHref({ url: "data:text/html,<b>x</b>" }), "https://data:text/html,<b>x</b>");
  });

  test("an empty link goes nowhere", () => {
    assert.equal(linkHref({ url: "" }), "#");
    assert.equal(linkHref({}), "#");
  });
});

describe("linkProps", () => {
  test("web links open in a new tab", () => {
    assert.deepEqual(linkProps({ url: "janedoe.com" }), { href: "https://janedoe.com", target: "_blank", rel: "noreferrer" });
  });

  test("phone and email links open in place", () => {
    assert.deepEqual(linkProps({ url: "tel:555" }), { href: "tel:555" });
    assert.deepEqual(linkProps({ url: "mailto:a@b.c" }), { href: "mailto:a@b.c" });
  });
});

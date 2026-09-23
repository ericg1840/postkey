// Pure helpers for the Local tool (src/CommunityTool.jsx), kept out of the
// component so they can be tested without a DOM.

// Display names for the Local tool's styles. Posts saved to the library
// before it stored these names carry the bare key ("card", "poll") as their
// category, so the Post Library maps those through this too.
export const LOCAL_STYLE_LABELS = {
  card: "Local & Trending",
  testimonial: "Client Testimonial",
  tips: "Tip List",
  stats: "Market Stats",
  checklist: "Checklist",
  quote: "Quote Card",
  poll: "This or That",
};

// Keeps at most `max` wrapped lines, ending the last kept one with "…" when
// anything was cut, so a too-long message reads as shortened, not broken.
export function ellipsizeLines(lines, max) {
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  kept[max - 1] = kept[max - 1].replace(/[.,;:\s]*$/, "") + "…";
  return kept;
}

// What a post is about, in words — for the downloaded file's name, the Post
// Library entry and a saved draft's label. Only some styles use the subject
// field; the rest would otherwise all be named after whatever was left in it
// ("The Kettle & Vine" on a testimonial).
export function postTitle(form) {
  switch (form.style) {
    case "testimonial": return form.clientName ? `${form.clientName} review` : "Client testimonial";
    case "quote": return form.quoteEyebrow || (form.quoteText || "").trim().split(/\s+/).slice(0, 6).join(" ");
    case "poll": return form.pollHeadline || [form.optionA, form.optionB].filter(Boolean).join(" vs ");
    default: return form.subject || "";
  }
}

// "local-favorite-spot-local-spotlight" — title then type, filename-safe.
export function postFileBase(title, typeLabel) {
  const slug = (text) => (text || "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return [slug(title) || "local-post", slug(typeLabel)].filter(Boolean).join("-");
}

// The line under a testimonial's signature: "BUYER" for one client, "BUYERS"
// when the name is a couple or family ("Mariella & Jon", "The Torres Family").
export function clientTypeLabel(clientType, clientName) {
  const plural = /\s(&|and|\+)\s|\bfamily\b/i.test(clientName || "");
  const word = clientType === "Seller" ? "SELLER" : "BUYER";
  return plural ? `${word}S` : word;
}

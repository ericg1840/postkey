// Pure helpers for the Listings tool (src/ListingTool.jsx), kept out of the
// component so they can be tested without a DOM.

// Post-type phrases a planner title might carry, most specific first ("new
// price" before a bare "sold", "under contract" before anything else).
const TYPE_PATTERNS = [
  ["under_contract", /\bunder contract\b|\bpending\b/i],
  ["coming_soon", /\bcoming soon\b/i],
  ["open_house", /\bopen house\b/i],
  ["price_improvement", /\bnew price\b|\bprice (?:drop|improvement|change|reduction|reduced|cut)\b|\breduced\b/i],
  ["sold", /\bsold\b|\bclosed\b/i],
  ["just_listed", /\bjust listed\b|\bnew listing\b|\bfor sale\b/i],
];

// A planned post's title, as handed over by the Planner's "Create this
// post" — "419 Tall Oaks Dr — Just Listed", "Open House: 12 Main St",
// "Follow-up: 56 Founders Way — open house, price or status update" — split
// into the address and, when the title names one, the post type. The whole
// title used to land in the address field, status and all.
export function parsePlannedListing(title) {
  const text = String(title || "").replace(/^\s*follow-up:\s*/i, "").trim();
  const templateKey = TYPE_PATTERNS.find(([, re]) => re.test(text))?.[0] || null;
  const parts = text.split(/\s+[—–|-]\s+|:\s+/).map((p) => p.trim()).filter(Boolean);
  // The address is the part that isn't just a post-type phrase — usually
  // the first, but "Just Listed — 419 Tall Oaks Dr" puts it second.
  const isTypeOnly = (p) => TYPE_PATTERNS.some(([, re]) => re.test(p)) && !/\d/.test(p);
  const address = parts.find((p) => !isTypeOnly(p)) || parts[0] || "";
  return { address, templateKey };
}

// Which of the example values the form starts with are still in place —
// so the agent is warned before posting someone else's address and price.
export function exampleFieldsInUse(form, defaults, fields) {
  return fields.filter((key) => form[key] && form[key] === defaults[key]);
}

// A wording check for listing copy, based on the categories the Fair Housing
// Act protects (race, color, national origin, religion, sex, familial status,
// disability) plus the two habits that most often draw complaints in practice:
// describing the people a home suits rather than the home, and characterizing
// a neighborhood's safety or schools.
//
// This is a drafting aid, not a compliance check. It matches phrases, so it
// cannot see intent, it does not know state and local protected classes (many
// add source of income, age, sexual orientation, veteran status), and a clean
// result is not an assurance that anything is lawful. The UI has to say so.
//
// Two design rules keep it useful rather than noisy:
//
//   1. Patterns match the risky *construction*, not the risky word. "Family
//      room", "single-family" and "multi-family" are architectural terms and
//      must never flag; "perfect for families" must. A checker that cries wolf
//      on every listing gets ignored, and then it protects nobody.
//   2. Severity is honest. "Avoid" is for language that names or excludes a
//      protected class. "Review" is for phrasing that is legitimate in some
//      contexts and risky in others, where the agent is better placed to judge.

export const AVOID = "avoid";
export const REVIEW = "review";

export const FAIR_HOUSING_RULES = [
  // ---- Familial status -------------------------------------------------
  {
    id: "suited-for-families",
    severity: AVOID,
    category: "Familial status",
    pattern: /\b(?:perfect|ideal|great|excellent|wonderful|well[- ]suited|suited|designed|built|made)\s+for\s+(?:a\s+|the\s+|growing\s+|young\s+)*famil(?:y|ies)\b/gi,
    note: "Describes who the home is for rather than what it is.",
    suggestion: "Describe the feature instead — \"four bedrooms and a fenced yard\".",
  },
  {
    id: "family-friendly",
    severity: AVOID,
    category: "Familial status",
    pattern: /\bfamily[- ]friendly\b/gi,
    note: "Signals a preference about household composition.",
    suggestion: "Name the actual amenity — \"quiet street\", \"large yard\".",
  },
  {
    id: "families-will",
    severity: AVOID,
    category: "Familial status",
    pattern: /\bfamilies\s+(?:will|would|can|should)\b/gi,
    note: "Addresses one type of buyer.",
    suggestion: "Address the home, not the buyer.",
  },
  {
    id: "next-family",
    severity: AVOID,
    category: "Familial status",
    pattern: /\b(?:next|new|lucky|right)\s+famil(?:y|ies)\b/gi,
    note: "Implies the home is meant for a family.",
    suggestion: "\"Next owner\" carries the same warmth without the preference.",
  },
  {
    id: "kids",
    severity: AVOID,
    category: "Familial status",
    pattern: /\b(?:great|perfect|ideal|room|space)\s+for\s+(?:the\s+)?(?:kids|children)\b|\bkid[- ]friendly\b|\bchild[- ]friendly\b/gi,
    note: "References children as the intended occupants.",
    suggestion: "Describe the room or yard itself.",
  },
  {
    id: "no-children",
    severity: AVOID,
    category: "Familial status",
    pattern: /\bno\s+(?:kids|children)\b|\bchildless\b|\badults?\s+only\b|\badult\s+(?:community|living|building)\b/gi,
    note: "Excluding children is prohibited outside qualified senior housing.",
    suggestion: "Remove it. If this is registered 55+ housing, say that explicitly instead.",
  },
  {
    id: "household-type",
    severity: AVOID,
    category: "Familial status",
    pattern: /\bempty[- ]nesters?\b|\bbachelor\s+pad\b|\bsingles?\s+(?:only|welcome)\b|\bmature\s+(?:buyers?|couples?|adults?)\b|\bnewlyweds?\b/gi,
    note: "Names a household type as the intended buyer.",
    suggestion: "Describe the size and layout and let buyers decide.",
  },

  // ---- Disability ------------------------------------------------------
  {
    id: "walking-distance",
    severity: REVIEW,
    category: "Disability",
    pattern: /\bwalking\s+distance\b|\bwalk\s+to\s+(?:the\s+)?(?:shops|town|school|train|station)\b/gi,
    note: "Assumes a buyer who can walk; long discouraged in listing copy.",
    suggestion: "Give the distance — \"half a mile from downtown\".",
  },
  {
    id: "able-bodied",
    severity: AVOID,
    category: "Disability",
    pattern: /\bable[- ]bodied\b|\bmust\s+be\s+able\s+to\b|\bnot\s+(?:suitable|suited)\s+for\s+(?:the\s+)?(?:disabled|handicapped|elderly)\b/gi,
    note: "Screens buyers by physical ability.",
    suggestion: "State the physical fact — \"second-floor unit, no elevator\".",
  },
  {
    id: "handicapped",
    severity: REVIEW,
    category: "Disability",
    pattern: /\bhandicapped?\b|\bcrippled\b/gi,
    note: "Outdated term.",
    suggestion: "\"Accessible\" — and describe the specific feature.",
  },
  {
    id: "active-healthy",
    severity: REVIEW,
    category: "Disability",
    pattern: /\b(?:perfect|great|ideal)\s+for\s+(?:the\s+)?(?:active|healthy|fit)\b/gi,
    note: "Describes the buyer's physical condition.",
    suggestion: "Name the trail, gym or park instead.",
  },

  // ---- Religion --------------------------------------------------------
  {
    id: "religious-landmark",
    severity: REVIEW,
    category: "Religion",
    pattern: /\b(?:near|close\s+to|steps\s+from|walk\s+to|next\s+to)\s+(?:the\s+|a\s+|St\.?\s+\w+\s+)?(?:church|synagogue|mosque|temple|parish|chapel)\b/gi,
    note: "Using a house of worship as a selling point can signal a preferred religion.",
    suggestion: "If it's a landmark, name a neutral one; otherwise drop it.",
  },
  {
    id: "religious-group",
    severity: AVOID,
    category: "Religion",
    pattern: /\b(?:christian|catholic|jewish|muslim|hindu|buddhist|mormon)\s+(?:community|neighborhood|area|family|families|buyers?)\b/gi,
    note: "Names a religious group.",
    suggestion: "Remove it.",
  },

  // ---- Race, color, national origin -----------------------------------
  {
    id: "ethnic-neighborhood",
    severity: AVOID,
    category: "Race or national origin",
    pattern: /\b(?:white|black|hispanic|latino|asian|ethnic|immigrant|american)\s+(?:neighborhood|community|area|block|families|buyers?)\b/gi,
    note: "Characterizes an area by the people who live there.",
    suggestion: "Remove it.",
  },
  {
    id: "coded-neighborhood",
    severity: REVIEW,
    category: "Race or national origin",
    pattern: /\b(?:exclusive|integrated|traditional|desirable)\s+(?:neighborhood|community|area|enclave)\b/gi,
    note: "Long treated as coded language about who lives in an area.",
    suggestion: "Say what's actually there — parks, shops, architecture.",
  },

  // ---- Steering: safety and schools ------------------------------------
  {
    id: "safe-area",
    severity: AVOID,
    category: "Steering",
    pattern: /\b(?:safe|safer|safest|crime[- ]free|low[- ]crime|quiet\s+and\s+safe)\s+(?:neighborhood|community|area|street|part\s+of\s+town)\b|\bsafe\s+place\s+to\s+raise\b/gi,
    note: "Safety claims about an area are a classic steering complaint, and you can't verify them.",
    suggestion: "Remove it. Buyers can research crime data themselves.",
  },
  {
    id: "school-quality",
    severity: REVIEW,
    category: "Steering",
    pattern: /\b(?:top[- ]rated|best|great|excellent|good|award[- ]winning|highly\s+rated)\s+schools?\b/gi,
    note: "School quality is often read as a proxy for the demographics of an area.",
    suggestion: "Name the district factually and let buyers look up ratings.",
  },

  // ---- Income and occupation -------------------------------------------
  {
    id: "income-source",
    severity: AVOID,
    category: "Source of income",
    pattern: /\bno\s+section\s*8\b|\bno\s+vouchers?\b|\bsection\s*8\s+not\s+accepted\b/gi,
    note: "Prohibited in many states and cities, and a common complaint everywhere.",
    suggestion: "Remove it.",
  },
  {
    id: "occupation",
    severity: REVIEW,
    category: "Source of income",
    pattern: /\b(?:perfect|ideal|great)\s+for\s+(?:young\s+)?(?:professionals?|executives?|students?|retirees?)\b/gi,
    note: "Describes the buyer's occupation or life stage.",
    suggestion: "Describe the commute, the layout, or the price point.",
  },
];

// Returns one entry per match, in the order they appear in the text, so the
// UI can list them the way an agent reads the description.
export function scanFairHousing(text) {
  const source = String(text || "");
  const findings = [];

  for (const rule of FAIR_HOUSING_RULES) {
    // A fresh regex per scan: the shared /g literal carries lastIndex between
    // calls, which would make repeated scans of the same text skip matches.
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match = pattern.exec(source);
    while (match !== null) {
      findings.push({
        id: rule.id,
        severity: rule.severity,
        category: rule.category,
        note: rule.note,
        suggestion: rule.suggestion,
        phrase: match[0],
        index: match.index,
      });
      // Zero-length matches would spin forever; no current rule can produce
      // one, but the guard costs nothing and outlives the current rule set.
      if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
      match = pattern.exec(source);
    }
  }

  findings.sort((a, b) => a.index - b.index || a.id.localeCompare(b.id));
  return findings;
}

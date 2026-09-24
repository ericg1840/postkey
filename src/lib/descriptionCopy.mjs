// The listing-description generator: the phrase pools and the two builders
// (formal MLS paragraph, Facebook post). Kept out of DescriptionTool.jsx so
// the node test runner can import it — the component file is JSX.
import { rotateBlocks } from "./description.mjs";

export const TONES = ["warm", "luxury", "modern", "straightforward"];

// Property type just changes the noun used throughout the copy — kept
// separate from "tone" so any type can be written in any voice.
export const PROPERTY_NOUNS = {
  home: "home",
  condo: "condo",
  townhome: "townhome",
  multi: "multi-family property",
};

export const DEFAULTS = {
  format: "mls",
  propertyType: "home",
  tone: "warm",
  address: "419 Tall Oaks Dr, Warminster",
  neighborhood: "Warminster",
  schoolDistrict: "",
  beds: "4",
  baths: "4",
  sqft: "3,028",
  lotSize: "",
  yearBuilt: "",
  price: "$2,295,000",
  highlight: "Chef's kitchen with a huge center island",
  features: "Hardwood floors throughout the main level\nOpen-concept living and dining area\nCozy family room with a gas fireplace\nFinished walk-out basement\nGenerous cabinet space and a dedicated pantry",
  primarySuite: "a walk-in closet, soaking tub, and double vanity",
  exteriorFeatures: "Low-maintenance vinyl siding\nDeck overlooking the backyard\nFenced yard with a paver patio\nProfessionally landscaped walkways",
  parking: "an attached one-car garage with inside access and driveway parking",
  amenities: "",
  updates: "",
  conditionNote: "",
  nearby: "downtown shops and local parks",
  cta: "",
};

// Every pool is keyed by tone and indexed with `variant % length`, the same
// pattern CommunityTool uses for "Try another version" — rotating through a
// small set of hand-written phrasings instead of anything generative.
const OPENERS = {
  warm: [
    (f, stats, noun, place) => `Welcome home to ${f.address}, a ${stats}${noun} tucked into ${place || "a wonderful neighborhood"}.`,
    (f, stats, noun) => `Step inside ${f.address} and feel right at home in this ${stats}${noun}.`,
    (f, stats, noun) => `This ${stats}${noun} at ${f.address} is ready to welcome its next owner.`,
    (f, stats, noun) => `Located in the highly desirable ${f.neighborhood || "area"}, this beautifully maintained ${stats}${noun} offers an exceptional blend of comfort and character.`,
    (f, stats, noun, place) => `Welcome to ${f.address}, a ${stats}${noun} in the sought-after ${place || "neighborhood"}.`,
    (f, stats, noun) => `This is the one you've been waiting for — a ${stats}${noun} at ${f.address} that's ready for its next chapter.`,
    (f, stats, noun) => `Freshly updated and full of charm, ${f.address} is a ${stats}${noun} that's easy to fall for.`,
    (f, stats, noun, place) => `Tucked away on a quiet stretch of ${place || "the area"}, ${f.address} is a ${stats}${noun} that feels like home the moment you walk in.`,
    (f, stats, noun) => `Offered for the first time in years, ${f.address} is a ${stats}${noun} full of warmth and possibility.`,
  ],
  luxury: [
    (f, stats, noun) => `Discover refined living at ${f.address}, an exceptional ${stats}${noun} offering timeless elegance.`,
    (f, stats, noun) => `Presenting ${f.address} — a distinguished ${stats}${noun} crafted for discerning buyers.`,
    (f, stats, noun) => `An extraordinary opportunity awaits at ${f.address}, a masterfully appointed ${stats}${noun}.`,
    (f, stats, noun) => `Nestled in the charming ${f.neighborhood || "community"}, this exquisite ${stats}${noun} offers a perfect blend of modern luxury and timeless elegance.`,
    (f, stats, noun) => `Every detail has been meticulously crafted at ${f.address}, a ${stats}${noun} where sophistication meets comfort.`,
    (f, stats, noun) => `Set on grounds worthy of the address, ${f.address} is a ${stats}${noun} built for those who expect more.`,
    (f, stats, noun, place) => `Rarely does a ${stats}${noun} like ${f.address} come to market in ${place || "this community"} — a residence defined by craftsmanship and scale.`,
    (f, stats, noun, place) => `${f.address} is a ${stats}${noun} of uncommon scale and detail in ${place || "this community"}.`,
  ],
  modern: [
    (f, stats, noun) => `${f.address} delivers clean lines and effortless living in this ${stats}${noun}.`,
    (f, stats, noun) => `Sleek, smart, and move-in ready — ${f.address} is a ${stats}${noun} built for modern life.`,
    (f, stats, noun) => `Introducing ${f.address}, a thoughtfully designed ${stats}${noun}.`,
    (f, stats, _noun) => `The contemporary design of ${f.address} offers a spacious ${stats}floor plan that creates a comfortable, modern living space.`,
    (f, stats, noun, place) => `Nestled within the intimate ${place || "community"}, ${f.address} is a beautifully designed ${stats}${noun} that balances comfort and style.`,
    (f, stats, _noun) => `${f.address} pairs a flexible ${stats}layout with an easy, low-maintenance lifestyle.`,
    (f, stats, noun) => `Bright, efficient, and turnkey — ${f.address} is a ${stats}${noun} designed around how people actually live.`,
    (f, stats, noun) => `${f.address} is a ${stats}${noun} with a flexible layout that adapts to how you live.`,
  ],
  straightforward: [
    (f, stats, noun) => `${f.address} is a ${stats}${noun} now available for sale.`,
    (f, stats, noun) => `Now for sale: ${f.address}, a ${stats}${noun}.`,
    (f, stats, noun) => `This ${stats}${noun} at ${f.address} is on the market and ready for showings.`,
    (f, stats, noun, place) => `Welcome to ${f.address}, a ${stats}${noun} in the sought-after ${place || "area"}.`,
    (f, stats, _noun, place) => `${f.address} offers ${stats}living space in the ${place || "area"}.`,
    (f, stats, noun, place) => `${f.address} is a ${stats}${noun} in ${place || "the area"}, available now.`,
    (f, stats, noun) => `Now available: a ${stats}${noun} at ${f.address}, ready for its next owner.`,
    (f, stats, noun, place) => `${f.address} is a ${stats}${noun} in ${place || "the area"}.`,
  ],
};

const FEATURE_LEADS = {
  warm: ["Inside, you'll find", "You'll love", "The home also features", "Additional touches include", "You'll also appreciate", "Cozy details include", "You'll also love", "Also inside:"],
  luxury: ["Inside, discerning buyers will appreciate", "The residence also showcases", "Further appointments include", "Additional finishes include", "Every space has been elevated with", "The interior is further defined by", "Additional custom touches include", "The residence is further appointed with"],
  modern: ["Inside, the layout features", "The space also includes", "You'll also find", "Additional details include", "The design also incorporates", "Also on the main level:", "Rounding out the interior:", "The layout also includes"],
  straightforward: ["Interior features include", "The property also includes", "Additional features:", "Also included:", "The home also offers", "Other interior features:", "The interior also includes", "Additional interior details:"],
};

const HIGHLIGHT_LEADS = {
  warm: [
    (h) => `You'll fall in love with the ${lowerFirst(h)}.`,
    (h) => `A favorite feature is the ${lowerFirst(h)}.`,
    (h) => `Everyone who visits mentions the ${lowerFirst(h)}.`,
  ],
  luxury: [
    (h) => `A true showpiece, the ${lowerFirst(h)} anchors the home.`,
    (h) => `Chief among the home's appointments is the ${lowerFirst(h)}.`,
    (h) => `The ${lowerFirst(h)} sets this residence apart.`,
  ],
  modern: [
    (h) => `The standout: the ${lowerFirst(h)}.`,
    (h) => `The highlight is the ${lowerFirst(h)}.`,
    (h) => `Front and center is the ${lowerFirst(h)}.`,
  ],
  straightforward: [
    (h) => `Notably, the home offers the ${lowerFirst(h)}.`,
    (h) => `A key feature is the ${lowerFirst(h)}.`,
    (h) => `Worth noting: the ${lowerFirst(h)}.`,
  ],
};

const AMENITIES_LEADS = {
  warm: [
    (a) => `The community offers ${a}, so you can spend more time enjoying life and less on upkeep.`,
    (a) => `You'll also have access to ${a} right in the community.`,
  ],
  luxury: [
    (a) => `Residents enjoy access to ${a}.`,
    (a) => `The community itself provides ${a}, adding to the appeal.`,
  ],
  modern: [
    (a) => `Community amenities include ${a}.`,
    (a) => `Also available to residents: ${a}.`,
  ],
  straightforward: [
    (a) => `The community provides ${a}.`,
    (a) => `Community amenities: ${a}.`,
  ],
};

const UPDATES_LEADS = {
  warm: [
    (u) => `Recent updates give extra peace of mind, including ${u}.`,
    (u) => `The sellers have taken great care of this one, with ${u}.`,
  ],
  luxury: [
    (u) => `Thoughtful updates include ${u}.`,
    (u) => `Recent investment in the property includes ${u}.`,
  ],
  modern: [
    (u) => `Recent upgrades: ${u}.`,
    (u) => `Already handled for you: ${u}.`,
  ],
  straightforward: [
    (u) => `Recent updates include ${u}.`,
    (u) => `Updates include ${u}.`,
  ],
};

const CONDITION_LEADS = {
  warm: [
    (c) => `Worth knowing: ${lowerFirst(c)}.`,
    (c) => `A quick note for buyers: ${lowerFirst(c)}.`,
  ],
  luxury: [
    (c) => `Please note: ${lowerFirst(c)}.`,
    (c) => `Prospective buyers should note that ${lowerFirst(c)}.`,
  ],
  modern: [
    (c) => `Good to know: ${lowerFirst(c)}.`,
    (c) => `Note: ${lowerFirst(c)}.`,
  ],
  straightforward: [
    (c) => `Note: ${lowerFirst(c)}.`,
    (c) => `Buyers should note: ${lowerFirst(c)}.`,
  ],
};

const PRIMARY_SUITE_LEADS = {
  warm: [
    (s) => `Retreat to the primary suite, complete with ${lowerFirst(s)}.`,
    (s) => `At the end of the day, unwind in the primary suite with ${lowerFirst(s)}.`,
  ],
  luxury: [
    (s) => `The primary suite is a true retreat, featuring ${lowerFirst(s)}.`,
    (s) => `A private sanctuary, the primary suite boasts ${lowerFirst(s)}.`,
  ],
  modern: [
    (s) => `The primary suite includes ${lowerFirst(s)}.`,
    (s) => `Primary suite: ${lowerFirst(s)}.`,
  ],
  straightforward: [
    (s) => `The primary suite offers ${lowerFirst(s)}.`,
    (s) => `The primary bedroom includes ${lowerFirst(s)}.`,
  ],
};

const EXTERIOR_LEADS = {
  warm: ["Outside, you'll find", "The exterior offers", "You'll also enjoy", "Additional outdoor features include", "Out back, you'll find", "There's also", "Outdoors, you'll love"],
  luxury: ["The grounds feature", "Outside, the property showcases", "Further exterior details include", "The exterior also boasts", "The grounds are further complemented by", "Outside amenities include", "The grounds also include"],
  modern: ["Outside, the property offers", "The exterior includes", "You'll also find outside", "Additional exterior details include", "Outside:", "Also outside:", "The grounds include"],
  straightforward: ["Exterior features include", "Outside, the property offers", "Additional exterior features:", "Also outside:", "Other exterior features:", "The lot also includes", "The grounds also include"],
};

const PARKING_LEADS = {
  warm: [
    (p) => `Parking is a breeze with ${lowerFirst(p)}.`,
    (p) => `You'll never have to worry about parking, thanks to ${lowerFirst(p)}.`,
  ],
  luxury: [
    (p) => `Parking is provided via ${lowerFirst(p)}.`,
    (p) => `Vehicle storage is handled by ${lowerFirst(p)}.`,
  ],
  modern: [
    (p) => `Parking: ${lowerFirst(p)}.`,
    (p) => `For parking, there's ${lowerFirst(p)}.`,
  ],
  straightforward: [
    (p) => `Parking includes ${lowerFirst(p)}.`,
    (p) => `Parking is available via ${lowerFirst(p)}.`,
  ],
};

const NEARBY_LEADS = {
  warm: [
    (n) => `You're just minutes from ${n} — everything you need is close by.`,
    (n) => `It's a short drive to ${n}, so you're never far from what matters.`,
  ],
  luxury: [
    (n) => `Ideally situated near ${n}, offering both privacy and convenience.`,
    (n) => `The location affords easy access to ${n}, all while feeling tucked away.`,
  ],
  modern: [
    (n) => `Conveniently located near ${n}.`,
    (n) => `Close to ${n}.`,
  ],
  straightforward: [
    (n) => `Located near ${n}.`,
    (n) => `Close proximity to ${n}.`,
  ],
};

const SCHOOL_LEADS = {
  warm: [
    (s) => `The property sits within the highly regarded ${s}.`,
    (s) => `Zoned for the well-regarded ${s}.`,
  ],
  luxury: [
    (s) => `The property falls within the acclaimed ${s}.`,
    (s) => `Situated within the respected ${s}.`,
  ],
  modern: [
    (s) => `Located within the ${s}.`,
    (s) => `Zoned for the ${s}.`,
  ],
  straightforward: [
    (s) => `Located in the ${s}.`,
    (s) => `Part of the ${s}.`,
  ],
};

const CLOSINGS = {
  warm: [
    "This one won't last — schedule your private showing today.",
    "Come see it for yourself — book a showing today.",
    "Homes like this don't come around often. Reach out to schedule a tour.",
    "Driving by will only make you want to visit — and once you visit, you'll want to call it home.",
    "This one truly has it all — schedule your showing before it's gone.",
    "Come fall in love in person — schedule a tour today.",
  ],
  luxury: [
    "Private showings are available by appointment — inquire today.",
    "An exceptional offering — schedule your private tour today.",
    "Contact us today to arrange your private viewing.",
    "Embrace the opportunity to make this exceptional residence your own.",
    "Opportunities like this are rare — arrange your private showing today.",
    "Discover it for yourself — schedule a private tour today.",
  ],
  modern: [
    "Book your showing today.",
    "Schedule a tour and see it in person.",
    "Reach out today to set up a showing.",
    "Come see it for yourself and start imagining life here.",
    "Schedule your visit today.",
    "Book a tour and see the space in person.",
  ],
  straightforward: [
    "Contact us to schedule a showing.",
    "Showings available by appointment — contact us today.",
    "Reach out to schedule a tour.",
    "Don't miss this one — schedule your showing today.",
    "Contact us today for more information or to schedule a showing.",
    "Schedule a showing at your convenience.",
  ],
};

function lowerFirst(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function pick(pool, variant) {
  return pool[variant % pool.length];
}

function joinList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  // "basement and cabinet space and a pantry" — when either item already has
  // its own "and", a second one makes the pair unreadable.
  if (items.length === 2) {
    return items.some((item) => /\band\b/.test(item)) ? `${items[0]}, plus ${items[1]}` : `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

// LOT SIZE only ever needs the number — "acre lot" is implied, so it's
// stripped if someone types it anyway (whole or as "acres") and always
// reappended as "-acre lot", preserving whatever they typed for the
// number itself (".50" stays ".50", not normalized to "0.5").
function formatLotSize(raw) {
  const cleaned = (raw || "").trim().replace(/\s*acres?(\s*lot)?\s*$/i, "").trim();
  return cleaned ? `${cleaned}-acre lot` : "";
}

// Splits a long feature list into a few sentences of up to 3 items each,
// cycling through the tone's lead phrases — mirrors how real listings walk
// through several items per sentence rather than dumping them all in one.
function listSentences(items, leadPool, variant) {
  const chunks = [];
  for (let i = 0; i < items.length; i += 3) chunks.push(items.slice(i, i + 3));
  return chunks.map((chunk, i) => `${leadPool[(variant + i) % leadPool.length]} ${joinList(chunk.map(lowerFirst))}.`);
}

function parseLines(text) {
  return (text || "").split("\n").map(tidy).filter(Boolean);
}

// Every free-text field lands mid-sentence, followed by the template's own
// punctuation, so whatever the agent ended it with has to go — otherwise
// "Two-car garage." comes out as "…thanks to two-car garage..". Trailing
// quotes and brackets are left alone; they're part of what was typed.
export function tidy(text) {
  return (text || "").trim().replace(/[\s.,;:!?]+$/, "");
}

// The highlight templates supply their own "the", so one the agent typed
// would double up: "fall in love with the a huge chef's kitchen".
export function stripLeadingArticle(text) {
  return (text || "").replace(/^(?:a|an|the)\s+/i, "");
}

// The call to action is the last sentence, so it's the one place a missing
// full stop shows; it keeps "!" or "?" if the agent used one.
export function endSentence(text) {
  const t = (text || "").trim();
  return !t || /[.!?…]["'”’)]*$/.test(t) ? t : `${t}.`;
}

// Whether the address already names the town, so the copy doesn't say it
// twice. Whole words only: "Warminster" in "419 Tall Oaks Dr, Warminster",
// but not "Ash" inside "Ashbourne Rd".
export function addressNamesPlace(address, place) {
  const p = (place || "").trim();
  if (!p) return false;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(address || "");
}

// The form with every free-text field cleaned the way the templates expect.
// Lines-based fields (features, exteriorFeatures) are tidied per line by
// parseLines instead.
function tidyForm(form) {
  const fields = ["address", "neighborhood", "schoolDistrict", "highlight", "primarySuite", "parking", "amenities", "updates", "conditionNote", "nearby"];
  const out = { ...form };
  for (const key of fields) out[key] = tidy(form[key]);
  out.cta = endSentence(form.cta);
  return out;
}

function buildStatsPhrase(f) {
  const parts = [];
  if (f.beds) parts.push(`${f.beds}-bedroom`);
  if (f.baths) parts.push(`${f.baths}-bath`);
  const bedsBaths = parts.join(", ");
  const sqftPart = f.sqft ? `${bedsBaths ? " " : ""}${f.sqft} sq ft` : "";
  const combined = `${bedsBaths}${sqftPart}`;
  return combined ? `${combined} ` : "";
}

// Both builders return "" without an address: every opener is built around
// it, and "Welcome home to , a home…" is worse than the prompt the page shows
// in its place.
export function buildDescription(rawForm, variant) {
  const form = tidyForm(rawForm);
  if (!form.address) return "";
  const tone = TONES.includes(form.tone) ? form.tone : "warm";
  const stats = buildStatsPhrase(form);
  const noun = PROPERTY_NOUNS[form.propertyType] || PROPERTY_NOUNS.home;
  const place = addressNamesPlace(form.address, form.neighborhood) ? "" : form.neighborhood;

  const openerPool = OPENERS[tone];
  const opener = openerPool[variant % openerPool.length](form, stats, noun, place);

  // Paragraph 1 — the hook, then the interior. The opener has to lead; the
  // three blocks after it describe the same rooms from different angles and
  // read correctly in any order, so they rotate.
  const introBlocks = [];
  if (form.highlight) introBlocks.push([pick(HIGHLIGHT_LEADS[tone], variant)(stripLeadingArticle(form.highlight))]);
  const featureSentences = listSentences(parseLines(form.features), FEATURE_LEADS[tone], variant);
  if (featureSentences.length) introBlocks.push(featureSentences);
  if (form.primarySuite) introBlocks.push([pick(PRIMARY_SUITE_LEADS[tone], variant)(form.primarySuite)]);
  const introSentences = [opener, ...rotateBlocks(introBlocks, variant).flat()];

  // Paragraph 2 — everything outside the front door. These five blocks are
  // independent of each other and rotate; a listing's features stay grouped
  // because each block moves as a unit.
  const outroBlocks = [];
  const exteriorSentences = listSentences(parseLines(form.exteriorFeatures), EXTERIOR_LEADS[tone], variant);
  if (exteriorSentences.length) outroBlocks.push(exteriorSentences);
  if (form.parking) outroBlocks.push([pick(PARKING_LEADS[tone], variant)(form.parking)]);

  const extraStats = [];
  if (form.lotSize) extraStats.push(`a ${formatLotSize(form.lotSize)}`);
  if (form.yearBuilt) extraStats.push(`built in ${form.yearBuilt}`);
  if (extraStats.length) outroBlocks.push([`The property sits on ${joinList(extraStats)}.`]);

  if (form.amenities) outroBlocks.push([pick(AMENITIES_LEADS[tone], variant)(lowerFirst(form.amenities))]);
  if (form.updates) outroBlocks.push([pick(UPDATES_LEADS[tone], variant)(lowerFirst(form.updates))]);

  const outroSentences = rotateBlocks(outroBlocks, variant).flat();

  // Everything below stays pinned in place. The condition note is a caveat
  // ("Note:", "Worth knowing:") and reads wrong opening a paragraph; location,
  // price and the call to action are the close, in that order, the way a real
  // listing ends.
  if (form.conditionNote) outroSentences.push(pick(CONDITION_LEADS[tone], variant)(form.conditionNote));
  if (form.schoolDistrict) outroSentences.push(pick(SCHOOL_LEADS[tone], variant)(form.schoolDistrict));
  if (form.nearby) outroSentences.push(pick(NEARBY_LEADS[tone], variant)(form.nearby));
  if (form.price) outroSentences.push(`Offered at ${form.price}.`);

  const closingPool = CLOSINGS[tone];
  outroSentences.push(form.cta || closingPool[variant % closingPool.length]);

  const paragraphs = [introSentences.join(" "), outroSentences.filter(Boolean).join(" ")].filter(Boolean);
  return paragraphs.join("\n\n");
}

function capFirst(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function slugifyTag(s) {
  return (s || "").replace(/[^a-zA-Z0-9]/g, "");
}

// A short opener, keyed by tone and rotated the same way OPENERS is — just
// shorter, since a social caption leads with the address line above it. None
// may open "Welcome…": that's the header line, one row up.
const FB_INTROS = {
  warm: [
    (f, place) => `Charming living awaits at ${f.address}${place ? ` in ${place}` : ""}!`,
    (_f, place) => `Your next chapter starts here${place ? `, tucked into ${place}` : ""}!`,
  ],
  luxury: [
    (f, place) => `An extraordinary opportunity awaits at ${f.address}${place ? ` in ${place}` : ""}.`,
    (f, place) => `Discover refined living at ${f.address}${place ? ` in ${place}` : ""}.`,
  ],
  modern: [
    (f, place) => `Clean lines and easy living at ${f.address}${place ? ` in ${place}` : ""}.`,
    (f, place) => `Introducing ${f.address}${place ? ` in ${place}` : ""}.`,
  ],
  straightforward: [
    (f, place) => `Now available: ${f.address}${place ? ` in ${place}` : ""}.`,
    (f, place) => `${f.address} is now on the market${place ? ` in ${place}` : ""}.`,
  ],
};

const FB_CLOSERS = {
  warm: ["Peaceful setting + convenient location = the best of both worlds!", "This one has it all — come see for yourself!"],
  luxury: ["A rare opportunity in an unbeatable location.", "Where elegance meets everyday convenience."],
  modern: ["Style, comfort, and location — all in one place.", "Everything you need, right where you want it."],
  straightforward: ["A great location with everything nearby.", "Convenient location, move-in ready."],
};

// Cycled across the free-text feature/exterior lines so a long list doesn't
// repeat the same emoji bullet after bullet.
const FB_BULLET_EMOJIS = ["🛋️", "🍽️", "🚪", "🎮", "🔧", "🎨", "🧺", "🪟", "🧱", "🌟"];

export function buildFacebookPost(rawForm, variant) {
  const form = tidyForm(rawForm);
  if (!form.address) return "";
  const tone = TONES.includes(form.tone) ? form.tone : "warm";
  const place = addressNamesPlace(form.address, form.neighborhood) ? "" : form.neighborhood;

  const lines = [`🏡✨ Welcome to ${form.address}! ✨🏡`, ""];

  const intro = pick(FB_INTROS[tone], variant)(form, place);
  lines.push(form.schoolDistrict ? `${intro.replace(/[!.]\s*$/, "")}, located within the ${form.schoolDistrict}! 🌳` : `${intro} 🌳`);
  lines.push("", "🌟 Property Highlights:", "");

  const bullets = [];
  if (form.highlight) bullets.push(`✨ ${capFirst(form.highlight)}`);
  if (form.lotSize) bullets.push(`🌿 ${formatLotSize(form.lotSize)}`);
  if (form.beds) bullets.push(`🛏️ ${form.beds} bedroom${form.beds === "1" ? "" : "s"}`);
  if (form.baths) bullets.push(`🛁 ${form.baths} bathroom${form.baths === "1" ? "" : "s"}`);
  parseLines(form.features).forEach((line, i) => bullets.push(`${FB_BULLET_EMOJIS[(variant + i) % FB_BULLET_EMOJIS.length]} ${line}`));
  if (form.primarySuite) bullets.push(`🛌 Primary suite with ${lowerFirst(form.primarySuite)}`);
  parseLines(form.exteriorFeatures).forEach((line) => bullets.push(`🌅 ${line}`));
  if (form.parking) bullets.push(`🚗 ${capFirst(form.parking)}`);
  if (form.amenities) bullets.push(`🏊 ${capFirst(form.amenities)}`);
  if (form.updates) bullets.push(`🔧 Recent updates: ${form.updates}`);
  if (form.conditionNote) bullets.push(`ℹ️ ${capFirst(form.conditionNote)}`);
  // No "* " in front: Facebook doesn't render markdown, so it showed as a
  // literal asterisk. The emoji is the bullet.
  lines.push(...bullets);

  lines.push("", `🌳 ${pick(FB_CLOSERS[tone], variant)}`, "");

  const footer = [];
  if (form.neighborhood) footer.push(`📍 ${form.neighborhood}`);
  if (form.schoolDistrict) footer.push(`🏫 ${form.schoolDistrict}`);
  if (form.lotSize) footer.push(`🏡 ${formatLotSize(form.lotSize)}`);
  else if (form.sqft) footer.push(`🏡 ${form.sqft} sq ft`);
  if (form.price) footer.push(`💰 Offered at ${form.price}`);
  if (footer.length) lines.push(...footer, "");

  lines.push(`📲 ${form.cta || pick(CLOSINGS[tone], variant)}`, "");

  const placeTag = slugifyTag(form.neighborhood);
  const hashtags = [...new Set([
    ...(placeTag ? [`#${placeTag}`, `#${placeTag}RealEstate`] : []),
    "#JustListed", "#NewListing", "#RealEstate", "#DreamHome", "#HouseHunting",
  ])];
  lines.push(hashtags.join(" "));

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

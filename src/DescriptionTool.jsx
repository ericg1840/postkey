import { useState } from "react";
import { Copy, Check, Shuffle, Home, Building2, Warehouse, Building } from "lucide-react";
import { UI, ACCENT, WHITE, mixWithWhite, TopNav } from "./shared.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

// Property type just changes the noun used throughout the copy — kept
// separate from "tone" so any type can be written in any voice.
const PROPERTY_TYPES = [
  { key: "home", label: "House", icon: Home, noun: "home" },
  { key: "condo", label: "Condo", icon: Building, noun: "condo" },
  { key: "townhome", label: "Townhome", icon: Building2, noun: "townhome" },
  { key: "multi", label: "Multi-family", icon: Warehouse, noun: "multi-family property" },
];

const TONE_OPTIONS = [
  { key: "warm", label: "Warm & Inviting", description: "Cozy, welcoming language" },
  { key: "luxury", label: "Luxury", description: "Elevated, upscale phrasing" },
  { key: "modern", label: "Modern & Sleek", description: "Clean, minimal language" },
  { key: "straightforward", label: "Straightforward", description: "Just the facts, professionally stated" },
];

const DEFAULTS = {
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
  features: "Hardwood floors throughout\nFinished walk-out basement\nFenced backyard with patio\nUpdated primary suite",
  amenities: "",
  updates: "",
  nearby: "downtown shops and top-rated schools",
  cta: "",
};

// Every pool is keyed by tone and indexed with `variant % length`, the same
// pattern CommunityTool uses for "Try another version" — rotating through a
// small set of hand-written phrasings instead of anything generative.
const OPENERS = {
  warm: [
    (f, stats, noun) => `Welcome home to ${f.address}, a ${stats}${noun} tucked into ${f.neighborhood || "a wonderful neighborhood"}.`,
    (f, stats, noun) => `Step inside ${f.address} and feel right at home in this ${stats}${noun}.`,
    (f, stats, noun) => `This ${stats}${noun} at ${f.address} is ready to welcome its next family.`,
    (f, stats, noun) => `Located in the highly desirable ${f.neighborhood || "area"}, this beautifully maintained ${stats}${noun} offers an exceptional blend of comfort and character.`,
    (f, stats, noun) => `Welcome to ${f.address}, a ${stats}${noun} in the sought-after ${f.neighborhood || "neighborhood"}.`,
  ],
  luxury: [
    (f, stats, noun) => `Discover refined living at ${f.address}, an exceptional ${stats}${noun} offering timeless elegance.`,
    (f, stats, noun) => `Presenting ${f.address} — a distinguished ${stats}${noun} crafted for discerning buyers.`,
    (f, stats, noun) => `An extraordinary opportunity awaits at ${f.address}, a masterfully appointed ${stats}${noun}.`,
    (f, stats, noun) => `Nestled in the charming ${f.neighborhood || "community"}, this exquisite ${stats}${noun} offers a perfect blend of modern luxury and timeless elegance.`,
    (f, stats, noun) => `Every detail has been meticulously crafted at ${f.address}, a ${stats}${noun} where sophistication meets comfort.`,
  ],
  modern: [
    (f, stats, noun) => `${f.address} delivers clean lines and effortless living in this ${stats}${noun}.`,
    (f, stats, noun) => `Sleek, smart, and move-in ready — ${f.address} is a ${stats}${noun} built for modern life.`,
    (f, stats, noun) => `Introducing ${f.address}, a thoughtfully designed ${stats}${noun}.`,
    (f, stats, noun) => `The contemporary design of ${f.address} offers a spacious ${stats}floor plan that creates a comfortable, modern living space.`,
    (f, stats, noun) => `Nestled within the intimate ${f.neighborhood || "community"}, ${f.address} is a beautifully designed ${stats}${noun} that balances comfort and style.`,
  ],
  straightforward: [
    (f, stats, noun) => `${f.address} is a ${stats}${noun} now available for sale.`,
    (f, stats, noun) => `Now for sale: ${f.address}, a ${stats}${noun}.`,
    (f, stats, noun) => `This ${stats}${noun} at ${f.address} is on the market and ready for showings.`,
    (f, stats, noun) => `Welcome to ${f.address}, a ${stats}${noun} in the sought-after ${f.neighborhood || "area"}.`,
    (f, stats, noun) => `${f.address} offers ${stats}living space in the ${f.neighborhood || "area"}.`,
  ],
};

const FEATURE_LEADS = {
  warm: ["Inside, you'll find", "You'll love", "The home also features", "Additional touches include", "You'll also appreciate"],
  luxury: ["Inside, discerning buyers will appreciate", "The residence also showcases", "Further appointments include", "Additional finishes include", "Every space has been elevated with"],
  modern: ["Inside, the layout features", "The space also includes", "You'll also find", "Additional details include", "The design also incorporates"],
  straightforward: ["Interior features include", "The property also includes", "Additional features:", "Also included:", "The home also offers"],
};

const HIGHLIGHT_LEADS = {
  warm: (h) => `You'll fall in love with the ${lowerFirst(h)}.`,
  luxury: (h) => `A true showpiece, the ${lowerFirst(h)} anchors the home.`,
  modern: (h) => `The standout: a ${lowerFirst(h)}.`,
  straightforward: (h) => `Notably, the home offers a ${lowerFirst(h)}.`,
};

const AMENITIES_LEADS = {
  warm: (a) => `The community offers ${a}, so you can spend more time enjoying life and less on upkeep.`,
  luxury: (a) => `Residents enjoy access to ${a}.`,
  modern: (a) => `Community amenities include ${a}.`,
  straightforward: (a) => `The community provides ${a}.`,
};

const UPDATES_LEADS = {
  warm: (u) => `Recent updates give extra peace of mind, including ${u}.`,
  luxury: (u) => `Thoughtful updates include ${u}.`,
  modern: (u) => `Recent upgrades: ${u}.`,
  straightforward: (u) => `Recent updates include ${u}.`,
};

const NEARBY_LEADS = {
  warm: (n) => `You're just minutes from ${n} — everything you need is close by.`,
  luxury: (n) => `Ideally situated near ${n}, offering both privacy and convenience.`,
  modern: (n) => `Conveniently located near ${n}.`,
  straightforward: (n) => `Located near ${n}.`,
};

const SCHOOL_LEADS = {
  warm: (s) => `Families will love being part of the highly regarded ${s}.`,
  luxury: (s) => `The property falls within the acclaimed ${s}.`,
  modern: (s) => `Located within the ${s}.`,
  straightforward: (s) => `Located in the ${s}.`,
};

const CLOSINGS = {
  warm: [
    "This one won't last — schedule your private showing today.",
    "Come see it for yourself — book a showing today.",
    "Homes like this don't come around often. Reach out to schedule a tour.",
    "Driving by will only make you want to visit — and once you visit, you'll want to call it home.",
  ],
  luxury: [
    "Private showings are available by appointment — inquire today.",
    "An exceptional offering — schedule your private tour today.",
    "Contact us today to arrange your private viewing.",
    "Embrace the opportunity to make this exceptional residence your own.",
  ],
  modern: [
    "Book your showing today.",
    "Schedule a tour and see it in person.",
    "Reach out today to set up a showing.",
    "Come see it for yourself and start imagining life here.",
  ],
  straightforward: [
    "Contact us to schedule a showing.",
    "Showings available by appointment — contact us today.",
    "Reach out to schedule a tour.",
    "Don't miss this one — schedule your showing today.",
  ],
};

function lowerFirst(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function joinList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
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

function buildDescription(form, variant) {
  const propertyType = PROPERTY_TYPES.find((p) => p.key === form.propertyType) || PROPERTY_TYPES[0];
  const tone = TONE_OPTIONS.find((t) => t.key === form.tone) ? form.tone : "warm";
  const stats = buildStatsPhrase(form);
  const noun = propertyType.noun;

  const openerPool = OPENERS[tone];
  const opener = openerPool[variant % openerPool.length](form, stats, noun);

  const sentences = [opener];

  if (form.highlight) sentences.push(HIGHLIGHT_LEADS[tone](form.highlight));

  const featureLines = (form.features || "").split("\n").map((s) => s.trim()).filter(Boolean);
  if (featureLines.length) {
    const lead = FEATURE_LEADS[tone][variant % FEATURE_LEADS[tone].length];
    sentences.push(`${lead} ${joinList(featureLines.map(lowerFirst))}.`);
  }

  const extraStats = [];
  if (form.lotSize) extraStats.push(`a ${form.lotSize} lot`);
  if (form.yearBuilt) extraStats.push(`built in ${form.yearBuilt}`);
  if (extraStats.length) sentences.push(`The property sits on ${joinList(extraStats)}.`);

  if (form.amenities) sentences.push(AMENITIES_LEADS[tone](lowerFirst(form.amenities)));

  if (form.updates) sentences.push(UPDATES_LEADS[tone](lowerFirst(form.updates)));

  if (form.schoolDistrict) sentences.push(SCHOOL_LEADS[tone](form.schoolDistrict));

  if (form.nearby) sentences.push(NEARBY_LEADS[tone](form.nearby));

  if (form.price) sentences.push(`Offered at ${form.price}.`);

  const closingPool = CLOSINGS[tone];
  const closing = form.cta || closingPool[variant % closingPool.length];
  sentences.push(closing);

  return sentences.filter(Boolean).join(" ");
}

function StepHeading({ n, title, subtitle }) {
  return (
    <div className="flex items-start gap-2.5 mb-2.5">
      <span
        className="flex items-center justify-center rounded-full font-body text-xs font-semibold flex-shrink-0"
        style={{ width: 22, height: 22, background: ACCENT, color: WHITE, marginTop: 1 }}
      >
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="font-body text-sm font-semibold" style={{ color: UI.ink }}>{title}</h3>
        {subtitle && <p className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export function DescriptionTool({ onSwitchTool, onGoHome }) {
  const { user, logout } = useAuth();
  const [form, setForm] = useState(DEFAULTS);
  const [variant, setVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const description = buildDescription(form, variant);
  const tryAnother = () => setVariant((v) => v + 1);

  const copyDescription = async () => {
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      setCopyError("");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Couldn't copy — try selecting and copying the text manually.");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: UI.page, color: UI.ink }}>
      <TopNav active="description" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-10">
        <div className="mb-3 sm:mb-6">
          <h1 className="font-display font-bold" style={{ color: UI.ink, fontSize: "1.85rem" }}>Write a Listing Description</h1>
          <p className="font-body text-sm mt-1 hidden sm:block" style={{ color: UI.inkSoft }}>
            Fill in the details — get copy ready to paste into Zillow, Redfin, or Realtor.com.
          </p>
        </div>

        <div className="grid lg:grid-cols-[55fr_45fr] gap-8 items-start">
          {/* LEFT: FORM */}
          <div className="grid gap-6">
            <section>
              <StepHeading n={1} title="Property type & tone" subtitle="These shape the wording of every sentence." />
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PROPERTY TYPE</span>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {PROPERTY_TYPES.map(({ key, label, icon: Icon }) => (
                  <button key={key} type="button" onClick={() => setForm((f) => ({ ...f, propertyType: key }))}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition"
                    style={{ borderColor: form.propertyType === key ? ACCENT : UI.line, background: form.propertyType === key ? mixWithWhite(ACCENT, 0.92) : UI.card }}>
                    <Icon size={18} color={form.propertyType === key ? ACCENT : UI.inkSoft} />
                    <span className="font-body text-xs font-semibold" style={{ color: UI.ink }}>{label}</span>
                  </button>
                ))}
              </div>

              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>TONE</span>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map(({ key, label, description: d }) => (
                  <button key={key} type="button" onClick={() => setForm((f) => ({ ...f, tone: key }))}
                    className="text-left p-3 rounded-lg border-2 transition"
                    style={{ borderColor: form.tone === key ? ACCENT : UI.line, background: form.tone === key ? mixWithWhite(ACCENT, 0.92) : UI.card }}>
                    <div className="font-body text-xs font-bold" style={{ color: UI.ink }}>{label}</div>
                    <div className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>{d}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border p-4 sm:p-5" style={{ background: UI.card, borderColor: UI.line }}>
              <StepHeading n={2} title="Listing details" />
              <label className="block">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>ADDRESS</span>
                <input className="input" value={form.address} onChange={update("address")} />
              </label>
              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>NEIGHBORHOOD / CITY</span>
                <input className="input" value={form.neighborhood} onChange={update("neighborhood")} />
              </label>
              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SCHOOL DISTRICT</span>
                <input className="input" value={form.schoolDistrict} onChange={update("schoolDistrict")} placeholder="Spring-Ford Area School District" />
              </label>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BEDS</span>
                  <input className="input" value={form.beds} onChange={update("beds")} />
                </label>
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BATHS</span>
                  <input className="input" value={form.baths} onChange={update("baths")} />
                </label>
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SQFT</span>
                  <input className="input" value={form.sqft} onChange={update("sqft")} />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>LOT SIZE</span>
                  <input className="input" value={form.lotSize} onChange={update("lotSize")} placeholder="0.25 acre" />
                </label>
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>YEAR BUILT</span>
                  <input className="input" value={form.yearBuilt} onChange={update("yearBuilt")} placeholder="1998" />
                </label>
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PRICE</span>
                  <input className="input" value={form.price} onChange={update("price")} placeholder="Optional" />
                </label>
              </div>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>STANDOUT HIGHLIGHT</span>
                <input className="input" value={form.highlight} onChange={update("highlight")} placeholder="Chef's kitchen with a huge center island" />
              </label>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>OTHER FEATURES (one per line)</span>
                <textarea className="input" rows={4} value={form.features} onChange={update("features")}
                  placeholder={"Hardwood floors throughout\nFinished walk-out basement\nFenced backyard with patio"} />
              </label>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>COMMUNITY / HOA AMENITIES (optional)</span>
                <input className="input" value={form.amenities} onChange={update("amenities")} placeholder="pool, tennis courts, clubhouse, lawn care & snow removal" />
              </label>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>RECENT UPDATES (optional)</span>
                <input className="input" value={form.updates} onChange={update("updates")} placeholder="new HVAC in 2024, new windows, new hot water heater" />
              </label>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>NEARBY (optional)</span>
                <input className="input" value={form.nearby} onChange={update("nearby")} placeholder="downtown shops and the Schuylkill River trail" />
              </label>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>CALL TO ACTION (optional — leave blank for a suggested one)</span>
                <input className="input" value={form.cta} onChange={update("cta")} placeholder="Schedule your private showing today." />
              </label>
            </section>
          </div>

          {/* RIGHT: OUTPUT */}
          <div className="lg:sticky" style={{ top: "1.5rem" }}>
            <div className="rounded-2xl border p-3.5 sm:p-6" style={{ background: UI.card, borderColor: UI.line }}>
              <div className="rounded-xl p-3.5" style={{ background: mixWithWhite(ACCENT, 0.94), border: `1px solid ${mixWithWhite(ACCENT, 0.75)}` }}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold" style={{ color: ACCENT, letterSpacing: "0.04em" }}>LISTING DESCRIPTION</span>
                  <button
                    onClick={tryAnother}
                    className="flex items-center gap-1 font-body text-xs font-semibold flex-shrink-0"
                    style={{ color: ACCENT }}
                  >
                    <Shuffle size={12} /> Try another version
                  </button>
                </div>
                <p className="font-body text-sm whitespace-pre-line" style={{ color: UI.ink, lineHeight: 1.65 }}>{description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-mono text-xs" style={{ color: UI.inkSoft }}>{description.length} characters</span>
                </div>
                <button
                  onClick={copyDescription}
                  className="w-full mt-3 py-2 rounded-lg font-body font-semibold text-xs flex items-center justify-center gap-2 transition"
                  style={{ background: copied ? UI.card : ACCENT, color: copied ? UI.ink : WHITE, border: copied ? `1px solid ${UI.line}` : "none" }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy description"}
                </button>
                {copyError && (
                  <p className="font-body text-xs mt-2" style={{ color: UI.inkSoft }}>{copyError}</p>
                )}
              </div>
              <p className="font-body text-xs mt-3" style={{ color: UI.inkSoft }}>
                This is assembled from what you typed above — nothing here is invented, so it's safe to post as-is. Always double-check facts before publishing to Zillow, Redfin, or Realtor.com.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

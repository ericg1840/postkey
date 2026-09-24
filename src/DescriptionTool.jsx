import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Copy, Check, Shuffle, ArrowDown, Home, Building2, Warehouse, Building, AlertTriangle, ShieldCheck, FileText, Facebook } from "lucide-react";
import { UI, ACCENT, ACCENT_PRESETS, WHITE, mixWithWhite, TopNav } from "./shared.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import { seedFromText } from "./lib/description.mjs";
import { DEFAULTS, buildDescription, buildFacebookPost } from "./lib/descriptionCopy.mjs";
import { AVOID, scanFairHousing } from "./lib/fairHousing.mjs";

// Two output shapes share every field below them: a formal MLS/Zillow
// paragraph (buildDescription) and a shorter, emoji-bulleted social post
// with hashtags (buildFacebookPost) for Facebook/Instagram-style sharing.
const FORMAT_OPTIONS = [
  { key: "mls", label: "MLS / Zillow", description: "Formal paragraph style", icon: FileText },
  { key: "facebook", label: "Facebook Post", description: "Emoji highlights + hashtags", icon: Facebook },
];

// The noun each type puts in the copy lives in PROPERTY_NOUNS
// (lib/descriptionCopy.mjs); this is just the picker.
const PROPERTY_TYPES = [
  { key: "home", label: "House", icon: Home },
  { key: "condo", label: "Condo", icon: Building },
  { key: "townhome", label: "Townhome", icon: Building2 },
  { key: "multi", label: "Multi-family", icon: Warehouse },
];

const TONE_OPTIONS = [
  { key: "warm", label: "Warm & Inviting", description: "Cozy, welcoming language" },
  { key: "luxury", label: "Luxury", description: "Elevated, upscale phrasing" },
  { key: "modern", label: "Modern & Sleek", description: "Clean, minimal language" },
  { key: "straightforward", label: "Straightforward", description: "Just the facts, professionally stated" },
];

// A textarea that grows to fit what's typed, so a feature list longer than
// the box isn't clipped mid-line. Measured from scrollHeight rather than
// counting newlines, because on a phone most lines wrap. (CSS field-sizing
// would do this, but Safari and Firefox don't support it yet.)
function AutoTextarea({ value, minRows, ...props }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    // Width changes rewrap the text: rotating a phone, resizing a window.
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [value]);
  return <textarea ref={ref} rows={minRows} value={value} style={{ overflow: "hidden", resize: "none" }} {...props} />;
}

function StepHeading({ n, title, subtitle, color = ACCENT }) {
  return (
    <div className="flex items-start gap-2.5 mb-2.5">
      <span
        className="flex items-center justify-center rounded-full font-body text-xs font-bold flex-shrink-0"
        style={{ width: 22, height: 22, background: color, color: WHITE, marginTop: 1 }}
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
  // Where in each phrase pool this listing starts, derived from its address,
  // plus however many times the agent has hit "try another". Splitting the two
  // means regenerating still steps forward one phrasing at a time, and typing
  // a correction into the address later doesn't throw away the variant they
  // landed on.
  const [seed, setSeed] = useState(() => seedFromText(DEFAULTS.address));
  const [variantOffset, setVariantOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  // Below lg the result sits under a long form, out of sight while the agent
  // types. Tracks whether it's on screen so a button can offer to jump to it.
  // scrollMarginTop on it (140px) clears the sticky nav, which is two rows tall
  // on a phone, so the jump lands on the heading rather than under the nav.
  const outputRef = useRef(null);
  const [outputVisible, setOutputVisible] = useState(true);

  useEffect(() => {
    const el = outputRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setOutputVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Settled rather than per-keystroke: the description is live beside the form,
  // and re-seeding on every character would rewrite the whole thing as the
  // agent types the address. Waiting for a pause makes it one rephrase once
  // they're done, instead of churn while they work.
  useEffect(() => {
    const timer = setTimeout(() => setSeed(seedFromText(form.address)), 400);
    return () => clearTimeout(timer);
  }, [form.address]);

  const isFacebook = form.format === "facebook";
  const description = isFacebook ? buildFacebookPost(form, seed + variantOffset) : buildDescription(form, seed + variantOffset);
  const tryAnother = () => setVariantOffset((v) => v + 1);

  // Run against the finished description rather than the raw fields: what the
  // agent is about to paste somewhere is what matters, and it catches phrasing
  // the templates contribute as well as their own words.
  const flags = scanFairHousing(description);

  const copyDescription = async () => {
    if (!description) return;
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
    <div className="min-h-dvh" style={{ background: UI.page, color: UI.ink }}>
      <TopNav active="description" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-24 sm:pt-10 lg:pb-10">
        <div className="mb-3 sm:mb-6">
          <h1 className="font-display font-bold" style={{ color: UI.ink, fontSize: "1.85rem" }}>Write a Listing Description</h1>
          <p className="font-body text-sm mt-1 hidden sm:block" style={{ color: UI.inkSoft }}>
            Fill in the details — get copy ready to paste into Zillow, Redfin, Realtor.com, or a Facebook post.
          </p>
        </div>

        <div className="grid lg:grid-cols-[55fr_45fr] gap-8 items-start">
          {/* LEFT: FORM */}
          <div className="grid gap-6">
            <section>
              <StepHeading n={1} title="Format, property type & tone" subtitle="These shape the wording and layout of the output." color={ACCENT_PRESETS[0]} />
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>OUTPUT FORMAT</span>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {FORMAT_OPTIONS.map(({ key, label, description: d, icon: Icon }) => (
                  <button key={key} type="button" onClick={() => setForm((f) => ({ ...f, format: key }))}
                    className="press-fx text-left p-3 rounded-lg transition flex items-start gap-2"
                    style={{
                      borderStyle: "solid",
                      borderWidth: form.format === key ? 2.5 : 2,
                      borderColor: form.format === key ? ACCENT : UI.line,
                      background: form.format === key ? mixWithWhite(ACCENT, 0.92) : UI.card,
                    }}>
                    <Icon size={16} color={form.format === key ? ACCENT : UI.inkSoft} className="flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-body text-xs font-bold" style={{ color: UI.ink }}>{label}</div>
                      <div className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>{d}</div>
                    </div>
                  </button>
                ))}
              </div>
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PROPERTY TYPE</span>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {PROPERTY_TYPES.map(({ key, label, icon: Icon }) => (
                  <button key={key} type="button" onClick={() => setForm((f) => ({ ...f, propertyType: key }))}
                    className="press-fx flex flex-col items-center gap-1.5 py-3 rounded-lg transition"
                    style={{
                      borderStyle: "solid",
                      borderWidth: form.propertyType === key ? 2.5 : 2,
                      borderColor: form.propertyType === key ? ACCENT : UI.line,
                      background: form.propertyType === key ? mixWithWhite(ACCENT, 0.92) : UI.card,
                    }}>
                    <Icon size={18} color={form.propertyType === key ? ACCENT : UI.inkSoft} />
                    <span className="font-body text-xs font-semibold" style={{ color: UI.ink }}>{label}</span>
                  </button>
                ))}
              </div>

              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>TONE</span>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map(({ key, label, description: d }) => (
                  <button key={key} type="button" onClick={() => setForm((f) => ({ ...f, tone: key }))}
                    className="press-fx text-left p-3 rounded-lg transition"
                    style={{
                      borderStyle: "solid",
                      borderWidth: form.tone === key ? 2.5 : 2,
                      borderColor: form.tone === key ? ACCENT : UI.line,
                      background: form.tone === key ? mixWithWhite(ACCENT, 0.92) : UI.card,
                    }}>
                    <div className="font-body text-xs font-bold" style={{ color: UI.ink }}>{label}</div>
                    <div className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>{d}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl p-4 sm:p-5" style={{ background: UI.card, border: `2px solid ${UI.ink}` }}>
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

              {/* Two columns on phones with price on its own row: at a third of
                  a 390px screen, "$2,295,000" was cut off at "$2,295,00". */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>LOT SIZE</span>
                  <input className="input" value={form.lotSize} onChange={update("lotSize")} placeholder="0.25" />
                </label>
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>YEAR BUILT</span>
                  <input className="input" value={form.yearBuilt} onChange={update("yearBuilt")} placeholder="1998" />
                </label>
                <label className="block col-span-2 sm:col-span-1">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PRICE</span>
                  <input className="input" value={form.price} onChange={update("price")} placeholder="Optional" />
                </label>
              </div>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>STANDOUT HIGHLIGHT</span>
                <input className="input" value={form.highlight} onChange={update("highlight")} placeholder="Chef's kitchen with a huge center island" />
              </label>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>INTERIOR FEATURES (one per line)</span>
                <AutoTextarea className="input" minRows={4} value={form.features} onChange={update("features")}
                  placeholder={"Hardwood floors throughout\nOpen-concept living and dining area\nFinished walk-out basement"} />
              </label>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PRIMARY SUITE (optional)</span>
                <input className="input" value={form.primarySuite} onChange={update("primarySuite")} placeholder="a walk-in closet, soaking tub, and double vanity" />
              </label>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>EXTERIOR FEATURES (one per line)</span>
                <AutoTextarea className="input" minRows={3} value={form.exteriorFeatures} onChange={update("exteriorFeatures")}
                  placeholder={"Deck overlooking the backyard\nFenced yard with a paver patio\nProfessionally landscaped walkways"} />
              </label>

              <label className="block mt-3">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PARKING (optional)</span>
                <input className="input" value={form.parking} onChange={update("parking")} placeholder="an attached one-car garage with inside access and driveway parking" />
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
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>CONDITION / OPPORTUNITY NOTE (optional)</span>
                <input className="input" value={form.conditionNote} onChange={update("conditionNote")} placeholder="sold as-is, a great opportunity for a hands-on buyer" />
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
          <div ref={outputRef} className="lg:sticky" style={{ top: "calc(82px + 1.5rem)", scrollMarginTop: 140 }}>
            <div className="rounded-2xl p-3.5 sm:p-6" style={{ background: UI.card, border: `2.5px solid ${UI.ink}` }}>
              <div className="rounded-xl p-3.5" style={{ background: mixWithWhite(ACCENT, 0.94), border: `1.5px solid ${ACCENT}` }}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold" style={{ color: ACCENT, letterSpacing: "0.04em" }}>{isFacebook ? "FACEBOOK POST" : "LISTING DESCRIPTION"}</span>
                  <button
                    onClick={tryAnother}
                    disabled={!description}
                    className="press-fx flex items-center justify-center gap-1 font-body text-xs font-semibold flex-shrink-0 px-2 disabled:opacity-40"
                    style={{ color: ACCENT, minHeight: 44 }}
                  >
                    <Shuffle size={12} /> Try another version
                  </button>
                </div>
                {description ? (
                  <>
                    <p className="font-body text-sm whitespace-pre-line" style={{ color: UI.ink, lineHeight: 1.65 }}>{description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono text-xs" style={{ color: UI.inkSoft }}>{description.length} characters</span>
                    </div>
                  </>
                ) : (
                  <p className="font-body text-sm" style={{ color: UI.inkSoft, lineHeight: 1.65 }}>
                    Add the property address to start your {isFacebook ? "post" : "description"}.
                  </p>
                )}
                <button
                  onClick={copyDescription}
                  disabled={!description}
                  className="press-fx w-full mt-3 rounded-lg font-body font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40"
                  style={{ minHeight: 44, background: copied ? UI.card : ACCENT, color: copied ? UI.ink : WHITE, border: copied ? `1.5px solid ${UI.line}` : `2px solid ${UI.ink}`, boxShadow: copied ? "none" : `2px 2px 0 ${UI.ink}` }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : isFacebook ? "Copy post" : "Copy description"}
                </button>
                {copyError && (
                  <p className="font-body text-xs mt-2" style={{ color: UI.inkSoft }}>{copyError}</p>
                )}
              </div>
              <div className="mt-4 rounded-xl p-3" style={{ background: UI.card, border: `1.5px solid ${flags.length ? "#E8792E" : UI.line}` }}>
                <p className="font-body text-xs font-bold flex items-center gap-1.5" style={{ color: UI.ink }}>
                  {flags.length ? <AlertTriangle size={14} style={{ color: "#E8792E" }} /> : <ShieldCheck size={14} style={{ color: UI.inkSoft }} />}
                  {flags.length
                    ? `${flags.length} phrase${flags.length === 1 ? "" : "s"} worth a second look`
                    : "No flagged wording"}
                </p>
                {flags.length > 0 && (
                  <ul className="mt-2 grid gap-2">
                    {/* Keyed by phrase+position: the same wording can legitimately
                        appear twice, and the id alone would collide. */}
                    {flags.map((flag) => (
                      <li key={`${flag.id}-${flag.index}`} className="font-body text-xs" style={{ color: UI.inkSoft }}>
                        <span className="font-semibold" style={{ color: UI.ink }}>“{flag.phrase}”</span>
                        <span
                          className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ background: flag.severity === AVOID ? "#FBE4D5" : UI.stone, color: flag.severity === AVOID ? "#8A3B0B" : UI.inkSoft }}
                        >
                          {flag.category}
                        </span>
                        <br />
                        {flag.note} {flag.suggestion}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="font-body text-[11px] mt-2.5" style={{ color: UI.inkSoft }}>
                  A wording aid, not legal advice — it matches phrases, so it can't judge intent and doesn't
                  know your state and local protected classes. Nothing flagged doesn't mean nothing to fix.
                </p>
              </div>
              <p className="font-body text-xs mt-3" style={{ color: UI.inkSoft }}>
                This is assembled from what you typed above — nothing here is invented. Always double-check facts before publishing{isFacebook ? " to Facebook" : " to Zillow, Redfin, or Realtor.com"}.
              </p>
            </div>
          </div>
        </div>
      </main>

      {!outputVisible && (
        <button
          type="button"
          onClick={() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="press-fx lg:hidden fixed left-1/2 -translate-x-1/2 rounded-full font-body font-bold text-sm whitespace-nowrap flex items-center gap-2 px-5"
          style={{ bottom: "calc(16px + env(safe-area-inset-bottom))", minHeight: 48, background: ACCENT, color: WHITE, border: `2px solid ${UI.ink}`, boxShadow: `2px 2px 0 ${UI.ink}`, zIndex: 30 }}
        >
          <ArrowDown size={16} /> See your {isFacebook ? "post" : "description"}
        </button>
      )}
    </div>
  );
}

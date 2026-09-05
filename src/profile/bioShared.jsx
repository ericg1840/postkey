import {
  Globe, Facebook, Instagram, Home, Building2, Briefcase, Link as LinkIcon,
  BedDouble, Bath, Star, ChevronRight, Linkedin,
} from "lucide-react";
import { UI } from "../shared.jsx";

// Lucide has no TikTok mark, so this draws the note glyph as a filled path —
// matching lucide's own icon API (size + color, color resolved through
// currentColor) so it drops into the same <Icon size={..} color={..} />
// call sites as every other icon in LINK_TYPES.
function TikTokIcon({ size = 24, color, style, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color, ...style }} {...props}>
      <path
        fill="currentColor"
        d="M16.6 5.82c-1.01-.9-1.6-2.19-1.6-3.62h-3.2v13.44c0 1.62-1.32 2.94-2.94 2.94s-2.94-1.32-2.94-2.94 1.32-2.94 2.94-2.94c.3 0 .59.05.86.13V9.5a6.14 6.14 0 0 0-.86-.06A6.15 6.15 0 0 0 2.72 15.6a6.15 6.15 0 0 0 6.14 6.15 6.15 6.15 0 0 0 6.14-6.15V9.02a9.34 9.34 0 0 0 5.46 1.75V7.56a5.98 5.98 0 0 1-3.86-1.74Z"
      />
    </svg>
  );
}

// Each type carries its own badge color — reads as a system of distinct,
// purposeful buttons rather than one repeated blue icon for everything.
export const LINK_TYPES = [
  { id: "website", label: "Website", icon: Globe, placeholder: "yourname.com", color: "#2563EB" },
  { id: "zillow", label: "Zillow Listing", icon: Home, placeholder: "zillow.com/homedetails/...", color: "#16A34A" },
  { id: "realtor", label: "Realtor.com", icon: Building2, placeholder: "realtor.com/agent/you", color: "#0D9488" },
  { id: "broker", label: "Brokerage Site", icon: Briefcase, placeholder: "yourbrokerage.com", color: "#7C3AED" },
  { id: "custom", label: "Custom Link", icon: LinkIcon, placeholder: "https://...", color: "#4F46E5" },
  { id: "facebook", label: "Facebook", icon: Facebook, placeholder: "facebook.com/yourpage", color: "#1877F2" },
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "instagram.com/yourhandle", color: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)" },
  { id: "tiktok", label: "TikTok", icon: TikTokIcon, placeholder: "tiktok.com/@yourhandle", color: "#111111" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "linkedin.com/in/you", color: "#0A66C2" },
];
const LINK_TYPE_MAP = Object.fromEntries(LINK_TYPES.map((t) => [t.id, t]));

// Social links get pulled out of the flat list and shown as a row of round
// icon buttons right under the tagline — that's what actually reads as
// "social" at a glance, versus one more full-width row.
export const SOCIAL_TYPES = new Set(["facebook", "instagram", "tiktok", "linkedin"]);

// Quick-start color combos for the Appearance section — each just sets
// background/button colors, so picking one is a starting point, not a lock-in.
export const THEME_PRESETS = [
  { id: "coastal", label: "Coastal", bg: "#0F172A", box: "#2563EB" },
  { id: "luxury", label: "Luxury", bg: "#111111", box: "#B8860B" },
  { id: "modern", label: "Modern", bg: "#FFFFFF", box: "#111111" },
  { id: "minimal", label: "Minimal", bg: "#F3EFE6", box: "#5B6472" },
];

export const BUTTON_STYLES = [
  { id: "rounded", label: "Rounded", radius: 12 },
  { id: "pill", label: "Pill", radius: 999 },
  { id: "square", label: "Square", radius: 4 },
];
export function buttonRadius(id) {
  return (BUTTON_STYLES.find((b) => b.id === id) || BUTTON_STYLES[0]).radius;
}

export function hexToRgb(hex) {
  const m = hex.replace("#", "");
  const bigint = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
export function relativeLuminance(hex) {
  if (!/^#[0-9a-f]{3,6}$/i.test(hex)) return 0;
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
export function textOn(hex) {
  return relativeLuminance(hex) > 0.5 ? UI.ink : "#FDFBF7";
}

// When a background photo is set, the page's background color becomes a
// tint overlaid on the photo (not a separate flat fill) — same idea as the
// "photo with a color wash" templates agents are used to seeing elsewhere.
export function bgStyle(bgColor, bgImageUrl, bgTint) {
  if (!bgImageUrl) return { backgroundColor: bgColor };
  const { r, g, b } = hexToRgb(bgColor);
  const alpha = Math.max(0, Math.min(100, bgTint ?? 40)) / 100;
  return {
    backgroundImage: `linear-gradient(rgba(${r}, ${g}, ${b}, ${alpha}), rgba(${r}, ${g}, ${b}, ${alpha})), url(${bgImageUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

// Downscales + re-encodes an uploaded photo client-side before it's stored
// as a data URL, same pattern as the headshot/logo uploads — but a
// full-bleed background photo from a phone camera can be tens of MB
// unresized, which is too large to store as inline text and too slow to
// upload; this keeps it to a sane size without a separate file host.
export function resizeImageToDataUrl(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) { reject(new Error("Choose an image file.")); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image."));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Paired with the "Name style" font picker — same idea, but for size.
export const NAME_SIZES = [
  { id: "sm", label: "Small", px: 22 },
  { id: "md", label: "Medium", px: 30 },
  { id: "lg", label: "Large", px: 38 },
  { id: "xl", label: "Extra Large", px: 46 },
];
export function nameSizePx(id) {
  return (NAME_SIZES.find((s) => s.id === id) || NAME_SIZES[1]).px;
}

function linkHref(link) {
  if (!link.url) return "#";
  return /^https?:\/\//i.test(link.url) ? link.url : `https://${link.url}`;
}

// asLink: true renders real <a href> tags (the public page); false renders
// inert <div>s with identical markup (the in-editor preview, which lives
// inside an app the click shouldn't navigate away from).
export function BioLinksList({ links, bgColor, boxColor, buttonStyle, asLink }) {
  const social = links.filter((l) => SOCIAL_TYPES.has(l.type) && (l.url || asLink === false));
  const rest = links.filter((l) => !SOCIAL_TYPES.has(l.type));
  const boxTextColor = textOn(boxColor);
  const boxSubColor = relativeLuminance(boxColor) > 0.5 ? UI.inkSoft : "#B9C0CC";
  const Row = asLink ? "a" : "div";
  const radius = buttonRadius(buttonStyle);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {social.length > 0 && (
        <div className="flex items-center gap-3.5">
          {social.map((link, i) => {
            const typeInfo = LINK_TYPE_MAP[link.type] || LINK_TYPE_MAP.custom;
            const Icon = typeInfo.icon;
            return (
              <Row
                key={link.id ?? `s${i}`}
                {...(asLink ? { href: linkHref(link), target: "_blank", rel: "noreferrer" } : {})}
                aria-label={typeInfo.label}
                className="bio-link-icon w-11 h-11 rounded-full flex items-center justify-center shrink-0 hover:scale-105"
                style={{ background: typeInfo.color, boxShadow: "0 3px 10px rgba(0,0,0,0.25)" }}
              >
                <Icon size={19} color="#FFFFFF" />
              </Row>
            );
          })}
        </div>
      )}

      <div className="w-full flex flex-col gap-2.5">
        {links.length === 0 && (
          <p className="font-body text-center text-xs italic opacity-50" style={{ color: textOn(bgColor) }}>
            Your links will appear here
          </p>
        )}

        {rest.map((link, i) => {
          const typeInfo = LINK_TYPE_MAP[link.type] || LINK_TYPE_MAP.custom;
          const Icon = typeInfo.icon;
          const isZillow = link.type === "zillow";
          const hasListing = isZillow && (link.address || link.fetched);

          if (hasListing && link.photoUrl) {
            const stats = [
              link.beds && { icon: BedDouble, label: "Beds", value: link.beds },
              link.baths && { icon: Bath, label: "Baths", value: link.baths },
            ].filter(Boolean);

            return (
              <Row
                key={link.id ?? i}
                {...(asLink ? { href: linkHref(link), target: "_blank", rel: "noreferrer" } : {})}
                className="bio-link-row overflow-hidden block"
                style={{ backgroundColor: boxColor, borderRadius: radius === 999 ? 24 : radius }}
              >
                <img
                  src={link.photoUrl}
                  alt=""
                  className="w-full h-44 object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
                <div className="p-4">
                  <span
                    className="font-mono inline-flex items-center gap-1 text-[10px] tracking-[0.08em] uppercase px-2.5 py-1 rounded-full mb-2.5 shadow-sm"
                    style={{ background: typeInfo.color, color: "#FFFFFF" }}
                  >
                    <Star size={10} fill="#FFFFFF" /> Featured Listing
                  </span>
                  <p className="font-display text-lg font-bold" style={{ color: boxTextColor }}>{link.address}</p>
                  {(stats.length > 0) && (
                    <div className="flex items-center gap-5 mt-2.5 pt-2.5 border-t" style={{ borderColor: relativeLuminance(boxColor) > 0.5 ? "rgba(27,36,48,0.12)" : "rgba(255,255,255,0.12)" }}>
                      {stats.map((s) => (
                        <span key={s.label} className="flex items-center gap-1.5 font-body text-sm" style={{ color: boxSubColor }}>
                          <s.icon size={16} />
                          <span className="font-semibold" style={{ color: boxTextColor }}>{s.value}</span> {s.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {link.price && (
                    <p className="font-display text-2xl font-bold mt-2.5" style={{ color: typeInfo.color }}>{link.price}</p>
                  )}
                </div>
              </Row>
            );
          }

          const title = hasListing ? (link.address || link.label || typeInfo.label) : (link.label || typeInfo.label);
          // Listing stats (beds/baths/price) are worth showing — the raw
          // URL isn't. A visitor should see "Website" or "Zillow Listing"
          // and click through, not read out the link before they click it.
          const sub = hasListing
            ? [link.beds && `${link.beds} bed`, link.baths && `${link.baths} bath`, link.price].filter(Boolean).join(" · ")
            : "";

          return (
            <Row
              key={link.id ?? i}
              {...(asLink ? { href: linkHref(link), target: "_blank", rel: "noreferrer" } : {})}
              className="bio-link-row flex items-center gap-3.5 px-4 py-3.5 hover:-translate-y-0.5"
              style={{ backgroundColor: boxColor, borderRadius: radius }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: typeInfo.color, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
              >
                <Icon size={19} style={{ color: "#FFFFFF" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-base font-semibold truncate" style={{ color: boxTextColor }}>{title}</p>
                {sub && <p className="font-body text-xs truncate" style={{ color: boxSubColor }}>{sub}</p>}
              </div>
              <ChevronRight size={20} style={{ color: boxTextColor, opacity: 0.5 }} className="shrink-0" />
            </Row>
          );
        })}
      </div>
    </div>
  );
}

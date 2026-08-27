import { Globe, Facebook, Instagram, Home, Building2, Briefcase, Link as LinkIcon, BedDouble, Bath } from "lucide-react";
import { UI, ACCENT } from "../shared.jsx";

export const LINK_TYPES = [
  { id: "website", label: "Website", icon: Globe, placeholder: "yourname.com" },
  { id: "facebook", label: "Facebook", icon: Facebook, placeholder: "facebook.com/yourpage" },
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "instagram.com/yourhandle" },
  { id: "zillow", label: "Zillow Listing", icon: Home, placeholder: "zillow.com/homedetails/..." },
  { id: "realtor", label: "Realtor.com", icon: Building2, placeholder: "realtor.com/agent/you" },
  { id: "broker", label: "Brokerage Site", icon: Briefcase, placeholder: "yourbrokerage.com" },
  { id: "custom", label: "Custom Link", icon: LinkIcon, placeholder: "https://..." },
];
const LINK_TYPE_MAP = Object.fromEntries(LINK_TYPES.map((t) => [t.id, t]));

// Social links get pulled out of the flat list and shown as a row of round
// icon buttons instead — that's what actually reads as "social" at a
// glance, versus one more full-width row indistinguishable from a website link.
const SOCIAL_TYPES = new Set(["facebook", "instagram"]);
const SOCIAL_BG = {
  facebook: "#1877F2",
  instagram: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)",
};

export function hexToRgb(hex) {
  const m = hex.replace("#", "");
  const bigint = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
export function relativeLuminance(hex) {
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

function linkHref(link) {
  if (!link.url) return "#";
  return /^https?:\/\//i.test(link.url) ? link.url : `https://${link.url}`;
}

// asLink: true renders real <a href> tags (the public page); false renders
// inert <div>s with identical markup (the in-editor preview, which lives
// inside an app the click shouldn't navigate away from).
export function BioLinksList({ links, bgColor, boxColor, asLink }) {
  const social = links.filter((l) => SOCIAL_TYPES.has(l.type) && (l.url || asLink === false));
  const rest = links.filter((l) => !SOCIAL_TYPES.has(l.type));
  const boxTextColor = textOn(boxColor);
  const boxSubColor = relativeLuminance(boxColor) > 0.5 ? UI.inkSoft : "#B9C0CC";
  const Row = asLink ? "a" : "div";

  return (
    <div className="w-full flex flex-col gap-2.5">
      {links.length === 0 && (
        <p className="font-body text-center text-xs italic opacity-50 mt-4" style={{ color: textOn(bgColor) }}>
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
              className="rounded-xl overflow-hidden block"
              style={{ backgroundColor: boxColor }}
            >
              <img src={link.photoUrl} alt="" className="w-full h-36 object-cover" />
              <div className="p-4">
                <span
                  className="font-mono inline-block text-[10px] tracking-[0.08em] uppercase px-2 py-1 rounded mb-2"
                  style={{ background: ACCENT, color: "#FFFFFF" }}
                >
                  Featured Listing
                </span>
                <p className="font-body text-base font-semibold" style={{ color: boxTextColor }}>{link.address}</p>
                {(stats.length > 0) && (
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t" style={{ borderColor: relativeLuminance(boxColor) > 0.5 ? "rgba(27,36,48,0.12)" : "rgba(255,255,255,0.12)" }}>
                    {stats.map((s) => (
                      <span key={s.label} className="flex items-center gap-1.5 font-body text-xs" style={{ color: boxSubColor }}>
                        <s.icon size={13} />
                        <span className="font-semibold" style={{ color: boxTextColor }}>{s.value}</span> {s.label}
                      </span>
                    ))}
                  </div>
                )}
                {link.price && (
                  <p className="font-display text-lg font-bold mt-2" style={{ color: ACCENT }}>{link.price}</p>
                )}
              </div>
            </Row>
          );
        }

        const title = hasListing ? (link.address || link.label || typeInfo.label) : (link.label || typeInfo.label);
        const sub = hasListing
          ? [link.beds && `${link.beds} bed`, link.baths && `${link.baths} bath`, link.price].filter(Boolean).join(" · ")
          : (link.url || typeInfo.placeholder);

        return (
          <Row
            key={link.id ?? i}
            {...(asLink ? { href: linkHref(link), target: "_blank", rel: "noreferrer" } : {})}
            className="flex items-center gap-3 rounded-xl px-4 py-3 transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: boxColor }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ACCENT }}>
              <Icon size={16} style={{ color: "#FFFFFF" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-semibold truncate" style={{ color: boxTextColor }}>{title}</p>
              <p className="font-body text-[11px] truncate" style={{ color: boxSubColor }}>{sub}</p>
            </div>
            <span style={{ color: ACCENT }}>›</span>
          </Row>
        );
      })}

      {social.length > 0 && (
        <div className="flex flex-col items-center gap-3 mt-3">
          <div className="flex items-center gap-3 w-full">
            <span className="flex-1 h-px" style={{ background: `${textOn(bgColor)}33` }} />
            <span className="font-body text-xs italic" style={{ color: textOn(bgColor), opacity: 0.7 }}>Let's Connect</span>
            <span className="flex-1 h-px" style={{ background: `${textOn(bgColor)}33` }} />
          </div>
          <div className="flex items-center gap-3">
            {social.map((link, i) => {
              const typeInfo = LINK_TYPE_MAP[link.type] || LINK_TYPE_MAP.custom;
              const Icon = typeInfo.icon;
              return (
                <Row
                  key={link.id ?? `s${i}`}
                  {...(asLink ? { href: linkHref(link), target: "_blank", rel: "noreferrer" } : {})}
                  aria-label={typeInfo.label}
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: SOCIAL_BG[link.type] || ACCENT }}
                >
                  <Icon size={18} color="#FFFFFF" />
                </Row>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

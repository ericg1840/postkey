import {
  Phone, MessageSquare, Mail, UserPlus, Star, Globe, Building2, Briefcase,
  Link as LinkIcon, ChevronRight, ArrowRight, ImageIcon, Home, Instagram, Facebook, Linkedin,
} from "lucide-react";
import { TOKENS, readableAccent, headerOverlay, headerSolid, chipTint } from "../lib/bioTheme.mjs";
import { linkProps } from "../lib/bioLinks.mjs";

// The public Key Link page, rendered from its data. One component for the
// real page (asLink: real <a href>s), the editor's side preview and its
// full-screen preview (asLink false: identical markup, nothing navigates),
// so the three can't drift apart. Visual spec: the revised link-page
// mockup — fixed light palette, one per-agent accent.

const SERIF = "'Fraunces', Georgia, serif";
const SANS = "'DM Sans', system-ui, -apple-system, sans-serif";

export const LISTING_STATUSES = [
  { id: "just_listed", label: "Just Listed" },
  { id: "open_house", label: "Open House" },
  { id: "under_contract", label: "Under Contract" },
  { id: "sold", label: "Sold" },
];
const STATUS_LABEL = Object.fromEntries(LISTING_STATUSES.map((s) => [s.id, s.label]));

const SOCIAL = {
  instagram: { icon: Instagram, label: "Instagram" },
  facebook: { icon: Facebook, label: "Facebook" },
  linkedin: { icon: Linkedin, label: "LinkedIn" },
  tiktok: { icon: TikTokIcon, label: "TikTok" },
};
const SOCIAL_ORDER = ["linkedin", "instagram", "facebook", "tiktok"];

const ROW_ICON = { website: Globe, realtor: Building2, broker: Briefcase, review: Star, zillow: Home, custom: LinkIcon };
const ROW_DEFAULT_LABEL = { website: "Website", realtor: "Realtor.com", broker: "Brokerage Site", review: "Leave a Review", zillow: "Zillow Listing", custom: "Link" };

function TikTokIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 4 4V3c.5 2.5 2.5 4.5 6 5" />
    </svg>
  );
}

function EqualHousingIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10 12 3l9 7v11H3z" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
    </svg>
  );
}

// <a> on the live page, <div> in the editor previews.
function Action({ asLink, href, external = true, children, ...rest }) {
  if (!asLink) return <div {...rest}>{children}</div>;
  const props = external ? linkProps({ url: href }) : { href };
  return <a {...props} {...rest}>{children}</a>;
}

function initials(name) {
  return (name || "?").split(/\s+/).filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// A Zillow link that has listing details gets the big card; one that was
// never filled in is just a row.
export function isListing(link) {
  return link.type === "zillow" && !!(link.address || link.price || link.photoUrl);
}

export function BioPage({ data, handle, asLink = true }) {
  const {
    name = "", headshotUrl = "", title = "", brokerage = "", tagline = "",
    boxColor, bgImageUrl = "", contact = null, links = [], license = "",
    showEho = false, brokeragePhone = "",
  } = data;
  const accent = readableAccent(boxColor);
  const tint = chipTint(accent);

  const listings = links.filter(isListing);
  const rows = links.filter((l) => !SOCIAL[l.type] && !isListing(l));
  const socials = SOCIAL_ORDER
    .map((type) => links.find((l) => l.type === type && (l.url || !asLink)))
    .filter(Boolean);
  const actions = contact ? [
    contact.phone && { label: "Call", icon: Phone, href: `tel:${contact.phone}` },
    contact.phone && { label: "Text", icon: MessageSquare, href: `sms:${contact.phone}` },
    contact.email && { label: "Email", icon: Mail, href: `mailto:${contact.email}` },
  ].filter(Boolean) : [];
  const firstName = (name || "").trim().split(/\s+/)[0] || "me";
  const subline = [title, brokerage].filter(Boolean).join(" · ");
  const footerLine = [brokerage, brokeragePhone].filter(Boolean).join(" · ");

  return (
    <div className="w-full flex flex-col" style={{ background: TOKENS.page, color: TOKENS.text, fontFamily: SANS, minHeight: "100%" }}>
      {/* 1. Header band */}
      <div className="relative overflow-hidden shrink-0" style={{ height: 176, background: headerSolid(accent) }}>
        {bgImageUrl && (
          <>
            {/* Oversized so the blur's soft edge falls outside the band
                instead of showing as a dark rim along the sides. */}
            <img src={bgImageUrl} alt="" className="absolute object-cover" style={{ left: -32, top: -32, width: "calc(100% + 64px)", height: "calc(100% + 64px)", maxWidth: "none", filter: "blur(6px)" }} />
            <div className="absolute inset-0" style={{ background: headerOverlay(accent) }} />
          </>
        )}
      </div>

      <div className="w-full mx-auto flex flex-col" style={{ maxWidth: 480 }}>
        {/* 2–3. Headshot, name, subline */}
        <div className="relative flex flex-col items-center px-5 gap-1.5" style={{ marginTop: -60 }}>
          {headshotUrl ? (
            <img
              src={headshotUrl}
              alt={name ? `${name} headshot` : "Agent headshot"}
              className="object-cover"
              style={{ width: 120, height: 120, borderRadius: 60, border: `4px solid ${TOKENS.page}`, boxShadow: "0 6px 20px rgba(11, 42, 91, 0.25)" }}
            />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ width: 120, height: 120, borderRadius: 60, border: `4px solid ${TOKENS.page}`, boxShadow: "0 6px 20px rgba(11, 42, 91, 0.25)", background: accent, color: "#FFFFFF", fontFamily: SERIF, fontSize: 36, fontWeight: 600 }}
              aria-hidden="true"
            >
              {initials(name)}
            </div>
          )}
          <h1 className="text-center" style={{ margin: "10px 0 0", fontFamily: SERIF, fontWeight: 600, fontSize: 30, lineHeight: 1.1, color: TOKENS.text }}>
            {name || "Your Name"}
          </h1>
          {subline && (
            <p className="text-center" style={{ fontSize: 14, fontWeight: 500, color: TOKENS.textSoft, letterSpacing: "0.02em" }}>{subline}</p>
          )}
          {tagline && (
            <p className="text-center" style={{ fontSize: 15, color: TOKENS.textSoft, lineHeight: 1.45, marginTop: 4, maxWidth: 340 }}>{tagline}</p>
          )}
        </div>

        {/* 4–5. Contact row + Save My Contact */}
        {contact && (
          <div className="flex flex-col px-5" style={{ paddingTop: 22, gap: 10 }}>
            {actions.length > 0 && (
              <div className="grid" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))`, gap: 10 }}>
                {actions.map(({ label, icon: Icon, href }) => (
                  <Action
                    key={label}
                    asLink={asLink}
                    href={href}
                    aria-label={`${label} ${firstName}`}
                    className="flex flex-col items-center justify-center"
                    style={{ height: 64, background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 16, gap: 4, color: TOKENS.text, fontSize: 13, fontWeight: 600 }}
                  >
                    <Icon size={22} color={accent} strokeWidth={2} />
                    <span>{label}</span>
                  </Action>
                ))}
              </div>
            )}
            <Action
              asLink={asLink}
              href={`/api/bio-vcard?handle=${encodeURIComponent(handle || "")}`}
              external={false}
              className="flex items-center justify-center"
              style={{ height: 54, background: accent, borderRadius: 16, gap: 10, color: "#FFFFFF", fontSize: 16, fontWeight: 700 }}
            >
              <UserPlus size={20} color="#FFFFFF" />
              <span>Save My Contact</span>
            </Action>
          </div>
        )}

        {/* 6. Listing cards */}
        {listings.length > 0 && (
          <div className="flex flex-col px-5" style={{ paddingTop: 28, gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: TOKENS.textSoft }}>
              {listings.length === 1 ? "LATEST LISTING" : "LISTINGS"}
            </div>
            {listings.map((l, i) => (
              <ListingCard key={l.id ?? `l${i}`} link={l} accent={accent} asLink={asLink} eager={i === 0} />
            ))}
          </div>
        )}

        {/* 7. Secondary links */}
        {rows.length > 0 && (
          <div className="flex flex-col px-5" style={{ paddingTop: listings.length ? 12 : 28, gap: 10 }}>
            {rows.map((l, i) => {
              const Icon = ROW_ICON[l.type] || LinkIcon;
              return (
                <Action
                  key={l.id ?? `r${i}`}
                  asLink={asLink}
                  href={l.url}
                  className="flex items-center"
                  style={{ minHeight: 64, background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 16, gap: 14, padding: "10px 16px 10px 12px", color: TOKENS.text }}
                >
                  <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: tint }}>
                    <Icon size={20} color={accent} strokeWidth={2} />
                  </div>
                  <span className="flex-grow min-w-0 break-words" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
                    {l.label || ROW_DEFAULT_LABEL[l.type] || "Link"}
                  </span>
                  <ChevronRight size={18} color={TOKENS.textSoft} strokeWidth={2.2} className="shrink-0" />
                </Action>
              );
            })}
          </div>
        )}

        {links.length === 0 && !contact && !asLink && (
          <p className="text-center px-5" style={{ paddingTop: 28, fontSize: 13, color: TOKENS.textSoft, fontStyle: "italic" }}>
            Your links will appear here
          </p>
        )}

        {/* 8. Social icons */}
        {socials.length > 0 && (
          <div className="flex justify-center flex-wrap px-5" style={{ paddingTop: 28, gap: 14 }}>
            {socials.map((l) => {
              const { icon: Icon, label } = SOCIAL[l.type];
              return (
                <Action
                  key={l.type}
                  asLink={asLink}
                  href={l.url}
                  aria-label={label}
                  className="flex items-center justify-center"
                  style={{ width: 48, height: 48, borderRadius: 24, border: `1.5px solid ${TOKENS.socialBorder}`, background: TOKENS.card }}
                >
                  <Icon size={20} color={TOKENS.text} strokeWidth={2} />
                </Action>
              );
            })}
          </div>
        )}

        {/* 9. Footer */}
        <div
          className="flex flex-col items-center text-center"
          style={{ marginTop: 32, padding: "20px 20px 28px", borderTop: `1px solid ${TOKENS.border}`, gap: 8 }}
        >
          {showEho && (
            <div className="flex items-center" style={{ gap: 8, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: TOKENS.footer }}>
              <EqualHousingIcon color={TOKENS.footer} />
              <span>EQUAL HOUSING OPPORTUNITY</span>
            </div>
          )}
          {footerLine && <div style={{ fontSize: 13, color: TOKENS.footer }}>{footerLine}</div>}
          {license && <div style={{ fontSize: 12, color: TOKENS.footer }}>{name ? `${name} · ` : ""}License #{license}</div>}
          <Action
            asLink={asLink}
            href="/"
            external={false}
            style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.powered, minHeight: 44, display: "inline-flex", alignItems: "center" }}
          >
            POWERED BY POSTKEY
          </Action>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ link, accent, asLink, eager }) {
  const stats = [
    link.beds && `${link.beds} bd`,
    link.baths && `${link.baths} ba`,
    link.sqft && `${link.sqft} sq ft`,
  ].filter(Boolean).join(" · ");
  const status = STATUS_LABEL[link.status] || STATUS_LABEL.just_listed;

  return (
    <Action
      asLink={asLink}
      href={link.url}
      className="flex flex-col overflow-hidden"
      style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 20, color: TOKENS.text }}
    >
      <div className="relative flex items-center justify-center" style={{ height: 180, background: "#DCD8CE" }}>
        {link.photoUrl ? (
          <img
            src={link.photoUrl}
            alt={link.address ? `Photo of ${link.address}` : "Listing photo"}
            className="absolute inset-0 w-full h-full object-cover"
            loading={eager ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <ImageIcon size={28} color="#6A6558" strokeWidth={1.8} aria-hidden="true" />
        )}
        <span
          className="absolute"
          style={{ left: 12, top: 12, background: "#FFFFFF", color: TOKENS.text, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", padding: "6px 10px", borderRadius: 999 }}
        >
          {status.toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col" style={{ padding: "16px 18px 18px", gap: 4 }}>
        {link.price && <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: TOKENS.text }}>{link.price}</div>}
        {link.address && <div style={{ fontSize: 15, fontWeight: 500, color: TOKENS.text }}>{link.address}</div>}
        {stats && <div style={{ fontSize: 14, color: TOKENS.textSoft }}>{stats}</div>}
        <div className="flex items-center" style={{ marginTop: 10, gap: 6, color: accent, fontSize: 15, fontWeight: 700 }}>
          <span>View listing</span>
          <ArrowRight size={18} color={accent} strokeWidth={2.2} />
        </div>
      </div>
    </Action>
  );
}

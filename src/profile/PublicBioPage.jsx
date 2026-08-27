import { useEffect, useState } from "react";
import { Globe, Facebook, Instagram, Home, Building2, Briefcase, Link as LinkIcon, Key } from "lucide-react";

const LINK_TYPES = {
  website: { label: "Website", icon: Globe },
  facebook: { label: "Facebook", icon: Facebook },
  instagram: { label: "Instagram", icon: Instagram },
  zillow: { label: "Zillow Listing", icon: Home },
  realtor: { label: "Realtor.com", icon: Building2 },
  broker: { label: "Brokerage Site", icon: Briefcase },
  custom: { label: "Custom Link", icon: LinkIcon },
};

const BRASS = "#C9A24B";
const BRASS_LIGHT = "#E4C878";
const CREAM = "#F3EFE6";

function hexToRgb(hex) {
  const m = hex.replace("#", "");
  const bigint = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function textOn(hex) {
  return relativeLuminance(hex) > 0.5 ? "#20242C" : CREAM;
}

function linkHref(link) {
  if (link.type === "zillow" && link.url) return /^https?:\/\//i.test(link.url) ? link.url : `https://${link.url}`;
  if (!link.url) return "#";
  return /^https?:\/\//i.test(link.url) ? link.url : `https://${link.url}`;
}

export function PublicBioPage({ handle }) {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bio-public?handle=${encodeURIComponent(handle)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Page not found.");
        if (!cancelled) setState({ loading: false, error: "", data });
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: err.message, data: null });
      }
    })();
    return () => { cancelled = true; };
  }, [handle]);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#12171F" }}>
        <p className="text-sm" style={{ color: "#8A93A3" }}>Loading…</p>
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-center px-6" style={{ background: "#12171F" }}>
        <p className="text-lg" style={{ color: CREAM }}>This page doesn't exist.</p>
        <p className="text-sm" style={{ color: "#8A93A3" }}>{state.error}</p>
      </div>
    );
  }

  const { name, tagline, bgColor, boxColor, links } = state.data;
  const boxTextColor = textOn(boxColor);
  const boxSubColor = relativeLuminance(boxColor) > 0.5 ? "#5B6472" : "#B9C0CC";

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12" style={{ backgroundColor: bgColor }}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-20 h-20 rounded-full p-1 mb-4" style={{ background: `conic-gradient(from 180deg, ${BRASS_LIGHT}, ${BRASS}, ${BRASS_LIGHT})` }}>
          <div className="w-full h-full rounded-full flex items-center justify-center text-lg" style={{ background: "#2A3542", color: BRASS_LIGHT, fontFamily: "Georgia, serif" }}>
            {(name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
        </div>
        <h1 className="text-xl text-center mb-1" style={{ color: textOn(bgColor), fontFamily: "Georgia, serif" }}>{name || "Agent"}</h1>
        {tagline && <p className="text-xs text-center mb-8 opacity-70 max-w-[240px]" style={{ color: textOn(bgColor) }}>{tagline}</p>}

        <div className="w-full flex flex-col gap-2.5 mt-2">
          {links.map((link, i) => {
            const typeInfo = LINK_TYPES[link.type] || LINK_TYPES.custom;
            const Icon = typeInfo.icon;
            const isZillow = link.type === "zillow";
            const title = isZillow && link.address ? link.address : link.label || typeInfo.label;
            const sub = isZillow && link.address
              ? [link.beds && `${link.beds} bed`, link.baths && `${link.baths} bath`, link.price].filter(Boolean).join(" · ")
              : link.url;

            return (
              <a
                key={i}
                href={linkHref(link)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: boxColor }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ border: `2px solid ${BRASS}`, background: bgColor }}>
                  <Icon size={11} style={{ color: BRASS }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: boxTextColor }}>{title}</p>
                  {sub && <p className="text-[11px] truncate" style={{ color: boxSubColor }}>{sub}</p>}
                </div>
                <span style={{ color: BRASS }}>›</span>
              </a>
            );
          })}
        </div>

        <a href="/" className="flex items-center gap-1.5 mt-10 opacity-40 hover:opacity-70 transition-opacity">
          <Key size={11} style={{ color: textOn(bgColor), transform: "rotate(-45deg)" }} />
          <span className="text-[10px] tracking-[0.1em] uppercase" style={{ color: textOn(bgColor) }}>Powered by PostKey</span>
        </a>
      </div>
    </div>
  );
}

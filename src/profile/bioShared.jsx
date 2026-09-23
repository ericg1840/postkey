import {
  Globe, Facebook, Instagram, Home, Building2, Briefcase, Link as LinkIcon, Linkedin, Star,
} from "lucide-react";

// What the Key Link editor offers. The public page itself is rendered by
// BioPage.jsx; this is just the editor's catalogue of link types and a photo
// helper.

// Lucide has no TikTok mark, so this draws the note glyph as a filled path,
// matching lucide's icon API (size + color).
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

// Badge colors here are the editor's own list styling; the public page uses
// the agent's accent for every icon.
export const LINK_TYPES = [
  { id: "website", label: "Website", icon: Globe, placeholder: "yourname.com", color: "#2563EB" },
  { id: "zillow", label: "Zillow Listing", icon: Home, placeholder: "zillow.com/homedetails/...", color: "#16A34A" },
  { id: "review", label: "Leave a Review", icon: Star, placeholder: "Google or Zillow review link", color: "#D97706" },
  { id: "realtor", label: "Realtor.com", icon: Building2, placeholder: "realtor.com/agent/you", color: "#0D9488" },
  { id: "broker", label: "Brokerage Site", icon: Briefcase, placeholder: "yourbrokerage.com", color: "#7C3AED" },
  { id: "custom", label: "Custom Link", icon: LinkIcon, placeholder: "https://...", color: "#4F46E5" },
  { id: "facebook", label: "Facebook", icon: Facebook, placeholder: "facebook.com/yourpage", color: "#1877F2" },
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "instagram.com/yourhandle", color: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)" },
  { id: "tiktok", label: "TikTok", icon: TikTokIcon, placeholder: "tiktok.com/@yourhandle", color: "#111111" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "linkedin.com/in/you", color: "#0A66C2" },
];

// Shown as a row of icons on the public page rather than as link rows.
export const SOCIAL_TYPES = new Set(["facebook", "instagram", "tiktok", "linkedin"]);

// Downscales + re-encodes an uploaded photo client-side before it's stored
// as a data URL, same pattern as the headshot/logo uploads — a phone camera
// photo can be tens of MB unresized.
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

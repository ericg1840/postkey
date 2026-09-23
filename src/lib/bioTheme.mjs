// Colors for the Key Link page, all derived from the one accent color an
// agent picks. The rest of the palette is fixed (see TOKENS).

export const DEFAULT_ACCENT = "#003DA5";

export const TOKENS = {
  page: "#F4F2ED",
  card: "#FFFFFF",
  border: "#E2DFD7",
  text: "#14213D",
  textSoft: "#4A5163",
  footer: "#3F4555",
  powered: "#5E6473",
  socialBorder: "#B9C3D6",
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function toRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [l1, l2] = [luminance(toRgb(a)), luminance(toRgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Blends `hex` toward `target` by `amount` (0 = unchanged, 1 = target).
function mix(hex, target, amount) {
  const a = toRgb(hex);
  const b = toRgb(target);
  return toHex(a.map((v, i) => v + (b[i] - v) * amount));
}

// The accent as used on the page. White text sits on it (Save My Contact)
// and it's used as text/icon color on white cards, so it has to reach 4.5:1
// against white: a light accent (yellow, pale blue) is darkened until it
// does. An invalid value falls back to the default blue.
export function readableAccent(raw) {
  let accent = HEX.test(raw || "") ? toHex(toRgb(raw)) : DEFAULT_ACCENT;
  for (let i = 0; i < 20 && contrastRatio(accent, "#FFFFFF") < 4.5; i++) {
    accent = mix(accent, "#000000", 0.12);
  }
  return accent;
}

// The header band's overlay: a deep shade of the accent at 78% opacity —
// RE/MAX blue gives the mockup's navy, a red accent gives deep red.
export function headerOverlay(accent) {
  const [r, g, b] = toRgb(mix(readableAccent(accent), "#000000", 0.5));
  return `rgba(${r}, ${g}, ${b}, 0.78)`;
}

// The solid header color when the agent has no header photo.
export function headerSolid(accent) {
  return mix(readableAccent(accent), "#000000", 0.5);
}

// Tinted background for icon chips (#E6ECF6 for the default blue).
export function chipTint(accent) {
  return mix(readableAccent(accent), "#FFFFFF", 0.9);
}
